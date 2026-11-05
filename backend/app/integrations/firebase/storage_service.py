from typing import Optional
from datetime import timedelta
from app.integrations.firebase.firebase_admin import firebase_manager
from app.core.logging import logger

class FirebaseStorageService:
    """
    Firebase Storage integration for audio recordings and medical documents.
    Uses time-limited signed URLs (Uniform Bucket-Level Access compliant)
    and provides safe fallback when Storage is unprovisioned or offline.
    """
    def upload_audio(self, file_bytes: bytes, file_name: str, content_type: str = "audio/wav") -> str:
        if firebase_manager.is_connected:
            try:
                from firebase_admin import storage
                bucket = storage.bucket()
                if bucket.exists():
                    blob = bucket.blob(f"audio_records/{file_name}")
                    blob.upload_from_string(file_bytes, content_type=content_type)
                    # Generate a secure 7-day signed URL (preserves privacy, no public ACLs)
                    signed_url = blob.generate_signed_url(
                        version="v4",
                        expiration=timedelta(days=7),
                        method="GET"
                    )
                    return signed_url
                else:
                    logger.warning("Firebase Storage bucket does not exist. Operating in safe mock fallback mode.")
            except Exception as e:
                logger.error(f"Failed to upload to Firebase Storage: {e}")
        
        return f"https://mock-storage.sahayika.local/audio_records/{file_name}"

    def get_signed_url(self, file_path: str, expiration_days: int = 7) -> Optional[str]:
        if firebase_manager.is_connected:
            try:
                from firebase_admin import storage
                bucket = storage.bucket()
                if bucket.exists():
                    blob = bucket.blob(file_path)
                    if blob.exists():
                        return blob.generate_signed_url(
                            version="v4",
                            expiration=timedelta(days=expiration_days),
                            method="GET"
                        )
            except Exception as e:
                logger.error(f"Failed to generate signed URL for {file_path}: {e}")
        return None

firebase_storage = FirebaseStorageService()


