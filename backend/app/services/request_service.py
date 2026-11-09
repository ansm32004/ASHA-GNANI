from typing import List, Optional, Dict, Any
from datetime import date
from app.repositories.request_repository import request_repo
from app.repositories.household_repository import household_repo
from app.repositories.notification_repository import notification_repo
from app.repositories.task_repository import task_repo
from app.core.exceptions import NotFoundException, ValidationException
from app.core.logging import logger

class RequestService:
    def list_requests(
        self,
        status: Optional[str] = None,
        category: Optional[str] = None,
        priority: Optional[str] = None,
        household_id: Optional[str] = None,
        assigned_asha_id: Optional[str] = None
    ) -> List[Dict[str, Any]]:
        return request_repo.list_all(
            status=status,
            category=category,
            priority=priority,
            household_id=household_id,
            assigned_asha_id=assigned_asha_id
        )

    def get_request(self, req_id: str) -> Dict[str, Any]:
        req = request_repo.get_by_id(req_id)
        if not req:
            raise NotFoundException("Community Request", req_id)
        return req

    def create_request(self, data: Dict[str, Any]) -> Dict[str, Any]:
        hh = household_repo.get_by_id(data.get("household_id", ""))
        if hh:
            data["household_name"] = data.get("household_name") or hh.get("primary_contact_name", "Household")
            data["contact_number"] = data.get("contact_number") or hh.get("contact_number", "9871100221")
            data["village"] = data.get("village") or hh.get("village", "Rampur Kalan")
            data["assigned_asha_id"] = data.get("assigned_asha_id") or hh.get("assigned_asha_id", "asha_sunita_001")
        else:
            data["household_name"] = data.get("household_name") or data.get("beneficiary_name") or "Community Household"
            data["contact_number"] = data.get("contact_number") or "9871100221"
            data["village"] = data.get("village") or "Rampur Kalan"
            data["assigned_asha_id"] = data.get("assigned_asha_id") or "asha_sunita_001"

        created_req = request_repo.create(data)

        # 1. Instantly create Notification for the respective ASHA worker
        asha_id = data.get("assigned_asha_id") or "asha_sunita_001"
        hh_name = data.get("household_name", "Household")
        ben_name = data.get("beneficiary_name", hh_name)
        category = data.get("category", "Household visit request")
        desc = data.get("description", "Visit requested by community member")
        priority = data.get("priority", "High")
        pref_date = data.get("preferred_date")

        try:
            notif_msg = f"{ben_name} requested a home visit: {desc}"
            if pref_date:
                notif_msg += f" • Preferred Date/Call: {pref_date}"

            notif_payload = {
                "title": f"Visit Request: {hh_name} ({category})",
                "message": notif_msg,
                "category": "Urgent request" if priority == "Urgent" else "Community request",
                "priority": priority,
                "userId": asha_id,
                "timestamp": "Just now",
                "is_read": False,
                "action_type": "request",
                "action_id": created_req["id"],
                "metadata": {
                    "household_id": data.get("household_id"),
                    "request_id": created_req["id"],
                    "preferred_date": pref_date
                }
            }
            notification_repo.create(notif_payload)
        except Exception as notif_err:
            logger.warning(f"Error creating notification for visit request: {notif_err}")

        # 2. Instantly schedule a Task in the respective ASHA worker's schedule
        try:
            today_str = str(date.today())
            task_due_date = today_str
            if pref_date and isinstance(pref_date, str) and "-" in pref_date:
                parts = pref_date.strip().split("-")
                if len(parts) == 3 and len(parts[0]) == 2 and len(parts[2]) == 4:
                    task_due_date = f"{parts[2]}-{parts[1]}-{parts[0]}"
                elif len(parts) == 3 and len(parts[0]) == 4:
                    task_due_date = pref_date.strip()

            task_desc = f"Community Visit Request: {desc}"
            if pref_date:
                task_desc += f" (Preferred Date: {pref_date})"

            task_payload = {
                "household_id": data.get("household_id") or "hh_001",
                "household_name": hh_name,
                "beneficiary_name": ben_name,
                "village": data.get("village", "Rampur Kalan"),
                "assigned_asha_id": asha_id,
                "task_type": f"{category} (Requested)",
                "description": task_desc,
                "due_date": task_due_date,
                "priority": priority,
                "status": "Due today" if task_due_date == today_str else "Upcoming",
                "created_from": "Community Request",
                "created_from_request_id": created_req["id"]
            }
            task_repo.create(task_payload)
        except Exception as task_err:
            logger.warning(f"Error scheduling task for visit request: {task_err}")

        # 3. Trigger Firebase Cloud Messaging push notification if configured
        try:
            from app.integrations.firebase.messaging_service import firebase_messaging
            firebase_messaging.send_push_notification(
                user_id=asha_id,
                title=f"New Visit Request: {hh_name}",
                body=f"{ben_name}: {desc}",
                data={
                    "type": "visit_request",
                    "request_id": created_req["id"],
                    "household_id": data.get("household_id", "")
                }
            )
        except Exception as push_err:
            pass

        return created_req

    def process_action(self, req_id: str, action: str, notes: Optional[str] = None) -> Dict[str, Any]:
        updated = request_repo.update_action(req_id, action, notes)
        if not updated:
            raise NotFoundException("Community Request", req_id)
        return updated

request_service = RequestService()

