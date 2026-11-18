import type {
  AdminAllowlistEntry,
  AppStateResponse,
  BookingRecord,
  DashboardStats,
  EquipmentCategory,
  EquipmentItem,
  EquipmentStatus,
  ReturnCondition,
  UserProfile,
  UserRole,
} from '../types';

const OWNER_ADMIN_EMAIL = 'nichanatnicha1102@gmail.com';
const STORAGE_KEY = 'edtech_borrowing_db_v1';

interface LocalDatabaseSchema {
  admins: AdminAllowlistEntry[];
  users: Record<string, UserProfile>;
  equipment: EquipmentItem[];
  bookings: BookingRecord[];
}

function buildSeedDatabase(): LocalDatabaseSchema {
  const now = new Date().toISOString();
  const yesterday = new Date(Date.now() - 86400000).toISOString();
  const twoDaysAgo = new Date(Date.now() - 2 * 86400000).toISOString();
  const todayStr = new Date().toISOString().slice(0, 10);
  const nextWeekStr = new Date(Date.now() + 5 * 86400000).toISOString().slice(0, 10);

  return {
    admins: [
      {
        email: OWNER_ADMIN_EMAIL,
        addedBy: 'system',
        addedAt: now,
        isOwner: true,
      },
    ],
    users: {
      [OWNER_ADMIN_EMAIL]: {
        email: OWNER_ADMIN_EMAIL,
        name: 'ผู้ดูแลระบบ ภาควิชาเทคโนโลยีการศึกษา',
        phone: '02-000-1102',
        studentId: 'STAFF-EDTECH-01',
        avatarUrl: '',
        affiliation: 'ภาควิชาเทคโนโลยีการศึกษา',
        createdAt: now,
        updatedAt: now,
      },
      'somchai.edtech@university.ac.th': {
        email: 'somchai.edtech@university.ac.th',
        name: 'สมชาย ใจดี',
        phone: '081-234-5678',
        studentId: '6604010025',
        avatarUrl: '',
        affiliation: 'นิสิตชั้นปีที่ 3 สาขาเทคโนโลยีการศึกษา',
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
      },
    },
    equipment: [
      {
        id: 'eq-cam-01',
        code: 'EDTECH-CAM-001',
        name: 'ชุดกล้อง Mirrorless 4K พร้อมเลนส์ 24-70mm',
        category: 'กล้อง',
        totalQty: 4,
        availableQty: 3,
        status: 'พร้อมใช้งาน',
        imageUrl: '/src/assets/images/equip_mirrorless_camera_1795015990845.jpg',
        description:
          'กล้องบันทึกวิดีโอความละเอียด 4K 60fps พร้อมจอ Monitor ภายนอก ไมค์หัวกล้อง แบตเตอรี่ 2 ก้อน และการ์ด SDXC 128GB เหมาะสำหรับผลิตสื่อการสอนและสารคดี',
        createdAt: twoDaysAgo,
        updatedAt: yesterday,
      },
      {
        id: 'eq-mic-01',
        code: 'EDTECH-MIC-001',
        name: 'ชุดไมโครโฟนไร้สาย Dual Wireless Lavalier',
        category: 'ไมโครโฟน',
        totalQty: 6,
        availableQty: 6,
        status: 'พร้อมใช้งาน',
        imageUrl: '/src/assets/images/equip_wireless_mic_1795015992470.jpg',
        description:
          'ไมโครโฟนหนีบปกเสื้อไร้สาย 2 ช่องสัญญาณ (TX1 + TX2 + RX) พร้อมกล่องชาร์จพกพา ระยะรับส่งสูงสุด 200 เมตร รองรับทั้งกล้องและสมาร์ตโฟน',
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
      },
      {
        id: 'eq-tri-01',
        code: 'EDTECH-TRI-001',
        name: 'ขาตั้งกล้องคาร์บอนไฟเบอร์ หัวแพนน้ำมัน (Fluid Head)',
        category: 'ขาตั้งกล้อง',
        totalQty: 5,
        availableQty: 5,
        status: 'พร้อมใช้งาน',
        imageUrl: '/src/assets/images/equip_carbon_tripod_1795015992394.jpg',
        description:
          'ขาตั้งกล้องวัสดุ Carbon Fiber น้ำหนักเบา รับน้ำหนักได้สูงสุด 8 กิโลกรัม หัวแพนน้ำมันหมุนนุ่มนวลพร้อม Quick Release Plate สำหรับงานถ่ายทำวิดีโอ',
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
      },
      {
        id: 'eq-prj-01',
        code: 'EDTECH-PRJ-001',
        name: 'เครื่องฉายโปรเจกเตอร์เลเซอร์ 4K (4,500 Lumens)',
        category: 'โปรเจกเตอร์',
        totalQty: 3,
        availableQty: 3,
        status: 'พร้อมใช้งาน',
        imageUrl: '/src/assets/images/equip_laser_projector_1795015993112.jpg',
        description:
          'เครื่องฉายภาพความสว่างสูง รองรับพอร์ต HDMI คู่ และเชื่อมต่อไร้สาย เหมาะสำหรับการนำเสนองานห้องบรรยายและการจัดนิทรรศการสื่อการศึกษา',
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
      },
      {
        id: 'eq-lgt-01',
        code: 'EDTECH-LGT-001',
        name: 'ชุดไฟสตูดิโอ LED Bi-Color 300W พร้อมขาตั้งและ Barn Door',
        category: 'ไฟสตูดิโอ',
        totalQty: 4,
        availableQty: 4,
        status: 'พร้อมใช้งาน',
        imageUrl: '/src/assets/images/equip_led_studio_light_1795015992947.jpg',
        description:
          'ไฟสตูดิโอปรับอุณหภูมิสีได้ตั้งแต่ 2700K–6500K ค่า CRI 97+ พร้อมตัวควบคุมกำลังไฟและขาตั้งอลูมิเนียมแข็งแรง สำหรับห้องบันทึกสื่อการสอน',
        createdAt: twoDaysAgo,
        updatedAt: twoDaysAgo,
      },
    ],
    bookings: [
      {
        id: 'bk-seed-01',
        equipmentId: 'eq-cam-01',
        equipmentCode: 'EDTECH-CAM-001',
        equipmentName: 'ชุดกล้อง Mirrorless 4K พร้อมเลนส์ 24-70mm',
        equipmentCategory: 'กล้อง',
        equipmentImageUrl: '/src/assets/images/equip_mirrorless_camera_1795015990845.jpg',
        userEmail: 'somchai.edtech@university.ac.th',
        userName: 'สมชาย ใจดี',
        userPhone: '081-234-5678',
        userStudentId: '6604010025',
        userAffiliation: 'นิสิตชั้นปีที่ 3 สาขาเทคโนโลยีการศึกษา',
        quantity: 1,
        borrowDate: todayStr,
        dueDate: nextWeekStr,
        purpose: 'ถ่ายทำวิดีโอสื่อการสอนรายวิชา EDT301 การผลิตรายการโทรทัศน์เพื่อการศึกษา',
        status: 'กำลังยืม',
        createdAt: yesterday,
        updatedAt: yesterday,
        approvedAt: yesterday,
        approvedBy: OWNER_ADMIN_EMAIL,
      },
      {
        id: 'bk-seed-02',
        equipmentId: 'eq-mic-01',
        equipmentCode: 'EDTECH-MIC-001',
        equipmentName: 'ชุดไมโครโฟนไร้สาย Dual Wireless Lavalier',
        equipmentCategory: 'ไมโครโฟน',
        equipmentImageUrl: '/src/assets/images/equip_wireless_mic_1795015992470.jpg',
        userEmail: 'somchai.edtech@university.ac.th',
        userName: 'สมชาย ใจดี',
        userPhone: '081-234-5678',
        userStudentId: '6604010025',
        userAffiliation: 'นิสิตชั้นปีที่ 3 สาขาเทคโนโลยีการศึกษา',
        quantity: 1,
        borrowDate: todayStr,
        dueDate: nextWeekStr,
        purpose: 'บันทึกเสียงสัมภาษณ์อาจารย์สำหรับโครงงานวิจัยสื่อดิจิทัล',
        status: 'รออนุมัติ',
        createdAt: now,
        updatedAt: now,
      },
    ],
  };
}

function loadDb(): LocalDatabaseSchema {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      const seed = buildSeedDatabase();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    const parsed = JSON.parse(raw) as LocalDatabaseSchema;
    if (!Array.isArray(parsed.equipment) || parsed.equipment.length === 0) {
      const seed = buildSeedDatabase();
      localStorage.setItem(STORAGE_KEY, JSON.stringify(seed));
      return seed;
    }
    if (!parsed.admins.some((a) => a.email.toLowerCase() === OWNER_ADMIN_EMAIL)) {
      parsed.admins.unshift({
        email: OWNER_ADMIN_EMAIL,
        addedBy: 'system',
        addedAt: new Date().toISOString(),
        isOwner: true,
      });
    }
    return parsed;
  } catch {
    return buildSeedDatabase();
  }
}

function notifyTabs() {
  try {
    if (typeof BroadcastChannel !== 'undefined') {
      const ch = new BroadcastChannel('edtech_borrowing_sync');
      ch.postMessage({ type: 'state-updated', timestamp: Date.now() });
      ch.close();
    }
  } catch {
    // Ignore BroadcastChannel errors
  }
}

function saveDb(db: LocalDatabaseSchema) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(db));
    notifyTabs();
  } catch {
    // Ignore storage quota errors
  }
}

function normalizeEmail(raw?: string | null): string {
  return (raw || '').trim().toLowerCase();
}

function isAdminEmail(db: LocalDatabaseSchema, email: string): boolean {
  if (!email) return false;
  return db.admins.some((a) => a.email.toLowerCase() === email.toLowerCase());
}

function computeStats(db: LocalDatabaseSchema): DashboardStats {
  const totalEquipmentTypes = db.equipment.length;
  const totalUnits = db.equipment.reduce((sum, item) => sum + item.totalQty, 0);
  const availableUnits = db.equipment.reduce((sum, item) => sum + item.availableQty, 0);
  const borrowedUnits = db.bookings
    .filter((b) => b.status === 'กำลังยืม')
    .reduce((sum, b) => sum + b.quantity, 0);
  const pendingBookings = db.bookings.filter((b) => b.status === 'รออนุมัติ').length;
  const activeBookings = db.bookings.filter((b) => b.status === 'กำลังยืม').length;
  const completedBookings = db.bookings.filter((b) => b.status === 'คืนแล้ว').length;

  return {
    totalEquipmentTypes,
    totalUnits,
    availableUnits,
    borrowedUnits,
    pendingBookings,
    activeBookings,
    completedBookings,
  };
}

function buildState(db: LocalDatabaseSchema, rawEmail?: string | null): AppStateResponse {
  const email = normalizeEmail(rawEmail);
  const currentUser = email && db.users[email] ? db.users[email] : null;
  const role: UserRole | null = email ? (isAdminEmail(db, email) ? 'admin' : 'user') : null;
  const isAdmin = role === 'admin';

  const sortedEquipment = [...db.equipment].sort((a, b) =>
    a.code.localeCompare(b.code, 'th')
  );
  const sortedBookings = [...db.bookings].sort(
    (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
  );

  const myBookings = email
    ? sortedBookings.filter((b) => b.userEmail.toLowerCase() === email)
    : [];

  return {
    equipment: sortedEquipment,
    bookings: isAdmin ? sortedBookings : [],
    myBookings,
    currentUser,
    role,
    users: isAdmin ? Object.values(db.users) : currentUser ? [currentUser] : [],
    admins: isAdmin ? db.admins : [],
    stats: computeStats(db),
  };
}

export const localStore = {
  fetchState(userEmail?: string | null): AppStateResponse {
    const db = loadDb();
    return buildState(db, userEmail);
  },

  signInWithGoogleAccount(payload: {
    email: string;
    name?: string;
    avatarUrl?: string;
    phone?: string;
    studentId?: string;
    affiliation?: string;
  }) {
    const db = loadDb();
    const email = normalizeEmail(payload.email);
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      throw new Error('กรุณาระบุอีเมล Google Account ที่ถูกต้อง');
    }

    const now = new Date().toISOString();
    let isNewUser = false;
    let profile = db.users[email];

    if (!profile) {
      isNewUser = true;
      profile = {
        email,
        name: (payload.name || '').trim() || email.split('@')[0],
        phone: (payload.phone || '').trim(),
        studentId: (payload.studentId || '').trim(),
        avatarUrl: (payload.avatarUrl || '').trim(),
        affiliation: (payload.affiliation || '').trim() || 'ภาควิชาเทคโนโลยีการศึกษา',
        createdAt: now,
        updatedAt: now,
      };
      db.users[email] = profile;
      saveDb(db);
    }

    const role: UserRole = isAdminEmail(db, email) ? 'admin' : 'user';
    return {
      user: profile,
      role,
      isNewUser,
      state: buildState(db, email),
    };
  },

  updateProfile(
    userEmail: string,
    payload: {
      name: string;
      phone: string;
      studentId: string;
      affiliation: string;
      avatarUrl: string;
    }
  ) {
    const db = loadDb();
    const email = normalizeEmail(userEmail);
    if (!email || !db.users[email]) {
      throw new Error('กรุณาเข้าสู่ระบบก่อนแก้ไขข้อมูลโปรไฟล์');
    }
    if (!payload.name.trim()) {
      throw new Error('กรุณาระบุชื่อ-นามสกุล');
    }
    const updated: UserProfile = {
      ...db.users[email],
      name: payload.name.trim(),
      phone: payload.phone.trim(),
      studentId: payload.studentId.trim(),
      affiliation: payload.affiliation.trim() || 'ภาควิชาเทคโนโลยีการศึกษา',
      avatarUrl: payload.avatarUrl.trim(),
      updatedAt: new Date().toISOString(),
    };
    db.users[email] = updated;
    saveDb(db);
    return { user: updated, state: buildState(db, email) };
  },

  createEquipment(
    userEmail: string,
    payload: {
      code: string;
      name: string;
      category: EquipmentCategory;
      totalQty: number;
      availableQty: number;
      status: EquipmentStatus;
      imageUrl: string;
      description: string;
    }
  ) {
    const db = loadDb();
    const email = normalizeEmail(userEmail);
    if (!isAdminEmail(db, email)) {
      throw new Error('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเพิ่มอุปกรณ์ได้');
    }
    const code = payload.code.trim().toUpperCase();
    if (db.equipment.some((item) => item.code.toLowerCase() === code.toLowerCase())) {
      throw new Error(`รหัสอุปกรณ์ ${code} มีอยู่ในระบบแล้ว`);
    }
    const now = new Date().toISOString();
    const newItem: EquipmentItem = {
      id: `eq-${Date.now().toString(36)}`,
      code,
      name: payload.name.trim(),
      category: payload.category,
      totalQty: payload.totalQty,
      availableQty: payload.availableQty,
      status: payload.status,
      imageUrl: payload.imageUrl.trim(),
      description: payload.description.trim(),
      createdAt: now,
      updatedAt: now,
    };
    db.equipment.push(newItem);
    saveDb(db);
    return { state: buildState(db, email) };
  },

  updateEquipment(
    userEmail: string,
    id: string,
    payload: {
      code: string;
      name: string;
      category: EquipmentCategory;
      totalQty: number;
      availableQty: number;
      status: EquipmentStatus;
      imageUrl: string;
      description: string;
    }
  ) {
    const db = loadDb();
    const email = normalizeEmail(userEmail);
    if (!isAdminEmail(db, email)) {
      throw new Error('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถแก้ไขอุปกรณ์ได้');
    }
    const idx = db.equipment.findIndex((item) => item.id === id);
    if (idx === -1) {
      throw new Error('ไม่พบข้อมูลอุปกรณ์ที่ต้องการแก้ไข');
    }
    const code = payload.code.trim().toUpperCase();
    if (
      db.equipment.some(
        (item) => item.id !== id && item.code.toLowerCase() === code.toLowerCase()
      )
    ) {
      throw new Error(`รหัสอุปกรณ์ ${code} ซ้ำกับรายการอื่น`);
    }
    db.equipment[idx] = {
      ...db.equipment[idx],
      code,
      name: payload.name.trim(),
      category: payload.category,
      totalQty: payload.totalQty,
      availableQty: payload.availableQty,
      status: payload.status,
      imageUrl: payload.imageUrl.trim(),
      description: payload.description.trim(),
      updatedAt: new Date().toISOString(),
    };
    saveDb(db);
    return { state: buildState(db, email) };
  },

  deleteEquipment(userEmail: string, id: string) {
    const db = loadDb();
    const email = normalizeEmail(userEmail);
    if (!isAdminEmail(db, email)) {
      throw new Error('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบอุปกรณ์ได้');
    }
    const hasActiveBorrow = db.bookings.some(
      (b) => b.equipmentId === id && b.status === 'กำลังยืม'
    );
    if (hasActiveBorrow) {
      throw new Error(
        'ไม่สามารถลบอุปกรณ์ที่ยังมีรายการกำลังยืมค้างอยู่ได้ กรุณาบันทึกการคืนให้เรียบร้อยก่อน'
      );
    }
    db.equipment = db.equipment.filter((item) => item.id !== id);
    saveDb(db);
    return { state: buildState(db, email) };
  },

  createBooking(
    userEmail: string,
    payload: {
      equipmentId: string;
      quantity: number;
      borrowDate: string;
      dueDate: string;
      purpose: string;
    }
  ) {
    const db = loadDb();
    const email = normalizeEmail(userEmail);
    const user = db.users[email];
    if (!email || !user) {
      throw new Error('กรุณาเข้าสู่ระบบด้วย Google Account ก่อนส่งคำขอจอง');
    }
    const equipment = db.equipment.find((item) => item.id === payload.equipmentId);
    if (!equipment) {
      throw new Error('ไม่พบอุปกรณ์ที่เลือก');
    }
    if (equipment.status !== 'พร้อมใช้งาน' || equipment.availableQty < 1) {
      throw new Error('อุปกรณ์นี้ไม่พร้อมให้ยืมในขณะนี้');
    }
    if (payload.quantity < 1 || payload.quantity > equipment.availableQty) {
      throw new Error(
        `จำนวนที่ขอยืมต้องอยู่ระหว่าง 1 ถึง ${equipment.availableQty} ชิ้น`
      );
    }
    if (payload.dueDate < payload.borrowDate) {
      throw new Error('วันที่กำหนดคืนต้องไม่เร็วกว่าวันที่ต้องการยืม');
    }
    const now = new Date().toISOString();
    const booking: BookingRecord = {
      id: `bk-${Date.now().toString(36)}`,
      equipmentId: equipment.id,
      equipmentCode: equipment.code,
      equipmentName: equipment.name,
      equipmentCategory: equipment.category,
      equipmentImageUrl: equipment.imageUrl,
      userEmail: user.email,
      userName: user.name,
      userPhone: user.phone,
      userStudentId: user.studentId,
      userAffiliation: user.affiliation,
      quantity: payload.quantity,
      borrowDate: payload.borrowDate,
      dueDate: payload.dueDate,
      purpose: payload.purpose.trim(),
      status: 'รออนุมัติ',
      createdAt: now,
      updatedAt: now,
    };
    db.bookings.unshift(booking);
    saveDb(db);
    return { state: buildState(db, email) };
  },

  cancelBooking(userEmail: string, id: string) {
    const db = loadDb();
    const email = normalizeEmail(userEmail);
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking) throw new Error('ไม่พบคำขอจอง');
    if (booking.userEmail.toLowerCase() !== email && !isAdminEmail(db, email)) {
      throw new Error('คุณไม่มีสิทธิ์ยกเลิกคำขอนี้');
    }
    if (booking.status !== 'รออนุมัติ') {
      throw new Error('สามารถยกเลิกได้เฉพาะคำขอที่อยู่ในสถานะรออนุมัติเท่านั้น');
    }
    booking.status = 'ยกเลิกแล้ว';
    booking.updatedAt = new Date().toISOString();
    saveDb(db);
    return { state: buildState(db, email) };
  },

  approveBooking(userEmail: string, id: string) {
    const db = loadDb();
    const email = normalizeEmail(userEmail);
    if (!isAdminEmail(db, email)) {
      throw new Error('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถอนุมัติการยืมได้');
    }
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking || booking.status !== 'รออนุมัติ') {
      throw new Error('รายการนี้ไม่ได้อยู่ในสถานะรออนุมัติ');
    }
    const equipment = db.equipment.find((item) => item.id === booking.equipmentId);
    if (!equipment || equipment.availableQty < booking.quantity) {
      throw new Error('จำนวนคงเหลือไม่เพียงพอสำหรับการอนุมัติ');
    }
    const now = new Date().toISOString();
    equipment.availableQty -= booking.quantity;
    equipment.updatedAt = now;
    booking.status = 'กำลังยืม';
    booking.approvedAt = now;
    booking.approvedBy = email;
    booking.updatedAt = now;
    saveDb(db);
    return { state: buildState(db, email) };
  },

  rejectBooking(userEmail: string, id: string, rejectReason: string) {
    const db = loadDb();
    const email = normalizeEmail(userEmail);
    if (!isAdminEmail(db, email)) {
      throw new Error('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถปฏิเสธคำขอได้');
    }
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking || booking.status !== 'รออนุมัติ') {
      throw new Error('สามารถปฏิเสธได้เฉพาะคำขอที่รออนุมัติเท่านั้น');
    }
    const now = new Date().toISOString();
    booking.status = 'ถูกปฏิเสธ';
    booking.rejectedAt = now;
    booking.rejectedBy = email;
    booking.rejectReason =
      rejectReason.trim() || 'อุปกรณ์ไม่พร้อมใช้งานหรือติดภารกิจภาควิชาในช่วงเวลาดังกล่าว';
    booking.updatedAt = now;
    saveDb(db);
    return { state: buildState(db, email) };
  },

  returnBooking(
    userEmail: string,
    id: string,
    payload: {
      returnCondition: ReturnCondition;
      returnNote: string;
      markMaintenance: boolean;
    }
  ) {
    const db = loadDb();
    const email = normalizeEmail(userEmail);
    if (!isAdminEmail(db, email)) {
      throw new Error('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถบันทึกการคืนได้');
    }
    const booking = db.bookings.find((b) => b.id === id);
    if (!booking || booking.status !== 'กำลังยืม') {
      throw new Error('รายการนี้ไม่ได้อยู่ในสถานะกำลังยืม');
    }
    const now = new Date().toISOString();
    const equipment = db.equipment.find((item) => item.id === booking.equipmentId);
    if (equipment) {
      equipment.availableQty = Math.min(
        equipment.totalQty,
        equipment.availableQty + booking.quantity
      );
      if (payload.markMaintenance || payload.returnCondition === 'ชำรุดต้องซ่อม') {
        equipment.status = 'ชำรุด/ซ่อมบำรุง';
      }
      equipment.updatedAt = now;
    }
    booking.status = 'คืนแล้ว';
    booking.returnedAt = now;
    booking.returnedBy = email;
    booking.returnCondition = payload.returnCondition;
    booking.returnNote = payload.returnNote.trim();
    booking.updatedAt = now;
    saveDb(db);
    return { state: buildState(db, email) };
  },

  addAdminEmail(userEmail: string, targetEmailRaw: string) {
    const db = loadDb();
    const email = normalizeEmail(userEmail);
    if (!isAdminEmail(db, email)) {
      throw new Error('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเพิ่มสิทธิ์ Admin ได้');
    }
    const targetEmail = normalizeEmail(targetEmailRaw);
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      throw new Error('กรุณาระบุอีเมลที่ถูกต้อง');
    }
    if (isAdminEmail(db, targetEmail)) {
      throw new Error('อีเมลนี้มีสิทธิ์ผู้ดูแลระบบอยู่แล้ว');
    }
    db.admins.push({
      email: targetEmail,
      addedBy: email,
      addedAt: new Date().toISOString(),
      isOwner: false,
    });
    saveDb(db);
    return { state: buildState(db, email) };
  },

  removeAdminEmail(userEmail: string, targetEmailRaw: string) {
    const db = loadDb();
    const email = normalizeEmail(userEmail);
    if (!isAdminEmail(db, email)) {
      throw new Error('เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถถอดสิทธิ์ Admin ได้');
    }
    const targetEmail = normalizeEmail(targetEmailRaw);
    const target = db.admins.find((a) => a.email.toLowerCase() === targetEmail);
    if (!target) {
      throw new Error('ไม่พบอีเมลผู้ดูแลระบบนี้');
    }
    if (target.isOwner || target.email.toLowerCase() === OWNER_ADMIN_EMAIL) {
      throw new Error('ไม่สามารถลบสิทธิ์เจ้าของระบบหลักได้');
    }
    db.admins = db.admins.filter((a) => a.email.toLowerCase() !== targetEmail);
    saveDb(db);
    return { state: buildState(db, email) };
  },
};
