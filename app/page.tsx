import { Dashboard } from "@/components/Dashboard";
import { Assistant } from "@/components/Assistant";

export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-xl font-bold text-slate-900">
            سامانه پایش هوشمند عملیات شارژینگ (ChargeOps Pilot)
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            داشبورد شاخص‌های دترمینستیک، پایگاه دانش ران‌بوک‌های عملیاتی و دستیار پاسخگوی امن
          </p>
        </div>
        <div className="flex items-center gap-2">
          <span className="inline-flex items-center rounded-full bg-emerald-50 px-2.5 py-1 text-xs font-medium text-emerald-700 border border-emerald-200">
            ● وضعیت: آنلاین (Read-Only Demo)
          </span>
        </div>
      </div>

      {/* Dashboard KPI and Metrics */}
      <Dashboard />

      {/* Assistant Component */}
      <Assistant />
    </div>
  );
}
