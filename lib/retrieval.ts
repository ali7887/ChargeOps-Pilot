import type { SupabaseClient } from "@supabase/supabase-js";

export interface RunbookSection {
  doc_id: string;
  version: string;
  section_id: string;
  title: string;
  content: string;
  error_codes: string[];
  status: "draft" | "active" | "deprecated" | "archived";
  effective_from: string;
  effective_to?: string | null;
  synthetic: boolean;
}

export interface RetrievalResult {
  matchType: "exact" | "full_text" | "none";
  sections: Array<{
    doc_id: string;
    version: string;
    section_id: string;
    title: string;
    excerpt: string;
    errorCodes: string[];
  }>;
  totalFound: number;
}

/**
 * Fallback synthetic runbook repository used when database schema is initializing
 * or running offline tests. Strictly identical to SQL seed definitions.
 */
export const SYNTHETIC_RUNBOOKS: RunbookSection[] = [
  {
    doc_id: "RB-SYN-001",
    version: "v1.2",
    section_id: "SEC-TIMEOUT",
    title: "مدیریت خطای تایم‌اوت سوئیچ شارژینگ (E_SYN_TIMEOUT)",
    content: "خطای E_SYN_TIMEOUT زمانی رخ می‌دهد که تراکنش در پنجره زمانی مجاز (۵ ثانیه) پاسخی از نود پایین‌دستی دریافت نکند. راهکار مجاز: بررسی وضعیت قطعی در پایگاه داده محلی و پرهیز از تکرار درخواست تا زمان تعیین تکلیف نهایی تراکنش.",
    error_codes: ["E_SYN_TIMEOUT"],
    status: "active",
    effective_from: "2026-01-01T00:00:00Z",
    effective_to: null,
    synthetic: true,
  },
  {
    doc_id: "RB-SYN-001",
    version: "v1.2",
    section_id: "SEC-FUNDS",
    title: "رسیدگی به خطای عدم موجودی اعتبار مشترک (E_SYN_INSUFFICIENT_FUNDS)",
    content: "کد خطای E_SYN_INSUFFICIENT_FUNDS نشان‌دهنده ناکافی بودن اعتبار ریالی یا حجم بسته کاربر جهت انجام عملیات است. تراکنش به صورت قطعی ناموفق تلقی شده و نباید مجدداً تلاش خودکار انجام شود.",
    error_codes: ["E_SYN_INSUFFICIENT_FUNDS"],
    status: "active",
    effective_from: "2026-01-01T00:00:00Z",
    effective_to: null,
    synthetic: true,
  },
  {
    doc_id: "RB-SYN-002",
    version: "v1.0",
    section_id: "SEC-NET-DROP",
    title: "خطای قطعی نشست شبکه در حین ارسال رویداد (E_SYN_NETWORK_DROP)",
    content: "کد خطای E_SYN_NETWORK_DROP ناشی از قطع ارتباط سوکت TCP پیش از تکمیل هندشیک شارژینگ است. در صورتی که تراکنش به وضعیت بازگشتی (reversed) درنیامده باشد، تراکنش پس از اعتبارسنجی مجدد توسط کلاینت قابل ارسال مجدد است.",
    error_codes: ["E_SYN_NETWORK_DROP"],
    status: "active",
    effective_from: "2026-01-01T00:00:00Z",
    effective_to: null,
    synthetic: true,
  },
  {
    doc_id: "RB-SYN-003",
    version: "v1.0",
    section_id: "SEC-GATEWAY",
    title: "خطای عدم پاسخ‌دهی گیت‌وی پرداخت فرضی (E_SYN_GATEWAY_ERR)",
    content: "کد خطای E_SYN_GATEWAY_ERR نشان‌دهنده خطای ۵۰۲/۵۰۴ از درگاه متصل است. در این حالت تراکنش به وضعیت تعلیق (pending) وارد شده و منتظر پیام مغایرت‌گیری سیستمی می‌ماند.",
    error_codes: ["E_SYN_GATEWAY_ERR"],
    status: "active",
    effective_from: "2026-01-01T00:00:00Z",
    effective_to: null,
    synthetic: true,
  },
  {
    doc_id: "RB-SYN-004",
    version: "v0.9",
    section_id: "SEC-DEPRECATED",
    title: "دستورالعمل منسوخ‌شده بررسی سهمیه قدیمی (E_SYN_OLD_LIMIT)",
    content: "این مستند منسوخ شده است و نباید در پاسخ‌های عملیاتی فعال استناد شود.",
    error_codes: ["E_SYN_OLD_LIMIT"],
    status: "deprecated",
    effective_from: "2025-01-01T00:00:00Z",
    effective_to: "2025-12-31T23:59:59Z",
    synthetic: true,
  },
];

/**
 * Checks whether a runbook section is currently active and within its validity window.
 */
export function isSectionActive(section: RunbookSection, now: Date = new Date()): boolean {
  if (section.status !== "active") return false;
  const from = new Date(section.effective_from).getTime();
  if (now.getTime() < from) return false;
  if (section.effective_to) {
    const to = new Date(section.effective_to).getTime();
    if (now.getTime() >= to) return false;
  }
  return true;
}

/**
 * Performs exact error-code lookup and PostgreSQL full-text / lexical retrieval.
 * Returns only current, permitted active sections with strict citation metadata.
 */
export async function retrieveRunbookSections(
  query: { errorCode?: string; searchTerm?: string },
  supabase?: SupabaseClient
): Promise<RetrievalResult> {
  const now = new Date();

  // Try database retrieval first if supabase client is provided
  if (supabase) {
    try {
      // 1. Exact error code lookup in PostgreSQL
      if (query.errorCode) {
        const { data, error } = await supabase
          .from("runbook_sections")
          .select("doc_id, version, section_id, title, content, error_codes, status, effective_from, effective_to, synthetic")
          .contains("error_codes", [query.errorCode])
          .eq("status", "active")
          .lte("effective_from", now.toISOString());

        if (!error && data && data.length > 0) {
          const activeSections = data.filter((s) => isSectionActive(s as RunbookSection, now));
          if (activeSections.length > 0) {
            return {
              matchType: "exact",
              sections: activeSections.map((s) => ({
                doc_id: s.doc_id,
                version: s.version,
                section_id: s.section_id,
                title: s.title,
                excerpt: s.content,
                errorCodes: s.error_codes,
              })),
              totalFound: activeSections.length,
            };
          }
        }
      }

      // 2. Full-text search in PostgreSQL
      if (query.searchTerm) {
        const { data, error } = await supabase
          .from("runbook_sections")
          .select("doc_id, version, section_id, title, content, error_codes, status, effective_from, effective_to, synthetic")
          .textSearch("search_vector", query.searchTerm, { type: "plain", config: "simple" })
          .eq("status", "active");

        if (!error && data && data.length > 0) {
          const activeSections = data.filter((s) => isSectionActive(s as RunbookSection, now));
          if (activeSections.length > 0) {
            return {
              matchType: "full_text",
              sections: activeSections.map((s) => ({
                doc_id: s.doc_id,
                version: s.version,
                section_id: s.section_id,
                title: s.title,
                excerpt: s.content,
                errorCodes: s.error_codes,
              })),
              totalFound: activeSections.length,
            };
          }
        }
      }
    } catch {
      // Fallback to deterministic in-memory lexical retrieval
    }
  }

  // Deterministic local lexical retrieval (fallback and local testing)
  if (query.errorCode) {
    const code = query.errorCode.trim();
    const exactMatches = SYNTHETIC_RUNBOOKS.filter(
      (s) => isSectionActive(s, now) && s.error_codes.includes(code)
    );

    if (exactMatches.length > 0) {
      return {
        matchType: "exact",
        sections: exactMatches.map((s) => ({
          doc_id: s.doc_id,
          version: s.version,
          section_id: s.section_id,
          title: s.title,
          excerpt: s.content,
          errorCodes: s.error_codes,
        })),
        totalFound: exactMatches.length,
      };
    }
  }

  if (query.searchTerm) {
    const term = query.searchTerm.toLowerCase().trim();
    const matches = SYNTHETIC_RUNBOOKS.filter((s) => {
      if (!isSectionActive(s, now)) return false;
      const haystack = (s.title + " " + s.content + " " + s.error_codes.join(" ")).toLowerCase();
      return haystack.includes(term);
    });

    if (matches.length > 0) {
      return {
        matchType: "full_text",
        sections: matches.map((s) => ({
          doc_id: s.doc_id,
          version: s.version,
          section_id: s.section_id,
          title: s.title,
          excerpt: s.content,
          errorCodes: s.error_codes,
        })),
        totalFound: matches.length,
      };
    }
  }

  return {
    matchType: "none",
    sections: [],
    totalFound: 0,
  };
}
