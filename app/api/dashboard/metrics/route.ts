import { NextResponse, type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { requireAuth, AuthError } from "@/lib/auth";
import { calculateMetrics, type ChargingEvent } from "@/lib/metrics";

export const dynamic = "force-dynamic";

// Fallback synthetic charging dataset strictly mirroring seed.sql
const FALLBACK_SYNTHETIC_EVENTS: ChargingEvent[] = [
  { event_id: "EVT-1001", transaction_id: "TX-2026-0001", attempt_id: "ATT-1", event_at: "2026-11-14T08:00:00Z", ingested_at: "2026-11-14T08:00:01Z", status: "success", service_type: "data", amount: 15000, synthetic: true },
  { event_id: "EVT-1002", transaction_id: "TX-2026-0002", attempt_id: "ATT-1", event_at: "2026-11-14T08:05:00Z", ingested_at: "2026-11-14T08:05:01Z", status: "failed", error_code: "E_SYN_TIMEOUT", service_type: "voice", amount: 2500, synthetic: true },
  { event_id: "EVT-1003", transaction_id: "TX-2026-0002", attempt_id: "ATT-2", event_at: "2026-11-14T08:05:15Z", ingested_at: "2026-11-14T08:05:16Z", status: "success", service_type: "voice", amount: 2500, synthetic: true },
  { event_id: "EVT-1004", transaction_id: "TX-2026-0003", attempt_id: "ATT-1", event_at: "2026-11-14T08:10:00Z", ingested_at: "2026-11-14T08:10:02Z", status: "failed", error_code: "E_SYN_INSUFFICIENT_FUNDS", service_type: "sms", amount: 500, synthetic: true },
  { event_id: "EVT-1005", transaction_id: "TX-2026-0004", attempt_id: "ATT-1", event_at: "2026-11-14T08:15:00Z", ingested_at: "2026-11-14T08:15:02Z", status: "failed", error_code: "E_SYN_TIMEOUT", service_type: "subscription", amount: 50000, synthetic: true },
  { event_id: "EVT-1006", transaction_id: "TX-2026-0005", attempt_id: "ATT-1", event_at: "2026-11-14T08:20:00Z", ingested_at: "2026-11-14T08:20:01Z", status: "failed", error_code: "E_SYN_NETWORK_DROP", service_type: "data", amount: 30000, synthetic: true },
  { event_id: "EVT-1007", transaction_id: "TX-2026-0005", attempt_id: "ATT-2", event_at: "2026-11-14T08:20:10Z", ingested_at: "2026-11-14T08:20:11Z", status: "reversed", service_type: "data", amount: 30000, synthetic: true },
  { event_id: "EVT-1008", transaction_id: "TX-2026-0006", attempt_id: "ATT-1", event_at: "2026-11-14T08:25:00Z", ingested_at: "2026-11-14T08:25:02Z", status: "pending", error_code: "E_SYN_GATEWAY_ERR", service_type: "subscription", amount: 100000, synthetic: true },
  { event_id: "EVT-1009", transaction_id: "TX-2026-0007", attempt_id: "ATT-1", event_at: "2026-11-14T08:30:00Z", ingested_at: "2026-11-14T08:45:00Z", status: "success", service_type: "data", amount: 20000, synthetic: true },
  { event_id: "EVT-1010", transaction_id: "TX-2026-0008", attempt_id: "ATT-1", event_at: "2026-11-14T08:32:00Z", ingested_at: "2026-11-14T08:32:01Z", status: "failed", error_code: "E_SYN_NETWORK_DROP", service_type: "voice", amount: 4000, synthetic: true },
  { event_id: "EVT-1011", transaction_id: "TX-2026-0008", attempt_id: "ATT-2", event_at: "2026-11-14T08:32:10Z", ingested_at: "2026-11-14T08:32:11Z", status: "failed", error_code: "E_SYN_NETWORK_DROP", service_type: "voice", amount: 4000, synthetic: true },
  { event_id: "EVT-1012", transaction_id: "TX-2026-0008", attempt_id: "ATT-3", event_at: "2026-11-14T08:32:25Z", ingested_at: "2026-11-14T08:32:26Z", status: "failed", error_code: "E_SYN_NETWORK_DROP", service_type: "voice", amount: 4000, synthetic: true },
];

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient();
    await requireAuth(supabase);

    const { searchParams } = new URL(request.url);
    const from = searchParams.get("from") || "2026-11-14T08:00:00Z";
    const to = searchParams.get("to") || "2026-11-14T09:00:00Z";
    const asOf = searchParams.get("asOf") || undefined;
    const serviceType = searchParams.get("serviceType") || undefined;
    const errorCode = searchParams.get("errorCode") || undefined;

    let events: ChargingEvent[] = FALLBACK_SYNTHETIC_EVENTS;

    // Fetch from database if table exists and accessible
    try {
      const { data, error } = await supabase
        .from("charging_events")
        .select("event_id, transaction_id, attempt_id, event_at, ingested_at, status, error_code, service_type, amount, synthetic")
        .gte("event_at", from)
        .lt("event_at", to);

      if (!error && data && data.length > 0) {
        events = data as ChargingEvent[];
      }
    } catch {
      // Retain fallback synthetic events
    }

    const metrics = calculateMetrics(events, {
      from,
      to,
      asOf,
      serviceType,
      errorCode,
    });

    return NextResponse.json(metrics, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch (error) {
    if (error instanceof AuthError) {
      return NextResponse.json(
        { error: error.message },
        { status: error.statusCode, headers: { "Cache-Control": "no-store" } }
      );
    }
    return NextResponse.json(
      { error: "خطا در محاسبه شاخص‌های عملیاتی." },
      { status: 500, headers: { "Cache-Control": "no-store" } }
    );
  }
}
