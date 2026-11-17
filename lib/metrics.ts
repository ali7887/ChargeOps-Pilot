/**
 * ChargeOps Pilot — Deterministic Metrics Engine
 * 
 * Implements authoritative mathematical calculation of charging transaction metrics.
 * Designed strictly to follow MASTER_PROMPT.md Section 4:
 * - UTC time window [from, to)
 * - Transaction inception/start-time basis
 * - As-of timestamp filtering (ingested_at <= as_of)
 * - Event deduplication by unique event_id
 * - Deterministic canonical transaction state derivation
 * - Explicit tie-breaking and late-arrival handling
 * - Zero denominator handling returns 'N/A'
 */

export type EventStatus = "success" | "failed" | "reversed" | "pending" | "timeout";

export type CanonicalState = "success" | "failed" | "reversed" | "pending";

export interface ChargingEvent {
  event_id: string;
  transaction_id: string;
  attempt_id: string;
  event_at: string | Date;
  ingested_at: string | Date;
  status: EventStatus;
  error_code?: string | null;
  service_type: string;
  amount?: number;
  synthetic?: boolean;
}

export interface MetricFilter {
  from: string | Date;
  to: string | Date;
  asOf?: string | Date;
  serviceType?: string;
  errorCode?: string;
}

export interface TopErrorItem {
  code: string;
  count: number;
  percentage: number;
}

export interface MetricResult {
  timeWindow: {
    from: string; // ISO UTC
    to: string;   // ISO UTC
  };
  asOf: string;     // ISO UTC
  totalTransactions: number;
  successfulTransactions: number;
  failedTransactions: number;
  reversedTransactions: number;
  pendingTransactions: number;
  denominator: number; // successful + failed
  successRate: number | "N/A"; // percentage 0-100 or 'N/A'
  failureRate: number | "N/A"; // percentage 0-100 or 'N/A'
  totalAttempts: number;
  topErrors: TopErrorItem[];
  limitations: string[];
}

export interface TransactionDetail {
  transactionId: string;
  inceptionAt: Date;
  canonicalState: CanonicalState;
  finalErrorCode: string | null;
  attemptCount: number;
  serviceType: string;
  events: ChargingEvent[];
}

/**
 * Deduplicates events by event_id. If duplicate exists, retains the earliest ingested.
 */
export function deduplicateEvents(events: ChargingEvent[]): ChargingEvent[] {
  const map = new Map<string, ChargingEvent>();
  for (const evt of events) {
    const existing = map.get(evt.event_id);
    if (!existing) {
      map.set(evt.event_id, evt);
    } else {
      const existingIngested = new Date(existing.ingested_at).getTime();
      const newIngested = new Date(evt.ingested_at).getTime();
      if (newIngested < existingIngested) {
        map.set(evt.event_id, evt);
      }
    }
  }
  return Array.from(map.values());
}

/**
 * Resolves the canonical state of a single transaction deterministically.
 */
export function resolveTransactionState(events: ChargingEvent[], asOfDate: Date): TransactionDetail | null {
  // 1. Filter events ingested up to asOfDate
  const visibleEvents = events.filter((e) => new Date(e.ingested_at).getTime() <= asOfDate.getTime());
  if (visibleEvents.length === 0) {
    return null;
  }

  // 2. Sort deterministically:
  // Primary: event_at ASC
  // Secondary: ingested_at ASC
  // Tertiary: attempt_id ASC
  // Quaternary: event_id ASC
  const sorted = [...visibleEvents].sort((a, b) => {
    const timeDiff = new Date(a.event_at).getTime() - new Date(b.event_at).getTime();
    if (timeDiff !== 0) return timeDiff;

    const ingestDiff = new Date(a.ingested_at).getTime() - new Date(b.ingested_at).getTime();
    if (ingestDiff !== 0) return ingestDiff;

    const attemptDiff = a.attempt_id.localeCompare(b.attempt_id);
    if (attemptDiff !== 0) return attemptDiff;

    return a.event_id.localeCompare(b.event_id);
  });

  const inceptionAt = new Date(sorted[0].event_at);
  const latestEvent = sorted[sorted.length - 1];

  let canonicalState: CanonicalState;
  switch (latestEvent.status) {
    case "success":
      canonicalState = "success";
      break;
    case "reversed":
      canonicalState = "reversed";
      break;
    case "pending":
      canonicalState = "pending";
      break;
    case "timeout":
    case "failed":
    default:
      canonicalState = "failed";
      break;
  }

  return {
    transactionId: latestEvent.transaction_id,
    inceptionAt,
    canonicalState,
    finalErrorCode: canonicalState === "failed" ? latestEvent.error_code ?? "UNKNOWN" : null,
    attemptCount: sorted.length,
    serviceType: latestEvent.service_type,
    events: sorted,
  };
}

/**
 * Computes deterministic charging transaction metrics across a given dataset.
 */
export function calculateMetrics(
  rawEvents: ChargingEvent[],
  filter: MetricFilter
): MetricResult {
  const fromDate = new Date(filter.from);
  const toDate = new Date(filter.to);
  const asOfDate = filter.asOf ? new Date(filter.asOf) : new Date("9999-12-31T23:59:59.999Z");

  // 1. Deduplicate by event_id
  const deduped = deduplicateEvents(rawEvents);

  // 2. Group by transaction_id
  const txMap = new Map<string, ChargingEvent[]>();
  for (const evt of deduped) {
    const list = txMap.get(evt.transaction_id) ?? [];
    list.push(evt);
    txMap.set(evt.transaction_id, list);
  }

  // 3. Resolve canonical states and filter by inception window [from, to)
  const txSummaries: TransactionDetail[] = [];
  for (const [, events] of txMap) {
    const summary = resolveTransactionState(events, asOfDate);
    if (!summary) continue;

    const inceptionMs = summary.inceptionAt.getTime();
    if (inceptionMs >= fromDate.getTime() && inceptionMs < toDate.getTime()) {
      if (filter.serviceType && summary.serviceType !== filter.serviceType) {
        continue;
      }
      if (filter.errorCode && summary.finalErrorCode !== filter.errorCode) {
        continue;
      }
      txSummaries.push(summary);
    }
  }

  // 4. Calculate deterministic counters
  let successful = 0;
  let failed = 0;
  let reversed = 0;
  let pending = 0;
  let totalAttempts = 0;
  const errorCounts = new Map<string, number>();

  for (const tx of txSummaries) {
    totalAttempts += tx.attemptCount;
    switch (tx.canonicalState) {
      case "success":
        successful++;
        break;
      case "failed":
        failed++;
        if (tx.finalErrorCode) {
          errorCounts.set(tx.finalErrorCode, (errorCounts.get(tx.finalErrorCode) ?? 0) + 1);
        }
        break;
      case "reversed":
        reversed++;
        break;
      case "pending":
        pending++;
        break;
    }
  }

  const denominator = successful + failed;
  const successRate: number | "N/A" = denominator > 0
    ? Math.round((successful / denominator) * 10000) / 100
    : "N/A";
  const failureRate: number | "N/A" = denominator > 0
    ? Math.round((failed / denominator) * 10000) / 100
    : "N/A";

  // 5. Calculate top errors
  const topErrors: TopErrorItem[] = Array.from(errorCounts.entries())
    .map(([code, count]) => ({
      code,
      count,
      percentage: failed > 0 ? Math.round((count / failed) * 10000) / 100 : 0,
    }))
    .sort((a, b) => b.count - a.count || a.code.localeCompare(b.code));

  return {
    timeWindow: {
      from: fromDate.toISOString(),
      to: toDate.toISOString(),
    },
    asOf: asOfDate.toISOString(),
    totalTransactions: txSummaries.length,
    successfulTransactions: successful,
    failedTransactions: failed,
    reversedTransactions: reversed,
    pendingTransactions: pending,
    denominator,
    successRate,
    failureRate,
    totalAttempts,
    topErrors,
    limitations: [
      "داده‌های پردازش‌شده کاملاً ساختگی (Synthetic) هستند.",
      "پنجره زمانی بر مبنای ساعت شروع تراکنش (Inception) و به صورت [from, to) در مقیاس UTC محاسبه شده است.",
      "تراکنش‌های معلق (pending) و برگشتی (reversed) در مخرج کسر محاسبه نرخ موفقیت لحاظ نمی‌شوند.",
      "اگر مخرج کسر (تراکنش‌های موفق + ناموفق) صفر باشد، مقدار N/A بازگردانده می‌شود.",
    ],
  };
}
