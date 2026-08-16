/**
 * Hostel Manager - Comprehensive Realistic Mock Dataset
 * Used for demo fallback when Supabase is empty or unconfigured.
 */

export interface MockHostel {
  id: string;
  name: string;
  code: string;
  gender_type: "male" | "female" | "co-ed";
  total_floors: number;
  floor_count: number;
  total_rooms: number;
  total_beds: number;
  occupied_beds: number;
  address: string;
  warden_name: string;
  warden_phone: string;
}

export interface MockAllocation {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  email: string;
  phone: string;
  hostel_name: string;
  hostel_code: string;
  room_number: string;
  bed_label: string;
  start_date: string;
  end_date: string | null;
  status: "active" | "cancelled" | "completed" | "transferred";
  allocated_by: string;
}

export interface MockIssue {
  id: string;
  title: string;
  description: string;
  category: "plumbing" | "electrical" | "carpentry" | "appliance" | "cleaning" | "internet" | "security" | "pest_control" | "other";
  priority: "low" | "medium" | "high" | "urgent";
  status: "reported" | "assigned" | "investigating" | "repair_scheduled" | "resolved";
  reporter_name: string;
  reporter_role: string;
  hostel_name: string;
  room_number: string;
  location_description?: string;
  created_at: string;
  resolved_at?: string;
  assigned_to?: string;
}

export interface MockLeaveRequest {
  id: string;
  student_id: string;
  student_name: string;
  roll_number: string;
  hostel_name: string;
  room_number: string;
  leave_type: "Outstation" | "Local Pass" | "Night Stay" | "Medical Emergency" | "Vacation";
  reason: string;
  destination: string;
  start_date: string;
  end_date: string;
  emergency_contact: string;
  status: "pending" | "approved" | "rejected" | "out" | "returned";
  warden_comments?: string;
  created_at: string;
}

export interface MockAnnouncement {
  id: string;
  title: string;
  content: string;
  category: "maintenance" | "fee" | "event" | "security" | "general";
  priority: "normal" | "important" | "urgent";
  target_audience: "All Hostels" | "Boys Hostels" | "Girls Hostels" | "Specific Block";
  author_name: string;
  author_role: string;
  is_pinned: boolean;
  created_at: string;
}

export interface MockAuditLog {
  id: string;
  action: string;
  actor_name: string;
  actor_role: string;
  target_entity: string;
  details: string;
  ip_address: string;
  timestamp: string;
}

// ----------------------------------------------------
// Mock Datasets
// ----------------------------------------------------

export const MOCK_HOSTELS: MockHostel[] = [
  {
    id: "h-1",
    name: "Aryabhata Tower (Block A)",
    code: "ARY-A",
    gender_type: "male",
    total_floors: 5,
    floor_count: 5,
    total_rooms: 60,
    total_beds: 180,
    occupied_beds: 162,
    address: "North Campus Quadrangle, Gate 2",
    warden_name: "Dr. Rajesh Sharma",
    warden_phone: "+91 98765 43210",
  },
  {
    id: "h-2",
    name: "Gargi Residence Hall",
    code: "GAR-B",
    gender_type: "female",
    total_floors: 4,
    floor_count: 4,
    total_rooms: 48,
    total_beds: 144,
    occupied_beds: 138,
    address: "South Campus Green, Near Library",
    warden_name: "Prof. Sunita Verma",
    warden_phone: "+91 98123 55678",
  },
  {
    id: "h-3",
    name: "Kalam Research Hostel",
    code: "KLM-C",
    gender_type: "co-ed",
    total_floors: 6,
    floor_count: 6,
    total_rooms: 72,
    total_beds: 144,
    occupied_beds: 110,
    address: "Innovation Avenue, East Campus",
    warden_name: "Dr. Vikram Seth",
    warden_phone: "+91 97111 22334",
  },
  {
    id: "h-4",
    name: "Turing International House",
    code: "TUR-INT",
    gender_type: "co-ed",
    total_floors: 4,
    floor_count: 4,
    total_rooms: 40,
    total_beds: 80,
    occupied_beds: 74,
    address: "Global Student Enclave, West Gate",
    warden_name: "Dr. Ananya Roy",
    warden_phone: "+91 99887 76655",
  },
];

export const MOCK_ALLOCATIONS: MockAllocation[] = [
  {
    id: "alloc-101",
    student_id: "s-101",
    student_name: "Aarav Sharma",
    roll_number: "2024-CS-042",
    email: "aarav.sharma@campus.edu",
    phone: "+91 98765 11223",
    hostel_name: "Aryabhata Tower (Block A)",
    hostel_code: "ARY-A",
    room_number: "304",
    bed_label: "Bed A",
    start_date: "2025-08-01",
    end_date: "2026-05-31",
    status: "active",
    allocated_by: "Chief Warden",
  },
  {
    id: "alloc-102",
    student_id: "s-102",
    student_name: "Ananya Deshmukh",
    roll_number: "2024-EC-089",
    email: "ananya.d@campus.edu",
    phone: "+91 98765 22334",
    hostel_name: "Gargi Residence Hall",
    hostel_code: "GAR-B",
    room_number: "212",
    bed_label: "Bed B",
    start_date: "2025-08-01",
    end_date: "2026-05-31",
    status: "active",
    allocated_by: "Warden Desk",
  },
  {
    id: "alloc-103",
    student_id: "s-103",
    student_name: "Rohan Kulkarni",
    roll_number: "2023-ME-015",
    email: "rohan.k@campus.edu",
    phone: "+91 98765 33445",
    hostel_name: "Aryabhata Tower (Block A)",
    hostel_code: "ARY-A",
    room_number: "410",
    bed_label: "Bed C",
    start_date: "2025-08-01",
    end_date: "2026-05-31",
    status: "active",
    allocated_by: "Chief Warden",
  },
  {
    id: "alloc-104",
    student_id: "s-104",
    student_name: "Priya Nair",
    roll_number: "2024-BT-007",
    email: "priya.nair@campus.edu",
    phone: "+91 98765 44556",
    hostel_name: "Gargi Residence Hall",
    hostel_code: "GAR-B",
    room_number: "105",
    bed_label: "Bed A",
    start_date: "2025-08-01",
    end_date: "2026-05-31",
    status: "active",
    allocated_by: "Warden Desk",
  },
  {
    id: "alloc-105",
    student_id: "s-105",
    student_name: "David Chen",
    roll_number: "2024-INT-003",
    email: "david.chen@campus.edu",
    phone: "+91 98765 55667",
    hostel_name: "Turing International House",
    hostel_code: "TUR-INT",
    room_number: "201",
    bed_label: "Bed A",
    start_date: "2025-08-01",
    end_date: "2026-05-31",
    status: "active",
    allocated_by: "Admin",
  },
  {
    id: "alloc-106",
    student_id: "s-106",
    student_name: "Sneha Patel",
    roll_number: "2023-CS-112",
    email: "sneha.p@campus.edu",
    phone: "+91 98765 66778",
    hostel_name: "Kalam Research Hostel",
    hostel_code: "KLM-C",
    room_number: "502",
    bed_label: "Bed B",
    start_date: "2025-08-01",
    end_date: "2026-05-31",
    status: "active",
    allocated_by: "Chief Warden",
  },
  {
    id: "alloc-107",
    student_id: "s-107",
    student_name: "Vikram Malhotra",
    roll_number: "2022-CE-033",
    email: "vikram.m@campus.edu",
    phone: "+91 98765 77889",
    hostel_name: "Aryabhata Tower (Block A)",
    hostel_code: "ARY-A",
    room_number: "501",
    bed_label: "Bed A",
    start_date: "2024-08-01",
    end_date: "2025-05-31",
    status: "completed",
    allocated_by: "Admin",
  },
];

export const MOCK_ISSUES: MockIssue[] = [
  {
    id: "issue-201",
    title: "Air Conditioner Leaking Water in Room 304",
    description: "The split AC unit is leaking water onto the study desk. Requires technician inspection and compressor drain flush.",
    category: "appliance",
    priority: "high",
    status: "investigating",
    reporter_name: "Aarav Sharma",
    reporter_role: "Student",
    hostel_name: "Aryabhata Tower (Block A)",
    room_number: "304",
    location_description: "Desk area next to balcony window",
    created_at: "2026-08-16T14:30:00Z",
    assigned_to: "Tech Team - ElectroCool",
  },
  {
    id: "issue-202",
    title: "Wi-Fi Access Point Dropping Connection (Floor 2)",
    description: "High packet loss on 5GHz band between 8 PM and 11 PM daily. Affects rooms 201 to 215.",
    category: "internet",
    priority: "urgent",
    status: "repair_scheduled",
    reporter_name: "Ananya Deshmukh",
    reporter_role: "Student",
    hostel_name: "Gargi Residence Hall",
    room_number: "212",
    location_description: "Central corridor ceiling router",
    created_at: "2026-08-16T09:15:00Z",
    assigned_to: "Campus IT Support",
  },
  {
    id: "issue-203",
    title: "Main Bathroom Sink Pipe Clogged",
    description: "Water draining very slowly in communal washroom basin 2.",
    category: "plumbing",
    priority: "medium",
    status: "assigned",
    reporter_name: "Rohan Kulkarni",
    reporter_role: "Student",
    hostel_name: "Aryabhata Tower (Block A)",
    room_number: "410",
    location_description: "East wing washroom 4th floor",
    created_at: "2026-08-15T18:40:00Z",
    assigned_to: "Ramesh Plumber",
  },
  {
    id: "issue-204",
    title: "Corridor Light Fixture Flickering",
    description: "Fluorescent tube flickering continuously outside Room 105.",
    category: "electrical",
    priority: "low",
    status: "resolved",
    reporter_name: "Priya Nair",
    reporter_role: "Student",
    hostel_name: "Gargi Residence Hall",
    room_number: "105",
    created_at: "2026-08-14T11:00:00Z",
    resolved_at: "2026-08-15T10:20:00Z",
    assigned_to: "Electrician Team B",
  },
  {
    id: "issue-205",
    title: "Study Chair Hydraulic Cylinder Broken",
    description: "Height adjustment lever on desk chair stuck at lowest position.",
    category: "carpentry",
    priority: "medium",
    status: "reported",
    reporter_name: "David Chen",
    reporter_role: "Student",
    hostel_name: "Turing International House",
    room_number: "201",
    created_at: "2026-08-16T16:50:00Z",
  },
  {
    id: "issue-206",
    title: "Elevator Emergency Intercom Buzzing",
    description: "Constant static noise coming from intercom speaker inside Elevator B.",
    category: "security",
    priority: "high",
    status: "repair_scheduled",
    reporter_name: "Dr. Rajesh Sharma",
    reporter_role: "Warden",
    hostel_name: "Aryabhata Tower (Block A)",
    room_number: "Lobby",
    location_description: "Elevator B Shaft",
    created_at: "2026-08-16T08:00:00Z",
    assigned_to: "Schindler Elevator Engineers",
  },
  {
    id: "issue-207",
    title: "Geyser Heating Coil Tripping MCB Switch",
    description: "Geyser in Room 502 washroom trips the circuit breaker after 5 minutes of operation.",
    category: "appliance",
    priority: "urgent",
    status: "investigating",
    reporter_name: "Sneha Patel",
    reporter_role: "Student",
    hostel_name: "Kalam Research Hostel",
    room_number: "502",
    location_description: "5th Floor Washroom",
    created_at: "2026-08-17T02:10:00Z",
    assigned_to: "Electrician Team A",
  },
  {
    id: "issue-208",
    title: "Window Mosquito Netting Torn in Room 212",
    description: "Aluminum mesh screen came off window frame, allowing insects inside at night.",
    category: "carpentry",
    priority: "medium",
    status: "reported",
    reporter_name: "Ananya Deshmukh",
    reporter_role: "Student",
    hostel_name: "Gargi Residence Hall",
    room_number: "212",
    location_description: "East-facing window frame",
    created_at: "2026-08-17T01:30:00Z",
  },
  {
    id: "issue-209",
    title: "Common Room Water Cooler Filter Replacement",
    description: "Water output tastes metallic and purification filter light indicator turned red.",
    category: "plumbing",
    priority: "high",
    status: "assigned",
    reporter_name: "Prof. Sunita Verma",
    reporter_role: "Warden",
    hostel_name: "Gargi Residence Hall",
    room_number: "Ground Floor",
    location_description: "Common Room Recreation Area",
    created_at: "2026-08-16T22:15:00Z",
    assigned_to: "AquaPure Service Tech",
  },
  {
    id: "issue-210",
    title: "Door Lock Mortise Key Sticking",
    description: "Room main door latch gets jammed when locking from outside.",
    category: "security",
    priority: "medium",
    status: "resolved",
    reporter_name: "Aarav Sharma",
    reporter_role: "Student",
    hostel_name: "Aryabhata Tower (Block A)",
    room_number: "304",
    created_at: "2026-08-13T14:00:00Z",
    resolved_at: "2026-08-14T09:30:00Z",
    assigned_to: "Locksmith Team",
  },
  {
    id: "issue-211",
    title: "Pest Control Drive Requested for Mess Kitchen",
    description: "Routine quarterly pest eradication & fogging required before semester midterms.",
    category: "pest_control",
    priority: "medium",
    status: "repair_scheduled",
    reporter_name: "Dr. Vikram Seth",
    reporter_role: "Warden",
    hostel_name: "Kalam Research Hostel",
    room_number: "Mess Hall",
    location_description: "Central Kitchen & Food Storage",
    created_at: "2026-08-16T11:45:00Z",
    assigned_to: "ShieldPest Services",
  },
  {
    id: "issue-212",
    title: "Balcony Drain Overflow After Monsoon Rain",
    description: "Leaves blocking rainwater exit pipe on 4th floor west balcony.",
    category: "cleaning",
    priority: "low",
    status: "reported",
    reporter_name: "Rohan Kulkarni",
    reporter_role: "Student",
    hostel_name: "Aryabhata Tower (Block A)",
    room_number: "410",
    created_at: "2026-08-17T03:00:00Z",
  },
];

export const MOCK_LEAVE_REQUESTS: MockLeaveRequest[] = [
  {
    id: "leave-301",
    student_id: "s-101",
    student_name: "Aarav Sharma",
    roll_number: "2024-CS-042",
    hostel_name: "Aryabhata Tower (Block A)",
    room_number: "304",
    leave_type: "Outstation",
    reason: "Attending National Hackathon Finals at IIT Bombay",
    destination: "Mumbai, Maharashtra",
    start_date: "2026-08-20",
    end_date: "2026-08-24",
    emergency_contact: "+91 98765 00000 (Father)",
    status: "approved",
    warden_comments: "Verified event invitation letter. Approved.",
    created_at: "2026-08-16T10:00:00Z",
  },
  {
    id: "leave-302",
    student_id: "s-102",
    student_name: "Ananya Deshmukh",
    roll_number: "2024-EC-089",
    hostel_name: "Gargi Residence Hall",
    room_number: "212",
    leave_type: "Night Stay",
    reason: "Family gathering at local guardian residence",
    destination: "Green Park, New Delhi",
    start_date: "2026-08-17",
    end_date: "2026-08-18",
    emergency_contact: "+91 98123 99999 (Guardian)",
    status: "pending",
    created_at: "2026-08-16T19:20:00Z",
  },
  {
    id: "leave-303",
    student_id: "s-103",
    student_name: "Rohan Kulkarni",
    roll_number: "2023-ME-015",
    hostel_name: "Aryabhata Tower (Block A)",
    room_number: "410",
    leave_type: "Medical Emergency",
    reason: "Dental surgery appointment and rest",
    destination: "Apollo Hospital, Pune",
    start_date: "2026-08-18",
    end_date: "2026-08-21",
    emergency_contact: "+91 98765 88888 (Mother)",
    status: "approved",
    warden_comments: "Medical prescription attached. Get well soon.",
    created_at: "2026-08-15T15:10:00Z",
  },
  {
    id: "leave-304",
    student_id: "s-104",
    student_name: "Priya Nair",
    roll_number: "2024-BT-007",
    hostel_name: "Gargi Residence Hall",
    room_number: "105",
    leave_type: "Local Pass",
    reason: "Late library study session & project submission",
    destination: "Central Library Building",
    start_date: "2026-08-16",
    end_date: "2026-08-16",
    emergency_contact: "+91 98765 44556",
    status: "returned",
    warden_comments: "Returned at 22:45. Verified gate log.",
    created_at: "2026-08-16T17:00:00Z",
  },
];

export const MOCK_ANNOUNCEMENTS: MockAnnouncement[] = [
  {
    id: "ann-401",
    title: "Urgent: Water Supply Maintenance Notice (Block A & B)",
    content: "Please be informed that scheduled plumbing maintenance will occur tomorrow between 10:00 AM and 01:00 PM. Overhead tanks will be flushed. Please store adequate drinking water.",
    category: "maintenance",
    priority: "urgent",
    target_audience: "All Hostels",
    author_name: "Chief Warden Office",
    author_role: "Admin",
    is_pinned: true,
    created_at: "2026-08-16T12:00:00Z",
  },
  {
    id: "ann-402",
    title: "Fall Semester Hostel Mess Fee Payment Deadline",
    content: "All resident students are requested to clear mess and utility dues before August 25, 2026. Payments can be submitted online via the student dashboard.",
    category: "fee",
    priority: "important",
    target_audience: "All Hostels",
    author_name: "Finance Controller",
    author_role: "Admin",
    is_pinned: true,
    created_at: "2026-08-14T09:00:00Z",
  },
  {
    id: "ann-403",
    title: "Annual Cultural Fest Hostel Decoration Competition",
    content: "Hostel blocks are invited to participate in the eco-friendly green decoration drive. Cash prizes and trophy for the best maintained block!",
    category: "event",
    priority: "normal",
    target_audience: "All Hostels",
    author_name: "Student Cultural Council",
    author_role: "Warden",
    is_pinned: false,
    created_at: "2026-08-12T16:30:00Z",
  },
];

export const MOCK_AUDIT_LOGS: MockAuditLog[] = [
  {
    id: "log-501",
    action: "ALLOCATION_CREATED",
    actor_name: "Dr. Rajesh Sharma",
    actor_role: "Admin",
    target_entity: "Student: Aarav Sharma (ARY-A Room 304)",
    details: "Assigned Bed A in Room 304 under Aryabhata Tower for Fall Semester.",
    ip_address: "192.168.1.42",
    timestamp: "2026-08-16T14:22:10Z",
  },
  {
    id: "log-502",
    action: "LEAVE_APPROVED",
    actor_name: "Prof. Sunita Verma",
    actor_role: "Warden",
    target_entity: "Gate Pass: Outstation (Aarav Sharma)",
    details: "Approved outstation leave request for IIT Bombay Hackathon.",
    ip_address: "192.168.1.88",
    timestamp: "2026-08-16T11:05:00Z",
  },
  {
    id: "log-503",
    action: "ISSUE_STATUS_CHANGED",
    actor_name: "Ramesh Plumber",
    actor_role: "Maintenance Staff",
    target_entity: "Ticket #issue-204 (Gargi Hall)",
    details: "Updated ticket status from IN_PROGRESS to RESOLVED.",
    ip_address: "192.168.2.14",
    timestamp: "2026-08-15T10:20:00Z",
  },
  {
    id: "log-504",
    action: "ANNOUNCEMENT_PINNED",
    actor_name: "Chief Warden Office",
    actor_role: "Admin",
    target_entity: "Announcement: Water Supply Maintenance",
    details: "Pinned high priority notice to top of resident feeds.",
    ip_address: "192.168.1.1",
    timestamp: "2026-08-16T12:01:00Z",
  },
];

export const MOCK_ANALYTICS_METRICS = {
  totalHostels: 4,
  totalCapacity: 484,
  occupiedBeds: 424,
  occupancyRate: 87.6,
  pendingIssues: 4,
  resolvedIssues: 38,
  averageResolutionHours: 14.2,
  activeGatePasses: 3,
  hostelBreakdown: [
    { name: "Aryabhata Tower", total: 180, occupied: 162, rate: 90 },
    { name: "Gargi Residence", total: 144, occupied: 138, rate: 95.8 },
    { name: "Kalam Research", total: 144, occupied: 110, rate: 76.4 },
    { name: "Turing House", total: 80, occupied: 74, rate: 92.5 },
  ],
  categoryIssues: [
    { category: "Plumbing", count: 12 },
    { category: "Internet / Wi-Fi", count: 10 },
    { category: "Appliance", count: 8 },
    { category: "Electrical", count: 7 },
    { category: "Carpentry", count: 5 },
  ],
};
