import { calculateMetrics, type MetricFilter, type MetricResult } from "./metrics";
import { retrieveRunbookSections, type RetrievalResult } from "./retrieval";
import type { AuthUser } from "./auth";

export type AssistantIntent =
  | "analytics"
  | "knowledge"
  | "combined"
  | "unsupported_action"
  | "unsupported_root_cause"
  | "unsupported_admin"
  | "ambiguous_time"
  | "prompt_injection"
  | "unknown";

export interface AssistantCitation {
  doc_id: string;
  version: string;
  section_id: string;
  title: string;
}

export interface AssistantResponse {
  intent: AssistantIntent;
  answer: string;
  citations: AssistantCitation[];
  metrics?: MetricResult | null;
  limitations: string[];
  refusal: boolean;
}

/**
 * Inspectable, rule-based intent router to ensure safety and determinism.
 */
export function classifyIntent(prompt: string, user?: AuthUser): AssistantIntent {
  const p = prompt.toLowerCase().trim();

  // 1. Prompt Injection Checks
  if (
    p.includes("ignore previous") ||
    p.includes("نادیده بگیر") ||
    p.includes("اسرار را چاپ کن") ||
    p.includes("print secrets") ||
    p.includes("show keys") ||
    p.includes("رمزها را نشان بده") ||
    p.includes("system prompt") ||
    p.includes("reveal secrets")
  ) {
    return "prompt_injection";
  }

  // 2. Operational Action Checks (Read-Only Safety Barrier)
  if (
    p.includes("reset") ||
    p.includes("ریست") ||
    p.includes("retry") ||
    p.includes("تلاش مجدد") ||
    p.includes("refund") ||
    p.includes("استرداد") ||
    p.includes("سرویس را ریست کن") ||
    p.includes("قطع کن") ||
    p.includes("اجرا کن") ||
    p.includes("تغییر بده")
  ) {
    return "unsupported_action";
  }

  // 3. Unproven Root Cause Inquiries
  if (
    p.includes("علت ریشه‌ای") ||
    p.includes("root cause") ||
    p.includes("چرا این تراکنش خاص شکست خورد") ||
    p.includes("چرا تراکنش") && p.includes("شکست خورد")
  ) {
    return "unsupported_root_cause";
  }

  // 4. Admin Privileged Actions by Viewer
  if (
    (p.includes("کاربر جدید") || p.includes("invite user") || p.includes("تغییر دسترسی") || p.includes("create admin")) &&
    user?.role === "viewer"
  ) {
    return "unsupported_admin";
  }

  // 5. Ambiguous Time Window (metrics question without any window or parameters)
  if (
    (p.includes("چند تراکنش") || p.includes("نرخ موفقیت") || p.includes("تعداد تراکنش")) &&
    !p.includes("بازه") &&
    !p.includes("از") &&
    !p.includes("ساعت") &&
    !p.includes("window") &&
    !p.includes("2026")
  ) {
    return "ambiguous_time";
  }

  // 6. Knowledge Queries (Error codes & runbooks)
  const isErrorCodeQuery = /E_SYN_[A-Z0-9_]+/.test(prompt) || p.includes("خطای") || p.includes("ران‌بوک") || p.includes("کد خطا") || p.includes("راهنما");
  const isMetricsQuery = p.includes("چند تراکنش") || p.includes("نرخ موفقیت") || p.includes("درصد") || p.includes("موفق") || p.includes("ناموفق") || p.includes("بازه");

  if (isErrorCodeQuery && isMetricsQuery) {
    return "combined";
  }

  if (isErrorCodeQuery) {
    return "knowledge";
  }

  if (isMetricsQuery) {
    return "analytics";
  }

  return "unknown";
}

/**
 * Orchestrates deterministic answer generation following MASTER_PROMPT.md Section 3 & 4.
 */
export async function generateAssistantAnswer(
  prompt: string,
  user: AuthUser,
  options?: {
    filter?: MetricFilter;
    events?: any[];
  }
): Promise<AssistantResponse> {
  const intent = classifyIntent(prompt, user);

  // 1. Prompt Injection Handler
  if (intent === "prompt_injection") {
    return {
      intent,
      answer: "درخواست شما به دلیل نقض سیاست‌های امنیتی و تلاش برای تغییر دستورالعمل‌های سامانه پذیرفته نمی‌شود. اطلاعات حساس یا ساختار داخلی فاش نخواهد شد.",
      citations: [],
      limitations: ["امنیت: درخواست‌های مداخله در پرامپت یا افشای کلیدها مسدود است."],
      refusal: true,
    };
  }

  // 2. Operational Action Handler
  if (intent === "unsupported_action") {
    return {
      intent,
      answer: "سامانه ChargeOps Pilot یک محیط نمایشی کاملاً Read-Only است و هیچ‌گونه اقدام عملیاتی (مانند بازنشانی، تلاش مجدد، استرداد یا تغییر تنظیمات) را اجرا نمی‌کند و به سوئیچ‌های شبکه متصل نیست.",
      citations: [],
      limitations: ["عملیات اجرایی و ایجاد تغییرات در شبکه یا داده‌ها در این سامانه پشتیبانی نمی‌شود."],
      refusal: true,
    };
  }

  // 3. Unsupported Root Cause Handler
  if (intent === "unsupported_root_cause") {
    return {
      intent,
      answer: "داده‌های ساختگی موجود در این پایلوت شواهد کافی برای اثبات «علت ریشه‌ای» تراکنش خاص را ندارند. این سامانه فقط قادر است الگوی خطاهای پرتکرار مشاهده‌شده را گزارش کند و از ادعای علت ریشه‌ای قطعی خودداری می‌نماید.",
      citations: [],
      limitations: ["عدم وجود لاگ‌های عمیق زیرساخت؛ پرهیز از ادعای علت ریشه‌ای بر پایه شواهد ناکافی."],
      refusal: true,
    };
  }

  // 4. Admin Action by Viewer Handler
  if (intent === "unsupported_admin") {
    return {
      intent,
      answer: "دسترسی غیرمجاز: شما دارای نقش «viewer» هستید و مجاز به انجام یا درخواست عملیات مدیریتی نیستید.",
      citations: [],
      limitations: ["مجوز دسترسی ناکافی است."],
      refusal: true,
    };
  }

  // 5. Ambiguous Time Window Handler
  if (intent === "ambiguous_time") {
    return {
      intent,
      answer: "لطفاً بازه زمانی مورد نظر خود را مشخص کنید (مثلاً: «در بازه ۰۸:۰۰ الی ۰۹:۰۰ UTC چند تراکنش موفق و ناموفق داریم؟»). محاسبات آماری مستلزم تعیین پنجره زمانی مشخص [from, to) در مقیاس UTC است.",
      citations: [],
      limitations: ["نیاز به شفاف‌سازی بازه زمانی."],
      refusal: true,
    };
  }

  // 6. Analytics Intent
  if (intent === "analytics") {
    const filter: MetricFilter = options?.filter || {
      from: "2026-11-14T08:00:00Z",
      to: "2026-11-14T09:00:00Z",
    };

    const metrics = calculateMetrics(options?.events || [], filter);

    let answer = `در بازه انتخابی [${metrics.timeWindow.from} تا ${metrics.timeWindow.to}) UTC:\n` +
      `- تعداد کل تراکنش‌ها: ${metrics.totalTransactions}\n` +
      `- تراکنش‌های موفق: ${metrics.successfulTransactions}\n` +
      `- تراکنش‌های ناموفق: ${metrics.failedTransactions}\n` +
      `- نرخ موفقیت: ${metrics.successRate === "N/A" ? "N/A" : `${metrics.successRate}%`}\n` +
      `- مخرج کسر: ${metrics.denominator} (موفق + ناموفق)\n` +
      `- وضعیت معلق (pending): ${metrics.pendingTransactions} مورد (جدا از مخرج)\n` +
      `- وضعیت برگشتی (reversed): ${metrics.reversedTransactions} مورد (جدا از مخرج)\n` +
      `مرجع زمان (As-of): ${metrics.asOf}`;

    return {
      intent,
      answer,
      citations: [],
      metrics,
      limitations: metrics.limitations,
      refusal: false,
    };
  }

  // 7. Knowledge Intent
  if (intent === "knowledge") {
    const errorMatch = prompt.match(/E_SYN_[A-Z0-9_]+/);
    const errorCode = errorMatch ? errorMatch[0] : undefined;

    const retrieval: RetrievalResult = await retrieveRunbookSections({
      errorCode,
      searchTerm: errorCode ? undefined : prompt,
    });

    if (retrieval.totalFound === 0) {
      return {
        intent,
        answer: `کد خطا یا عبارت درخواستی «${errorCode || prompt}» در مستندات ران‌بوک مجاز و فعال سامانه یافت نشد. این سامانه از ارائه راهکار فرضی یا ساختگی خودداری می‌کند.`,
        citations: [],
        limitations: ["عدم وجود مستند فعال منطبق."],
        refusal: false,
      };
    }

    const sec = retrieval.sections[0];
    const answer = `بر اساس مستند مجاز ${sec.title}:\n\n` +
      `«${sec.excerpt}»\n\n` +
      `منبع استناد: [سند: ${sec.doc_id} | نگارش: ${sec.version} | بخش: ${sec.section_id}]`;

    return {
      intent,
      answer,
      citations: retrieval.sections.map((s) => ({
        doc_id: s.doc_id,
        version: s.version,
        section_id: s.section_id,
        title: s.title,
      })),
      limitations: ["استناد صرفاً به ران‌بوک‌های ساختگی فعال در پنجره زمانی معتبر صورت گرفته است."],
      refusal: false,
    };
  }

  // 8. Combined Intent
  if (intent === "combined") {
    const filter: MetricFilter = options?.filter || {
      from: "2026-11-14T08:00:00Z",
      to: "2026-11-14T09:00:00Z",
    };

    const metrics = calculateMetrics(options?.events || [], filter);
    const errorMatch = prompt.match(/E_SYN_[A-Z0-9_]+/);
    const errorCode = errorMatch ? errorMatch[0] : undefined;

    const retrieval: RetrievalResult = await retrieveRunbookSections({
      errorCode,
      searchTerm: errorCode ? undefined : prompt,
    });

    let answer = `تحلیل آماری و ران‌بوک:\n` +
      `۱. آمار بازه [${metrics.timeWindow.from} الی ${metrics.timeWindow.to}) UTC:\n` +
      `   - موفق: ${metrics.successfulTransactions} | ناموفق: ${metrics.failedTransactions} | نرخ موفقیت: ${metrics.successRate === "N/A" ? "N/A" : `${metrics.successRate}%`}\n\n`;

    if (retrieval.totalFound > 0) {
      const sec = retrieval.sections[0];
      answer += `۲. مستند عملیاتی مرتبط (${sec.title}):\n` +
        `   «${sec.excerpt}»\n` +
        `   [استناد: ${sec.doc_id} • ${sec.version} • ${sec.section_id}]`;
    }

    return {
      intent,
      answer,
      citations: retrieval.sections.map((s) => ({
        doc_id: s.doc_id,
        version: s.version,
        section_id: s.section_id,
        title: s.title,
      })),
      metrics,
      limitations: metrics.limitations,
      refusal: false,
    };
  }

  // Fallback for general unsupported inquiries
  return {
    intent: "unknown",
    answer: "سؤال شما در چارچوب قابلیت‌های تعریف‌شده این پایلوت (محاسبه شاخص‌های دترمینستیک و بازیابی ران‌بوک‌های مجاز) قرار ندارد. لطفاً در مورد آمار تراکنش‌ها در بازه زمانی مشخص یا کد خطای خاص سؤال بفرمایید.",
    citations: [],
    limitations: ["تنها پرسش‌های تحلیلی و مستنداتی پشتیبانی می‌شوند."],
    refusal: true,
  };
}
