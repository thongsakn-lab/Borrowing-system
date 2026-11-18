import express from 'express';
import type { Request, Response } from 'express';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { createServer as createViteServer } from 'vite';
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
} from './src/types.ts';

const OWNER_ADMIN_EMAIL = 'nichanatnicha1102@gmail.com';
const PORT = Number(process.env.PORT || 3000);
const DATA_DIR = path.resolve(process.cwd(), 'data');
const DB_FILE = path.join(DATA_DIR, 'borrowing-db.json');
const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');

const VALID_CATEGORIES: EquipmentCategory[] = [
  'กล้อง',
  'ไมโครโฟน',
  'ขาตั้งกล้อง',
  'โปรเจกเตอร์',
  'ไฟสตูดิโอ',
  'อุปกรณ์เสริม',
];

const VALID_STATUSES: EquipmentStatus[] = [
  'พร้อมใช้งาน',
  'ชำรุด/ซ่อมบำรุง',
  'งดให้บริการ',
];

const VALID_RETURN_CONDITIONS: ReturnCondition[] = [
  'ปกติสมบูรณ์',
  'ชำรุดเล็กน้อย',
  'ชำรุดต้องซ่อม',
];

interface DatabaseSchema {
  admins: AdminAllowlistEntry[];
  users: Record<string, UserProfile>;
  equipment: EquipmentItem[];
  bookings: BookingRecord[];
}

function ensureDirectories() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
  if (!fs.existsSync(UPLOADS_DIR)) {
    fs.mkdirSync(UPLOADS_DIR, { recursive: true });
  }
}

function buildSeedDatabase(): DatabaseSchema {
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

function loadDatabase(): DatabaseSchema {
  ensureDirectories();
  if (!fs.existsSync(DB_FILE)) {
    const seed = buildSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
  try {
    const raw = fs.readFileSync(DB_FILE, 'utf-8');
    const parsed = JSON.parse(raw) as DatabaseSchema;
    // Guarantee primary owner admin is always present
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
    const seed = buildSeedDatabase();
    fs.writeFileSync(DB_FILE, JSON.stringify(seed, null, 2), 'utf-8');
    return seed;
  }
}

function saveDatabase(db: DatabaseSchema) {
  ensureDirectories();
  const tempPath = `${DB_FILE}.tmp`;
  fs.writeFileSync(tempPath, JSON.stringify(db, null, 2), 'utf-8');
  fs.renameSync(tempPath, DB_FILE);
}

let db = loadDatabase();
const sseClients = new Set<Response>();

function broadcastStateUpdate(reason: string) {
  const payload = JSON.stringify({ type: 'state-updated', reason, timestamp: Date.now() });
  for (const client of sseClients) {
    try {
      client.write(`data: ${payload}\n\n`);
    } catch {
      sseClients.delete(client);
    }
  }
}

function normalizeEmail(raw: unknown): string {
  return typeof raw === 'string' ? raw.trim().toLowerCase() : '';
}

function isAdminEmail(email: string): boolean {
  if (!email) return false;
  return db.admins.some((a) => a.email.toLowerCase() === email.toLowerCase());
}

function getRequesterEmail(req: Request): string {
  const headerEmail = req.header('x-user-email');
  return normalizeEmail(headerEmail);
}

function computeStats(): DashboardStats {
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

function buildStateForUser(email: string): AppStateResponse {
  const currentUser = email && db.users[email] ? db.users[email] : null;
  const role: UserRole | null = email ? (isAdminEmail(email) ? 'admin' : 'user') : null;
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
    stats: computeStats(),
  };
}

async function startServer() {
  const app = express();
  app.use(express.json({ limit: '15mb' }));

  // Serve uploaded equipment/profile images
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Real-time Server-Sent Events stream
  app.get('/api/events', (req, res) => {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    res.write(`data: ${JSON.stringify({ type: 'connected', timestamp: Date.now() })}\n\n`);
    sseClients.add(res);

    const keepAlive = setInterval(() => {
      try {
        res.write(': keep-alive\n\n');
      } catch {
        clearInterval(keepAlive);
        sseClients.delete(res);
      }
    }, 25000);

    req.on('close', () => {
      clearInterval(keepAlive);
      sseClients.delete(res);
    });
  });

  // Google Sign-In / Auto-create User Profile on first login
  app.post('/api/auth/google-signin', (req, res) => {
    const email = normalizeEmail(req.body?.email);
    const nameInput = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const avatarInput = typeof req.body?.avatarUrl === 'string' ? req.body.avatarUrl.trim() : '';
    const phoneInput = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    const studentIdInput = typeof req.body?.studentId === 'string' ? req.body.studentId.trim() : '';
    const affiliationInput =
      typeof req.body?.affiliation === 'string' ? req.body.affiliation.trim() : '';

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      res.status(400).json({ error: 'กรุณาระบุอีเมล Google Account ที่ถูกต้อง' });
      return;
    }

    const now = new Date().toISOString();
    let isNewUser = false;
    let profile = db.users[email];

    if (!profile) {
      isNewUser = true;
      const defaultName = nameInput || email.split('@')[0];
      profile = {
        email,
        name: defaultName.slice(0, 100),
        phone: phoneInput.slice(0, 30),
        studentId: studentIdInput.slice(0, 40),
        avatarUrl: avatarInput.slice(0, 500),
        affiliation: affiliationInput.slice(0, 120) || 'ภาควิชาเทคโนโลยีการศึกษา',
        createdAt: now,
        updatedAt: now,
      };
      db.users[email] = profile;
      saveDatabase(db);
      broadcastStateUpdate('user-created');
    } else if (nameInput && !profile.name) {
      profile.name = nameInput.slice(0, 100);
      profile.updatedAt = now;
      saveDatabase(db);
    }

    const role: UserRole = isAdminEmail(email) ? 'admin' : 'user';
    res.json({
      user: profile,
      role,
      isNewUser,
      state: buildStateForUser(email),
    });
  });

  // Get synchronized shared state
  app.get('/api/state', (req, res) => {
    const email = getRequesterEmail(req);
    res.json(buildStateForUser(email));
  });

  // Update own user profile
  app.put('/api/profile', (req, res) => {
    const email = getRequesterEmail(req);
    if (!email || !db.users[email]) {
      res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนแก้ไขข้อมูลโปรไฟล์' });
      return;
    }

    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const phone = typeof req.body?.phone === 'string' ? req.body.phone.trim() : '';
    const studentId = typeof req.body?.studentId === 'string' ? req.body.studentId.trim() : '';
    const affiliation =
      typeof req.body?.affiliation === 'string' ? req.body.affiliation.trim() : '';
    const avatarUrl = typeof req.body?.avatarUrl === 'string' ? req.body.avatarUrl.trim() : '';

    if (!name) {
      res.status(400).json({ error: 'กรุณาระบุชื่อ-นามสกุล' });
      return;
    }

    const updated: UserProfile = {
      ...db.users[email],
      name: name.slice(0, 100),
      phone: phone.slice(0, 30),
      studentId: studentId.slice(0, 40),
      affiliation: affiliation.slice(0, 120) || 'ภาควิชาเทคโนโลยีการศึกษา',
      avatarUrl: avatarUrl.slice(0, 500),
      updatedAt: new Date().toISOString(),
    };

    db.users[email] = updated;
    saveDatabase(db);
    broadcastStateUpdate('profile-updated');
    res.json({ user: updated, state: buildStateForUser(email) });
  });

  // Upload image (simulates Cloud Storage upload to /uploads directory)
  app.post('/api/upload', (req, res) => {
    const email = getRequesterEmail(req);
    if (!email || !db.users[email]) {
      res.status(401).json({ error: 'กรุณาเข้าสู่ระบบก่อนอัปโหลดรูปภาพ' });
      return;
    }

    const dataUrl = typeof req.body?.dataUrl === 'string' ? req.body.dataUrl : '';
    const match = /^data:(image\/(?:jpeg|png|webp|gif));base64,([A-Za-z0-9+/=]+)$/.exec(dataUrl);
    if (!match) {
      res.status(400).json({ error: 'รองรับเฉพาะไฟล์รูปภาพ JPG, PNG, WEBP หรือ GIF เท่านั้น' });
      return;
    }

    const mime = match[1];
    const base64Data = match[2];
    const buffer = Buffer.from(base64Data, 'base64');

    if (buffer.byteLength > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'ขนาดไฟล์รูปภาพต้องไม่เกิน 5 MB' });
      return;
    }

    const extMap: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
      'image/webp': 'webp',
      'image/gif': 'gif',
    };
    const ext = extMap[mime] || 'jpg';
    const fileName = `edtech_${Date.now()}_${crypto.randomBytes(4).toString('hex')}.${ext}`;
    const filePath = path.join(UPLOADS_DIR, fileName);

    fs.writeFileSync(filePath, buffer);
    res.json({ url: `/uploads/${fileName}`, fileName });
  });

  // Admin: Create equipment
  app.post('/api/equipment', (req, res) => {
    const email = getRequesterEmail(req);
    if (!isAdminEmail(email)) {
      res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเพิ่มอุปกรณ์ได้' });
      return;
    }

    const code = typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : '';
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : '';
    const category = req.body?.category as EquipmentCategory;
    const totalQty = Number(req.body?.totalQty);
    const availableQtyRaw =
      req.body?.availableQty !== undefined ? Number(req.body.availableQty) : totalQty;
    const status = (req.body?.status || 'พร้อมใช้งาน') as EquipmentStatus;
    const imageUrl = typeof req.body?.imageUrl === 'string' ? req.body.imageUrl.trim() : '';
    const description =
      typeof req.body?.description === 'string' ? req.body.description.trim() : '';

    if (!code || !name) {
      res.status(400).json({ error: 'กรุณาระบุรหัสอุปกรณ์และชื่ออุปกรณ์' });
      return;
    }
    if (!VALID_CATEGORIES.includes(category)) {
      res.status(400).json({ error: 'หมวดหมู่อุปกรณ์ไม่ถูกต้อง' });
      return;
    }
    if (!VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'สถานะอุปกรณ์ไม่ถูกต้อง' });
      return;
    }
    if (!Number.isInteger(totalQty) || totalQty < 1 || totalQty > 999) {
      res.status(400).json({ error: 'จำนวนทั้งหมดต้องเป็นจำนวนเต็มตั้งแต่ 1 ถึง 999' });
      return;
    }
    if (
      !Number.isInteger(availableQtyRaw) ||
      availableQtyRaw < 0 ||
      availableQtyRaw > totalQty
    ) {
      res.status(400).json({ error: 'จำนวนคงเหลือต้องอยู่ระหว่าง 0 ถึงจำนวนทั้งหมด' });
      return;
    }
    if (db.equipment.some((item) => item.code.toLowerCase() === code.toLowerCase())) {
      res.status(400).json({ error: `รหัสอุปกรณ์ ${code} มีอยู่ในระบบแล้ว` });
      return;
    }

    const now = new Date().toISOString();
    const newItem: EquipmentItem = {
      id: `eq-${crypto.randomBytes(4).toString('hex')}`,
      code: code.slice(0, 40),
      name: name.slice(0, 120),
      category,
      totalQty,
      availableQty: availableQtyRaw,
      status,
      imageUrl: imageUrl.slice(0, 500),
      description: description.slice(0, 1000),
      createdAt: now,
      updatedAt: now,
    };

    db.equipment.push(newItem);
    saveDatabase(db);
    broadcastStateUpdate('equipment-created');
    res.status(201).json({ item: newItem, state: buildStateForUser(email) });
  });

  // Admin: Update equipment
  app.put('/api/equipment/:id', (req, res) => {
    const email = getRequesterEmail(req);
    if (!isAdminEmail(email)) {
      res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถแก้ไขอุปกรณ์ได้' });
      return;
    }

    const idx = db.equipment.findIndex((item) => item.id === req.params.id);
    if (idx === -1) {
      res.status(404).json({ error: 'ไม่พบข้อมูลอุปกรณ์ที่ต้องการแก้ไข' });
      return;
    }

    const existing = db.equipment[idx];
    const code =
      typeof req.body?.code === 'string' ? req.body.code.trim().toUpperCase() : existing.code;
    const name = typeof req.body?.name === 'string' ? req.body.name.trim() : existing.name;
    const category = (req.body?.category || existing.category) as EquipmentCategory;
    const totalQty =
      req.body?.totalQty !== undefined ? Number(req.body.totalQty) : existing.totalQty;
    const availableQty =
      req.body?.availableQty !== undefined ? Number(req.body.availableQty) : existing.availableQty;
    const status = (req.body?.status || existing.status) as EquipmentStatus;
    const imageUrl =
      typeof req.body?.imageUrl === 'string' ? req.body.imageUrl.trim() : existing.imageUrl;
    const description =
      typeof req.body?.description === 'string'
        ? req.body.description.trim()
        : existing.description;

    if (!code || !name) {
      res.status(400).json({ error: 'กรุณาระบุรหัสอุปกรณ์และชื่ออุปกรณ์' });
      return;
    }
    if (!VALID_CATEGORIES.includes(category) || !VALID_STATUSES.includes(status)) {
      res.status(400).json({ error: 'หมวดหมู่หรือสถานะอุปกรณ์ไม่ถูกต้อง' });
      return;
    }
    if (!Number.isInteger(totalQty) || totalQty < 1 || totalQty > 999) {
      res.status(400).json({ error: 'จำนวนทั้งหมดต้องเป็นจำนวนเต็มตั้งแต่ 1 ถึง 999' });
      return;
    }
    if (!Number.isInteger(availableQty) || availableQty < 0 || availableQty > totalQty) {
      res.status(400).json({ error: 'จำนวนคงเหลือต้องอยู่ระหว่าง 0 ถึงจำนวนทั้งหมด' });
      return;
    }
    if (
      db.equipment.some(
        (item) => item.id !== existing.id && item.code.toLowerCase() === code.toLowerCase()
      )
    ) {
      res.status(400).json({ error: `รหัสอุปกรณ์ ${code} ซ้ำกับรายการอื่น` });
      return;
    }

    const updated: EquipmentItem = {
      ...existing,
      code: code.slice(0, 40),
      name: name.slice(0, 120),
      category,
      totalQty,
      availableQty,
      status,
      imageUrl: imageUrl.slice(0, 500),
      description: description.slice(0, 1000),
      updatedAt: new Date().toISOString(),
    };

    db.equipment[idx] = updated;
    saveDatabase(db);
    broadcastStateUpdate('equipment-updated');
    res.json({ item: updated, state: buildStateForUser(email) });
  });

  // Admin: Delete equipment
  app.delete('/api/equipment/:id', (req, res) => {
    const email = getRequesterEmail(req);
    if (!isAdminEmail(email)) {
      res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถลบอุปกรณ์ได้' });
      return;
    }

    const target = db.equipment.find((item) => item.id === req.params.id);
    if (!target) {
      res.status(404).json({ error: 'ไม่พบอุปกรณ์ที่ต้องการลบ' });
      return;
    }

    const hasActiveBorrow = db.bookings.some(
      (b) => b.equipmentId === target.id && b.status === 'กำลังยืม'
    );
    if (hasActiveBorrow) {
      res.status(400).json({
        error: 'ไม่สามารถลบอุปกรณ์ที่ยังมีรายการกำลังยืมค้างอยู่ได้ กรุณาบันทึกการคืนให้เรียบร้อยก่อน',
      });
      return;
    }

    db.equipment = db.equipment.filter((item) => item.id !== target.id);
    saveDatabase(db);
    broadcastStateUpdate('equipment-deleted');
    res.json({ success: true, state: buildStateForUser(email) });
  });

  // User: Create booking request
  app.post('/api/bookings', (req, res) => {
    const email = getRequesterEmail(req);
    if (!email || !db.users[email]) {
      res.status(401).json({ error: 'กรุณาเข้าสู่ระบบด้วย Google Account ก่อนส่งคำขอจอง' });
      return;
    }

    const user = db.users[email];
    const equipmentId = typeof req.body?.equipmentId === 'string' ? req.body.equipmentId : '';
    const quantity = Number(req.body?.quantity);
    const borrowDate = typeof req.body?.borrowDate === 'string' ? req.body.borrowDate.trim() : '';
    const dueDate = typeof req.body?.dueDate === 'string' ? req.body.dueDate.trim() : '';
    const purpose = typeof req.body?.purpose === 'string' ? req.body.purpose.trim() : '';

    const equipment = db.equipment.find((item) => item.id === equipmentId);
    if (!equipment) {
      res.status(404).json({ error: 'ไม่พบอุปกรณ์ที่เลือก' });
      return;
    }
    if (equipment.status !== 'พร้อมใช้งาน' || equipment.availableQty < 1) {
      res.status(400).json({ error: 'อุปกรณ์นี้ไม่พร้อมให้ยืมในขณะนี้' });
      return;
    }
    if (!Number.isInteger(quantity) || quantity < 1 || quantity > equipment.availableQty) {
      res.status(400).json({
        error: `จำนวนที่ขอยืมต้องอยู่ระหว่าง 1 ถึง ${equipment.availableQty} ชิ้น`,
      });
      return;
    }
    if (!/^\d{4}-\d{2}-\d{2}$/.test(borrowDate) || !/^\d{4}-\d{2}-\d{2}$/.test(dueDate)) {
      res.status(400).json({ error: 'กรุณาระบุวันที่ยืมและวันที่กำหนดคืนให้ถูกต้อง' });
      return;
    }
    if (dueDate < borrowDate) {
      res.status(400).json({ error: 'วันที่กำหนดคืนต้องไม่เร็วกว่าวันที่ต้องการยืม' });
      return;
    }
    if (!purpose || purpose.length < 3) {
      res.status(400).json({ error: 'กรุณาระบุวัตถุประสงค์ในการยืมใช้งาน' });
      return;
    }

    const now = new Date().toISOString();
    const booking: BookingRecord = {
      id: `bk-${Date.now().toString(36)}-${crypto.randomBytes(2).toString('hex')}`,
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
      quantity,
      borrowDate,
      dueDate,
      purpose: purpose.slice(0, 600),
      status: 'รออนุมัติ',
      createdAt: now,
      updatedAt: now,
    };

    db.bookings.unshift(booking);
    saveDatabase(db);
    broadcastStateUpdate('booking-created');
    res.status(201).json({ booking, state: buildStateForUser(email) });
  });

  // User: Cancel own pending booking
  app.post('/api/bookings/:id/cancel', (req, res) => {
    const email = getRequesterEmail(req);
    if (!email) {
      res.status(401).json({ error: 'กรุณาเข้าสู่ระบบ' });
      return;
    }

    const booking = db.bookings.find((b) => b.id === req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'ไม่พบคำขอจอง' });
      return;
    }
    if (booking.userEmail.toLowerCase() !== email && !isAdminEmail(email)) {
      res.status(403).json({ error: 'คุณไม่มีสิทธิ์ยกเลิกคำขอนี้' });
      return;
    }
    if (booking.status !== 'รออนุมัติ') {
      res.status(400).json({ error: 'สามารถยกเลิกได้เฉพาะคำขอที่อยู่ในสถานะรออนุมัติเท่านั้น' });
      return;
    }

    booking.status = 'ยกเลิกแล้ว';
    booking.updatedAt = new Date().toISOString();
    saveDatabase(db);
    broadcastStateUpdate('booking-cancelled');
    res.json({ booking, state: buildStateForUser(email) });
  });

  // Admin: Approve pickup (อนุมัติการยืม)
  app.post('/api/bookings/:id/approve', (req, res) => {
    const email = getRequesterEmail(req);
    if (!isAdminEmail(email)) {
      res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถอนุมัติการยืมได้' });
      return;
    }

    const booking = db.bookings.find((b) => b.id === req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'ไม่พบรายการจอง' });
      return;
    }
    if (booking.status !== 'รออนุมัติ') {
      res.status(400).json({ error: 'รายการนี้ไม่ได้อยู่ในสถานะรออนุมัติ' });
      return;
    }

    const equipment = db.equipment.find((item) => item.id === booking.equipmentId);
    if (!equipment) {
      res.status(404).json({ error: 'ไม่พบอุปกรณ์ของรายการจองนี้' });
      return;
    }
    if (equipment.status !== 'พร้อมใช้งาน') {
      res.status(400).json({ error: 'อุปกรณ์นี้ไม่ได้อยู่ในสถานะพร้อมใช้งาน' });
      return;
    }
    if (equipment.availableQty < booking.quantity) {
      res.status(400).json({
        error: `จำนวนคงเหลือไม่เพียงพอ (คงเหลือ ${equipment.availableQty} ชิ้น แต่ขอยืม ${booking.quantity} ชิ้น)`,
      });
      return;
    }

    const now = new Date().toISOString();
    equipment.availableQty -= booking.quantity;
    equipment.updatedAt = now;

    booking.status = 'กำลังยืม';
    booking.approvedAt = now;
    booking.approvedBy = email;
    booking.updatedAt = now;

    saveDatabase(db);
    broadcastStateUpdate('booking-approved');
    res.json({ booking, state: buildStateForUser(email) });
  });

  // Admin: Reject booking
  app.post('/api/bookings/:id/reject', (req, res) => {
    const email = getRequesterEmail(req);
    if (!isAdminEmail(email)) {
      res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถปฏิเสธคำขอได้' });
      return;
    }

    const booking = db.bookings.find((b) => b.id === req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'ไม่พบรายการจอง' });
      return;
    }
    if (booking.status !== 'รออนุมัติ') {
      res.status(400).json({ error: 'สามารถปฏิเสธได้เฉพาะคำขอที่รออนุมัติเท่านั้น' });
      return;
    }

    const rejectReason =
      typeof req.body?.rejectReason === 'string' && req.body.rejectReason.trim()
        ? req.body.rejectReason.trim().slice(0, 300)
        : 'อุปกรณ์ไม่พร้อมใช้งานหรือติดภารกิจภาควิชาในช่วงเวลาดังกล่าว';

    const now = new Date().toISOString();
    booking.status = 'ถูกปฏิเสธ';
    booking.rejectedAt = now;
    booking.rejectedBy = email;
    booking.rejectReason = rejectReason;
    booking.updatedAt = now;

    saveDatabase(db);
    broadcastStateUpdate('booking-rejected');
    res.json({ booking, state: buildStateForUser(email) });
  });

  // Admin: Record return with condition check (บันทึกการคืน)
  app.post('/api/bookings/:id/return', (req, res) => {
    const email = getRequesterEmail(req);
    if (!isAdminEmail(email)) {
      res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถบันทึกการคืนได้' });
      return;
    }

    const booking = db.bookings.find((b) => b.id === req.params.id);
    if (!booking) {
      res.status(404).json({ error: 'ไม่พบรายการยืม' });
      return;
    }
    if (booking.status !== 'กำลังยืม') {
      res.status(400).json({ error: 'รายการนี้ไม่ได้อยู่ในสถานะกำลังยืม' });
      return;
    }

    const returnCondition = req.body?.returnCondition as ReturnCondition;
    const returnNote = typeof req.body?.returnNote === 'string' ? req.body.returnNote.trim() : '';
    const markMaintenance = Boolean(req.body?.markMaintenance);

    if (!VALID_RETURN_CONDITIONS.includes(returnCondition)) {
      res.status(400).json({ error: 'กรุณาระบุสภาพอุปกรณ์หลังตรวจสอบการคืน' });
      return;
    }

    const now = new Date().toISOString();
    const equipment = db.equipment.find((item) => item.id === booking.equipmentId);
    if (equipment) {
      equipment.availableQty = Math.min(equipment.totalQty, equipment.availableQty + booking.quantity);
      if (markMaintenance || returnCondition === 'ชำรุดต้องซ่อม') {
        equipment.status = 'ชำรุด/ซ่อมบำรุง';
      }
      equipment.updatedAt = now;
    }

    booking.status = 'คืนแล้ว';
    booking.returnedAt = now;
    booking.returnedBy = email;
    booking.returnCondition = returnCondition;
    booking.returnNote = returnNote.slice(0, 400);
    booking.updatedAt = now;

    saveDatabase(db);
    broadcastStateUpdate('booking-returned');
    res.json({ booking, state: buildStateForUser(email) });
  });

  // Admin: Add another admin email
  app.post('/api/admins', (req, res) => {
    const requester = getRequesterEmail(req);
    if (!isAdminEmail(requester)) {
      res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถเพิ่มสิทธิ์ Admin ได้' });
      return;
    }

    const targetEmail = normalizeEmail(req.body?.email);
    if (!targetEmail || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(targetEmail)) {
      res.status(400).json({ error: 'กรุณาระบุอีเมลที่ถูกต้อง' });
      return;
    }
    if (isAdminEmail(targetEmail)) {
      res.status(400).json({ error: 'อีเมลนี้มีสิทธิ์ผู้ดูแลระบบอยู่แล้ว' });
      return;
    }

    db.admins.push({
      email: targetEmail,
      addedBy: requester,
      addedAt: new Date().toISOString(),
      isOwner: false,
    });
    saveDatabase(db);
    broadcastStateUpdate('admin-added');
    res.status(201).json({ state: buildStateForUser(requester) });
  });

  // Admin: Remove an admin email (cannot remove primary owner)
  app.delete('/api/admins/:email', (req, res) => {
    const requester = getRequesterEmail(req);
    if (!isAdminEmail(requester)) {
      res.status(403).json({ error: 'เฉพาะผู้ดูแลระบบเท่านั้นที่สามารถถอดสิทธิ์ Admin ได้' });
      return;
    }

    const targetEmail = normalizeEmail(decodeURIComponent(req.params.email));
    const target = db.admins.find((a) => a.email.toLowerCase() === targetEmail);
    if (!target) {
      res.status(404).json({ error: 'ไม่พบอีเมลผู้ดูแลระบบนี้' });
      return;
    }
    if (target.isOwner || target.email.toLowerCase() === OWNER_ADMIN_EMAIL) {
      res.status(400).json({ error: 'ไม่สามารถลบสิทธิ์เจ้าของระบบหลักได้' });
      return;
    }

    db.admins = db.admins.filter((a) => a.email.toLowerCase() !== targetEmail);
    saveDatabase(db);
    broadcastStateUpdate('admin-removed');
    res.json({ state: buildStateForUser(requester) });
  });

  // Vite dev middleware or production static build
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`EdTech Borrowing Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
