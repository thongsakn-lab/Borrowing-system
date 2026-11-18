import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Upload, User, X } from 'lucide-react';
import type { UserProfile, UserRole } from '../types';
import { uploadImageFile } from '../lib/api';

interface ProfileModalProps {
  isOpen: boolean;
  user: UserProfile | null;
  role: UserRole | null;
  isFirstLoginPrompt?: boolean;
  onClose: () => void;
  onSave: (payload: {
    name: string;
    phone: string;
    studentId: string;
    affiliation: string;
    avatarUrl: string;
  }) => Promise<void>;
}

export function ProfileModal({
  isOpen,
  user,
  role,
  isFirstLoginPrompt = false,
  onClose,
  onSave,
}: ProfileModalProps) {
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [studentId, setStudentId] = useState('');
  const [affiliation, setAffiliation] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (user) {
      setName(user.name || '');
      setPhone(user.phone || '');
      setStudentId(user.studentId || '');
      setAffiliation(user.affiliation || 'ภาควิชาเทคโนโลยีการศึกษา');
      setAvatarUrl(user.avatarUrl || '');
      setError('');
    }
  }, [user, isOpen]);

  if (!isOpen || !user) return null;

  async function handleAvatarUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setError('');
    setUploading(true);
    try {
      const res = await uploadImageFile(user.email, file);
      setAvatarUrl(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อัปโหลดรูปโปรไฟล์ไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('กรุณากรอกชื่อ-นามสกุล');
      return;
    }
    setSaving(true);
    try {
      await onSave({
        name: name.trim(),
        phone: phone.trim(),
        studentId: studentId.trim(),
        affiliation: affiliation.trim() || 'ภาควิชาเทคโนโลยีการศึกษา',
        avatarUrl: avatarUrl.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกข้อมูลไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="profile-modal-title"
    >
      <div className="w-full max-w-lg bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-blue-50/40">
          <div>
            <h2
              id="profile-modal-title"
              className="text-base font-semibold text-slate-900"
            >
              {isFirstLoginPrompt
                ? 'ยินดีต้อนรับ — กรุณาตรวจสอบข้อมูลโปรไฟล์ของคุณ'
                : 'ข้อมูลโปรไฟล์ผู้ใช้งาน'}
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">
              สิทธิ์การใช้งาน: {role === 'admin' ? 'ผู้ดูแลระบบ (Admin)' : 'ผู้ใช้งานทั่วไป (User)'}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div className="flex items-center gap-4 pb-4 border-b border-slate-100">
            <div className="w-16 h-16 rounded-full bg-blue-50 border border-blue-200 overflow-hidden flex items-center justify-center shrink-0">
              {avatarUrl ? (
                <img
                  src={avatarUrl}
                  alt={name}
                  referrerPolicy="no-referrer"
                  className="w-full h-full object-cover"
                />
              ) : (
                <User className="w-7 h-7 text-blue-600" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-semibold text-slate-900 truncate">
                {user.email}
              </p>
              <label className="mt-1.5 inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg cursor-pointer transition-colors">
                <Upload className="w-3.5 h-3.5" />
                <span>{uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดภาพโปรไฟล์'}</span>
                <input
                  type="file"
                  accept="image/jpeg,image/png,image/webp,image/gif"
                  onChange={handleAvatarUpload}
                  disabled={uploading}
                  className="sr-only"
                />
              </label>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="sm:col-span-2">
              <label
                htmlFor="profile-name"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                ชื่อ-นามสกุล *
              </label>
              <input
                id="profile-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="profile-student-id"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                รหัสนักศึกษา / รหัสบุคลากร
              </label>
              <input
                id="profile-student-id"
                type="text"
                value={studentId}
                onChange={(e) => setStudentId(e.target.value)}
                placeholder="เช่น 6604010025"
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="profile-phone"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                เบอร์โทรศัพท์ติดต่อ
              </label>
              <input
                id="profile-phone"
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="เช่น 081-234-5678"
                className="w-full px-3.5 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="profile-affiliation"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                สังกัด / ชั้นปี / หน่วยงาน
              </label>
              <input
                id="profile-affiliation"
                type="text"
                value={affiliation}
                onChange={(e) => setAffiliation(e.target.value)}
                placeholder="เช่น นิสิตชั้นปีที่ 3 สาขาเทคโนโลยีการศึกษา"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              ปิด
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'กำลังบันทึก...' : 'บันทึกโปรไฟล์'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
