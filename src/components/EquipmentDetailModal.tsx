import { useEffect, useState, type FormEvent } from 'react';
import { Calendar, CheckCircle2, X, XCircle } from 'lucide-react';
import type { EquipmentItem, UserProfile } from '../types';
import { EquipmentImage } from './EquipmentImage';

interface EquipmentDetailModalProps {
  equipment: EquipmentItem | null;
  currentUser: UserProfile | null;
  onClose: () => void;
  onRequireSignIn: () => void;
  onSubmitBooking: (payload: {
    equipmentId: string;
    quantity: number;
    borrowDate: string;
    dueDate: string;
    purpose: string;
  }) => Promise<void>;
}

export function EquipmentDetailModal({
  equipment,
  currentUser,
  onClose,
  onRequireSignIn,
  onSubmitBooking,
}: EquipmentDetailModalProps) {
  const today = new Date().toISOString().slice(0, 10);
  const defaultDue = new Date(Date.now() + 3 * 86400000).toISOString().slice(0, 10);

  const [quantity, setQuantity] = useState(1);
  const [borrowDate, setBorrowDate] = useState(today);
  const [dueDate, setDueDate] = useState(defaultDue);
  const [purpose, setPurpose] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (equipment) {
      setQuantity(1);
      setBorrowDate(today);
      setDueDate(defaultDue);
      setPurpose('');
      setError('');
    }
  }, [equipment?.id]);

  if (!equipment) return null;

  const isAvailable =
    equipment.status === 'พร้อมใช้งาน' && equipment.availableQty > 0;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    if (!equipment) return;
    if (!currentUser) {
      onRequireSignIn();
      return;
    }
    setError('');
    if (quantity < 1 || quantity > equipment.availableQty) {
      setError(`จำนวนที่ขอยืมต้องอยู่ระหว่าง 1 ถึง ${equipment.availableQty} ชิ้น`);
      return;
    }
    if (dueDate < borrowDate) {
      setError('วันที่กำหนดคืนต้องไม่เร็วกว่าวันที่ต้องการยืม');
      return;
    }
    if (!purpose.trim()) {
      setError('กรุณาระบุวัตถุประสงค์ในการยืมใช้งาน');
      return;
    }

    setSubmitting(true);
    try {
      await onSubmitBooking({
        equipmentId: equipment.id,
        quantity,
        borrowDate,
        dueDate,
        purpose: purpose.trim(),
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'ส่งคำขอจองไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4 overflow-y-auto"
      role="dialog"
      aria-modal="true"
      aria-labelledby="equip-detail-title"
    >
      <div className="w-full max-w-3xl bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden my-auto">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-blue-50/40">
          <div className="min-w-0 pr-4">
            <p className="text-xs font-mono text-blue-700">
              {equipment.code} · {equipment.category}
            </p>
            <h2
              id="equip-detail-title"
              className="text-lg font-semibold text-slate-900 truncate"
            >
              {equipment.name}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-700 rounded-lg hover:bg-slate-100 transition-colors shrink-0"
            aria-label="ปิดหน้าต่าง"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-slate-100">
          {/* Left: Photo & Details */}
          <div className="p-6 space-y-4">
            <div className="aspect-[4/3] w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100">
              <EquipmentImage
                src={equipment.imageUrl}
                alt={equipment.name}
                category={equipment.category}
              />
            </div>

            <div className="flex items-center justify-between text-sm py-2 border-y border-slate-100">
              <div className="flex items-center gap-2">
                {isAvailable ? (
                  <>
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                    <span className="font-semibold text-emerald-700">
                      ว่าง (พร้อมให้ยืม)
                    </span>
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span className="font-semibold text-rose-700">
                      ไม่ว่าง ({equipment.status === 'พร้อมใช้งาน' ? 'ถูกยืมครบแล้ว' : equipment.status})
                    </span>
                  </>
                )}
              </div>
              <span className="font-mono tabular-nums text-slate-700">
                คงเหลือ {equipment.availableQty} / {equipment.totalQty} ชิ้น
              </span>
            </div>

            <div>
              <h3 className="text-xs font-semibold text-slate-500 mb-1.5">
                รายละเอียดอุปกรณ์
              </h3>
              <p className="text-sm text-slate-700 leading-relaxed whitespace-pre-line">
                {equipment.description || 'ไม่มีรายละเอียดเพิ่มเติม'}
              </p>
            </div>
          </div>

          {/* Right: Booking Request Form */}
          <div className="p-6 flex flex-col justify-between">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="flex items-center gap-2 text-sm font-semibold text-slate-900">
                <Calendar className="w-4 h-4 text-blue-700" />
                <span>ส่งคำขอจองยืมอุปกรณ์</span>
              </div>

              {!currentUser && (
                <div className="p-3.5 rounded-lg bg-blue-50 border border-blue-200 text-xs text-blue-900 space-y-2">
                  <p>กรุณาเข้าสู่ระบบด้วยบัญชี Google ก่อนทำการส่งคำขอจองอุปกรณ์</p>
                  <button
                    type="button"
                    onClick={onRequireSignIn}
                    className="px-3 py-1.5 text-xs font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-md transition-colors cursor-pointer"
                  >
                    เข้าสู่ระบบด้วย Google
                  </button>
                </div>
              )}

              <div>
                <label
                  htmlFor="booking-qty"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  จำนวนที่ต้องการยืม (ชิ้น)
                </label>
                <input
                  id="booking-qty"
                  type="number"
                  min={1}
                  max={Math.max(1, equipment.availableQty)}
                  disabled={!isAvailable || submitting}
                  value={quantity}
                  onChange={(e) => setQuantity(Math.max(1, Number(e.target.value)))}
                  className="w-full px-3.5 py-2.5 text-sm font-mono tabular-nums bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label
                    htmlFor="booking-borrow-date"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    วันที่ต้องการยืม
                  </label>
                  <input
                    id="booking-borrow-date"
                    type="date"
                    required
                    min={today}
                    disabled={!isAvailable || submitting}
                    value={borrowDate}
                    onChange={(e) => {
                      const val = e.target.value;
                      setBorrowDate(val);
                      if (dueDate < val) setDueDate(val);
                    }}
                    className="w-full px-3 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50"
                  />
                </div>
                <div>
                  <label
                    htmlFor="booking-due-date"
                    className="block text-xs font-medium text-slate-700 mb-1"
                  >
                    วันที่กำหนดคืน
                  </label>
                  <input
                    id="booking-due-date"
                    type="date"
                    required
                    min={borrowDate}
                    disabled={!isAvailable || submitting}
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="w-full px-3 py-2.5 text-sm font-mono bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50"
                  />
                </div>
              </div>

              <div>
                <label
                  htmlFor="booking-purpose"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  วัตถุประสงค์ในการยืมใช้งาน *
                </label>
                <textarea
                  id="booking-purpose"
                  rows={3}
                  required
                  disabled={!isAvailable || submitting}
                  value={purpose}
                  onChange={(e) => setPurpose(e.target.value)}
                  placeholder="ระบุรายวิชา โครงงาน หรือกิจกรรมที่ใช้..."
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 disabled:bg-slate-50"
                />
              </div>

              {error && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {error}
                </p>
              )}

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="px-4 py-2.5 text-sm font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors cursor-pointer"
                >
                  ปิด
                </button>
                <button
                  type="submit"
                  disabled={!isAvailable || submitting}
                  className="px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer disabled:bg-slate-300 disabled:cursor-not-allowed"
                >
                  {submitting
                    ? 'กำลังส่งคำขอ...'
                    : !isAvailable
                    ? 'อุปกรณ์ไม่ว่าง'
                    : 'ส่งคำขอจองอุปกรณ์'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}
