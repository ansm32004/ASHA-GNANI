import time
from typing import Dict, Any, List, Optional
from app.integrations.firebase.firebase_admin import firebase_manager
from app.core.logging import logger

class FirestoreRepository:
    """
    Standard interface for Cloud Firestore collections.
    When Firebase Admin SDK is connected, reads/writes directly to Cloud Firestore.
    Provides CRUD, querying, batch seeding, and in-memory TTL caching for sub-millisecond reads.
    """
    def __init__(self, collection_name: str, cache_ttl: float = 30.0):
        self.collection_name = collection_name
        self.cache_ttl = cache_ttl
        self._cache: Optional[List[Dict[str, Any]]] = None
        self._cache_time: float = 0.0
        self._cache_map: Dict[str, Dict[str, Any]] = {}

    def _invalidate_cache(self):
        self._cache = None
        self._cache_time = 0.0
        self._cache_map.clear()

    @property
    def is_connected(self) -> bool:
        return firebase_manager.is_connected

    def _get_collection(self):
        db = firebase_manager.get_firestore()
        if db:
            return db.collection(self.collection_name)
        return None

    def get(self, doc_id: str) -> Optional[Dict[str, Any]]:
        str_id = str(doc_id)
        # Fast path: instant in-memory cache lookup
        if self._cache is not None and str_id in self._cache_map:
            return self._cache_map[str_id].copy()

        coll = self._get_collection()
        if coll is None:
            return None
        try:
            doc = coll.document(str_id).get()
            if doc.exists:
                data = doc.to_dict() or {}
                if "id" not in data:
                    data["id"] = doc.id
                return data
            return None
        except Exception as e:
            logger.error(f"Firestore get error in {self.collection_name}/{doc_id}: {e}")
            raise

    def set(self, doc_id: str, data: Dict[str, Any], merge: bool = True) -> bool:
        coll = self._get_collection()
        if coll is None:
            raise RuntimeError(f"Cannot write to Firestore {self.collection_name}: database not connected")
        try:
            data_to_save = {**data, "id": str(doc_id)}
            coll.document(str(doc_id)).set(data_to_save, merge=merge)
            self._invalidate_cache()
            return True
        except Exception as e:
            logger.error(f"Firestore set error in {self.collection_name}/{doc_id}: {e}")
            raise

    def create_doc(self, doc_id: str, data: Dict[str, Any]) -> bool:
        coll = self._get_collection()
        if coll is None:
            raise RuntimeError(f"Cannot write to Firestore {self.collection_name}: database not connected")
        try:
            data_to_save = {**data, "id": str(doc_id)}
            coll.document(str(doc_id)).create(data_to_save)
            self._invalidate_cache()
            return True
        except Exception as e:
            raise

    def add(self, data: Dict[str, Any], doc_id: Optional[str] = None) -> str:
        coll = self._get_collection()
        if coll is None:
            raise RuntimeError(f"Cannot write to Firestore {self.collection_name}: database not connected")
        try:
            if doc_id:
                doc_ref = coll.document(str(doc_id))
            else:
                doc_ref = coll.document()

            data_to_save = {**data, "id": doc_ref.id}
            doc_ref.set(data_to_save)
            self._invalidate_cache()
            return doc_ref.id
        except Exception as e:
            logger.error(f"Firestore add error in {self.collection_name}: {e}")
            raise

    def update(self, doc_id: str, data: Dict[str, Any]) -> bool:
        coll = self._get_collection()
        if coll is None:
            raise RuntimeError(f"Cannot update Firestore {self.collection_name}: database not connected")
        try:
            coll.document(str(doc_id)).update(data)
            self._invalidate_cache()
            return True
        except Exception as e:
            logger.error(f"Firestore update error in {self.collection_name}/{doc_id}: {e}")
            raise

    def delete(self, doc_id: str) -> bool:
        coll = self._get_collection()
        if coll is None:
            raise RuntimeError(f"Cannot delete from Firestore {self.collection_name}: database not connected")
        try:
            coll.document(str(doc_id)).delete()
            self._invalidate_cache()
            return True
        except Exception as e:
            logger.error(f"Firestore delete error in {self.collection_name}/{doc_id}: {e}")
            raise

    def list_all(
        self,
        filters: Optional[List[tuple]] = None,
        limit: Optional[int] = None
    ) -> List[Dict[str, Any]]:
        coll = self._get_collection()
        if coll is None:
            return []

        # Fast path: instant in-memory cache lookup for full collection reads
        now = time.time()
        if not filters and not limit:
            if self._cache is not None and (now - self._cache_time < self.cache_ttl):
                return [doc.copy() for doc in self._cache]

        try:
            query = coll
            if filters:
                for field, op, val in filters:
                    if val is not None:
                        query = query.where(field, op, val)
            if limit:
                query = query.limit(limit)

            docs = query.stream()
            results = []
            for doc in docs:
                item = doc.to_dict() or {}
                if "id" not in item:
                    item["id"] = doc.id
                results.append(item)

            if not filters and not limit:
                self._cache = results
                self._cache_time = now
                self._cache_map = {item["id"]: item for item in results if "id" in item}

            return [doc.copy() for doc in results]
        except Exception as e:
            logger.error(f"Firestore list error in {self.collection_name}: {e}")
            if not filters and not limit and self._cache is not None:
                return [doc.copy() for doc in self._cache]
            raise

    def seed_if_empty(self, seed_data: List[Dict[str, Any]], id_key: str = "id") -> int:
        from app.config import settings
        if not getattr(settings, "DEMO_MODE", False):
            # Production safeguard: never seed mock data into Firestore unless DEMO_MODE is True
            return 0
        coll = self._get_collection()
        if coll is None or not seed_data:
            return 0
        try:
            existing = list(coll.limit(1).stream())
            if len(existing) > 0:
                # Already populated
                return 0

            db = firebase_manager.get_firestore()
            batch = db.batch()
            count = 0
            for item in seed_data:
                doc_id = str(item.get(id_key) or f"seed_{count+1}")
                doc_ref = coll.document(doc_id)
                batch.set(doc_ref, {**item, "id": doc_id})
                count += 1
                if count % 450 == 0:
                    batch.commit()
                    batch = db.batch()
            if count % 450 != 0:
                batch.commit()
            logger.info(f"Seeded {count} documents into Firestore collection '{self.collection_name}'")
            return count
        except Exception as e:
            logger.warning(f"Could not seed Firestore collection '{self.collection_name}': {e}")
            return 0

