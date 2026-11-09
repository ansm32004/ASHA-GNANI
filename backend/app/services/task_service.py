from typing import List, Optional, Dict, Any
from app.repositories.task_repository import task_repo
from app.repositories.household_repository import household_repo
from app.core.exceptions import NotFoundException, ValidationException

class TaskService:
    def list_tasks(
        self,
        status: Optional[str] = None,
        priority: Optional[str] = None,
        date_filter: Optional[str] = None,
        household_id: Optional[str] = None,
        assigned_asha_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        return task_repo.list_all(
            status=status,
            priority=priority,
            date_filter=date_filter,
            household_id=household_id,
            assigned_asha_id=assigned_asha_id
        )

    def get_task(self, task_id: str) -> Dict[str, Any]:
        task = task_repo.get_by_id(task_id)
        if not task:
            raise NotFoundException("Task", task_id)
        return task

    def create_task(self, data: Dict[str, Any], asha_id: Optional[str] = None) -> Dict[str, Any]:
        if asha_id:
            data["assigned_asha_id"] = asha_id
        hh = household_repo.get_by_id(data["household_id"])
        if hh:
            data["household_name"] = hh.get("primary_contact_name", "Household")
            data["village"] = hh.get("village", "Rampur Kalan")
        return task_repo.create(data)

    def update_task(self, task_id: str, data: Dict[str, Any]) -> Dict[str, Any]:
        updated = task_repo.update(task_id, data)
        if not updated:
            raise NotFoundException("Task", task_id)
        return updated

    def complete_task(self, task_id: str, notes: Optional[str] = None) -> Dict[str, Any]:
        task = task_repo.complete(task_id, notes)
        if not task:
            raise NotFoundException("Task", task_id)

        # If task was created from a community request, mark the request as Resolved
        req_id = task.get("created_from_request_id")
        try:
            from app.repositories.request_repository import request_repo
            if req_id:
                request_repo.update_action(req_id, "resolve", notes or "Completed by ASHA worker during home visit")
            else:
                # Also check if any active request exists for this household
                hh_id = task.get("household_id")
                if hh_id:
                    hh_reqs = request_repo.list_all(household_id=hh_id)
                    for r in hh_reqs:
                        if r.get("status") not in ["Resolved", "Completed"]:
                            request_repo.update_action(r["id"], "resolve", notes or "Completed by ASHA worker during home visit")
                            break
        except Exception:
            pass

        return task

    def reschedule_task(self, task_id: str, new_due_date: str, notes: Optional[str] = None) -> Dict[str, Any]:
        task = task_repo.reschedule(task_id, new_due_date, notes)
        if not task:
            raise NotFoundException("Task", task_id)

        # Notify the respective beneficiary / household person
        try:
            from app.repositories.notification_repository import notification_repo
            from app.integrations.firebase.messaging_service import firebase_messaging
            from app.core.logging import logger

            hh_id = task.get("household_id") or "hh_001"
            ben_name = task.get("beneficiary_name") or task.get("household_name") or "Family"
            task_type = task.get("task_type") or "Home visit"
            reason_suffix = f" (Reason: {notes})" if notes and str(notes).strip() else ""

            notif_title = "Visit Rescheduled"
            notif_body = (
                f"Home visit for {ben_name} ({task_type}) has been rescheduled to {new_due_date} "
                f"by ASHA worker Sunita Devi.{reason_suffix}"
            )

            target_user = "comm_meena_001" if hh_id == "hh_001" else hh_id

            notif_record = {
                "title": notif_title,
                "message": notif_body,
                "category": "Follow-up due",
                "priority": "High",
                "is_read": False,
                "timestamp": "Just now",
                "userId": target_user,
                "action_type": "task",
                "action_id": task_id,
                "metadata": {
                    "household_id": hh_id,
                    "task_id": task_id,
                    "beneficiary_name": ben_name,
                    "new_due_date": new_due_date,
                    "notes": notes or "",
                    "rescheduled_by": "ASHA Worker Sunita Devi"
                }
            }
            notification_repo.create(notif_record)
            logger.info(f"Dispatched reschedule notification to {ben_name} ({target_user}) for task {task_id}")

            # Send FCM push if token registered
            try:
                token = firebase_messaging._tokens.get(target_user) or firebase_messaging._tokens.get(hh_id)
                if token:
                    firebase_messaging.send_push_notification(
                        token=token,
                        title=notif_title,
                        body=notif_body,
                        data={"task_id": str(task_id), "household_id": str(hh_id)}
                    )
            except Exception as push_err:
                logger.warning(f"Push dispatch warning on reschedule: {push_err}")
        except Exception as err:
            pass

        return task

    def delete_task(self, task_id: str) -> bool:
        deleted = task_repo.delete(task_id)
        if not deleted:
            raise NotFoundException("Task", task_id)
        return True

task_service = TaskService()

