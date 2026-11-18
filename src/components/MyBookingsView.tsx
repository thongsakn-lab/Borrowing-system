import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  PackageCheck,
  XCircle,
} from 'lucide-react';
import type { BookingRecord, BookingStatus, UserProfile } from '../types';
import { formatThaiDate } from '../lib/api';
import { EquipmentImage } from './EquipmentImage';

interface MyBookingsViewProps {
  currentUser: UserProfile | null;
  bookings: BookingRecord[];
  onRequireSignIn: () => void;
  onCancelBooking: (bookingId: string) => Promise<void>;
  onBrowseEquipment: () => void;
}

type FilterTab = 'ทั้งหมด' | 'รออนุมัติ' | 'กำลังยืม' | 'คืนแล้ว' | 'ถูกปฏิเสธ';

const FILTER_TABS: FilterTab[] = [
  'ทั้งหมด',
  'รออนุมัติ',
  'กำลังยืม',
  'คืนแล้ว',
  'ถูกปฏิเสธ',
];

function StatusIndicator({ status }: { status: BookingStatus }) {
  switch (status) {
    case 'รออนุมัติ':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>รออนุมัติ</span>
        </span>
      );
    case 'กำลังยืม':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700">
          <PackageCheck className="w-3.5 h-3.5 shrink-0" />
          <span>กำลังยืม</span>
        </span>
      );
    case 'คืนแล้ว':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>คืนแล้ว</span>
        </span>
      );
    case 'ถูกปฏิเสธ':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          <span>ถูกปฏิเสธ</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{status}</span>
        </span>
      );
  }
}

export function MyBookingsView({
  currentUser,
  bookings,
  onRequireSignIn,
  onCancelBooking,
  onBrowseEquipment,
}: MyBookingsViewProps) {
  const [filter, setFilter] = useState<FilterTab>('ทั้งหมด');
  const [busyId, setBusyId] = useState<string | null>(null);

  if (!currentUser) {
    return (
      <div className="bg-white border border-slate-200 rounded-xl p-10 text-center max-w-xl mx-auto my-8">
        <h2 className="text-lg font-semibold text-slate-900">
          รายการจองอุปกรณ์ของฉัน
        </h2>
        <p className="text-sm text-slate-600 mt-2">
          เข้าสู่ระบบด้วยบัญชี Google เพื่อดูประวัติคำขอจอง ตรวจสอบสถานะการอนุมัติ และกำหนดคืนอุปกรณ์ของคุณ
        </p>
        <button
          type="button"
          onClick={onRequireSignIn}
          className="mt-5 px-5 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
        >
          เข้าสู่ระบบด้วย Google
        </button>
      </div>
    );
  }

  const filtered =
    filter === 'ทั้งหมด'
      ? bookings
      : bookings.filter((b) => b.status === filter);

  async function handleCancel(id: string) {
    setBusyId(id);
    try {
      await onCancelBooking(id);
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            รายการจองของฉัน
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            ติดตามสถานะคำขอยืม-คืนอุปกรณ์ของ {currentUser.name}
          </p>
        </div>

        <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg overflow-x-auto">
          {FILTER_TABS.map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => setFilter(tab)}
              className={`px-3 py-1.5 text-xs font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                filter === tab
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>
      </div>

      {filtered.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-xl p-10 text-center">
          <p className="text-base font-semibold text-slate-900">
            ยังไม่มีรายการจองในหมวดสถานะ "{filter}"
          </p>
          <p className="text-sm text-slate-500 mt-1">
            คุณสามารถเลือกดูอุปกรณ์ที่พร้อมให้ยืมและส่งคำขอจองได้ตลอดเวลา
          </p>
          <button
            type="button"
            onClick={onBrowseEquipment}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer"
          >
            เลือกดูรายการอุปกรณ์
          </button>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="divide-y divide-slate-100">
            {filtered.map((booking) => (
              <div
                key={booking.id}
                className="p-4 sm:p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 hover:bg-slate-50/70 transition-colors"
              >
                <div className="flex items-start gap-4 min-w-0">
                  <div className="w-20 h-16 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                    <EquipmentImage
                      src={booking.equipmentImageUrl}
                      alt={booking.equipmentName}
                      category={booking.equipmentCategory}
                    />
                  </div>
                  <div className="min-w-0 space-y-1">
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-slate-500">
                      <span className="font-mono text-blue-700">
                        {booking.equipmentCode}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span>{booking.equipmentCategory}</span>
                      <span aria-hidden="true">·</span>
                      <span className="tabular-nums">
                        จำนวน {booking.quantity} ชิ้น
                      </span>
                    </div>
                    <h3 className="text-sm font-semibold text-slate-900">
                      {booking.equipmentName}
                    </h3>
                    <p className="text-xs text-slate-600 line-clamp-2">
                      วัตถุประสงค์: {booking.purpose}
                    </p>
                    <p className="text-xs font-mono tabular-nums text-slate-500">
                      กำหนดยืม {formatThaiDate(booking.borrowDate)} — กำหนดคืน{' '}
                      {formatThaiDate(booking.dueDate)}
                    </p>
                    {booking.status === 'ถูกปฏิเสธ' && booking.rejectReason && (
                      <p className="text-xs text-rose-700 pt-0.5">
                        เหตุผล: {booking.rejectReason}
                      </p>
                    )}
                    {booking.status === 'คืนแล้ว' && booking.returnCondition && (
                      <p className="text-xs text-emerald-700 pt-0.5">
                        ผลการตรวจรับ: {booking.returnCondition}
                        {booking.returnNote ? ` (${booking.returnNote})` : ''}
                      </p>
                    )}
                  </div>
                </div>

                <div className="flex sm:flex-col items-center sm:items-end justify-between gap-3 shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-slate-100">
                  <StatusIndicator status={booking.status} />
                  {booking.status === 'รออนุมัติ' && (
                    <button
                      type="button"
                      disabled={busyId === booking.id}
                      onClick={() => handleCancel(booking.id)}
                      className="px-3 py-1.5 text-xs font-medium text-slate-700 bg-white border border-slate-300 hover:bg-slate-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      {busyId === booking.id ? 'กำลังยกเลิก...' : 'ยกเลิกคำขอ'}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </section>
  );
}
