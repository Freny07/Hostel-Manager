/**
 * Hostel Manager Core Domain TypeScript Definitions
 */

export type RoomStatus = "available" | "occupied" | "under_maintenance" | "reserved";
export type RoomType = "single" | "double" | "triple" | "dormitory";

export interface HostelBlock {
  id: string;
  name: string;
  code: string;
  gender: "male" | "female" | "co-ed";
  totalFloors: number;
  totalRooms: number;
}

export interface Room {
  id: string;
  blockId: string;
  roomNumber: string;
  floor: number;
  type: RoomType;
  capacity: number;
  occupied: number;
  pricePerMonth: number;
  status: RoomStatus;
  amenities: string[];
}

export interface Student {
  id: string;
  rollNumber: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  roomId?: string;
  blockId?: string;
  course: string;
  yearOfStudy: number;
  emergencyContact: {
    name: string;
    relationship: string;
    phone: string;
  };
  createdAt: string;
}

export interface MaintenanceTicket {
  id: string;
  ticketNumber: string;
  studentId: string;
  roomId: string;
  category: "plumbing" | "electrical" | "carpentry" | "cleaning" | "wifi" | "other";
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "open" | "in_progress" | "resolved" | "closed";
  createdAt: string;
}

export interface GatePass {
  id: string;
  passNumber: string;
  studentId: string;
  reason: string;
  outTime: string;
  expectedInTime: string;
  actualInTime?: string;
  status: "pending" | "approved" | "rejected" | "out" | "returned";
  approvedBy?: string;
}
