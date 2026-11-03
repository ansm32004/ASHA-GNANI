import uuid
from datetime import datetime, timedelta

DEMO_USER = {
    "id": "asha_sunita_001",
    "email": "asha.demo@sahayika.test",
    "name": "Sunita Devi",
    "phone": "9876543210",
    "role": "ASHA",
    "asha_id": "ASHA-UP-VNS-2024-042",
    "village_name": "Rampur Kalan",
    "sub_centre": "Rampur SC-04",
    "phc_name": "Kashi Primary Health Centre",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "assigned_clusters": ["Rampur Kalan", "Lakshmi Nagar", "Shanti Kunj", "Kalyanpur", "Basti Vikas"],
    "preferred_ui_language": "hi",
    "preferred_voice_language": "hi",
    "total_assigned_households": 34,
    "profile_photo_url": "https://images.unsplash.com/photo-1544005313-94ddf0286df2?auto=format&fit=crop&w=200&q=80"
}

DEMO_ASHA_USER = DEMO_USER

DEMO_COMMUNITY_USER = {
    "id": "comm_meena_001",
    "email": "community.demo@sahayika.test",
    "name": "Meena Devi",
    "phone": "9871100221",
    "role": "COMMUNITY",
    "household_id": "hh_001",
    "household_code": "HH-RK-001",
    "village_name": "Rampur Kalan",
    "sub_area": "Ward 3, Near Primary School",
    "district": "Varanasi",
    "state": "Uttar Pradesh",
    "preferred_ui_language": "hi",
    "preferred_voice_language": "hi",
    "assigned_asha": {
        "id": "asha_sunita_001",
        "name": "Sunita Devi",
        "phone": "9876543210",
        "village": "Rampur Kalan",
        "sub_centre": "Rampur SC-04",
        "phc": "Kashi Primary Health Centre"
    },
    "family_members": [
        {
            "id": "mem_001_1",
            "name": "Meena Devi",
            "relation": "Self",
            "age": 24,
            "gender": "Female",
            "category": "Pregnant Woman",
            "status": "3rd Trimester (32 wks)",
            "next_checkup": "Today, 11:30 AM",
            "abha_id": "91-4521-8834-0192",
            "blood_group": "B+",
            "rch_id": "RCH-UP-2026-89102",
            "vitals": [
                {"date": "2026-10-28", "bp": "118/76", "weight": "54 kg", "hb": "9.2 g/dL"},
                {"date": "2026-09-14", "bp": "114/72", "weight": "52 kg", "hb": "9.5 g/dL"}
            ],
            "immunizations": [
                {"vaccine": "TT-1", "date": "2026-09-14", "status": "Given"},
                {"vaccine": "TT-2 Booster", "date": "2026-11-12", "status": "Due"}
            ],
            "schemes": [
                "Pradhan Mantri Matru Vandana Yojana (PMMVY)",
                "Janani Suraksha Yojana (JSY)",
                "Ayushman Bharat PM-JAY"
            ],
            "doctor_notes": "Mild anaemia noted (Hb 9.2 g/dL). Prescribed 100 IFA tablets and nutrition counseling."
        },
        {
            "id": "mem_001_2",
            "name": "Rajesh Kumar",
            "relation": "Husband",
            "age": 28,
            "gender": "Male",
            "category": "Adult",
            "abha_id": "91-4521-8834-0193",
            "blood_group": "O+",
            "vitals": [
                {"date": "2026-08-10", "bp": "122/80", "weight": "68 kg", "hb": "13.8 g/dL"}
            ],
            "immunizations": [
                {"vaccine": "COVID-19 Precaution Dose", "date": "2025-04-12", "status": "Given"}
            ],
            "schemes": [
                "Ayushman Bharat PM-JAY",
                "PM Kisan Samman Nidhi"
            ],
            "doctor_notes": "Healthy adult. Routine checkup normal."
        },
        {
            "id": "mem_001_3",
            "name": "Aarav Kumar",
            "relation": "Son",
            "age": 2,
            "gender": "Male",
            "category": "Child (1-5)",
            "next_vaccine": "DPT Booster 1 Due",
            "abha_id": "91-4521-8834-0194",
            "blood_group": "B+",
            "rch_id": "RCH-UP-2024-11029",
            "vitals": [
                {"date": "2026-07-20", "bp": "Normal", "weight": "11.8 kg", "height": "86 cm"}
            ],
            "immunizations": [
                {"vaccine": "BCG", "date": "2024-08-02", "status": "Given"},
                {"vaccine": "OPV-1, 2, 3", "date": "2024-12-10", "status": "Given"},
                {"vaccine": "Pentavalent-1, 2, 3", "date": "2024-12-10", "status": "Given"},
                {"vaccine": "MR-1 (9 mo)", "date": "2025-05-15", "status": "Given"},
                {"vaccine": "DPT Booster 1", "date": "2026-11-06", "status": "Due"}
            ],
            "schemes": [
                "Mission Indradhanush",
                "POSHAN Abhiyaan Ration Scheme"
            ],
            "doctor_notes": "Growth is on track in the Green Zone of MCP card."
        }
    ]
}

def generate_mock_households():
    villages = ["Rampur Kalan", "Lakshmi Nagar", "Shanti Kunj", "Kalyanpur", "Basti Vikas"]
    
    households = [
        {
            "id": "hh_001",
            "household_id": "HH-RK-001",
            "primary_contact_name": "Meena Devi",
            "village": "Rampur Kalan",
            "sub_area": "Ward 3, Near Primary School",
            "contact_number": "9871100221",
            "preferred_language": "hi",
            "address": "House 14, Gali No. 2, Rampur Kalan",
            "consent_status": True,
            "priority": "Urgent",
            "assigned_asha_id": "asha_sunita_001",
            "last_visit_date": "2026-10-28",
            "next_follow_up": "2026-11-04",
            "pending_tasks_count": 2,
            "created_at": "2026-08-10T10:00:00Z",
            "updated_at": "2026-10-28T14:30:00Z",
            "members": [
                {
                    "id": "mem_001_1",
                    "name": "Meena Devi",
                    "age": 24,
                    "gender": "Female",
                    "relation": "Head/Mother",
                    "category": "Pregnant Woman",
                    "rch_id": "RCH-UP-2026-89102",
                    "abha_id": "91-4521-8834-0192",
                    "blood_group": "B+",
                    "is_high_risk": True,
                    "high_risk_reason": "Mild anaemia (Hb 9.2 g/dL), 3rd trimester",
                    "pregnancy_month": 7,
                    "expected_delivery_date": "2026-12-18",
                    "last_vaccination_date": "2026-09-14",
                    "next_due_vaccine": "TT-2 Booster"
                },
                {
                    "id": "mem_001_2",
                    "name": "Rajesh Kumar",
                    "age": 28,
                    "gender": "Male",
                    "relation": "Husband",
                    "category": "General",
                    "abha_id": "91-4521-8834-0193",
                    "blood_group": "O+",
                    "is_high_risk": False
                },
                {
                    "id": "mem_001_3",
                    "name": "Aarav Kumar",
                    "age": 2,
                    "gender": "Male",
                    "relation": "Son",
                    "category": "Child (1-5)",
                    "abha_id": "91-4521-8834-0194",
                    "blood_group": "B+",
                    "rch_id": "RCH-UP-2024-11029",
                    "is_high_risk": False,
                    "last_vaccination_date": "2026-07-20",
                    "next_due_vaccine": "DPT Booster 1"
                }
            ]
        },
        {
            "id": "hh_002",
            "household_id": "HH-RK-002",
            "primary_contact_name": "Rekha Sharma",
            "village": "Rampur Kalan",
            "sub_area": "Purani Basti",
            "contact_number": "9871100222",
            "preferred_language": "hi",
            "address": "House 28, Purani Basti, Rampur Kalan",
            "consent_status": True,
            "priority": "Routine",
            "assigned_asha_id": "asha_sunita_001",
            "last_visit_date": "2026-10-25",
            "next_follow_up": "2026-11-06",
            "pending_tasks_count": 1,
            "created_at": "2026-08-11T11:00:00Z",
            "updated_at": "2026-10-25T16:00:00Z",
            "members": [
                {
                    "id": "mem_002_1",
                    "name": "Rekha Sharma",
                    "age": 29,
                    "gender": "Female",
                    "relation": "Head",
                    "category": "Lactating Mother",
                    "rch_id": "RCH-UP-2026-44211",
                    "is_high_risk": False,
                    "last_vaccination_date": "2026-06-15"
                },
                {
                    "id": "mem_002_2",
                    "name": "Golu Sharma",
                    "age": 0,
                    "gender": "Male",
                    "relation": "Son",
                    "category": "Infant",
                    "is_high_risk": False,
                    "last_vaccination_date": "2026-10-02",
                    "next_due_vaccine": "Pentavalent-3 + IPV-2"
                }
            ]
        },
        {
            "id": "hh_003",
            "household_id": "HH-LN-003",
            "primary_contact_name": "Sita Verma",
            "village": "Lakshmi Nagar",
            "sub_area": "Mandi Chowk",
            "contact_number": "9871100223",
            "preferred_language": "hi",
            "address": "Opposite Shiv Mandir, Lakshmi Nagar",
            "consent_status": True,
            "priority": "Urgent",
            "assigned_asha_id": "asha_sunita_001",
            "last_visit_date": "2026-10-30",
            "next_follow_up": "2026-11-03",
            "pending_tasks_count": 1,
            "created_at": "2026-08-12T09:30:00Z",
            "updated_at": "2026-10-30T12:00:00Z",
            "members": [
                {
                    "id": "mem_003_1",
                    "name": "Sita Verma",
                    "age": 21,
                    "gender": "Female",
                    "relation": "Wife",
                    "category": "Pregnant Woman",
                    "rch_id": "RCH-UP-2026-78310",
                    "is_high_risk": True,
                    "high_risk_reason": "First pregnancy, borderline blood pressure (138/88)",
                    "pregnancy_month": 5,
                    "expected_delivery_date": "2027-02-14",
                    "last_vaccination_date": "2026-09-10",
                    "next_due_vaccine": "TT-1"
                },
                {
                    "id": "mem_003_2",
                    "name": "Anil Verma",
                    "age": 26,
                    "gender": "Male",
                    "relation": "Husband",
                    "category": "General",
                    "is_high_risk": False
                }
            ]
        },
        {
            "id": "hh_004",
            "household_id": "HH-SK-004",
            "primary_contact_name": "Pooja Singh",
            "village": "Shanti Kunj",
            "sub_area": "Ganga Ghat Road",
            "contact_number": "9871100224",
            "preferred_language": "hi",
            "address": "Plot 12, Ganga Ghat Road, Shanti Kunj",
            "consent_status": True,
            "priority": "Routine",
            "assigned_asha_id": "asha_sunita_001",
            "last_visit_date": "2026-10-22",
            "next_follow_up": "2026-11-08",
            "pending_tasks_count": 0,
            "created_at": "2026-08-15T14:00:00Z",
            "updated_at": "2026-10-22T11:00:00Z",
            "members": [
                {
                    "id": "mem_004_1",
                    "name": "Pooja Singh",
                    "age": 32,
                    "gender": "Female",
                    "relation": "Head",
                    "category": "General",
                    "is_high_risk": False
                },
                {
                    "id": "mem_004_2",
                    "name": "Ananya Singh",
                    "age": 4,
                    "gender": "Female",
                    "relation": "Daughter",
                    "category": "Child (1-5)",
                    "is_high_risk": False,
                    "last_vaccination_date": "2026-08-14",
                    "next_due_vaccine": "Vitamin A Dose 7"
                }
            ]
        },
        {
            "id": "hh_005",
            "household_id": "HH-KP-005",
            "primary_contact_name": "Kamla Yadav",
            "village": "Kalyanpur",
            "sub_area": "Kisan Basti",
            "contact_number": "9871100225",
            "preferred_language": "hi",
            "address": "Near Tubewell No. 3, Kalyanpur",
            "consent_status": True,
            "priority": "Priority",
            "assigned_asha_id": "asha_sunita_001",
            "last_visit_date": "2026-10-29",
            "next_follow_up": "2026-11-05",
            "pending_tasks_count": 1,
            "created_at": "2026-08-18T10:15:00Z",
            "updated_at": "2026-10-29T15:20:00Z",
            "members": [
                {
                    "id": "mem_005_1",
                    "name": "Kamla Yadav",
                    "age": 55,
                    "gender": "Female",
                    "relation": "Head",
                    "category": "Elder",
                    "is_high_risk": True,
                    "high_risk_reason": "Hypertension under NCD screening"
                },
                {
                    "id": "mem_005_2",
                    "name": "Nisha Yadav",
                    "age": 22,
                    "gender": "Female",
                    "relation": "Daughter-in-law",
                    "category": "Lactating Mother",
                    "rch_id": "RCH-UP-2026-67019",
                    "is_high_risk": False
                },
                {
                    "id": "mem_005_3",
                    "name": "Pawan Yadav",
                    "age": 1,
                    "gender": "Male",
                    "relation": "Grandson",
                    "category": "Infant",
                    "is_high_risk": False,
                    "last_vaccination_date": "2026-09-18",
                    "next_due_vaccine": "Measles-Rubella 1 (MR-1)"
                }
            ]
        }
    ]

    # Dynamically generate households 6 through 34 to reach 34 realistic records across 5 villages
    names = [
        ("Geeta Maurya", "Female", 27, "Pregnant Woman"),
        ("Shashi Bind", "Female", 34, "Lactating Mother"),
        ("Mamta Patel", "Female", 23, "Pregnant Woman"),
        ("Savitri Gond", "Female", 62, "Elder"),
        ("Rani Nishad", "Female", 25, "Lactating Mother"),
        ("Priyanka Gupta", "Female", 22, "Pregnant Woman"),
        ("Sunita Paswan", "Female", 38, "General"),
        ("Kavita Chauhan", "Female", 28, "Lactating Mother"),
        ("Urmila Tripathi", "Female", 45, "General"),
        ("Sarojini Devi", "Female", 30, "Lactating Mother"),
        ("Pushpa Prajapati", "Female", 26, "Pregnant Woman"),
        ("Aarti Kashyap", "Female", 24, "Lactating Mother"),
        ("Manju Pal", "Female", 31, "General"),
        ("Anita Rajbhar", "Female", 29, "Pregnant Woman"),
        ("Durgawati Bind", "Female", 58, "Elder"),
        ("Chandrakala Devi", "Female", 23, "Lactating Mother"),
        ("Sangeeta Dubey", "Female", 35, "General"),
        ("Parvati Rawat", "Female", 27, "Pregnant Woman"),
        ("Sudha Tiwari", "Female", 40, "General"),
        ("Bindu Sonkar", "Female", 25, "Lactating Mother"),
        ("Kanti Devi", "Female", 60, "Elder"),
        ("Indu Pandey", "Female", 24, "Pregnant Woman"),
        ("Maya Chaurasia", "Female", 33, "General"),
        ("Lalita Vishwakarma", "Female", 28, "Lactating Mother"),
        ("Sharda Prasad", "Female", 52, "Elder"),
        ("Seema Jaiswal", "Female", 22, "Pregnant Woman"),
        ("Baby Khatun", "Female", 26, "Lactating Mother"),
        ("Rehana Bano", "Female", 30, "General"),
        ("Fatima Begum", "Female", 25, "Pregnant Woman")
    ]

    for idx, (p_name, gender, age, cat) in enumerate(names, start=6):
        v = villages[(idx - 1) % len(villages)]
        code = f"HH-{v[:2].upper()}-{idx:03d}"
        days_ago = (idx * 3) % 25
        last_v = (datetime.now() - timedelta(days=days_ago)).strftime("%Y-%m-%d")
        next_f = (datetime.now() + timedelta(days=((idx * 2) % 12) + 1)).strftime("%Y-%m-%d")
        priority = "Urgent" if cat == "Pregnant Woman" and idx % 3 == 0 else ("Priority" if cat in ["Pregnant Woman", "Lactating Mother"] else "Routine")
        
        child_pool = [
            "Rohan", "Pooja", "Vikram", "Sneha", "Karan", "Kavya", "Aditya", "Anushka",
            "Nikhil", "Priya", "Rahul", "Divya", "Siddharth", "Simran", "Amit", "Ritu",
            "Deepak", "Neha", "Varun", "Swati", "Manish", "Shweta", "Alok", "Komal",
            "Suraj", "Payal", "Harsh", "Tanvi", "Vishal"
        ]
        c_name = child_pool[(idx - 6) % len(child_pool)]

        m_list = [
            {
                "id": f"mem_{idx:03d}_1",
                "name": p_name,
                "age": age,
                "gender": gender,
                "relation": "Head",
                "category": cat,
                "is_high_risk": True if priority == "Urgent" else False,
                "high_risk_reason": "High risk pregnancy (Severe anaemia)" if priority == "Urgent" else None
            },
            {
                "id": f"mem_{idx:03d}_2",
                "name": c_name,
                "age": 1 if cat == "Lactating Mother" else 3,
                "gender": "Male" if idx % 2 == 0 else "Female",
                "relation": "Son" if idx % 2 == 0 else "Daughter",
                "category": "Infant" if cat == "Lactating Mother" else "Child (1-5)",
                "is_high_risk": False,
                "next_due_vaccine": "MR-1 Vaccine" if cat == "Lactating Mother" else "DPT Booster"
            }
        ]

        households.append({
            "id": f"hh_{idx:03d}",
            "household_id": code,
            "primary_contact_name": p_name,
            "village": v,
            "sub_area": f"Lane {idx % 5 + 1}, Ward {(idx % 4) + 1}",
            "contact_number": f"9871100{idx:03d}",
            "preferred_language": "hi",
            "address": f"Makan No. {idx * 7}, {v}",
            "consent_status": True,
            "priority": priority,
            "assigned_asha_id": "asha_sunita_001",
            "last_visit_date": last_v,
            "next_follow_up": next_f,
            "pending_tasks_count": 1 if priority != "Routine" else 0,
            "created_at": (datetime.now() - timedelta(days=60 + idx)).isoformat() + "Z",
            "updated_at": (datetime.now() - timedelta(days=days_ago)).isoformat() + "Z",
            "members": m_list
        })

    return households

def generate_mock_tasks():
    today = datetime.now().strftime("%Y-%m-%d")
    tomorrow = (datetime.now() + timedelta(days=1)).strftime("%Y-%m-%d")
    yesterday = (datetime.now() - timedelta(days=1)).strftime("%Y-%m-%d")
    in_3_days = (datetime.now() + timedelta(days=3)).strftime("%Y-%m-%d")

    return [
        {
            "id": "task_001",
            "household_id": "hh_001",
            "household_name": "Meena Devi Household",
            "beneficiary_name": "Meena Devi (Mother)",
            "village": "Rampur Kalan",
            "task_type": "Maternal health follow-up",
            "description": "Check IFA tablet intake & monitor blood pressure (3rd trimester follow-up)",
            "due_date": today,
            "priority": "Urgent",
            "status": "Due today",
            "created_from": "Visit",
            "completion_notes": None,
            "created_at": "2026-10-28T14:30:00Z",
            "updated_at": "2026-10-28T14:30:00Z"
        },
        {
            "id": "task_002",
            "household_id": "hh_001",
            "household_name": "Meena Devi Household",
            "beneficiary_name": "Aarav Kumar (Child - 2 yrs)",
            "village": "Rampur Kalan",
            "task_type": "Vaccination reminder",
            "description": "Mobilise child Aarav for DPT Booster 1 in upcoming Wednesday VHSND session",
            "due_date": in_3_days,
            "priority": "High",
            "status": "Upcoming",
            "created_from": "Manual",
            "completion_notes": None,
            "created_at": "2026-10-28T14:35:00Z",
            "updated_at": "2026-10-28T14:35:00Z"
        },
        {
            "id": "task_003",
            "household_id": "hh_003",
            "household_name": "Sita Verma Household",
            "beneficiary_name": "Sita Verma (Mother)",
            "village": "Lakshmi Nagar",
            "task_type": "Maternal health follow-up",
            "description": "Confirm PHC registration for ANC checkup and JSY bank account linking",
            "due_date": today,
            "priority": "Urgent",
            "status": "Due today",
            "created_from": "Visit",
            "completion_notes": None,
            "created_at": "2026-10-30T12:00:00Z",
            "updated_at": "2026-10-30T12:00:00Z"
        },
        {
            "id": "task_004",
            "household_id": "hh_002",
            "household_name": "Rekha Sharma Household",
            "beneficiary_name": "Golu Sharma (Infant - 14 days)",
            "village": "Rampur Kalan",
            "task_type": "Child health follow-up",
            "description": "Exclusive breastfeeding counseling & weight tracking (14-day check)",
            "due_date": tomorrow,
            "priority": "Medium",
            "status": "Upcoming",
            "created_from": "Visit",
            "completion_notes": None,
            "created_at": "2026-10-25T16:00:00Z",
            "updated_at": "2026-10-25T16:00:00Z"
        },
        {
            "id": "task_005",
            "household_id": "hh_005",
            "household_name": "Kamla Yadav Household",
            "beneficiary_name": "Kamla Yadav (Elder)",
            "village": "Kalyanpur",
            "task_type": "Health camp",
            "description": "Inform family about NCD screening camp at Kashi PHC this Saturday",
            "due_date": in_3_days,
            "priority": "Medium",
            "status": "Upcoming",
            "created_from": "Camp",
            "completion_notes": None,
            "created_at": "2026-10-29T15:20:00Z",
            "updated_at": "2026-10-29T15:20:00Z"
        },
        {
            "id": "task_006",
            "household_id": "hh_006",
            "household_name": "Geeta Maurya Household",
            "beneficiary_name": "Geeta Maurya (Pregnant)",
            "village": "Shanti Kunj",
            "task_type": "Maternal health follow-up",
            "description": "Deliver Calcium & Iron tablets; follow up on severe leg swelling",
            "due_date": yesterday,
            "priority": "Urgent",
            "status": "Overdue",
            "created_from": "Visit",
            "completion_notes": None,
            "created_at": "2026-10-20T11:00:00Z",
            "updated_at": "2026-10-20T11:00:00Z"
        },
        {
            "id": "task_007",
            "household_id": "hh_004",
            "household_name": "Pooja Singh Household",
            "beneficiary_name": "Ananya Singh (Child - 4 yrs)",
            "village": "Shanti Kunj",
            "task_type": "Child health follow-up",
            "description": "Routine home visit completed: child height/weight measured on growth chart",
            "due_date": yesterday,
            "priority": "Low",
            "status": "Completed",
            "created_from": "Visit",
            "completion_notes": "Child growth is normal in Green Zone. Nutrition advice given to mother.",
            "created_at": "2026-10-22T10:00:00Z",
            "updated_at": "2026-10-22T11:00:00Z"
        }
    ]

def generate_mock_requests():
    return [
        {
            "id": "req_001",
            "household_id": "hh_001",
            "household_name": "Meena Devi",
            "beneficiary_name": "Meena Devi",
            "contact_number": "9871100221",
            "village": "Rampur Kalan",
            "category": "Urgent health concern",
            "description": "Experiencing sudden dizzy spells and blurred vision since this morning. Requested home visit.",
            "time_received": "Today, 08:30 AM",
            "priority": "Urgent",
            "status": "Acknowledged",
            "response_history": [
                "Received via community voice message at 08:30 AM",
                "Acknowledged by ASHA Sunita Devi at 08:45 AM. Scheduled priority visit for 11:30 AM."
            ],
            "created_at": "2026-11-03T08:30:00Z",
            "updated_at": "2026-11-03T08:45:00Z"
        },
        {
            "id": "req_002",
            "household_id": "hh_003",
            "household_name": "Sita Verma",
            "beneficiary_name": "Sita Verma",
            "contact_number": "9871100223",
            "village": "Lakshmi Nagar",
            "category": "Nutrition information",
            "description": "Enquiry regarding POSHAN Abhiyaan take-home ration collection dates from Anganwadi.",
            "time_received": "Yesterday, 04:15 PM",
            "priority": "Medium",
            "status": "In progress",
            "response_history": [
                "Request registered via Anganwadi helper"
            ],
            "created_at": "2026-11-02T16:15:00Z",
            "updated_at": "2026-11-02T16:15:00Z"
        },
        {
            "id": "req_003",
            "household_id": "hh_002",
            "household_name": "Rekha Sharma",
            "beneficiary_name": "Golu Sharma",
            "contact_number": "9871100222",
            "village": "Rampur Kalan",
            "category": "Vaccination information",
            "description": "Asked if Wednesday VHSND session will carry Rotavirus & MR vaccine for the 9-month child.",
            "time_received": "2 days ago",
            "priority": "High",
            "status": "Resolved",
            "response_history": [
                "Enquiry received 2 days ago",
                "ASHA Sunita visited and confirmed stock availability with ANM Maya."
            ],
            "created_at": "2026-11-01T10:00:00Z",
            "updated_at": "2026-11-02T12:00:00Z"
        },
        {
            "id": "req_004",
            "household_id": "hh_005",
            "household_name": "Kamla Yadav",
            "beneficiary_name": "Kamla Yadav",
            "contact_number": "9871100225",
            "village": "Kalyanpur",
            "category": "Appointment assistance",
            "description": "Assistance needed for NCD medicine renewal at Sub-Centre.",
            "time_received": "3 days ago",
            "priority": "Medium",
            "status": "New",
            "response_history": [],
            "created_at": "2026-10-31T14:00:00Z",
            "updated_at": "2026-10-31T14:00:00Z"
        }
    ]

def generate_mock_visits():
    return [
        {
            "id": "vis_001",
            "household_id": "hh_001",
            "household_name": "Meena Devi",
            "beneficiary_name": "Meena Devi",
            "visit_date": "2026-10-28",
            "activity_category": "Maternal Health",
            "activity_description": "ANC Home visit. Checked BP (118/76), distributed 30 IFA tablets, reminded about birth preparedness and 108 ambulance contact.",
            "visit_outcome": "Normal",
            "follow_up_required": True,
            "follow_up_date": "2026-11-04",
            "priority": "Urgent",
            "notes": "Meena agreed to attend the next VHSND session at Anganwadi center.",
            "status": "Confirmed",
            "created_task_id": "task_001",
            "created_at": "2026-10-28T14:30:00Z",
            "synced": True
        },
        {
            "id": "vis_002",
            "household_id": "hh_002",
            "household_name": "Rekha Sharma",
            "beneficiary_name": "Golu Sharma",
            "visit_date": "2026-10-25",
            "activity_category": "Child Health",
            "activity_description": "Postnatal home visit (PNC day 14). Assessed umbilical cord, newborn feeding, temperature and maternal health.",
            "visit_outcome": "Normal",
            "follow_up_required": True,
            "follow_up_date": "2026-11-06",
            "priority": "Routine",
            "notes": "Baby is feeding well, exclusive breastfeeding reinforced.",
            "status": "Confirmed",
            "created_task_id": "task_004",
            "created_at": "2026-10-25T16:00:00Z",
            "synced": True
        }
    ]

def generate_mock_claims():
    return [
        {
            "id": "claim_2026_10",
            "month": "October",
            "year": 2026,
            "asha_id": "asha_sunita_001",
            "asha_name": "Sunita Devi",
            "activities_count": 18,
            "total_estimated_amount": 3450,
            "status": "Submitted for Review",
            "submitted_at": "2026-10-31T18:00:00Z",
            "verified_at": None,
            "payment_status": "Under Verification",
            "supervisor_notes": "Submitted to ANM Maya for monthly verification. RCH register cross-checking in progress.",
            "disclaimer": "Disclaimer: Amounts and eligibility rules shown are illustrative for demonstration and claim-preparation assistance, not official government determinations.",
            "activities": [
                {
                    "id": "act_001",
                    "activity_date": "2026-10-28",
                    "category": "Maternal health",
                    "description": "Full Antenatal Care (ANC) facilitation & birth planning for Meena Devi",
                    "household_id": "hh_001",
                    "beneficiary_name": "Meena Devi",
                    "eligible_for_claim": True,
                    "incentive_code": "ASHA-MCH-01",
                    "estimated_amount": 300,
                    "status": "Included In Claim"
                },
                {
                    "id": "act_002",
                    "activity_date": "2026-10-25",
                    "category": "Child health",
                    "description": "HBNC Home visit Day 14 for newborn of Rekha Sharma",
                    "household_id": "hh_002",
                    "beneficiary_name": "Golu Sharma",
                    "eligible_for_claim": True,
                    "incentive_code": "ASHA-HBNC-03",
                    "estimated_amount": 250,
                    "status": "Included In Claim"
                },
                {
                    "id": "act_003",
                    "activity_date": "2026-10-22",
                    "category": "Immunisation",
                    "description": "Mobilisation of 4 children for complete immunisation session",
                    "household_id": "hh_004",
                    "beneficiary_name": "Ananya Singh & others",
                    "eligible_for_claim": True,
                    "incentive_code": "ASHA-IMM-02",
                    "estimated_amount": 400,
                    "status": "Included In Claim"
                },
                {
                    "id": "act_004",
                    "activity_date": "2026-10-18",
                    "category": "Community mobilisation",
                    "description": "Village Health Sanitation and Nutrition Committee (VHSNC) monthly meeting",
                    "household_id": "hh_001",
                    "beneficiary_name": "Community Members",
                    "eligible_for_claim": True,
                    "incentive_code": "ASHA-COMM-01",
                    "estimated_amount": 150,
                    "status": "Included In Claim"
                }
            ]
        },
        {
            "id": "claim_2026_09",
            "month": "September",
            "year": 2026,
            "asha_id": "asha_sunita_001",
            "asha_name": "Sunita Devi",
            "activities_count": 22,
            "total_estimated_amount": 4200,
            "status": "Approved by MO/ANM",
            "submitted_at": "2026-09-30T17:30:00Z",
            "verified_at": "2026-10-08T11:00:00Z",
            "payment_status": "Disbursed",
            "supervisor_notes": "All 22 activities verified with RCH register and approved by Medical Officer, Kashi PHC.",
            "disclaimer": "Disclaimer: Amounts and eligibility rules shown are illustrative for demonstration and claim-preparation assistance, not official government determinations.",
            "activities": []
        }
    ]

def generate_mock_notifications():
    return [
        {
            "id": "notif_001",
            "title": "Urgent Health Request",
            "message": "Meena Devi reported dizzy spells. Visit recommended today.",
            "category": "Urgent request",
            "priority": "Urgent",
            "is_read": False,
            "timestamp": "Today, 08:30 AM",
            "action_type": "request",
            "action_id": "req_001",
            "metadata": {"household_id": "hh_001"}
        },
        {
            "id": "notif_002",
            "title": "Follow-up Due Today",
            "message": "Maternal follow-up due for Sita Verma (Lakshmi Nagar).",
            "category": "Follow-up due",
            "priority": "High",
            "is_read": False,
            "timestamp": "Today, 07:00 AM",
            "action_type": "task",
            "action_id": "task_003",
            "metadata": {"household_id": "hh_003"}
        },
        {
            "id": "notif_003",
            "title": "VHSND Session Scheduled",
            "message": "Immunisation & ANC session this Wednesday at Anganwadi Centre 2.",
            "category": "Health camp",
            "priority": "Medium",
            "is_read": True,
            "timestamp": "Yesterday",
            "action_type": "camp",
            "action_id": "camp_vhsnd_01",
            "metadata": {}
        },
        {
            "id": "notif_004",
            "title": "September Incentive Disbursed",
            "message": "Incentive of ₹4,200 for September 2026 credited to registered bank account.",
            "category": "Payment status",
            "priority": "Medium",
            "is_read": True,
            "timestamp": "Oct 15, 2026",
            "action_type": "claim",
            "action_id": "claim_2026_09",
            "metadata": {}
        }
    ]

def generate_mock_sos_events():
    return [
        {
            "id": "sos_001",
            "household_id": "hh_001",
            "household_name": "Meena Devi",
            "beneficiary_name": "Meena Devi",
            "emergency_type": "Immediate Emergency",
            "description": "Simulation: Severe abdominal pain and bleeding in 7th month pregnancy.",
            "status": "Acknowledged",
            "call_112_initiated": True,
            "asha_notified": True,
            "escalation_level": 2,
            "timestamp": "2026-10-14T22:15:00Z",
            "resolved_at": "2026-10-15T01:30:00Z",
            "notes": "Patient escorted to Kashi PHC via 108 ambulance. Stable under MO care."
        }
    ]

