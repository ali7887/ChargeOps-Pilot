"use client";

import { useState, useEffect } from "react";
import { type MetricResult } from "@/lib/metrics";
import { type RetrievalResult } from "@/lib/retrieval";

export function Dashboard() {
  const [metrics, setMetrics] = useState<MetricResult | null>(null);
  const [loadingMetrics, setLoadingMetrics] = useState(true);
  const [fromTime, setFromTime] = useState("2026-11-14T08:00:00Z");
  const [toTime, setToTime] = useState("2026-11-14T09:00:00Z");

  // Runbook lookup state
  const [searchCode, setSearchCode] = useState("E_SYN_TIMEOUT");
  const [retrievalResult, setRetrievalResult] = useState<RetrievalResult | null>(null);
  const [loadingRetrieval, setLoadingRetrieval] = useState(false);

  // Fetch metrics
  const fetchMetrics = async () => {
    setLoadingMetrics(true);
    try {
      const res = await fetch(`/api/dashboard/metrics?from=${encodeURIComponent(fromTime)}&to=${encodeURIComponent(toTime)}`);
      if (res.ok) {
        const data = await res.json();
        setMetrics(data);
      }
    } catch {
      // Handle error gracefully
    } finally {
      setLoadingMetrics(false);
    }
  };

  // Runbook retrieval
  const handleLookup = async (codeToLookup: string) => {
    setLoadingRetrieval(true);
    try {
      const res = await fetch(`/api/retrieval/runbooks?errorCode=${encodeURIComponent(codeToLookup)}`);
      if (res.ok) {
        const data = await res.json();
        setRetrievalResult(data);
      } else {
        setRetrievalResult({ matchType: "none", sections: [], totalFound: 0 });
      }
    } catch {
      setRetrievalResult({ matchType: "none", sections: [], totalFound: 0 });
    } finally {
      setLoadingRetrieval(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    handleLookup("E_SYN_TIMEOUT");
  }, []);

  return (
    <div className="space-y-6">
      {/* Date Filter Bar */}
      <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-slate-700">فیلتر بازه زمانی (UTC):</span>
          <input
            type="text"
            value={fromTime}
            onChange={(e) => setFromTime(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs font-mono text-slate-800"
            dir="ltr"
          />
          <span className="text-xs text-slate-400">تا</span>
          <input
            type="text"
            value={toTime}
            onChange={(e) => setToTime(e.target.value)}
            className="rounded border border-slate-300 px-2 py-1 text-xs font-mono text-slate-800"
            dir="ltr"
          />
          <button
            onClick={fetchMetrics}
            className="rounded bg-blue-600 px-3 py-1 text-xs font-medium text-white hover:bg-blue-700"
          >
            اعمال بازه
          </button>
        </div>
        <div className="text-[11px] text-slate-500">
          مرجع زمان As-of: <span className="font-mono text-slate-700">{metrics?.asOf || "در حال بارگذاری..."}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500">کل تراکنش‌ها (Inception)</div>
          <div className="mt-2 text-2xl font-bold text-slate-900">
            {loadingMetrics ? "..." : metrics?.totalTransactions ?? "N/A"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            {metrics?.totalAttempts ? `${metrics.totalAttempts} تلاش ارسالی` : ""}
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500">تراکنش‌های موفق</div>
          <div className="mt-2 text-2xl font-bold text-emerald-600">
            {loadingMetrics ? "..." : metrics?.successfulTransactions ?? "N/A"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">وضعیت قطعی پایانی</div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500">تراکنش‌های ناموفق</div>
          <div className="mt-2 text-2xl font-bold text-rose-600">
            {loadingMetrics ? "..." : metrics?.failedTransactions ?? "N/A"}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">با خطای سیستمی یا بیزینسی</div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500">نرخ موفقیت (Success Rate)</div>
          <div className="mt-2 text-2xl font-bold text-blue-600">
            {loadingMetrics
              ? "..."
              : metrics?.successRate === "N/A"
              ? "N/A"
              : `${metrics?.successRate}%`}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">
            مخرج: {metrics?.denominator ?? 0} (موفق + ناموفق)
          </div>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white p-4 shadow-sm">
          <div className="text-xs font-medium text-slate-500">معلق / برگشتی</div>
          <div className="mt-2 flex items-baseline gap-2">
            <span className="text-lg font-bold text-amber-600">{metrics?.pendingTransactions ?? 0}</span>
            <span className="text-xs text-slate-400">معلق</span>
            <span className="text-slate-300">|</span>
            <span className="text-lg font-bold text-indigo-600">{metrics?.reversedTransactions ?? 0}</span>
            <span className="text-xs text-slate-400">برگشتی</span>
          </div>
          <div className="text-[11px] text-slate-400 mt-1">خارج از مخرج کسر نرخ</div>
        </div>
      </div>

      {/* Main Grid: Top Errors & Runbook Retrieval */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Top Error Codes Breakdown */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <h2 className="text-sm font-bold text-slate-800 mb-3">خطاهای پرتکرار مشاهده‌شده</h2>
          {loadingMetrics ? (
            <p className="text-xs text-slate-400">در حال محاسبه خطاهای پرتکرار...</p>
          ) : metrics?.topErrors && metrics.topErrors.length > 0 ? (
            <div className="divide-y divide-slate-100">
              {metrics.topErrors.map((err) => (
                <div key={err.code} className="flex items-center justify-between py-2 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-medium text-rose-700 bg-rose-50 px-2 py-0.5 rounded border border-rose-100">
                      {err.code}
                    </span>
                    <button
                      onClick={() => {
                        setSearchCode(err.code);
                        handleLookup(err.code);
                      }}
                      className="text-blue-600 hover:underline text-[11px]"
                    >
                      (مشاهده در ران‌بوک)
                    </button>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-slate-600 font-semibold">{err.count} مورد</span>
                    <span className="text-slate-400 w-12 text-left" dir="ltr">{err.percentage}%</span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-500">هیچ خطایی در بازه زمانی انتخابی یافت نشد.</p>
          )}

          <div className="mt-4 pt-3 border-t border-slate-100 text-[11px] text-slate-500">
            ⚠️ توجه: این لیست خطاهای مشاهده‌شده را نمایش می‌دهد و به معنای تعیین علت ریشه‌ای قطعی نیست.
          </div>
        </div>

        {/* Operational Runbook Retrieval Box */}
        <div className="rounded-lg border border-slate-200 bg-white p-5 shadow-sm">
          <div className="flex items-center justify-between mb-3">
            <h2 className="text-sm font-bold text-slate-800">بازیابی لغوی ران‌بوک‌های عملیاتی</h2>
            <span className="text-[11px] bg-slate-100 text-slate-600 px-2 py-0.5 rounded">
              Lexical / Full-Text
            </span>
          </div>

          <div className="flex gap-2 mb-4">
            <input
              type="text"
              value={searchCode}
              onChange={(e) => setSearchCode(e.target.value)}
              placeholder="کد خطا را وارد کنید (مثال: E_SYN_TIMEOUT)"
              className="flex-1 rounded border border-slate-300 px-3 py-1.5 text-xs text-slate-800 font-mono focus:border-blue-500 focus:outline-none"
              dir="ltr"
            />
            <button
              onClick={() => handleLookup(searchCode)}
              disabled={loadingRetrieval}
              className="rounded bg-blue-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-60"
            >
              {loadingRetrieval ? "در حال جستجو..." : "بازیابی سند"}
            </button>
          </div>

          {/* Quick preset buttons */}
          <div className="flex flex-wrap gap-1 mb-4 text-[11px]">
            <span className="text-slate-400 self-center ml-1">کدهای نمونه:</span>
            {["E_SYN_TIMEOUT", "E_SYN_INSUFFICIENT_FUNDS", "E_SYN_NETWORK_DROP", "E_SYN_GATEWAY_ERR", "UNKNOWN_ERR"].map((c) => (
              <button
                key={c}
                onClick={() => {
                  setSearchCode(c);
                  handleLookup(c);
                }}
                className="rounded border border-slate-200 bg-slate-50 px-2 py-0.5 text-slate-600 hover:bg-slate-100 font-mono"
              >
                {c}
              </button>
            ))}
          </div>

          {/* Retrieval Results */}
          {retrievalResult && retrievalResult.sections.length > 0 ? (
            <div className="space-y-3">
              {retrievalResult.sections.map((sec) => (
                <div key={sec.section_id} className="rounded border border-blue-100 bg-blue-50/40 p-3 text-xs">
                  <div className="flex items-center justify-between mb-1.5">
                    <span className="font-bold text-slate-900">{sec.title}</span>
                    <span className="font-mono text-[10px] bg-blue-100 text-blue-800 px-2 py-0.5 rounded">
                      استناد: {sec.doc_id} • {sec.version} • {sec.section_id}
                    </span>
                  </div>
                  <p className="text-slate-700 leading-relaxed text-[11px] mb-2">{sec.excerpt}</p>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-slate-400">کدهای خطای تحت پوشش:</span>
                    {sec.errorCodes.map((code) => (
                      <span key={code} className="font-mono text-[10px] bg-white border border-slate-200 px-1 rounded text-slate-600">
                        {code}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : retrievalResult && retrievalResult.totalFound === 0 ? (
            <div className="rounded border border-slate-100 bg-slate-50 p-4 text-center text-xs text-slate-500">
              هیچ مستند عملیاتی معتبری برای کد خطای درخواستی یافت نشد. سیستم از پاسخ فرضی خودداری می‌کند.
            </div>
          ) : null}
        </div>
      </div>
    </div>
  );
}
