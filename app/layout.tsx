import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "ChargeOps Pilot",
  description: "Read-only synthetic demonstration assistant for charging operations",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="fa" dir="rtl" className="h-full bg-slate-50">
      <body className="min-h-full flex flex-col bg-slate-50 text-slate-900 antialiased">
        <header className="border-b border-slate-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6 lg:px-8">
            <div className="flex items-center gap-3">
              <span className="rounded bg-blue-600 px-2.5 py-1 text-xs font-semibold text-white">
                ChargeOps Pilot
              </span>
              <span className="text-sm font-medium text-slate-600">
                سامانه پایش عملیات شارژینگ
              </span>
            </div>
            <div className="text-xs font-medium text-amber-700 bg-amber-50 border border-amber-200 px-3 py-1 rounded-full">
              دموی داده‌های مصنوعی؛ بدون اتصال به شبکه یا سامانه واقعی
            </div>
          </div>
        </header>
        <main className="flex-1">{children}</main>
        <footer className="border-t border-slate-200 bg-white py-4 text-center text-xs text-slate-500">
          ChargeOps Pilot — محیط نمایشی و آزمایشی داده‌های ساختگی (Read-only)
        </footer>
      </body>
    </html>
  );
}
