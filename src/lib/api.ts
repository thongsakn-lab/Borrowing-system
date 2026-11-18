import type {
  AppStateResponse,
  EquipmentCategory,
  EquipmentStatus,
  ReturnCondition,
} from '../types';
import { localStore } from './localStore';

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

let backendMode: 'unknown' | 'server' | 'local' = 'unknown';

async function callServerOrFallback<T>(
  url: string,
  options: RequestInit,
  userEmail: string | null | undefined,
  fallbackFn: () => T
): Promise<T> {
  if (backendMode === 'local') {
    return fallbackFn();
  }

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...((options.headers as Record<string, string>) || {}),
  };
  if (userEmail) {
    headers['x-user-email'] = userEmail;
  }

  try {
    const response = await fetch(url, {
      ...options,
      headers,
    });

    const contentType = response.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    // Static hosting (e.g., Vercel without backend) returns 404 or text/html
    if (!isJson && (response.status === 404 || response.status === 405 || response.ok)) {
      backendMode = 'local';
      return fallbackFn();
    }

    const data = await response.json().catch(() => null);
    if (!data) {
      backendMode = 'local';
      return fallbackFn();
    }

    if (!response.ok) {
      throw new Error(data.error || 'เกิดข้อผิดพลาดในการเชื่อมต่อเซิร์ฟเวอร์');
    }

    backendMode = 'server';
    return data as T;
  } catch (err) {
    // Only fall back on network/parse failures if backend hasn't been confirmed
    if (err instanceof TypeError || backendMode === 'unknown') {
      backendMode = 'local';
      return fallbackFn();
    }
    throw err;
  }
}

export function subscribeRealtimeUpdates(onUpdate: () => void): () => void {
  let eventSource: EventSource | null = null;
  let channel: BroadcastChannel | null = null;

  const handleStorage = (e: StorageEvent) => {
    if (e.key === 'edtech_borrowing_db_v1') {
      onUpdate();
    }
  };
  window.addEventListener('storage', handleStorage);

  if (typeof BroadcastChannel !== 'undefined') {
    channel = new BroadcastChannel('edtech_borrowing_sync');
    channel.onmessage = () => onUpdate();
  }

  // Only open SSE stream once backendMode is confirmed as 'server'
  let attempts = 0;
  const pollTimer = setInterval(() => {
    attempts += 1;
    if (backendMode === 'local' || attempts > 20) {
      clearInterval(pollTimer);
      return;
    }
    if (backendMode === 'server') {
      clearInterval(pollTimer);
      eventSource = new EventSource('/api/events');
      eventSource.onmessage = (event) => {
        try {
          const parsed = JSON.parse(event.data);
          if (parsed.type === 'state-updated') {
            onUpdate();
          }
        } catch {
          // Ignore keepalive messages
        }
      };
    }
  }, 250);

  return () => {
    clearInterval(pollTimer);
    window.removeEventListener('storage', handleStorage);
    if (channel) channel.close();
    if (eventSource) eventSource.close();
  };
}

export function fetchState(userEmail?: string | null): Promise<AppStateResponse> {
  return callServerOrFallback(
    '/api/state',
    { method: 'GET' },
    userEmail,
    () => localStore.fetchState(userEmail)
  );
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
  return callServerOrFallback(
    '/api/auth/google-signin',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    null,
    () => localStore.signInWithGoogleAccount(payload)
  );
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
  return callServerOrFallback(
    '/api/profile',
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    userEmail,
    () => localStore.updateProfile(userEmail, payload)
  );
}

function compressImageDataUrl(dataUrl: string): Promise<string> {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const maxDim = 900;
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) {
          height = Math.round((height * maxDim) / width);
          width = maxDim;
        } else {
          width = Math.round((width * maxDim) / height);
          height = maxDim;
        }
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) {
        resolve(dataUrl);
        return;
      }
      ctx.drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.82));
    };
    img.onerror = () => resolve(dataUrl);
    img.src = dataUrl;
  });
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
        const rawDataUrl = String(reader.result || '');
        if (backendMode === 'local') {
          const compressed = await compressImageDataUrl(rawDataUrl);
          resolve({ url: compressed, fileName: file.name });
          return;
        }
        const result = await callServerOrFallback<{ url: string; fileName: string }>(
          '/api/upload',
          {
            method: 'POST',
            body: JSON.stringify({
              dataUrl: rawDataUrl,
              filename: file.name,
            }),
          },
          userEmail,
          () => ({ url: rawDataUrl, fileName: file.name })
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
  return callServerOrFallback(
    '/api/equipment',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    userEmail,
    () => localStore.createEquipment(userEmail, payload)
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
  return callServerOrFallback(
    `/api/equipment/${encodeURIComponent(id)}`,
    {
      method: 'PUT',
      body: JSON.stringify(payload),
    },
    userEmail,
    () => localStore.updateEquipment(userEmail, id, payload)
  );
}

export function deleteEquipment(
  userEmail: string,
  id: string
): Promise<{ state: AppStateResponse }> {
  return callServerOrFallback(
    `/api/equipment/${encodeURIComponent(id)}`,
    {
      method: 'DELETE',
    },
    userEmail,
    () => localStore.deleteEquipment(userEmail, id)
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
  return callServerOrFallback(
    '/api/bookings',
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    userEmail,
    () => localStore.createBooking(userEmail, payload)
  );
}

export function cancelBooking(
  userEmail: string,
  id: string
): Promise<{ state: AppStateResponse }> {
  return callServerOrFallback(
    `/api/bookings/${encodeURIComponent(id)}/cancel`,
    {
      method: 'POST',
    },
    userEmail,
    () => localStore.cancelBooking(userEmail, id)
  );
}

export function approveBooking(
  userEmail: string,
  id: string
): Promise<{ state: AppStateResponse }> {
  return callServerOrFallback(
    `/api/bookings/${encodeURIComponent(id)}/approve`,
    {
      method: 'POST',
    },
    userEmail,
    () => localStore.approveBooking(userEmail, id)
  );
}

export function rejectBooking(
  userEmail: string,
  id: string,
  rejectReason: string
): Promise<{ state: AppStateResponse }> {
  return callServerOrFallback(
    `/api/bookings/${encodeURIComponent(id)}/reject`,
    {
      method: 'POST',
      body: JSON.stringify({ rejectReason }),
    },
    userEmail,
    () => localStore.rejectBooking(userEmail, id, rejectReason)
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
  return callServerOrFallback(
    `/api/bookings/${encodeURIComponent(id)}/return`,
    {
      method: 'POST',
      body: JSON.stringify(payload),
    },
    userEmail,
    () => localStore.returnBooking(userEmail, id, payload)
  );
}

export function addAdminEmail(
  userEmail: string,
  email: string
): Promise<{ state: AppStateResponse }> {
  return callServerOrFallback(
    '/api/admins',
    {
      method: 'POST',
      body: JSON.stringify({ email }),
    },
    userEmail,
    () => localStore.addAdminEmail(userEmail, email)
  );
}

export function removeAdminEmail(
  userEmail: string,
  targetEmail: string
): Promise<{ state: AppStateResponse }> {
  return callServerOrFallback(
    `/api/admins/${encodeURIComponent(targetEmail)}`,
    {
      method: 'DELETE',
    },
    userEmail,
    () => localStore.removeAdminEmail(userEmail, targetEmail)
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
