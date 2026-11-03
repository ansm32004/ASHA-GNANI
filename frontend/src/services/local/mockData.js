// Realistic seeded Indian demo data for frontline ASHA companion
export const SEEDED_HOUSEHOLDS = [
  {
    id: "hh_001",
    household_id: "HH-RK-001",
    primary_contact_name: "Meena Devi",
    village: "Rampur Kalan",
    sub_area: "Ward 3, Near Primary School",
    contact_number: "9871100221",
    preferred_language: "hi",
    address: "House 14, Gali No. 2, Rampur Kalan",
    consent_status: true,
    priority: "Urgent",
    members_count: 3,
    last_visit_date: "2026-10-28",
    next_follow_up: "2026-11-04",
    pending_tasks_count: 2,
    members: [
      {
        id: "mem_001_1",
        name: "Meena Devi",
        age: 24,
        gender: "Female",
        relation: "Head/Mother",
        category: "Pregnant Woman",
        rch_id: "RCH-UP-2026-89102",
        is_high_risk: true,
        high_risk_reason: "Mild anaemia (Hb 9.2 g/dL), 3rd trimester",
        pregnancy_month: 7,
        expected_delivery_date: "2026-12-18",
        next_due_vaccine: "TT-2 Booster"
      },
      {
        id: "mem_001_2",
        name: "Ramesh Kumar",
        age: 28,
        gender: "Male",
        relation: "Husband",
        category: "General",
        is_high_risk: false
      },
      {
        id: "mem_001_3",
        name: "Aarav Kumar",
        age: 2,
        gender: "Male",
        relation: "Son",
        category: "Child (1-5)",
        is_high_risk: false,
        next_due_vaccine: "DPT Booster 1"
      }
    ]
  },
  {
    id: "hh_002",
    household_id: "HH-RK-002",
    primary_contact_name: "Rekha Sharma",
    village: "Rampur Kalan",
    sub_area: "Purani Basti",
    contact_number: "9871100222",
    preferred_language: "hi",
    address: "House 28, Purani Basti, Rampur Kalan",
    consent_status: true,
    priority: "Routine",
    members_count: 2,
    last_visit_date: "2026-10-25",
    next_follow_up: "2026-11-06",
    pending_tasks_count: 1,
    members: [
      {
        id: "mem_002_1",
        name: "Rekha Sharma",
        age: 29,
        gender: "Female",
        relation: "Head",
        category: "Lactating Mother",
        rch_id: "RCH-UP-2026-44211",
        is_high_risk: false
      },
      {
        id: "mem_002_2",
        name: "Golu Sharma",
        age: 0,
        gender: "Male",
        relation: "Son",
        category: "Infant",
        is_high_risk: false,
        next_due_vaccine: "Pentavalent-3 + IPV-2"
      }
    ]
  },
  {
    id: "hh_003",
    household_id: "HH-LN-003",
    primary_contact_name: "Sita Verma",
    village: "Lakshmi Nagar",
    sub_area: "Mandi Chowk",
    contact_number: "9871100223",
    preferred_language: "hi",
    address: "Opposite Shiv Mandir, Lakshmi Nagar",
    consent_status: true,
    priority: "Urgent",
    members_count: 2,
    last_visit_date: "2026-10-30",
    next_follow_up: "2026-11-03",
    pending_tasks_count: 1,
    members: [
      {
        id: "mem_003_1",
        name: "Sita Verma",
        age: 21,
        gender: "Female",
        relation: "Wife",
        category: "Pregnant Woman",
        rch_id: "RCH-UP-2026-78310",
        is_high_risk: true,
        high_risk_reason: "Borderline blood pressure (138/88)",
        pregnancy_month: 5,
        expected_delivery_date: "2027-02-14",
        next_due_vaccine: "TT-1"
      }
    ]
  },
  {
    id: "hh_004",
    household_id: "HH-SK-004",
    primary_contact_name: "Pooja Singh",
    village: "Shanti Kunj",
    sub_area: "Ganga Ghat Road",
    contact_number: "9871100224",
    preferred_language: "hi",
    address: "Plot 12, Ganga Ghat Road, Shanti Kunj",
    consent_status: true,
    priority: "Routine",
    members_count: 2,
    last_visit_date: "2026-10-22",
    next_follow_up: "2026-11-08",
    pending_tasks_count: 0,
    members: [
      {
        id: "mem_004_1",
        name: "Pooja Singh",
        age: 32,
        gender: "Female",
        relation: "Head",
        category: "General",
        is_high_risk: false
      },
      {
        id: "mem_004_2",
        name: "Ananya Singh",
        age: 4,
        gender: "Female",
        relation: "Daughter",
        category: "Child (1-5)",
        is_high_risk: false,
        next_due_vaccine: "Vitamin A Dose 7"
      }
    ]
  },
  {
    id: "hh_005",
    household_id: "HH-KP-005",
    primary_contact_name: "Kamla Yadav",
    village: "Kalyanpur",
    sub_area: "Kisan Basti",
    contact_number: "9871100225",
    preferred_language: "hi",
    address: "Near Tubewell No. 3, Kalyanpur",
    consent_status: true,
    priority: "Priority",
    members_count: 3,
    last_visit_date: "2026-10-29",
    next_follow_up: "2026-11-05",
    pending_tasks_count: 1,
    members: [
      {
        id: "mem_005_1",
        name: "Kamla Yadav",
        age: 55,
        gender: "Female",
        relation: "Head",
        category: "Elder",
        is_high_risk: true,
        high_risk_reason: "Hypertension under NCD screening"
      }
    ]
  }
];

// Additional 29 realistic Indian households to guarantee 34+ records
const VILLAGES = ["Rampur Kalan", "Lakshmi Nagar", "Shanti Kunj", "Kalyanpur", "Basti Vikas"];
const INDIAN_NAMES = [
  "Geeta Maurya", "Shashi Bind", "Mamta Patel", "Savitri Gond", "Rani Nishad",
  "Priyanka Gupta", "Sunita Paswan", "Kavita Chauhan", "Urmila Tripathi", "Sarojini Devi",
  "Pushpa Prajapati", "Aarti Kashyap", "Manju Pal", "Anita Rajbhar", "Durgawati Bind",
  "Chandrakala Devi", "Sangeeta Dubey", "Parvati Rawat", "Sudha Tiwari", "Bindu Sonkar",
  "Kanti Devi", "Indu Pandey", "Maya Chaurasia", "Lalita Vishwakarma", "Sharda Prasad",
  "Seema Jaiswal", "Baby Khatun", "Rehana Bano", "Fatima Begum"
];

INDIAN_NAMES.forEach((name, i) => {
  const idx = i + 6;
  const v = VILLAGES[(idx - 1) % VILLAGES.length];
  const isPregnant = idx % 3 === 0;
  const isLactating = idx % 3 === 1;
  const cat = isPregnant ? "Pregnant Woman" : (isLactating ? "Lactating Mother" : "General");
  const prio = isPregnant && idx % 2 === 0 ? "Urgent" : (isPregnant || isLactating ? "Priority" : "Routine");

  SEEDED_HOUSEHOLDS.push({
    id: `hh_${String(idx).padStart(3, '0')}`,
    household_id: `HH-${v.substring(0, 2).toUpperCase()}-${String(idx).padStart(3, '0')}`,
    primary_contact_name: name,
    village: v,
    sub_area: `Lane ${idx % 5 + 1}, Ward ${(idx % 4) + 1}`,
    contact_number: `9871100${String(idx).padStart(3, '0')}`,
    preferred_language: "hi",
    address: `Makan No. ${idx * 7}, ${v}`,
    consent_status: true,
    priority: prio,
    members_count: 2,
    last_visit_date: `2026-10-${String(Math.max(10, 28 - (idx % 15))).padStart(2, '0')}`,
    next_follow_up: `2026-11-${String((idx % 10) + 2).padStart(2, '0')}`,
    pending_tasks_count: prio !== "Routine" ? 1 : 0,
    members: [
      {
        id: `mem_${idx}_1`,
        name: name,
        age: 22 + (idx % 20),
        gender: "Female",
        relation: "Head",
        category: cat,
        is_high_risk: prio === "Urgent",
        high_risk_reason: prio === "Urgent" ? "Severe anaemia (Hb < 8 g/dL)" : undefined
      }
    ]
  });
});

export const SEEDED_TASKS = [
  {
    id: "task_001",
    household_id: "hh_001",
    household_name: "Meena Devi",
    beneficiary_name: "Meena Devi",
    village: "Rampur Kalan",
    task_type: "Maternal health follow-up",
    description: "Check IFA tablet intake & monitor blood pressure (3rd trimester follow-up)",
    due_date: "2026-11-03",
    priority: "Urgent",
    status: "Due today",
    created_from: "Visit"
  },
  {
    id: "task_002",
    household_id: "hh_001",
    household_name: "Meena Devi",
    beneficiary_name: "Aarav Kumar",
    village: "Rampur Kalan",
    task_type: "Vaccination reminder",
    description: "Mobilise child Aarav for DPT Booster 1 in upcoming Wednesday VHSND session",
    due_date: "2026-11-06",
    priority: "High",
    status: "Upcoming",
    created_from: "Manual"
  },
  {
    id: "task_003",
    household_id: "hh_003",
    household_name: "Sita Verma",
    beneficiary_name: "Sita Verma",
    village: "Lakshmi Nagar",
    task_type: "Maternal health follow-up",
    description: "Confirm PHC registration for ANC checkup and JSY bank account linking",
    due_date: "2026-11-03",
    priority: "Urgent",
    status: "Due today",
    created_from: "Visit"
  },
  {
    id: "task_004",
    household_id: "hh_002",
    household_name: "Rekha Sharma",
    beneficiary_name: "Golu Sharma",
    village: "Rampur Kalan",
    task_type: "Child health follow-up",
    description: "Exclusive breastfeeding counseling & weight tracking (14-day check)",
    due_date: "2026-11-04",
    priority: "Medium",
    status: "Upcoming",
    created_from: "Visit"
  },
  {
    id: "task_005",
    household_id: "hh_005",
    household_name: "Kamla Yadav",
    beneficiary_name: "Kamla Yadav",
    village: "Kalyanpur",
    task_type: "Health camp",
    description: "Inform family about NCD screening camp at Kashi PHC this Saturday",
    due_date: "2026-11-06",
    priority: "Medium",
    status: "Upcoming",
    created_from: "Camp"
  },
  {
    id: "task_006",
    household_id: "hh_006",
    household_name: "Geeta Maurya",
    beneficiary_name: "Geeta Maurya",
    village: "Shanti Kunj",
    task_type: "Maternal health follow-up",
    description: "Deliver Calcium & Iron tablets; follow up on severe leg swelling",
    due_date: "2026-11-02",
    priority: "Urgent",
    status: "Overdue",
    created_from: "Visit"
  }
];

export const SEEDED_REQUESTS = [
  {
    id: "req_001",
    household_id: "hh_001",
    household_name: "Meena Devi",
    contact_number: "9871100221",
    village: "Rampur Kalan",
    category: "Urgent health concern",
    description: "Experiencing sudden dizzy spells and blurred vision since this morning. Requested home visit.",
    time_received: "Today, 08:30 AM",
    priority: "Urgent",
    status: "Acknowledged",
    response_history: [
      "Received via community voice message at 08:30 AM",
      "Acknowledged by ASHA Sunita Devi at 08:45 AM. Scheduled priority visit for 11:30 AM."
    ]
  },
  {
    id: "req_002",
    household_id: "hh_003",
    household_name: "Sita Verma",
    contact_number: "9871100223",
    village: "Lakshmi Nagar",
    category: "Nutrition information",
    description: "Enquiry regarding POSHAN Abhiyaan take-home ration collection dates from Anganwadi.",
    time_received: "Yesterday, 04:15 PM",
    priority: "Medium",
    status: "In progress",
    response_history: [
      "Request registered via Anganwadi helper"
    ]
  },
  {
    id: "req_003",
    household_id: "hh_002",
    household_name: "Rekha Sharma",
    contact_number: "9871100222",
    village: "Rampur Kalan",
    category: "Vaccination information",
    description: "Asked if Wednesday VHSND session will carry Rotavirus & MR vaccine for the 9-month child.",
    time_received: "2 days ago",
    priority: "High",
    status: "Resolved",
    response_history: [
      "Enquiry received 2 days ago",
      "ASHA Sunita visited and confirmed stock availability with ANM Maya."
    ]
  }
];

export const SEEDED_CLAIMS = [
  {
    id: "claim_2026_10",
    month: "October",
    year: 2026,
    asha_id: "asha_sunita_001",
    asha_name: "Sunita Devi",
    activities_count: 18,
    total_estimated_amount: 3450,
    status: "Submitted for Review",
    payment_status: "Under Verification",
    supervisor_notes: "Submitted to ANM Maya for monthly verification. RCH register cross-checking in progress.",
    disclaimer: "Disclaimer: Amounts and eligibility rules shown are illustrative for demonstration and claim-preparation assistance, not official government determinations."
  },
  {
    id: "claim_2026_09",
    month: "September",
    year: 2026,
    asha_id: "asha_sunita_001",
    asha_name: "Sunita Devi",
    activities_count: 22,
    total_estimated_amount: 4200,
    status: "Approved by MO/ANM",
    payment_status: "Disbursed",
    supervisor_notes: "All 22 activities verified with RCH register and approved by Medical Officer, Kashi PHC."
  }
];

