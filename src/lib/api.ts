import type {
  AppStateResponse,
  EquipmentCategory,
  EquipmentStatus,
  ReturnCondition,
} from '../types';

export const EQUIPMENT_CATEGORIES: EquipmentCategory[] = [
  'กล้อง',
  'ไมโครโฟน',
  'ขาตั้งกล้อง',
  'โปรเจกเตอร์',
  'ไฟสตูดิโอ',
  'อุปกรณ์เสริม',
];

export const EQUIPMENT_STATUSES: EquipmentStatus[] = [
  'พร้อมใช้งาน',
  'ชำรุด/ซ่อมบำรุง',
  'งดให้บริการ',
];

export const RETURN_CONDITIONS: ReturnCondition[] = [
  'ปกติสมบูรณ์',
  'ชำรุดเล็กน้อย',
  'ชำรุดต้องซ่อม',
];

async function requestJson<T>(
  url: string,
  options: RequestInit = {},
  userEmail?: string | null
): Promise<T> {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (userEmail) {
    headers['x-user-email'] = userEmail;
  }
  const response = await fetch(url, {
    ...options,
    headers,
  });
  const data = await response.json().catch(() => ({}));
  if (!response.ok) {
    throw new Error(data.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
  }
  return data as T;
}

export function fetchState(userEmail?: string | null): Promise<AppStateResponse> {
  return requestJson<AppStateResponse>('/api/state', { method: 'GET' }, userEmail);
}

export function signInWithGoogleAccount(payload: {
  email: string;
  name?: string;
  avatarUrl?: string;
  phone?: string;
  studentId?: string;
  affiliation?: string;
}): Promise<{
  user: AppStateResponse['currentUser'];
  role: AppStateResponse['role'];
  isNewUser: boolean;
  state: AppStateResponse;
}> {
  return requestJson('/api/auth/google-signin', {
    method: 'POST',
    body: JSON.stringify(payload),
  });
}

export function updateProfile(
  userEmail: string,
  payload: {
    name: string;
    phone: string;
    studentId: string;
    affiliation: string;
    avatarUrl: string;
  }
): Promise<{ user: AppStateResponse['currentUser']; state: AppStateResponse }> {
  return requestJson(
    '/api/profile',
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    userEmail
  );
}

export function uploadImageFile(
  userEmail: string,
  file: File
): Promise<{ url: string; fileName: string }> {
  return new Promise((resolve, reject) => {
    if (file.size > 5 * 1024 * 1024) {
      reject(new Error('ขนาดไฟล์รูปภาพต้องไม่เกิน 5 MB'));
      return;
    }
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const result = await requestJson<{ url: string; fileName: string }>(
          '/api/upload',
          {
            method: 'POST',
            body: JSON.stringify({
              dataUrl: reader.result,
              filename: file.name,
            }),
          },
          userEmail
        );
        resolve(result);
      } catch (err) {
        reject(err);
      }
    };
    reader.onerror = () => reject(new Error('ไม่สามารถอ่านไฟล์รูปภาพได้'));
    reader.readAsDataURL(file);
  });
}

export function createEquipment(
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
): Promise<{ state: AppStateResponse }> {
  return requestJson(
    '/api/equipment',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    userEmail
  );
}

export function updateEquipment(
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
): Promise<{ state: AppStateResponse }> {
  return requestJson(
    `/api/equipment/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    userEmail
  );
}

export function deleteEquipment(
  userEmail: string,
  id: string
): Promise<{ state: AppStateResponse }> {
  return requestJson(
    `/api/equipment/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
    userEmail
  );
}

export function createBooking(
  userEmail: string,
  payload: {
    equipmentId: string;
    quantity: number;
    borrowDate: string;
    dueDate: string;
    purpose: string;
  }
): Promise<{ state: AppStateResponse }> {
  return requestJson(
    '/api/bookings',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    userEmail
  );
}

export function cancelBooking(
  userEmail: string,
  id: string
): Promise<{ state: AppStateResponse }> {
  return requestJson(
    `/api/bookings/${encodeURIComponent(id)}/cancel`,
    {
      method: 'POST',
    },
    userEmail
  );
}

export function approveBooking(
  userEmail: string,
  id: string
): Promise<{ state: AppStateResponse }> {
  return requestJson(
    `/api/bookings/${encodeURIComponent(id)}/approve`,
    {
      method: 'POST',
    },
    userEmail
  );
}

export function rejectBooking(
  userEmail: string,
  id: string,
  rejectReason: string
): Promise<{ state: AppStateResponse }> {
  return requestJson(
    `/api/bookings/${encodeURIComponent(id)}/reject`,
    {
      method: 'POST',
      body: JSON.stringify({ rejectReason }),
    },
    userEmail
  );
}

export function returnBooking(
  userEmail: string,
  id: string,
  payload: {
    returnCondition: ReturnCondition;
    returnNote: string;
    markMaintenance: boolean;
  }
): Promise<{ state: AppStateResponse }> {
  return requestJson(
    `/api/bookings/${encodeURIComponent(id)}/return`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    userEmail
  );
}

export function addAdminEmail(
  userEmail: string,
  email: string
): Promise<{ state: AppStateResponse }> {
  return requestJson(
    '/api/admins',
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    },
    userEmail
  );
}

export function removeAdminEmail(
  userEmail: string,
  targetEmail: string
): Promise<{ state: AppStateResponse }> {
  return requestJson(
    `/api/admins/${encodeURIComponent(targetEmail)}`,
    {
      method: 'DELETE',
    },
    userEmail
  );
}

export function formatThaiDate(dateStr?: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr.length === 10 ? `${dateStr}T00:00:00` : dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

export function formatThaiDateTime(dateStr?: string): string {
  if (!dateStr) return '-';
  const date = new Date(dateStr);
  if (Number.isNaN(date.getTime())) return dateStr;
  return new Intl.DateTimeFormat('th-TH', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  }).format(date);
}
