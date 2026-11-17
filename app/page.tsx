import { Dashboard } from "@/components/Dashboard";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Top Banner and Intro */}
      <div className="mb-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            داشبورد شاخص‌ها و پایگاه دانش عملیات شارژینگ
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            پایش دترمینستیک متریک‌های ترافیکی و بازیابی لغوی مستندات ران‌بوک (نسخه آزمایشی پایلوت)
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
            ● وضعیت سامانه: فعال (Read-Only)
          </span>
        </div>
      </div>

      {/* Interactive Dashboard & Runbook Retrieval */}
      <Dashboard />
    </div>
  );
}
