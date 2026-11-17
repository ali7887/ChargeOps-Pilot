export default function HomePage() {
  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="rounded-lg border border-slate-200 bg-white p-8 shadow-sm">
        <h1 className="text-xl font-bold text-slate-900 mb-2">
          ChargeOps Pilot — سامانه پایش عملیات شارژینگ
        </h1>
        <p className="text-sm text-slate-600 mb-6">
          این سامانه یک دستیار نمایشی کاملاً Read-only برای تحلیل داده‌های ساختگی شارژینگ و ران‌بوک‌های عملیاتی است.
        </p>

        <div className="rounded-md border border-amber-200 bg-amber-50 p-4 mb-6">
          <p className="text-sm font-semibold text-amber-800">
            ⚠️ اطلاعیه مهم ایمنی و داده:
          </p>
          <p className="text-xs text-amber-700 mt-1">
            دموی داده‌های مصنوعی؛ بدون اتصال به شبکه یا سامانه واقعی. هیچ عملیات اجرایی، اصلاحی یا اتصالی به سیستم‌های واقعی ایرانسل وجود ندارد.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-xs">
          <div className="p-4 rounded border border-slate-100 bg-slate-50">
            <span className="font-semibold text-slate-800 block mb-1">داشبورد شاخص‌ها</span>
            <span className="text-slate-500">محاسبه دترمینستیک متریک‌های تراکنش‌های شارژینگ</span>
          </div>
          <div className="p-4 rounded border border-slate-100 bg-slate-50">
            <span className="font-semibold text-slate-800 block mb-1">پایگاه دانش عملیاتی</span>
            <span className="text-slate-500">بازیابی لغوی کدهای خطا و ران‌بوک‌های مجاز</span>
          </div>
          <div className="p-4 rounded border border-slate-100 bg-slate-50">
            <span className="font-semibold text-slate-800 block mb-1">دستیار هوشمند امن</span>
            <span className="text-slate-500">مسیریابی مشخص، استناد دقیق به مستندات و امتناع در صورت نبود شواهد</span>
          </div>
        </div>
      </div>
    </div>
  );
}
