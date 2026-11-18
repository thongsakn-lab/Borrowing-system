import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  CheckCircle2,
  LogOut,
  Menu,
  Search,
  ShieldCheck,
  User,
  X,
  XCircle,
} from 'lucide-react';
import type {
  AppStateResponse,
  BookingRecord,
  EquipmentCategory,
  EquipmentItem,
  EquipmentStatus,
  ReturnCondition,
} from './types';
import {
  addAdminEmail,
  approveBooking,
  cancelBooking,
  createBooking,
  createEquipment,
  deleteEquipment,
  EQUIPMENT_CATEGORIES,
  fetchState,
  rejectBooking,
  removeAdminEmail,
  returnBooking,
  signInWithGoogleAccount,
  subscribeRealtimeUpdates,
  updateEquipment,
  updateProfile,
} from './lib/api';
import { EquipmentImage } from './components/EquipmentImage';
import { GoogleSignInModal } from './components/GoogleSignInModal';
import { ProfileModal } from './components/ProfileModal';
import { EquipmentDetailModal } from './components/EquipmentDetailModal';
import { EquipmentFormModal } from './components/EquipmentFormModal';
import { ReturnCheckModal } from './components/ReturnCheckModal';
import { MyBookingsView } from './components/MyBookingsView';
import {
  AdminDashboardView,
  type AdminSection,
} from './components/AdminDashboardView';

type MainTab = 'catalog' | 'my-bookings' | 'admin';

const SESSION_EMAIL_KEY = 'edtech_borrowing_user_email';

export default function App() {
  const [userEmail, setUserEmail] = useState<string | null>(() => {
    try {
      return localStorage.getItem(SESSION_EMAIL_KEY);
    } catch {
      return null;
    }
  });
  const [appState, setAppState] = useState<AppStateResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorBanner, setErrorBanner] = useState<string | null>(null);
  const [toast, setToast] = useState<{
    message: string;
    tone: 'success' | 'error';
  } | null>(null);

  // Navigation & Filters
  const [activeTab, setActiveTab] = useState<MainTab>('catalog');
  const [adminSection, setAdminSection] = useState<AdminSection>('requests');
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<'ทั้งหมด' | EquipmentCategory>('ทั้งหมด');
  const [onlyAvailable, setOnlyAvailable] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Modals
  const [signInModalOpen, setSignInModalOpen] = useState(false);
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [isFirstLoginPrompt, setIsFirstLoginPrompt] = useState(false);
  const [selectedEquipment, setSelectedEquipment] = useState<EquipmentItem | null>(
    null
  );
  const [equipFormOpen, setEquipFormOpen] = useState(false);
  const [editingEquipment, setEditingEquipment] = useState<EquipmentItem | null>(
    null
  );
  const [returningBooking, setReturningBooking] = useState<BookingRecord | null>(
    null
  );

  const showToast = useCallback(
    (message: string, tone: 'success' | 'error' = 'success') => {
      setToast({ message, tone });
      setTimeout(() => {
        setToast((prev) => (prev?.message === message ? null : prev));
      }, 4000);
    },
    []
  );

  const loadState = useCallback(async (emailOverride?: string | null) => {
    const emailToUse = emailOverride !== undefined ? emailOverride : userEmail;
    try {
      const data = await fetchState(emailToUse);
      setAppState(data);
      setErrorBanner(null);
    } catch (err) {
      setErrorBanner(
        err instanceof Error ? err.message : 'ไม่สามารถโหลดข้อมูลระบบได้'
      );
    } finally {
      setLoading(false);
    }
  }, [userEmail]);

  useEffect(() => {
    loadState();
  }, [loadState]);

  // Real-time availability synchronization across devices/tabs
  useEffect(() => {
    return subscribeRealtimeUpdates(() => {
      loadState();
    });
  }, [loadState]);

  const currentUser = appState?.currentUser || null;
  const role = appState?.role || null;
  const isAdmin = role === 'admin';

  // Keep selectedEquipment synchronized with live state updates
  const liveSelectedEquipment = useMemo(() => {
    if (!selectedEquipment || !appState) return selectedEquipment;
    return (
      appState.equipment.find((e) => e.id === selectedEquipment.id) ||
      selectedEquipment
    );
  }, [selectedEquipment, appState]);

  const filteredEquipment = useMemo(() => {
    const list = appState?.equipment || [];
    const q = searchQuery.trim().toLowerCase();
    return list.filter((item) => {
      const matchCat =
        selectedCategory === 'ทั้งหมด' || item.category === selectedCategory;
      const matchAvail =
        !onlyAvailable ||
        (item.status === 'พร้อมใช้งาน' && item.availableQty > 0);
      const matchQuery =
        !q ||
        item.name.toLowerCase().includes(q) ||
        item.code.toLowerCase().includes(q) ||
        item.description.toLowerCase().includes(q) ||
        item.category.toLowerCase().includes(q);
      return matchCat && matchAvail && matchQuery;
    });
  }, [appState?.equipment, searchQuery, selectedCategory, onlyAvailable]);

  async function handleGoogleSignIn(payload: { email: string; name: string }) {
    const res = await signInWithGoogleAccount(payload);
    const normalized = res.user?.email || payload.email.toLowerCase();
    try {
      localStorage.setItem(SESSION_EMAIL_KEY, normalized);
    } catch {
      // Ignore storage failures
    }
    setUserEmail(normalized);
    setAppState(res.state);
    if (res.isNewUser) {
      setIsFirstLoginPrompt(true);
      setProfileModalOpen(true);
      showToast('สร้างบัญชีผู้ใช้เรียบร้อย กรุณากรอกข้อมูลติดต่อเพิ่มเติม');
    } else {
      showToast(`ยินดีต้อนรับคุณ ${res.user?.name || normalized}`);
    }
  }

  function handleSignOut() {
    try {
      localStorage.removeItem(SESSION_EMAIL_KEY);
    } catch {
      // Ignore
    }
    setUserEmail(null);
    setActiveTab('catalog');
    loadState(null);
    showToast('ออกจากระบบเรียบร้อยแล้ว');
  }

  async function handleSaveProfile(payload: {
    name: string;
    phone: string;
    studentId: string;
    affiliation: string;
    avatarUrl: string;
  }) {
    if (!userEmail) return;
    const res = await updateProfile(userEmail, payload);
    setAppState(res.state);
    setIsFirstLoginPrompt(false);
    showToast('บันทึกข้อมูลโปรไฟล์เรียบร้อยแล้ว');
  }

  async function handleCreateBooking(payload: {
    equipmentId: string;
    quantity: number;
    borrowDate: string;
    dueDate: string;
    purpose: string;
  }) {
    if (!userEmail) {
      setSignInModalOpen(true);
      return;
    }
    const res = await createBooking(userEmail, payload);
    setAppState(res.state);
    showToast('ส่งคำขอจองอุปกรณ์เรียบร้อยแล้ว สถานะ: รออนุมัติ');
  }

  async function handleCancelBooking(id: string) {
    if (!userEmail) return;
    const res = await cancelBooking(userEmail, id);
    setAppState(res.state);
    showToast('ยกเลิกคำขอจองเรียบร้อยแล้ว');
  }

  async function handleSaveEquipment(payload: {
    code: string;
    name: string;
    category: EquipmentCategory;
    totalQty: number;
    availableQty: number;
    status: EquipmentStatus;
    imageUrl: string;
    description: string;
  }) {
    if (!userEmail) return;
    if (editingEquipment) {
      const res = await updateEquipment(userEmail, editingEquipment.id, payload);
      setAppState(res.state);
      showToast('แก้ไขข้อมูลอุปกรณ์เรียบร้อยแล้ว');
    } else {
      const res = await createEquipment(userEmail, payload);
      setAppState(res.state);
      showToast('เพิ่มอุปกรณ์ใหม่เข้าสู่ระบบเรียบร้อยแล้ว');
    }
  }

  async function handleDeleteEquipment(id: string) {
    if (!userEmail) return;
    try {
      const res = await deleteEquipment(userEmail, id);
      setAppState(res.state);
      showToast('ลบข้อมูลอุปกรณ์เรียบร้อยแล้ว');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'ไม่สามารถลบอุปกรณ์ได้',
        'error'
      );
    }
  }

  async function handleApproveBooking(id: string) {
    if (!userEmail) return;
    try {
      const res = await approveBooking(userEmail, id);
      setAppState(res.state);
      showToast('อนุมัติการยืมและตัดยอดอุปกรณ์คงเหลือเรียบร้อยแล้ว');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'ไม่สามารถอนุมัติคำขอได้',
        'error'
      );
    }
  }

  async function handleRejectBooking(id: string, reason: string) {
    if (!userEmail) return;
    try {
      const res = await rejectBooking(userEmail, id, reason);
      setAppState(res.state);
      showToast('ปฏิเสธคำขอจองเรียบร้อยแล้ว');
    } catch (err) {
      showToast(
        err instanceof Error ? err.message : 'ไม่สามารถปฏิเสธคำขอได้',
        'error'
      );
    }
  }

  async function handleConfirmReturn(payload: {
    returnCondition: ReturnCondition;
    returnNote: string;
    markMaintenance: boolean;
  }) {
    if (!userEmail || !returningBooking) return;
    const res = await returnBooking(userEmail, returningBooking.id, payload);
    setAppState(res.state);
    showToast('บันทึกการคืนและปรับยอดอุปกรณ์คงเหลือเรียบร้อยแล้ว');
  }

  async function handleAddAdmin(email: string) {
    if (!userEmail) return;
    const res = await addAdminEmail(userEmail, email);
    setAppState(res.state);
    showToast(`เพิ่มสิทธิ์ผู้ดูแลระบบให้ ${email} เรียบร้อยแล้ว`);
  }

  async function handleRemoveAdmin(email: string) {
    if (!userEmail) return;
    const res = await removeAdminEmail(userEmail, email);
    setAppState(res.state);
    showToast(`ถอดสิทธิ์ผู้ดูแลระบบของ ${email} แล้ว`);
  }

  return (
    <div className="min-h-screen flex flex-col bg-slate-50 text-slate-900">
      {/* Top Navigation Bar (Strict 3-Zone Contract) */}
      <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-sm border-b border-slate-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between gap-8">
          {/* Zone 1: Single-line Brand Wordmark */}
          <button
            type="button"
            onClick={() => {
              setActiveTab('catalog');
              setMobileMenuOpen(false);
            }}
            className="text-base sm:text-lg font-bold tracking-tight text-blue-900 whitespace-nowrap shrink-0 cursor-pointer"
          >
            ระบบยืม-คืนอุปกรณ์ EdTech
          </button>

          {/* Zone 2: Clean Single-Line Navigation Links */}
          <nav
            className="hidden md:flex items-center gap-6 text-sm font-medium"
            aria-label="เมนูหลัก"
          >
            <button
              type="button"
              onClick={() => setActiveTab('catalog')}
              className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'catalog'
                  ? 'border-blue-700 text-blue-700 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              รายการอุปกรณ์
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('my-bookings')}
              className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                activeTab === 'my-bookings'
                  ? 'border-blue-700 text-blue-700 font-semibold'
                  : 'border-transparent text-slate-600 hover:text-slate-900'
              }`}
            >
              การจองของฉัน
            </button>
            {isAdmin && (
              <>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('admin');
                    setAdminSection('requests');
                  }}
                  className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'admin' && adminSection === 'requests'
                      ? 'border-blue-700 text-blue-700 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  อนุมัติและรับคืน
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setActiveTab('admin');
                    setAdminSection('equipment');
                  }}
                  className={`py-1.5 border-b-2 transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    activeTab === 'admin' && adminSection !== 'requests'
                      ? 'border-blue-700 text-blue-700 font-semibold'
                      : 'border-transparent text-slate-600 hover:text-slate-900'
                  }`}
                >
                  จัดการระบบ
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Single Primary Account Action */}
          <div className="flex items-center gap-2 shrink-0">
            {currentUser ? (
              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setIsFirstLoginPrompt(false);
                    setProfileModalOpen(true);
                  }}
                  className="inline-flex items-center gap-2 px-3 py-1.5 text-sm font-medium text-slate-800 bg-blue-50 hover:bg-blue-100 border border-blue-200 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
                >
                  {isAdmin ? (
                    <ShieldCheck className="w-4 h-4 text-blue-700 shrink-0" />
                  ) : (
                    <User className="w-4 h-4 text-blue-700 shrink-0" />
                  )}
                  <span className="max-w-[140px] truncate">{currentUser.name}</span>
                </button>
                <button
                  type="button"
                  onClick={handleSignOut}
                  className="hidden sm:inline-flex p-2 text-slate-500 hover:text-rose-700 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                  title="ออกจากระบบ"
                  aria-label="ออกจากระบบ"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setSignInModalOpen(true)}
                className="px-4 py-2 text-xs sm:text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer"
              >
                เข้าสู่ระบบ Google
              </button>
            )}

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg"
              aria-label="เปิดเมนูนำทาง"
            >
              {mobileMenuOpen ? (
                <X className="w-5 h-5" />
              ) : (
                <Menu className="w-5 h-5" />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-slate-200 bg-white px-4 py-3 space-y-1">
            <button
              type="button"
              onClick={() => {
                setActiveTab('catalog');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                activeTab === 'catalog'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              รายการอุปกรณ์
            </button>
            <button
              type="button"
              onClick={() => {
                setActiveTab('my-bookings');
                setMobileMenuOpen(false);
              }}
              className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                activeTab === 'my-bookings'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-slate-700 hover:bg-slate-50'
              }`}
            >
              การจองของฉัน
            </button>
            {isAdmin && (
              <button
                type="button"
                onClick={() => {
                  setActiveTab('admin');
                  setMobileMenuOpen(false);
                }}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium ${
                  activeTab === 'admin'
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-slate-700 hover:bg-slate-50'
                }`}
              >
                จัดการระบบ (Admin)
              </button>
            )}
            {currentUser && (
              <button
                type="button"
                onClick={() => {
                  handleSignOut();
                  setMobileMenuOpen(false);
                }}
                className="w-full text-left px-3 py-2.5 rounded-lg text-sm font-medium text-rose-700 hover:bg-rose-50"
              >
                ออกจากระบบ
              </button>
            )}
          </div>
        )}
      </header>

      {/* Toast Notification */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-xl shadow-lg border text-sm font-medium flex items-center gap-2.5 ${
            toast.tone === 'error'
              ? 'bg-rose-50 border-rose-200 text-rose-800'
              : 'bg-white border-blue-200 text-slate-900'
          }`}
        >
          {toast.tone === 'error' ? (
            <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
          ) : (
            <CheckCircle2 className="w-4 h-4 text-blue-700 shrink-0" />
          )}
          <span>{toast.message}</span>
        </div>
      )}

      {/* Main Content */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-8">
        {errorBanner && (
          <div className="mb-6 p-4 rounded-xl bg-rose-50 border border-rose-200 text-sm text-rose-800 flex items-center justify-between gap-4">
            <span>{errorBanner}</span>
            <button
              type="button"
              onClick={() => loadState()}
              className="px-3 py-1.5 text-xs font-medium bg-white border border-rose-200 rounded-lg hover:bg-rose-100 cursor-pointer shrink-0"
            >
              ลองใหม่
            </button>
          </div>
        )}

        {activeTab === 'catalog' && (
          <div className="space-y-8">
            {/* Hero / Department Banner */}
            <section className="bg-gradient-to-br from-blue-900 via-blue-800 to-blue-700 text-white rounded-2xl p-6 sm:p-10">
              <div className="flex flex-col lg:flex-row lg:items-end justify-between gap-6">
                <div className="max-w-2xl space-y-3">
                  <p className="text-xs sm:text-sm font-medium text-blue-100">
                    ภาควิชาเทคโนโลยีการศึกษา · ศูนย์บริการโสตทัศนูปกรณ์กลาง
                  </p>
                  <h1 className="text-2xl sm:text-4xl font-bold leading-tight text-balance">
                    ระบบยืม-คืนอุปกรณ์เพื่อการผลิตสื่อและการเรียนการสอน
                  </h1>
                  <p className="text-sm sm:text-base text-blue-100 leading-relaxed">
                    ตรวจสอบสถานะความพร้อมของกล้อง ไมโครโฟน ขาตั้งกล้อง โปรเจกเตอร์ และชุดไฟสตูดิโอแบบเรียลไทม์ พร้อมส่งคำขอจองออนไลน์ได้ทันที
                  </p>
                </div>

                {appState && (
                  <div className="grid grid-cols-2 gap-4 bg-white/10 border border-white/15 rounded-xl p-4 shrink-0">
                    <div>
                      <p className="text-xs text-blue-100">อุปกรณ์พร้อมให้ยืม</p>
                      <p className="text-2xl font-bold tabular-nums mt-0.5">
                        {appState.stats.availableUnits}{' '}
                        <span className="text-xs font-normal text-blue-100">
                          / {appState.stats.totalUnits} ชิ้น
                        </span>
                      </p>
                    </div>
                    <div>
                      <p className="text-xs text-blue-100">รายการอุปกรณ์ทั้งหมด</p>
                      <p className="text-2xl font-bold tabular-nums mt-0.5">
                        {appState.stats.totalEquipmentTypes}{' '}
                        <span className="text-xs font-normal text-blue-100">หมวดรายการ</span>
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </section>

            {/* Search & Category Filter Bar */}
            <section className="space-y-4">
              <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                <div className="relative flex-1 max-w-lg">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
                  <input
                    type="search"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="ค้นหาชื่ออุปกรณ์ รหัสอุปกรณ์ หรือรายละเอียด..."
                    className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-600"
                  />
                </div>

                <label className="inline-flex items-center gap-2 text-sm text-slate-700 cursor-pointer select-none">
                  <input
                    type="checkbox"
                    checked={onlyAvailable}
                    onChange={(e) => setOnlyAvailable(e.target.checked)}
                    className="w-4 h-4 accent-blue-700 rounded"
                  />
                  <span>แสดงเฉพาะอุปกรณ์ที่ว่างอยู่</span>
                </label>
              </div>

              {/* Interactive Category Filter Segmented Controls */}
              <div className="flex items-center gap-1.5 p-1 bg-slate-100 border border-slate-200 rounded-xl overflow-x-auto">
                <button
                  type="button"
                  onClick={() => setSelectedCategory('ทั้งหมด')}
                  className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                    selectedCategory === 'ทั้งหมด'
                      ? 'bg-white text-blue-700 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  ทั้งหมด
                </button>
                {EQUIPMENT_CATEGORIES.map((category) => (
                  <button
                    key={category}
                    type="button"
                    onClick={() => setSelectedCategory(category)}
                    className={`px-3.5 py-2 text-xs sm:text-sm font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                      selectedCategory === category
                        ? 'bg-white text-blue-700 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {category}
                  </button>
                ))}
              </div>
            </section>

            {/* Equipment Catalog Grid */}
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {[1, 2, 3].map((n) => (
                  <div
                    key={n}
                    className="bg-white border border-slate-200 rounded-xl overflow-hidden animate-pulse"
                  >
                    <div className="aspect-[4/3] bg-slate-200" />
                    <div className="p-5 space-y-3">
                      <div className="h-3 bg-slate-200 rounded w-1/3" />
                      <div className="h-5 bg-slate-200 rounded w-3/4" />
                      <div className="h-4 bg-slate-100 rounded w-full" />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredEquipment.length === 0 ? (
              <div className="bg-white border border-slate-200 rounded-xl p-12 text-center">
                <p className="text-base font-semibold text-slate-900">
                  ไม่พบอุปกรณ์ที่ตรงกับคำค้นหาหรือหมวดหมู่ที่เลือก
                </p>
                <p className="text-sm text-slate-500 mt-1">
                  ลองเปลี่ยนคำค้นหาหรือเลือกดูหมวดหมู่ "ทั้งหมด"
                </p>
                <button
                  type="button"
                  onClick={() => {
                    setSearchQuery('');
                    setSelectedCategory('ทั้งหมด');
                    setOnlyAvailable(false);
                  }}
                  className="mt-4 px-4 py-2 text-sm font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 rounded-lg transition-colors cursor-pointer"
                >
                  ล้างตัวกรองทั้งหมด
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {filteredEquipment.map((item) => {
                  const isAvailable =
                    item.status === 'พร้อมใช้งาน' && item.availableQty > 0;
                  return (
                    <article
                      key={item.id}
                      className="bg-white border border-slate-200 rounded-xl overflow-hidden flex flex-col justify-between hover:border-blue-300 transition-colors"
                    >
                      <div>
                        <div className="aspect-[4/3] w-full bg-slate-100 border-b border-slate-100 overflow-hidden">
                          <EquipmentImage
                            src={item.imageUrl}
                            alt={item.name}
                            category={item.category}
                          />
                        </div>

                        <div className="p-5 space-y-2.5">
                          {/* Clean Unboxed Metadata */}
                          <div className="flex items-center justify-between gap-2 text-xs text-slate-500">
                            <span className="font-mono text-blue-700 truncate">
                              {item.code}
                            </span>
                            <span className="shrink-0">{item.category}</span>
                          </div>

                          <h2 className="text-base font-semibold text-slate-900 leading-snug line-clamp-2">
                            {item.name}
                          </h2>

                          <p className="text-sm text-slate-600 leading-relaxed line-clamp-2">
                            {item.description || 'อุปกรณ์มาตรฐานสำหรับงานผลิตสื่อการสอน'}
                          </p>
                        </div>
                      </div>

                      <div className="px-5 pb-5 pt-3 border-t border-slate-100 flex items-center justify-between gap-3">
                        <div className="flex items-center gap-1.5 text-xs">
                          {isAvailable ? (
                            <>
                              <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                              <span className="font-semibold text-emerald-700">
                                ว่าง
                              </span>
                              <span className="text-slate-500 font-mono tabular-nums">
                                ({item.availableQty}/{item.totalQty})
                              </span>
                            </>
                          ) : (
                            <>
                              <XCircle className="w-4 h-4 text-rose-600 shrink-0" />
                              <span className="font-semibold text-rose-700">
                                ไม่ว่าง
                              </span>
                              <span className="text-slate-500 font-mono tabular-nums">
                                ({item.availableQty}/{item.totalQty})
                              </span>
                            </>
                          )}
                        </div>

                        <button
                          type="button"
                          onClick={() => setSelectedEquipment(item)}
                          className={`px-3.5 py-2 text-xs font-medium rounded-lg transition-colors whitespace-nowrap shrink-0 cursor-pointer ${
                            isAvailable
                              ? 'text-white bg-blue-700 hover:bg-blue-800'
                              : 'text-slate-700 bg-slate-100 hover:bg-slate-200'
                          }`}
                        >
                          {isAvailable ? 'ดูรายละเอียดและจอง' : 'ดูรายละเอียด'}
                        </button>
                      </div>
                    </article>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {activeTab === 'my-bookings' && (
          <MyBookingsView
            currentUser={currentUser}
            bookings={appState?.myBookings || []}
            onRequireSignIn={() => setSignInModalOpen(true)}
            onCancelBooking={handleCancelBooking}
            onBrowseEquipment={() => setActiveTab('catalog')}
          />
        )}

        {activeTab === 'admin' && isAdmin && appState && (
          <AdminDashboardView
            activeSection={adminSection}
            onChangeSection={setAdminSection}
            stats={appState.stats}
            equipment={appState.equipment}
            bookings={appState.bookings}
            admins={appState.admins}
            onOpenAddEquipment={() => {
              setEditingEquipment(null);
              setEquipFormOpen(true);
            }}
            onOpenEditEquipment={(item) => {
              setEditingEquipment(item);
              setEquipFormOpen(true);
            }}
            onDeleteEquipment={handleDeleteEquipment}
            onApproveBooking={handleApproveBooking}
            onRejectBooking={handleRejectBooking}
            onOpenReturnModal={(booking) => setReturningBooking(booking)}
            onAddAdmin={handleAddAdmin}
            onRemoveAdmin={handleRemoveAdmin}
          />
        )}
      </main>

      {/* Clean Minimal Footer */}
      <footer className="border-t border-slate-200 bg-white mt-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <p>
            ระบบยืม-คืนอุปกรณ์ ภาควิชาเทคโนโลยีการศึกษา (Educational Technology Equipment Borrowing System)
          </p>
          <p>ติดต่อเคาน์เตอร์บริการโสตทัศนูปกรณ์ ในวันและเวลาราชการ</p>
        </div>
      </footer>

      {/* Modals */}
      <GoogleSignInModal
        isOpen={signInModalOpen}
        onClose={() => setSignInModalOpen(false)}
        onSignIn={handleGoogleSignIn}
      />

      <ProfileModal
        isOpen={profileModalOpen}
        user={currentUser}
        role={role}
        isFirstLoginPrompt={isFirstLoginPrompt}
        onClose={() => {
          setProfileModalOpen(false);
          setIsFirstLoginPrompt(false);
        }}
        onSave={handleSaveProfile}
      />

      <EquipmentDetailModal
        equipment={liveSelectedEquipment}
        currentUser={currentUser}
        onClose={() => setSelectedEquipment(null)}
        onRequireSignIn={() => setSignInModalOpen(true)}
        onSubmitBooking={handleCreateBooking}
      />

      {isAdmin && userEmail && (
        <EquipmentFormModal
          isOpen={equipFormOpen}
          editingItem={editingEquipment}
          adminEmail={userEmail}
          onClose={() => {
            setEquipFormOpen(false);
            setEditingEquipment(null);
          }}
          onSave={handleSaveEquipment}
        />
      )}

      <ReturnCheckModal
        booking={returningBooking}
        onClose={() => setReturningBooking(null)}
        onConfirmReturn={handleConfirmReturn}
      />
    </div>
  );
}
