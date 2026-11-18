import { useState, type FormEvent } from 'react';
import {
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Edit3,
  PackageCheck,
  Plus,
  Search,
  ShieldCheck,
  Trash2,
  UserPlus,
  XCircle,
} from 'lucide-react';
import type {
  AdminAllowlistEntry,
  BookingRecord,
  BookingStatus,
  DashboardStats,
  EquipmentItem,
} from '../types';
import { formatThaiDate, formatThaiDateTime } from '../lib/api';
import { EquipmentImage } from './EquipmentImage';

export type AdminSection = 'requests' | 'history' | 'equipment' | 'admins';

interface AdminDashboardViewProps {
  activeSection: AdminSection;
  onChangeSection: (section: AdminSection) => void;
  stats: DashboardStats;
  equipment: EquipmentItem[];
  bookings: BookingRecord[];
  admins: AdminAllowlistEntry[];
  onOpenAddEquipment: () => void;
  onOpenEditEquipment: (item: EquipmentItem) => void;
  onDeleteEquipment: (id: string) => Promise<void>;
  onApproveBooking: (id: string) => Promise<void>;
  onRejectBooking: (id: string, reason: string) => Promise<void>;
  onOpenReturnModal: (booking: BookingRecord) => void;
  onAddAdmin: (email: string) => Promise<void>;
  onRemoveAdmin: (email: string) => Promise<void>;
}

function BookingStatusCell({ status }: { status: BookingStatus }) {
  switch (status) {
    case 'รออนุมัติ':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-amber-700 whitespace-nowrap">
          <Clock className="w-3.5 h-3.5 shrink-0" />
          <span>รออนุมัติ</span>
        </span>
      );
    case 'กำลังยืม':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-700 whitespace-nowrap">
          <PackageCheck className="w-3.5 h-3.5 shrink-0" />
          <span>กำลังยืม</span>
        </span>
      );
    case 'คืนแล้ว':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 shrink-0" />
          <span>คืนแล้ว</span>
        </span>
      );
    case 'ถูกปฏิเสธ':
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-rose-700 whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          <span>ถูกปฏิเสธ</span>
        </span>
      );
    default:
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 whitespace-nowrap">
          <XCircle className="w-3.5 h-3.5 shrink-0" />
          <span>{status}</span>
        </span>
      );
  }
}

export function AdminDashboardView({
  activeSection,
  onChangeSection,
  stats,
  equipment,
  bookings,
  admins,
  onOpenAddEquipment,
  onOpenEditEquipment,
  onDeleteEquipment,
  onApproveBooking,
  onRejectBooking,
  onOpenReturnModal,
  onAddAdmin,
  onRemoveAdmin,
}: AdminDashboardViewProps) {
  const [historySearch, setHistorySearch] = useState('');
  const [historyStatus, setHistoryStatus] = useState<'ทั้งหมด' | BookingStatus>(
    'ทั้งหมด'
  );
  const [equipSearch, setEquipSearch] = useState('');
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [adminError, setAdminError] = useState('');
  const [busyId, setBusyId] = useState<string | null>(null);
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const [rejectingId, setRejectingId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const pendingBookings = bookings.filter((b) => b.status === 'รออนุมัติ');
  const activeBorrows = bookings.filter((b) => b.status === 'กำลังยืม');

  const filteredHistory = bookings.filter((b) => {
    const matchStatus = historyStatus === 'ทั้งหมด' || b.status === historyStatus;
    const q = historySearch.trim().toLowerCase();
    const matchQuery =
      !q ||
      b.equipmentName.toLowerCase().includes(q) ||
      b.equipmentCode.toLowerCase().includes(q) ||
      b.userName.toLowerCase().includes(q) ||
      b.userEmail.toLowerCase().includes(q) ||
      b.userStudentId.toLowerCase().includes(q);
    return matchStatus && matchQuery;
  });

  const filteredEquipment = equipment.filter((item) => {
    const q = equipSearch.trim().toLowerCase();
    return (
      !q ||
      item.name.toLowerCase().includes(q) ||
      item.code.toLowerCase().includes(q) ||
      item.category.toLowerCase().includes(q)
    );
  });

  async function handleApprove(id: string) {
    setBusyId(id);
    try {
      await onApproveBooking(id);
    } finally {
      setBusyId(null);
    }
  }

  async function handleConfirmReject(e: FormEvent, id: string) {
    e.preventDefault();
    setBusyId(id);
    try {
      await onRejectBooking(id, rejectReason.trim());
      setRejectingId(null);
      setRejectReason('');
    } finally {
      setBusyId(null);
    }
  }

  async function handleConfirmDeleteEquipment(id: string) {
    setBusyId(id);
    try {
      await onDeleteEquipment(id);
      setConfirmDeleteId(null);
    } finally {
      setBusyId(null);
    }
  }

  async function handleAddAdminSubmit(e: FormEvent) {
    e.preventDefault();
    setAdminError('');
    if (!newAdminEmail.trim()) return;
    setBusyId('add-admin');
    try {
      await onAddAdmin(newAdminEmail.trim());
      setNewAdminEmail('');
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'เพิ่มผู้ดูแลระบบไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  }

  async function handleRemoveAdminClick(email: string) {
    setAdminError('');
    setBusyId(`rm-${email}`);
    try {
      await onRemoveAdmin(email);
    } catch (err) {
      setAdminError(err instanceof Error ? err.message : 'ถอดสิทธิ์ไม่สำเร็จ');
    } finally {
      setBusyId(null);
    }
  }

  return (
    <section className="space-y-6">
      {/* Header + Primary Action */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">
            ศูนย์จัดการระบบผู้ดูแล (Admin Console)
          </h1>
          <p className="text-sm text-slate-600 mt-1">
            ภาพรวมคลังอุปกรณ์ การอนุมัติคำขอยืม-คืน การตรวจรับสภาพ และสิทธิ์ผู้ดูแลระบบ
          </p>
        </div>

        <button
          type="button"
          onClick={onOpenAddEquipment}
          className="inline-flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
        >
          <Plus className="w-4 h-4" />
          <span>เพิ่มอุปกรณ์ใหม่</span>
        </button>
      </div>

      {/* 4-Column KPI Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">อุปกรณ์ทั้งหมดในคลัง</p>
          <p className="text-3xl font-bold text-slate-900 tabular-nums mt-2">
            {stats.totalUnits}
            <span className="text-sm font-normal text-slate-500 ml-1.5">ชิ้น</span>
          </p>
          <p className="text-xs text-slate-500 tabular-nums mt-1">
            {stats.totalEquipmentTypes} รายการ · คงเหลือ {stats.availableUnits} ชิ้น
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">อุปกรณ์ที่ถูกยืม</p>
          <p className="text-3xl font-bold text-blue-700 tabular-nums mt-2">
            {stats.borrowedUnits}
            <span className="text-sm font-normal text-slate-500 ml-1.5">ชิ้น</span>
          </p>
          <p className="text-xs text-slate-500 tabular-nums mt-1">
            กำลังใช้งานอยู่ {stats.activeBookings} รายการ
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">รายการรออนุมัติ</p>
          <p className="text-3xl font-bold text-amber-700 tabular-nums mt-2">
            {stats.pendingBookings}
            <span className="text-sm font-normal text-slate-500 ml-1.5">คำขอ</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            รอตรวจสอบและรับอุปกรณ์
          </p>
        </div>

        <div className="bg-white border border-slate-200 rounded-xl p-5">
          <p className="text-xs font-medium text-slate-500">ประวัติการคืนสำเร็จ</p>
          <p className="text-3xl font-bold text-emerald-700 tabular-nums mt-2">
            {stats.completedBookings}
            <span className="text-sm font-normal text-slate-500 ml-1.5">ครั้ง</span>
          </p>
          <p className="text-xs text-slate-500 mt-1">
            บันทึกการตรวจรับเรียบร้อย
          </p>
        </div>
      </div>

      {/* Workspace Sub-tabs */}
      <div className="flex items-center gap-1 p-1 bg-slate-100 border border-slate-200 rounded-lg overflow-x-auto w-full sm:w-fit">
        <button
          type="button"
          onClick={() => onChangeSection('requests')}
          className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeSection === 'requests'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          จัดการคำขอยืม-คืน ({pendingBookings.length + activeBorrows.length})
        </button>
        <button
          type="button"
          onClick={() => onChangeSection('history')}
          className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeSection === 'history'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          ประวัติการยืม-คืน ({bookings.length})
        </button>
        <button
          type="button"
          onClick={() => onChangeSection('equipment')}
          className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeSection === 'equipment'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          จัดการอุปกรณ์ ({equipment.length})
        </button>
        <button
          type="button"
          onClick={() => onChangeSection('admins')}
          className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-md transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
            activeSection === 'admins'
              ? 'bg-white text-blue-700 shadow-xs'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          สิทธิ์ผู้ดูแลระบบ ({admins.length})
        </button>
      </div>

      {/* Section 1: Requests & Active Borrows */}
      {activeSection === 'requests' && (
        <div className="space-y-6">
          {/* Pending Queue */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-blue-50/30">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  คำขอจองรออนุมัติการยืม
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  กด "อนุมัติการยืม" เมื่อผู้ใช้งานมารับอุปกรณ์จริงที่เคาน์เตอร์ภาควิชา
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-amber-700 font-semibold">
                {pendingBookings.length} รายการ
              </span>
            </div>

            {pendingBookings.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                ไม่มีคำขอจองที่รออนุมัติในขณะนี้
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {pendingBookings.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
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
                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                          <span className="font-mono text-blue-700">
                            {booking.equipmentCode}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums font-semibold text-slate-700">
                            ขอยืม {booking.quantity} ชิ้น
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            {formatThaiDate(booking.borrowDate)} –{' '}
                            {formatThaiDate(booking.dueDate)}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {booking.equipmentName}
                        </h3>
                        <p className="text-xs text-slate-700">
                          ผู้ขอ: <span className="font-medium">{booking.userName}</span>{' '}
                          {booking.userStudentId && (
                            <span className="font-mono text-slate-500">
                              ({booking.userStudentId})
                            </span>
                          )}{' '}
                          · {booking.userAffiliation || 'ไม่ระบุสังกัด'}
                          {booking.userPhone ? ` · โทร ${booking.userPhone}` : ''}
                        </p>
                        <p className="text-xs text-slate-600">
                          วัตถุประสงค์: {booking.purpose}
                        </p>

                        {rejectingId === booking.id && (
                          <form
                            onSubmit={(e) => handleConfirmReject(e, booking.id)}
                            className="mt-3 flex flex-col sm:flex-row gap-2 pt-2"
                          >
                            <input
                              type="text"
                              value={rejectReason}
                              onChange={(e) => setRejectReason(e.target.value)}
                              placeholder="ระบุเหตุผลที่ปฏิเสธคำขอ (เช่น อุปกรณ์ส่งซ่อม)..."
                              className="flex-1 px-3 py-1.5 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                            />
                            <div className="flex items-center gap-2 shrink-0">
                              <button
                                type="submit"
                                disabled={busyId === booking.id}
                                className="px-3 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-lg cursor-pointer"
                              >
                                ยืนยันปฏิเสธ
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setRejectingId(null);
                                  setRejectReason('');
                                }}
                                className="px-3 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-lg cursor-pointer"
                              >
                                ยกเลิก
                              </button>
                            </div>
                          </form>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2.5 shrink-0">
                      <button
                        type="button"
                        disabled={busyId === booking.id}
                        onClick={() => handleApprove(booking.id)}
                        className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                      >
                        {busyId === booking.id ? 'กำลังดำเนินการ...' : 'อนุมัติการยืม'}
                      </button>
                      <button
                        type="button"
                        disabled={busyId === booking.id}
                        onClick={() => {
                          setRejectingId(booking.id);
                          setRejectReason('');
                        }}
                        className="px-3.5 py-2 text-xs sm:text-sm font-medium text-rose-700 bg-white border border-rose-200 hover:bg-rose-50 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                      >
                        ปฏิเสธ
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Active Borrowed Items (Awaiting Return) */}
          <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/60">
              <div>
                <h2 className="text-base font-semibold text-slate-900">
                  อุปกรณ์ที่กำลังถูกยืม (รอรับคืน)
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  เมื่อผู้ใช้นำอุปกรณ์มาคืน กด "บันทึกการคืน" เพื่อตรวจสอบสภาพและคืนยอดคงเหลือ
                </p>
              </div>
              <span className="text-xs font-mono tabular-nums text-blue-700 font-semibold">
                {activeBorrows.length} รายการ
              </span>
            </div>

            {activeBorrows.length === 0 ? (
              <div className="p-8 text-center text-sm text-slate-500">
                ไม่มีรายการอุปกรณ์ที่กำลังถูกยืมในขณะนี้
              </div>
            ) : (
              <div className="divide-y divide-slate-100">
                {activeBorrows.map((booking) => (
                  <div
                    key={booking.id}
                    className="p-5 flex flex-col lg:flex-row lg:items-center justify-between gap-4"
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
                        <div className="flex flex-wrap items-center gap-x-2 text-xs text-slate-500">
                          <span className="font-mono text-blue-700">
                            {booking.equipmentCode}
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="tabular-nums font-semibold text-slate-700">
                            จำนวน {booking.quantity} ชิ้น
                          </span>
                          <span aria-hidden="true">·</span>
                          <span className="font-mono tabular-nums">
                            กำหนดคืน {formatThaiDate(booking.dueDate)}
                          </span>
                        </div>
                        <h3 className="text-sm font-semibold text-slate-900">
                          {booking.equipmentName}
                        </h3>
                        <p className="text-xs text-slate-700">
                          ผู้ยืม: <span className="font-medium">{booking.userName}</span>{' '}
                          {booking.userStudentId && (
                            <span className="font-mono text-slate-500">
                              ({booking.userStudentId})
                            </span>
                          )}
                          {booking.userPhone ? ` · โทร ${booking.userPhone}` : ''}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => onOpenReturnModal(booking)}
                      className="inline-flex items-center justify-center gap-2 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-emerald-700 hover:bg-emerald-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                    >
                      <ClipboardCheck className="w-4 h-4" />
                      <span>บันทึกการคืน</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Section 2: Full History Table */}
      {activeSection === 'history' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={historySearch}
                onChange={(e) => setHistorySearch(e.target.value)}
                placeholder="ค้นหาชื่อผู้ยืม รหัสนักศึกษา หรือรหัสอุปกรณ์..."
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <select
              value={historyStatus}
              onChange={(e) =>
                setHistoryStatus(e.target.value as 'ทั้งหมด' | BookingStatus)
              }
              className="px-3.5 py-2 text-sm bg-white border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
            >
              <option value="ทั้งหมด">สถานะทั้งหมด</option>
              <option value="รออนุมัติ">รออนุมัติ</option>
              <option value="กำลังยืม">กำลังยืม</option>
              <option value="คืนแล้ว">คืนแล้ว</option>
              <option value="ถูกปฏิเสธ">ถูกปฏิเสธ</option>
              <option value="ยกเลิกแล้ว">ยกเลิกแล้ว</option>
            </select>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">อุปกรณ์</th>
                  <th className="py-3 px-4">ผู้ยืม</th>
                  <th className="py-3 px-4 text-right">จำนวน</th>
                  <th className="py-3 px-4">ช่วงเวลายืม-คืน</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4">หมายเหตุ / สภาพคืน</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredHistory.length === 0 ? (
                  <tr>
                    <td
                      colSpan={6}
                      className="py-10 text-center text-sm text-slate-500"
                    >
                      ไม่พบประวัติการยืม-คืนที่ตรงกับเงื่อนไข
                    </td>
                  </tr>
                ) : (
                  filteredHistory.map((row) => (
                    <tr key={row.id} className="hover:bg-slate-50/70">
                      <td className="py-3 px-4">
                        <p className="font-medium text-slate-900">
                          {row.equipmentName}
                        </p>
                        <p className="text-xs font-mono text-slate-500">
                          {row.equipmentCode}
                        </p>
                      </td>
                      <td className="py-3 px-4">
                        <p className="text-slate-900 font-medium">{row.userName}</p>
                        <p className="text-xs text-slate-500">
                          {row.userStudentId ? `${row.userStudentId} · ` : ''}
                          {row.userEmail}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800">
                        {row.quantity}
                      </td>
                      <td className="py-3 px-4 font-mono tabular-nums text-xs text-slate-600 whitespace-nowrap">
                        {formatThaiDate(row.borrowDate)} –{' '}
                        {formatThaiDate(row.dueDate)}
                        {row.returnedAt && (
                          <div className="text-emerald-700 mt-0.5">
                            คืนจริง: {formatThaiDateTime(row.returnedAt)}
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        <BookingStatusCell status={row.status} />
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-600 max-w-xs">
                        {row.returnCondition
                          ? `${row.returnCondition}${row.returnNote ? ` (${row.returnNote})` : ''}`
                          : row.rejectReason || row.purpose}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 3: Equipment CRUD */}
      {activeSection === 'equipment' && (
        <div className="bg-white border border-slate-200 rounded-xl overflow-hidden">
          <div className="p-4 sm:p-5 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="search"
                value={equipSearch}
                onChange={(e) => setEquipSearch(e.target.value)}
                placeholder="ค้นหารหัสอุปกรณ์ ชื่ออุปกรณ์ หรือหมวดหมู่..."
                className="w-full pl-9 pr-3.5 py-2 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white"
              />
            </div>

            <button
              type="button"
              onClick={onOpenAddEquipment}
              className="inline-flex items-center justify-center gap-1.5 px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>เพิ่มอุปกรณ์</span>
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
                  <th className="py-3 px-4">อุปกรณ์</th>
                  <th className="py-3 px-4">หมวดหมู่</th>
                  <th className="py-3 px-4 text-right">คงเหลือ / ทั้งหมด</th>
                  <th className="py-3 px-4">สถานะ</th>
                  <th className="py-3 px-4 text-right">จัดการ</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-sm">
                {filteredEquipment.map((item) => (
                  <tr key={item.id} className="hover:bg-slate-50/70">
                    <td className="py-3 px-4">
                      <div className="flex items-center gap-3">
                        <div className="w-14 h-11 rounded-md overflow-hidden border border-slate-200 bg-slate-100 shrink-0">
                          <EquipmentImage
                            src={item.imageUrl}
                            alt={item.name}
                            category={item.category}
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="font-semibold text-slate-900 truncate max-w-xs">
                            {item.name}
                          </p>
                          <p className="text-xs font-mono text-blue-700">
                            {item.code}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="py-3 px-4 text-slate-700 whitespace-nowrap">
                      {item.category}
                    </td>
                    <td className="py-3 px-4 text-right font-mono tabular-nums text-slate-800 whitespace-nowrap">
                      {item.availableQty} / {item.totalQty}
                    </td>
                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`text-xs font-semibold ${
                          item.status === 'พร้อมใช้งาน'
                            ? 'text-emerald-700'
                            : item.status === 'ชำรุด/ซ่อมบำรุง'
                            ? 'text-amber-700'
                            : 'text-rose-700'
                        }`}
                      >
                        {item.status}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      {confirmDeleteId === item.id ? (
                        <div className="inline-flex items-center gap-2">
                          <button
                            type="button"
                            disabled={busyId === item.id}
                            onClick={() => handleConfirmDeleteEquipment(item.id)}
                            className="px-2.5 py-1.5 text-xs font-medium text-white bg-rose-600 hover:bg-rose-700 rounded-md cursor-pointer"
                          >
                            ยืนยันลบ
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(null)}
                            className="px-2.5 py-1.5 text-xs font-medium text-slate-600 bg-slate-100 hover:bg-slate-200 rounded-md cursor-pointer"
                          >
                            ยกเลิก
                          </button>
                        </div>
                      ) : (
                        <div className="inline-flex items-center gap-1.5">
                          <button
                            type="button"
                            onClick={() => onOpenEditEquipment(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Edit3 className="w-3.5 h-3.5" />
                            <span>แก้ไข</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => setConfirmDeleteId(item.id)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 rounded-md transition-colors cursor-pointer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>ลบ</span>
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Section 4: Admin Role Management */}
      {activeSection === 'admins' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="bg-white border border-slate-200 rounded-xl p-6 space-y-4">
            <div className="flex items-center gap-2.5">
              <UserPlus className="w-5 h-5 text-blue-700" />
              <h2 className="text-base font-semibold text-slate-900">
                เพิ่มอีเมลผู้ดูแลระบบ
              </h2>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed">
              ผู้ใช้อีเมล Google ที่ได้รับสิทธิ์ Admin จะสามารถเพิ่ม/แก้ไขอุปกรณ์ อนุมัติคำขอยืม-คืน และดูรายงานทั้งหมดได้ทันทีเมื่อเข้าสู่ระบบ
            </p>
            <form onSubmit={handleAddAdminSubmit} className="space-y-3">
              <div>
                <label
                  htmlFor="new-admin-email"
                  className="block text-xs font-medium text-slate-700 mb-1"
                >
                  อีเมล Google Account
                </label>
                <input
                  id="new-admin-email"
                  type="email"
                  required
                  value={newAdminEmail}
                  onChange={(e) => setNewAdminEmail(e.target.value)}
                  placeholder="staff@university.ac.th"
                  className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600"
                />
              </div>

              {adminError && (
                <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                  {adminError}
                </p>
              )}

              <button
                type="submit"
                disabled={busyId === 'add-admin'}
                className="w-full py-2.5 px-4 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                {busyId === 'add-admin' ? 'กำลังเพิ่มสิทธิ์...' : 'เพิ่มเป็นผู้ดูแลระบบ'}
              </button>
            </form>
          </div>

          <div className="lg:col-span-2 bg-white border border-slate-200 rounded-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-slate-100 bg-blue-50/30">
              <h2 className="text-base font-semibold text-slate-900">
                รายชื่อผู้ดูแลระบบในปัจจุบัน
              </h2>
            </div>
            <div className="divide-y divide-slate-100">
              {admins.map((entry) => (
                <div
                  key={entry.email}
                  className="px-6 py-4 flex items-center justify-between gap-4"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-blue-50 text-blue-700 flex items-center justify-center shrink-0">
                      <ShieldCheck className="w-5 h-5" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-mono font-medium text-slate-900 truncate">
                        {entry.email}
                      </p>
                      <p className="text-xs text-slate-500">
                        {entry.isOwner
                          ? 'เจ้าของระบบหลัก (ไม่สามารถถอดสิทธิ์ได้)'
                          : `เพิ่มโดย ${entry.addedBy} · ${formatThaiDate(entry.addedAt)}`}
                      </p>
                    </div>
                  </div>

                  {!entry.isOwner && (
                    <button
                      type="button"
                      disabled={busyId === `rm-${entry.email}`}
                      onClick={() => handleRemoveAdminClick(entry.email)}
                      className="px-3 py-1.5 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer disabled:opacity-50"
                    >
                      ถอดสิทธิ์
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </section>
  );
}
