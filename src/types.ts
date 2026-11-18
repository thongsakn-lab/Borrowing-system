export type UserRole = 'admin' | 'user';

export type EquipmentCategory =
  | 'กล้อง'
  | 'ไมโครโฟน'
  | 'ขาตั้งกล้อง'
  | 'โปรเจกเตอร์'
  | 'ไฟสตูดิโอ'
  | 'อุปกรณ์เสริม';

export type EquipmentStatus = 'พร้อมใช้งาน' | 'ชำรุด/ซ่อมบำรุง' | 'งดให้บริการ';

export type BookingStatus =
  | 'รออนุมัติ'
  | 'กำลังยืม'
  | 'คืนแล้ว'
  | 'ถูกปฏิเสธ'
  | 'ยกเลิกแล้ว';

export type ReturnCondition =
  | 'ปกติสมบูรณ์'
  | 'ชำรุดเล็กน้อย'
  | 'ชำรุดต้องซ่อม';

export interface UserProfile {
  email: string;
  name: string;
  phone: string;
  studentId: string;
  avatarUrl: string;
  affiliation: string;
  createdAt: string;
  updatedAt: string;
}

export interface EquipmentItem {
  id: string;
  code: string;
  name: string;
  category: EquipmentCategory;
  totalQty: number;
  availableQty: number;
  status: EquipmentStatus;
  imageUrl: string;
  description: string;
  createdAt: string;
  updatedAt: string;
}

export interface BookingRecord {
  id: string;
  equipmentId: string;
  equipmentCode: string;
  equipmentName: string;
  equipmentCategory: EquipmentCategory;
  equipmentImageUrl: string;
  userEmail: string;
  userName: string;
  userPhone: string;
  userStudentId: string;
  userAffiliation: string;
  quantity: number;
  borrowDate: string;
  dueDate: string;
  purpose: string;
  status: BookingStatus;
  createdAt: string;
  updatedAt: string;
  approvedAt?: string;
  approvedBy?: string;
  rejectedAt?: string;
  rejectedBy?: string;
  rejectReason?: string;
  returnedAt?: string;
  returnedBy?: string;
  returnCondition?: ReturnCondition;
  returnNote?: string;
}

export interface AdminAllowlistEntry {
  email: string;
  addedBy: string;
  addedAt: string;
  isOwner: boolean;
}

export interface DashboardStats {
  totalEquipmentTypes: number;
  totalUnits: number;
  availableUnits: number;
  borrowedUnits: number;
  pendingBookings: number;
  activeBookings: number;
  completedBookings: number;
}

export interface AppStateResponse {
  equipment: EquipmentItem[];
  bookings: BookingRecord[];
  myBookings: BookingRecord[];
  currentUser: UserProfile | null;
  role: UserRole | null;
  users: UserProfile[];
  admins: AdminAllowlistEntry[];
  stats: DashboardStats;
}
