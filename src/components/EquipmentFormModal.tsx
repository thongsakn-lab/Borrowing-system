import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react';
import { Trash2, Upload, X } from 'lucide-react';
import type { EquipmentCategory, EquipmentItem, EquipmentStatus } from '../types';
import { EQUIPMENT_CATEGORIES, EQUIPMENT_STATUSES, uploadImageFile } from '../lib/api';
import { EquipmentImage } from './EquipmentImage';

interface EquipmentFormModalProps {
  isOpen: boolean;
  editingItem: EquipmentItem | null;
  adminEmail: string;
  onClose: () => void;
  onSave: (payload: {
    code: string;
    name: string;
    category: EquipmentCategory;
    totalQty: number;
    availableQty: number;
    status: EquipmentStatus;
    imageUrl: string;
    description: string;
  }) => Promise<void>;
}

const PRESET_IMAGES = [
  {
    label: 'กล้อง',
    url: '/src/assets/images/equip_mirrorless_camera_1795015990845.jpg',
  },
  {
    label: 'ไมโครโฟน',
    url: '/src/assets/images/equip_wireless_mic_1795015992470.jpg',
  },
  {
    label: 'ขาตั้งกล้อง',
    url: '/src/assets/images/equip_carbon_tripod_1795015992394.jpg',
  },
  {
    label: 'โปรเจกเตอร์',
    url: '/src/assets/images/equip_laser_projector_1795015993112.jpg',
  },
  {
    label: 'ไฟสตูดิโอ',
    url: '/src/assets/images/equip_led_studio_light_1795015992947.jpg',
  },
];

export function EquipmentFormModal({
  isOpen,
  editingItem,
  adminEmail,
  onClose,
  onSave,
}: EquipmentFormModalProps) {
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [category, setCategory] = useState<EquipmentCategory>('กล้อง');
  const [totalQty, setTotalQty] = useState(1);
  const [availableQty, setAvailableQty] = useState(1);
  const [status, setStatus] = useState<EquipmentStatus>('พร้อมใช้งาน');
  const [imageUrl, setImageUrl] = useState('');
  const [description, setDescription] = useState('');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      if (editingItem) {
        setCode(editingItem.code);
        setName(editingItem.name);
        setCategory(editingItem.category);
        setTotalQty(editingItem.totalQty);
        setAvailableQty(editingItem.availableQty);
        setStatus(editingItem.status);
        setImageUrl(editingItem.imageUrl);
        setDescription(editingItem.description);
      } else {
        setCode('');
        setName('');
        setCategory('กล้อง');
        setTotalQty(1);
        setAvailableQty(1);
        setStatus('พร้อมใช้งาน');
        setImageUrl('');
        setDescription('');
      }
      setError('');
    }
  }, [isOpen, editingItem]);

  if (!isOpen) return null;

  async function handleImageUpload(e: ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setUploading(true);
    try {
      const res = await uploadImageFile(adminEmail, file);
      setImageUrl(res.url);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'อัปโหลดรูปภาพไม่สำเร็จ');
    } finally {
      setUploading(false);
    }
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!code.trim() || !name.trim()) {
      setError('กรุณากรอกรหัสอุปกรณ์และชื่ออุปกรณ์');
      return;
    }
    if (totalQty < 1) {
      setError('จำนวนทั้งหมดต้องไม่น้อยกว่า 1');
      return;
    }
    if (availableQty < 0 || availableQty > totalQty) {
      setError('จำนวนคงเหลือต้องอยู่ระหว่าง 0 ถึงจำนวนทั้งหมด');
      return;
    }

    setSaving(true);
    try {
      await onSave({
        code: code.trim().toUpperCase(),
        name: name.trim(),
        category,
        totalQty,
        availableQty,
        status,
        imageUrl: imageUrl.trim(),
        description: description.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกข้อมูลอุปกรณ์ไม่สำเร็จ');
    } finally {
      setSaving(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="equip-form-title"
    >
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-blue-50/40">
          <h2
            id="equip-form-title"
            className="text-base font-semibold text-slate-900"
          >
            {editingItem ? 'แก้ไขข้อมูลอุปกรณ์' : 'เพิ่มอุปกรณ์ใหม่เข้าสู่ระบบ'}
          </h2>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Image upload & management */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-start">
            <div className="aspect-[4/3] w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
              <EquipmentImage
                src={imageUrl}
                alt={name || 'ตัวอย่างรูปอุปกรณ์'}
                category={category}
              />
            </div>

            <div className="sm:col-span-2 space-y-2.5">
              <p className="text-xs font-medium text-slate-700">
                รูปภาพอุปกรณ์ (อัปโหลดไฟล์หรือเลือกภาพมาตรฐานภาควิชา)
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <label className="inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg cursor-pointer transition-colors">
                  <Upload className="w-3.5 h-3.5" />
                  <span>{uploading ? 'กำลังอัปโหลด...' : 'อัปโหลดรูปภาพใหม่'}</span>
                  <input
                    type="file"
                    accept="image/jpeg,image/png,image/webp,image/gif"
                    onChange={handleImageUpload}
                    disabled={uploading}
                    className="sr-only"
                  />
                </label>

                {imageUrl && (
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="inline-flex items-center gap-1 px-3 py-2 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg cursor-pointer transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>ลบรูปภาพ</span>
                  </button>
                )}
              </div>

              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                <span className="text-[11px] text-slate-500 mr-1">ภาพตัวอย่าง:</span>
                {PRESET_IMAGES.map((preset) => (
                  <button
                    key={preset.label}
                    type="button"
                    onClick={() => setImageUrl(preset.url)}
                    className={`px-2 py-1 text-[11px] rounded border transition-colors cursor-pointer ${
                      imageUrl === preset.url
                        ? 'bg-blue-50 border-blue-400 text-blue-800 font-medium'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                    }`}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="eq-code"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                รหัสอุปกรณ์ *
              </label>
              <input
                id="eq-code"
                type="text"
                required
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="เช่น EDTECH-CAM-002"
                className="w-full px-3.5 py-2.5 text-sm font-mono uppercase bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="eq-category"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                หมวดหมู่ *
              </label>
              <select
                id="eq-category"
                value={category}
                onChange={(e) => setCategory(e.target.value as EquipmentCategory)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {EQUIPMENT_CATEGORIES.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="eq-name"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                ชื่ออุปกรณ์ *
              </label>
              <input
                id="eq-name"
                type="text"
                required
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น กล้องวิดีโอ Sony FX30 พร้อมเลนส์ 18-105mm"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="eq-total"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                จำนวนทั้งหมด *
              </label>
              <input
                id="eq-total"
                type="number"
                min={1}
                max={999}
                required
                value={totalQty}
                onChange={(e) => {
                  const nextTotal = Math.max(1, Number(e.target.value));
                  setTotalQty(nextTotal);
                  if (!editingItem) {
                    setAvailableQty(nextTotal);
                  } else if (availableQty > nextTotal) {
                    setAvailableQty(nextTotal);
                  }
                }}
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="eq-available"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                จำนวนคงเหลือ *
              </label>
              <input
                id="eq-available"
                type="number"
                min={0}
                max={totalQty}
                required
                value={availableQty}
                onChange={(e) =>
                  setAvailableQty(Math.max(0, Math.min(totalQty, Number(e.target.value))))
                }
                className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="eq-status"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                สถานะการใช้งาน *
              </label>
              <select
                id="eq-status"
                value={status}
                onChange={(e) => setStatus(e.target.value as EquipmentStatus)}
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              >
                {EQUIPMENT_STATUSES.map((st) => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>
            </div>

            <div className="sm:col-span-2">
              <label
                htmlFor="eq-desc"
                className="block text-xs font-medium text-slate-700 mb-1"
              >
                รายละเอียดและอุปกรณ์ภายในชุด
              </label>
              <textarea
                id="eq-desc"
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="ระบุรุ่น สเปก หรืออุปกรณ์เสริมที่ให้ยืมพร้อมกัน..."
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
              />
            </div>
          </div>

          {error && (
            <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
              {error}
            </p>
          )}

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
            >
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={saving || uploading}
              className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {saving ? 'กำลังบันทึก...' : editingItem ? 'บันทึกการแก้ไข' : 'เพิ่มอุปกรณ์'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
