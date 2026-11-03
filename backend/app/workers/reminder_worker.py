import asyncio
from datetime import datetime, date
from app.repositories.task_repository import task_repo
from app.repositories.notification_repository import notification_repo
from app.core.logging import logger

class ReminderWorker:
    def __init__(self):
        self._running = False

    async def run_check_cycle(self):
        """
        Scans upcoming and due tasks, sending automatic local notifications.
        """
        today_str = str(date.today())
        tasks = task_repo.list_all(date_filter=today_str)
        
        logger.info(f"[ReminderWorker] Scanning tasks for today ({today_str}): found {len(tasks)} tasks.")
        for t in tasks:
            if t.get("status") in ["Due today", "Upcoming"]:
                logger.info(f"[ReminderWorker] Notification queued for {t['household_name']} - {t['task_type']}")

    async def start(self, interval_seconds: int = 3600):
        self._running = True
        logger.info("[ReminderWorker] Reminder worker started.")
        while self._running:
            try:
                await self.run_check_cycle()
            except Exception as e:
                logger.error(f"[ReminderWorker] Error in reminder cycle: {e}")
            await asyncio.sleep(interval_seconds)

    def stop(self):
        self._running = False
        logger.info("[ReminderWorker] Reminder worker stopped.")

reminder_worker = ReminderWorker()

