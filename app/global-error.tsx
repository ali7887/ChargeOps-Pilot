"use client";

export default function GlobalError({
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="fa" dir="rtl">
      <body className="flex min-h-screen items-center justify-center bg-slate-50 p-4 font-sans text-slate-900">
        <div className="max-w-md rounded-lg border border-red-200 bg-white p-6 text-center shadow-sm">
          <h2 className="text-base font-bold text-red-600 mb-2">خطای بحرانی در سطح سامانه</h2>
          <p className="text-xs text-slate-600 mb-4">
            سامانه با خطای پیش‌بینی‌نشده مواجه شد.
          </p>
          <button
            onClick={() => reset()}
            className="rounded bg-blue-600 px-4 py-2 text-xs font-semibold text-white hover:bg-blue-700"
          >
            تلاش مجدد
          </button>
        </div>
      </body>
    </html>
  );
}
