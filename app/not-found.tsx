import Link from "next/link";

export default function NotFound() {
  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-slate-800 mb-2">صفحه مورد نظر یافت نشد (۴۰۴)</h2>
        <p className="text-xs text-slate-600 mb-4">
          مسیر درخواستی در سامانه ChargeOps Pilot وجود ندارد.
        </p>
        <Link
          href="/"
          className="inline-block rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition"
        >
          بازگشت به صفحه اصلی
        </Link>
      </div>
    </div>
  );
}
