import { useEffect, useState, type FormEvent } from 'react';
import { ClipboardCheck, X } from 'lucide-react';
import type { BookingRecord, ReturnCondition } from '../types';
import { RETURN_CONDITIONS } from '../lib/api';

interface ReturnCheckModalProps {
  booking: BookingRecord | null;
  onClose: () => void;
  onConfirmReturn: (payload: {
    returnCondition: ReturnCondition;
    returnNote: string;
    markMaintenance: boolean;
  }) => Promise<void>;
}

export function ReturnCheckModal({
  booking,
  onClose,
  onConfirmReturn,
}: ReturnCheckModalProps) {
  const [returnCondition, setReturnCondition] =
    useState<ReturnCondition>('ปกติสมบูรณ์');
  const [returnNote, setReturnNote] = useState('');
  const [markMaintenance, setMarkMaintenance] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    if (booking) {
      setReturnCondition('ปกติสมบูรณ์');
      setReturnNote('');
      setMarkMaintenance(false);
      setError('');
    }
  }, [booking?.id]);

  if (!booking) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    setSubmitting(true);
    try {
      await onConfirmReturn({
        returnCondition,
        returnNote: returnNote.trim(),
        markMaintenance,
      });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'บันทึกการคืนไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="return-modal-title"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-blue-50/40">
          <div className="flex items-center gap-2.5">
            <ClipboardCheck className="w-5 h-5 text-blue-700" />
            <h2
              id="return-modal-title"
              className="text-base font-semibold text-slate-900"
            >
              บันทึกการคืนและตรวจสอบสภาพอุปกรณ์
            </h2>
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
          <div className="p-3.5 rounded-lg bg-slate-50 border border-slate-200 space-y-1">
            <p className="text-xs font-mono text-blue-700">{booking.equipmentCode}</p>
            <p className="text-sm font-semibold text-slate-900">
              {booking.equipmentName}
            </p>
            <p className="text-xs text-slate-600">
              ผู้ยืม: {booking.userName} · จำนวน {booking.quantity} ชิ้น
            </p>
          </div>

          <div>
            <p className="block text-xs font-medium text-slate-700 mb-2">
              ผลการตรวจสอบสภาพอุปกรณ์ *
            </p>
            <div className="space-y-2">
              {RETURN_CONDITIONS.map((condition) => (
                <label
                  key={condition}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-lg border text-sm cursor-pointer transition-colors ${
                    returnCondition === condition
                      ? 'bg-blue-50 border-blue-500 text-blue-900 font-medium'
                      : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  <input
                    type="radio"
                    name="returnCondition"
                    value={condition}
                    checked={returnCondition === condition}
                    onChange={() => {
                      setReturnCondition(condition);
                      setMarkMaintenance(condition === 'ชำรุดต้องซ่อม');
                    }}
                    className="accent-blue-700"
                  />
                  <span>{condition}</span>
                </label>
              ))}
            </div>
          </div>

          {returnCondition !== 'ปกติสมบูรณ์' && (
            <label className="flex items-center gap-2.5 text-xs text-slate-700 bg-amber-50 border border-amber-200 rounded-lg px-3 py-2.5 cursor-pointer">
              <input
                type="checkbox"
                checked={markMaintenance}
                onChange={(e) => setMarkMaintenance(e.target.checked)}
                className="accent-blue-700"
              />
              <span>เปลี่ยนสถานะอุปกรณ์เป็น "ชำรุด/ซ่อมบำรุง" ทันที</span>
            </label>
          )}

          <div>
            <label
              htmlFor="return-note"
              className="block text-xs font-medium text-slate-700 mb-1"
            >
              หมายเหตุการตรวจรับ (อุปกรณ์ครบถ้วน / ตำหนิที่พบ)
            </label>
            <textarea
              id="return-note"
              rows={2}
              value={returnNote}
              onChange={(e) => setReturnNote(e.target.value)}
              placeholder="เช่น อุปกรณ์ครบชุด แบตเตอรี่ครบ 2 ก้อน สภาพสมบูรณ์"
              className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            />
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
              ยกเลิก
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="px-5 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'กำลังบันทึก...' : 'ยืนยันบันทึกการคืน'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
