"use client";

import { useEffect } from "react";

export default function ErrorBoundary({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log safe error metadata without exposing internal traces to the user
    console.error("Application error:", error.message);
  }, [error]);

  return (
    <div className="mx-auto max-w-xl px-4 py-16 text-center">
      <div className="rounded-lg border border-red-200 bg-white p-6 shadow-sm">
        <h2 className="text-lg font-bold text-red-700 mb-2">خطایی در پردازش رخ داد</h2>
        <p className="text-xs text-slate-600 mb-4">
          در پردازش درخواست شما خطایی رخ داده است. اطلاعات حساس یا ردگیری سیستمی نمایش داده نمی‌شود.
        </p>
        <button
          onClick={() => reset()}
          className="rounded bg-blue-600 px-4 py-2 text-xs font-medium text-white hover:bg-blue-700 transition"
        >
          تلاش مجدد
        </button>
      </div>
    </div>
  );
}
