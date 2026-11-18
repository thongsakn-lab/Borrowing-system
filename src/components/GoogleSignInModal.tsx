import { useState, type FormEvent } from 'react';
import { ShieldCheck, User, X } from 'lucide-react';

interface GoogleSignInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSignIn: (payload: { email: string; name: string }) => Promise<void>;
}

export function GoogleSignInModal({
  isOpen,
  onClose,
  onSignIn,
}: GoogleSignInModalProps) {
  const [email, setEmail] = useState('');
  const [name, setName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');

  if (!isOpen) return null;

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError('');
    if (!email.trim()) {
      setError('กรุณากรอกอีเมล Google Account ของคุณ');
      return;
    }
    setSubmitting(true);
    try {
      await onSignIn({ email: email.trim(), name: name.trim() });
      setEmail('');
      setName('');
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  async function handleQuickSelect(presetEmail: string, presetName: string) {
    setError('');
    setSubmitting(true);
    try {
      await onSignIn({ email: presetEmail, name: presetName });
      onClose();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'เข้าสู่ระบบไม่สำเร็จ');
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 backdrop-blur-[2px] p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="google-signin-title"
    >
      <div className="w-full max-w-md bg-white border border-slate-200 rounded-xl shadow-xl overflow-hidden">
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-100 bg-blue-50/40">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-lg bg-white border border-slate-200 shadow-xs">
              <svg className="w-4 h-4" viewBox="0 0 24 24" aria-hidden="true">
                <path
                  fill="#4285F4"
                  d="M23.745 12.27c0-.7-.06-1.4-.19-2.07H12v4.51h6.6c-.29 1.52-1.14 2.82-2.4 3.68v3.05h3.88c2.27-2.09 3.665-5.17 3.665-9.17z"
                />
                <path
                  fill="#34A853"
                  d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.88-3.05c-1.08.72-2.45 1.16-4.05 1.16-3.12 0-5.77-2.11-6.72-4.96H1.29v3.14C3.26 21.3 7.31 24 12 24z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.28 14.24c-.24-.72-.38-1.49-.38-2.24s.14-1.52.38-2.24V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.99-3.14z"
                />
                <path
                  fill="#EA4335"
                  d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.99 3.14c.95-2.85 3.6-4.96 6.72-4.96z"
                />
              </svg>
            </span>
            <div>
              <h2
                id="google-signin-title"
                className="text-base font-semibold text-slate-900"
              >
                เข้าสู่ระบบด้วยบัญชี Google
              </h2>
              <p className="text-xs text-slate-500">
                ภาควิชาเทคโนโลยีการศึกษา
              </p>
            </div>
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

        <div className="p-6 space-y-5">
          <div>
            <p className="text-xs font-medium text-slate-500 mb-2.5">
              เลือกบัญชีเพื่อเข้าใช้งานทันที
            </p>
            <div className="space-y-2">
              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  handleQuickSelect(
                    'nichanatnicha1102@gmail.com',
                    'ผู้ดูแลระบบ ภาควิชาเทคโนโลยีการศึกษา'
                  )
                }
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-blue-50/70 hover:bg-blue-50 border border-blue-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                    <ShieldCheck className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      เจ้าของระบบ (ผู้ดูแลระบบหลัก)
                    </p>
                    <p className="text-xs text-blue-700 font-mono truncate">
                      nichanatnicha1102@gmail.com
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-blue-700 whitespace-nowrap shrink-0">
                  Admin
                </span>
              </button>

              <button
                type="button"
                disabled={submitting}
                onClick={() =>
                  handleQuickSelect('somchai.edtech@university.ac.th', 'สมชาย ใจดี')
                }
                className="w-full flex items-center justify-between gap-3 px-4 py-3 text-left bg-white hover:bg-slate-50 border border-slate-200 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-9 h-9 rounded-full bg-slate-100 text-slate-600 flex items-center justify-center shrink-0">
                    <User className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900 truncate">
                      สมชาย ใจดี (นักศึกษา)
                    </p>
                    <p className="text-xs text-slate-500 font-mono truncate">
                      somchai.edtech@university.ac.th
                    </p>
                  </div>
                </div>
                <span className="text-xs font-medium text-slate-600 whitespace-nowrap shrink-0">
                  User
                </span>
              </button>
            </div>
          </div>

          <div className="relative flex items-center py-1">
            <div className="flex-grow border-t border-slate-200" />
            <span className="px-3 text-xs text-slate-400">
              หรือระบุอีเมล Google Account อื่น
            </span>
            <div className="flex-grow border-t border-slate-200" />
          </div>

          <form onSubmit={handleSubmit} className="space-y-3.5">
            <div>
              <label
                htmlFor="signin-email"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                อีเมล Google / มหาวิทยาลัย
              </label>
              <input
                id="signin-email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@gmail.com"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            <div>
              <label
                htmlFor="signin-name"
                className="block text-xs font-medium text-slate-700 mb-1.5"
              >
                ชื่อ-นามสกุล (สำหรับสร้างโปรไฟล์ครั้งแรก)
              </label>
              <input
                id="signin-name"
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="เช่น กานต์ธิดา วงศ์สุวรรณ"
                className="w-full px-3.5 py-2.5 text-sm bg-white border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-600 focus:border-blue-600"
              />
            </div>

            {error && (
              <p className="text-xs text-rose-600 bg-rose-50 border border-rose-200 rounded-lg px-3 py-2">
                {error}
              </p>
            )}

            <button
              type="submit"
              disabled={submitting}
              className="w-full py-2.5 px-4 text-sm font-medium text-white bg-blue-700 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer disabled:opacity-50"
            >
              {submitting ? 'กำลังเข้าสู่ระบบ...' : 'ดำเนินการต่อด้วย Google'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
