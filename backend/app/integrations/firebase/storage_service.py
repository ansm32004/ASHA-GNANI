from typing import Optional
from app.integrations.firebase.firebase_admin import firebase_manager
from app.core.logging import logger

class FirebaseStorageService:
    def upload_audio(self, file_bytes: bytes, file_name: str, content_type: str = "audio/wav") -> str:
        if firebase_manager.is_connected:
            try:
                from firebase_admin import storage
                bucket = storage.bucket()
                blob = bucket.blob(f"audio_records/{file_name}")
                blob.upload_from_string(file_bytes, content_type=content_type)
                blob.make_public()
                return blob.public_url
            except Exception as e:
                logger.error(f"Failed to upload to Firebase Storage: {e}")
        
        return f"https://mock-storage.sahayika.local/audio_records/{file_name}"

firebase_storage = FirebaseStorageService()

