from typing import Dict, Any, Optional, List
from datetime import datetime, timezone
from app.integrations.firebase.firebase_admin import firebase_manager
from app.core.logging import logger

class FirebaseMessagingService:
    def __init__(self):
        self._tokens: Dict[str, str] = {}

    def register_device_token(self, user_id: str, token: str, platform: str = "android") -> bool:
        """
        Safely registers an FCM device token for a user:
        1. Stores in memory cache.
        2. Saves in Firestore `fcm_tokens` collection.
        3. Synchronizes to the user's document in `users` collection using merge=True
           without overwriting unrelated user profile fields.
        """
        clean_token = str(token).strip() if token else ""
        if not clean_token or not user_id:
            logger.warning("Attempted to register empty device token or user_id.")
            return False

        self._tokens[user_id] = clean_token
        now_iso = datetime.now(timezone.utc).isoformat()

        if firebase_manager.is_connected:
            try:
                db = firebase_manager.get_firestore()

                # 1. Update/set in dedicated fcm_tokens collection
                db.collection("fcm_tokens").document(user_id).set({
                    "user_id": user_id,
                    "token": clean_token,
                    "platform": platform,
                    "updated_at": now_iso
                }, merge=True)

                # 2. Synchronize to the user document in users collection safely with merge=True
                db.collection("users").document(user_id).set({
                    "fcm_token": clean_token,
                    "fcm_platform": platform,
                    "fcm_token_updated_at": now_iso
                }, merge=True)

                logger.info(f"Registered and synced FCM device token in Firestore for user {user_id}")
                return True
            except Exception as e:
                logger.warning(f"Could not persist FCM token to Firestore: {e}")
        return True

    def unregister_device_token(self, user_id: str) -> bool:
        """
        Safely unregisters and removes the device token for a user:
        1. Removes from memory cache.
        2. Deletes from `fcm_tokens` collection.
        3. Clears FCM token fields from the user document in `users` collection.
        """
        self._tokens.pop(user_id, None)

        if firebase_manager.is_connected:
            try:
                db = firebase_manager.get_firestore()

                # 1. Remove from fcm_tokens collection
                db.collection("fcm_tokens").document(user_id).delete()

                # 2. Remove token fields from user document
                from google.cloud import firestore
                user_doc_ref = db.collection("users").document(user_id)
                user_snap = user_doc_ref.get()
                if user_snap.exists:
                    user_doc_ref.update({
                        "fcm_token": firestore.DELETE_FIELD,
                        "fcm_platform": firestore.DELETE_FIELD,
                        "fcm_token_updated_at": firestore.DELETE_FIELD
                    })

                logger.info(f"Unregistered and cleared FCM device token for user {user_id}")
                return True
            except Exception as e:
                logger.warning(f"Could not unregister FCM token from Firestore: {e}")
        return True

    def purge_invalid_token(self, token: str) -> None:
        """
        Automatically purges an invalid or expired FCM token from Firestore and memory.
        """
        clean_token = str(token).strip() if token else ""
        if not clean_token:
            return

        # Purge from memory
        for uid, tok in list(self._tokens.items()):
            if tok == clean_token:
                self._tokens.pop(uid, None)

        if firebase_manager.is_connected:
            try:
                db = firebase_manager.get_firestore()
                # 1. Find matching document(s) in fcm_tokens
                from google.cloud.firestore_v1 import FieldFilter
                token_docs = list(db.collection("fcm_tokens").where(filter=FieldFilter("token", "==", clean_token)).stream())
                for doc in token_docs:
                    uid = doc.id
                    doc.reference.delete()
                    logger.info(f"Purged expired FCM token doc for user {uid}")
                    # Also clear from users collection
                    try:
                        from google.cloud import firestore
                        db.collection("users").document(uid).update({
                            "fcm_token": firestore.DELETE_FIELD,
                            "fcm_platform": firestore.DELETE_FIELD,
                            "fcm_token_updated_at": firestore.DELETE_FIELD
                        })
                    except Exception:
                        pass
            except Exception as e:
                logger.warning(f"Error purging invalid token {clean_token[:12]}...: {e}")

    def send_push_notification(self, token: str, title: str, body: str, data: Optional[Dict[str, str]] = None) -> bool:
        """
        Sends an FCM push notification to a single device token.
        Automatically cleans up invalid or expired tokens.
        """
        clean_token = str(token).strip() if token else ""
        if not clean_token:
            logger.warning("send_push_notification called with empty token.")
            return False

        if firebase_manager.is_connected:
            try:
                from firebase_admin import messaging
                string_data = {str(k): str(v) for k, v in (data or {}).items()}
                message = messaging.Message(
                    notification=messaging.Notification(title=title, body=body),
                    data=string_data,
                    token=clean_token
                )
                response = messaging.send(message)
                logger.info(f"FCM push notification dispatched successfully to {clean_token[:12]}... MessageId: {response}")
                return True
            except Exception as e:
                # Check for dead/expired token errors
                err_str = str(e).lower()
                from firebase_admin import messaging, exceptions
                is_invalid = (
                    isinstance(e, (messaging.UnregisteredError, messaging.SenderIdMismatchError, exceptions.InvalidArgumentError)) or
                    "not-registered" in err_str or
                    "unregistered" in err_str or
                    "invalid-registration-token" in err_str or
                    "invalid argument" in err_str
                )
                if is_invalid:
                    logger.warning(f"FCM token is invalid or expired ({e}). Automatically purging...")
                    self.purge_invalid_token(clean_token)
                else:
                    logger.warning(f"FCM push dispatch failed: {e}")
                return False

        logger.info(f"[MockFCM] Sent Push: '{title}' - '{body}' to {clean_token[:10]}...")
        return True

    def send_multicast(
        self,
        tokens: List[str],
        title: str,
        body: str,
        data: Optional[Dict[str, str]] = None
    ) -> Dict[str, Any]:
        """
        Sends an FCM push notification to multiple device tokens using send_each_for_multicast.
        Automatically purges invalid tokens reported in the batch response.
        """
        valid_tokens = list(dict.fromkeys([str(t).strip() for t in (tokens or []) if t and str(t).strip()]))
        if not valid_tokens:
            logger.info("send_multicast called with empty tokens list.")
            return {"success_count": 0, "failure_count": 0, "failed_tokens": []}

        if firebase_manager.is_connected:
            try:
                from firebase_admin import messaging, exceptions
                string_data = {str(k): str(v) for k, v in (data or {}).items()}
                multicast_msg = messaging.MulticastMessage(
                    notification=messaging.Notification(title=title, body=body),
                    data=string_data,
                    tokens=valid_tokens
                )
                batch_response = messaging.send_each_for_multicast(multicast_msg)

                failed_tokens = []
                for idx, resp in enumerate(batch_response.responses):
                    if not resp.success:
                        bad_token = valid_tokens[idx]
                        failed_tokens.append(bad_token)
                        exc = resp.exception
                        err_str = str(exc).lower() if exc else ""
                        is_invalid = (
                            isinstance(exc, (messaging.UnregisteredError, messaging.SenderIdMismatchError, exceptions.InvalidArgumentError)) or
                            "not-registered" in err_str or
                            "unregistered" in err_str or
                            "invalid" in err_str
                        )
                        if is_invalid:
                            logger.warning(f"Multicast target {bad_token[:12]}... is invalid ({exc}). Purging...")
                            self.purge_invalid_token(bad_token)

                logger.info(
                    f"FCM multicast dispatch completed. Success: {batch_response.success_count}, "
                    f"Failure: {batch_response.failure_count}"
                )
                return {
                    "success_count": batch_response.success_count,
                    "failure_count": batch_response.failure_count,
                    "failed_tokens": failed_tokens
                }
            except Exception as e:
                logger.warning(f"FCM multicast batch dispatch failed: {e}")
                return {
                    "success_count": 0,
                    "failure_count": len(valid_tokens),
                    "failed_tokens": valid_tokens,
                    "error": str(e)
                }

        logger.info(f"[MockFCM] Multicast Push to {len(valid_tokens)} devices: '{title}' - '{body}'")
        return {
            "success_count": len(valid_tokens),
            "failure_count": 0,
            "failed_tokens": [],
            "mock": True
        }

    def get_token_for_user(self, user_id: str) -> Optional[str]:
        """
        Retrieves the registered device token for a user from memory or Firestore.
        """
        token = self._tokens.get(user_id)
        if not token and firebase_manager.is_connected:
            try:
                db = firebase_manager.get_firestore()
                # 1. Try fcm_tokens collection
                doc = db.collection("fcm_tokens").document(user_id).get()
                if doc.exists:
                    token = doc.to_dict().get("token")

                # 2. Fallback to users collection if not in fcm_tokens
                if not token:
                    u_doc = db.collection("users").document(user_id).get()
                    if u_doc.exists:
                        token = u_doc.to_dict().get("fcm_token")

                if token:
                    self._tokens[user_id] = token
            except Exception as e:
                logger.warning(f"Error fetching token for user {user_id}: {e}")
        return token

    def send_to_user(self, user_id: str, title: str, body: str, data: Optional[Dict[str, str]] = None) -> bool:
        """
        Resolves the user's device token and delivers a push alert.
        """
        token = self.get_token_for_user(user_id)
        if token:
            return self.send_push_notification(token, title, body, data)
        else:
            logger.info(f"No device token registered for user {user_id}; push notification skipped.")
            return False

firebase_messaging = FirebaseMessagingService()
