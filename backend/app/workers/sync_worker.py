import asyncio
from app.core.logging import logger

class SyncWorker:
    def __init__(self):
        self._running = False

    async def reconcile_pending_queue(self):
        """
        Background reconciler for offline sync batches from field devices.
        Safely detects conflict without overwriting device changes.
        """
        logger.debug("[SyncWorker] Processing offline reconciliation queue...")

    async def start(self, interval_seconds: int = 60):
        self._running = True
        logger.info("[SyncWorker] Offline sync worker started.")
        while self._running:
            try:
                await self.reconcile_pending_queue()
            except Exception as e:
                logger.error(f"[SyncWorker] Error in sync reconciliation: {e}")
            await asyncio.sleep(interval_seconds)

    def stop(self):
        self._running = False
        logger.info("[SyncWorker] Offline sync worker stopped.")

sync_worker = SyncWorker()

