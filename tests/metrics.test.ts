import { describe, it, expect } from "vitest";
import {
  calculateMetrics,
  deduplicateEvents,
  resolveTransactionState,
  type ChargingEvent,
} from "../lib/metrics";

describe("Deterministic Metrics Engine — Acceptance & Edge Cases", () => {
  const sampleEvents: ChargingEvent[] = [
    // TX-1: Single successful attempt
    {
      event_id: "EVT-1001",
      transaction_id: "TX-1",
      attempt_id: "ATT-1",
      event_at: "2026-11-14T08:00:00Z",
      ingested_at: "2026-11-14T08:00:01Z",
      status: "success",
      service_type: "data",
    },
    // TX-2: Multiple attempts: ATT-1 failed with timeout, ATT-2 succeeded
    {
      event_id: "EVT-1002",
      transaction_id: "TX-2",
      attempt_id: "ATT-1",
      event_at: "2026-11-14T08:05:00Z",
      ingested_at: "2026-11-14T08:05:01Z",
      status: "failed",
      error_code: "E_SYN_TIMEOUT",
      service_type: "voice",
    },
    {
      event_id: "EVT-1003",
      transaction_id: "TX-2",
      attempt_id: "ATT-2",
      event_at: "2026-11-14T08:05:15Z",
      ingested_at: "2026-11-14T08:05:16Z",
      status: "success",
      service_type: "voice",
    },
    // TX-3: Single failed attempt
    {
      event_id: "EVT-1004",
      transaction_id: "TX-3",
      attempt_id: "ATT-1",
      event_at: "2026-11-14T08:10:00Z",
      ingested_at: "2026-11-14T08:10:02Z",
      status: "failed",
      error_code: "E_SYN_INSUFFICIENT_FUNDS",
      service_type: "sms",
    },
    // TX-4: Reversed transaction (failed then reversed)
    {
      event_id: "EVT-1005",
      transaction_id: "TX-4",
      attempt_id: "ATT-1",
      event_at: "2026-11-14T08:20:00Z",
      ingested_at: "2026-11-14T08:20:01Z",
      status: "failed",
      error_code: "E_SYN_NETWORK_DROP",
      service_type: "data",
    },
    {
      event_id: "EVT-1006",
      transaction_id: "TX-4",
      attempt_id: "ATT-2",
      event_at: "2026-11-14T08:20:10Z",
      ingested_at: "2026-11-14T08:20:11Z",
      status: "reversed",
      service_type: "data",
    },
    // TX-5: Pending transaction
    {
      event_id: "EVT-1007",
      transaction_id: "TX-5",
      attempt_id: "ATT-1",
      event_at: "2026-11-14T08:25:00Z",
      ingested_at: "2026-11-14T08:25:02Z",
      status: "pending",
      error_code: "E_SYN_GATEWAY_ERR",
      service_type: "subscription",
    },
  ];

  it("1. Deduplicates events by event_id cleanly", () => {
    const duplicates: ChargingEvent[] = [
      ...sampleEvents,
      { ...sampleEvents[0], ingested_at: "2026-11-14T08:00:05Z" }, // Duplicate EVT-1001 with later ingest
    ];
    const deduped = deduplicateEvents(duplicates);
    expect(deduped.length).toBe(sampleEvents.length);
  });

  it("2. Correctly derives canonical state with multiple attempts", () => {
    // TX-2 had ATT-1 (failed) and ATT-2 (success) -> Canonical state must be success
    const tx2Events = sampleEvents.filter((e) => e.transaction_id === "TX-2");
    const summary = resolveTransactionState(tx2Events, new Date("2026-11-14T09:00:00Z"));
    expect(summary).not.toBeNull();
    expect(summary?.canonicalState).toBe("success");
    expect(summary?.attemptCount).toBe(2);
  });

  it("3. Calculates standard success and failure metrics in window [from, to)", () => {
    const result = calculateMetrics(sampleEvents, {
      from: "2026-11-14T08:00:00Z",
      to: "2026-11-14T08:30:00Z",
    });

    // TX-1: success, TX-2: success, TX-3: failed, TX-4: reversed, TX-5: pending
    expect(result.totalTransactions).toBe(5);
    expect(result.successfulTransactions).toBe(2);
    expect(result.failedTransactions).toBe(1);
    expect(result.reversedTransactions).toBe(1);
    expect(result.pendingTransactions).toBe(1);

    // Denominator = success (2) + failed (1) = 3 (reversed & pending excluded)
    expect(result.denominator).toBe(3);
    // Success rate = 2 / 3 = 66.67%
    expect(result.successRate).toBe(66.67);
    // Failure rate = 1 / 3 = 33.33%
    expect(result.failureRate).toBe(33.33);

    // Total attempts across all 5 transactions: 1 + 2 + 1 + 2 + 1 = 7
    expect(result.totalAttempts).toBe(7);
  });

  it("4. Returns 'N/A' when denominator is zero (no success or failed transactions)", () => {
    // Only reversed and pending transactions
    const onlyReversedAndPending = sampleEvents.filter(
      (e) => e.transaction_id === "TX-4" || e.transaction_id === "TX-5"
    );
    const result = calculateMetrics(onlyReversedAndPending, {
      from: "2026-11-14T08:00:00Z",
      to: "2026-11-14T08:30:00Z",
    });

    expect(result.totalTransactions).toBe(2);
    expect(result.successfulTransactions).toBe(0);
    expect(result.failedTransactions).toBe(0);
    expect(result.reversedTransactions).toBe(1);
    expect(result.pendingTransactions).toBe(1);
    expect(result.denominator).toBe(0);
    expect(result.successRate).toBe("N/A");
    expect(result.failureRate).toBe("N/A");
  });

  it("5. Respects inclusive 'from' and exclusive 'to' window boundaries [from, to)", () => {
    // Boundary at 08:00:00Z is inclusive (TX-1 included)
    // Boundary at 08:05:00Z is exclusive (TX-2 excluded)
    const result = calculateMetrics(sampleEvents, {
      from: "2026-11-14T08:00:00Z",
      to: "2026-11-14T08:05:00Z",
    });

    expect(result.totalTransactions).toBe(1);
    expect(result.successfulTransactions).toBe(1);
  });

  it("6. Handles late-arriving events via asOf filter", () => {
    const lateEvents: ChargingEvent[] = [
      {
        event_id: "EVT-LATE",
        transaction_id: "TX-LATE",
        attempt_id: "ATT-1",
        event_at: "2026-11-14T08:00:00Z",      // event happened at 08:00
        ingested_at: "2026-11-14T08:30:00Z",   // ingested at 08:30
        status: "success",
        service_type: "data",
      },
    ];

    // As of 08:15:00Z, the event was not yet ingested
    const asOfBefore = calculateMetrics(lateEvents, {
      from: "2026-11-14T08:00:00Z",
      to: "2026-11-14T09:00:00Z",
      asOf: "2026-11-14T08:15:00Z",
    });
    expect(asOfBefore.totalTransactions).toBe(0);

    // As of 08:35:00Z, the event was ingested and visible
    const asOfAfter = calculateMetrics(lateEvents, {
      from: "2026-11-14T08:00:00Z",
      to: "2026-11-14T09:00:00Z",
      asOf: "2026-11-14T08:35:00Z",
    });
    expect(asOfAfter.totalTransactions).toBe(1);
    expect(asOfAfter.successfulTransactions).toBe(1);
  });

  it("7. Resolves equal timestamp tie-breaking deterministically", () => {
    // Two events with identical event_at and ingested_at: tie broken by attempt_id
    const tieEvents: ChargingEvent[] = [
      {
        event_id: "EVT-TIE-2",
        transaction_id: "TX-TIE",
        attempt_id: "ATT-2",
        event_at: "2026-11-14T08:00:00Z",
        ingested_at: "2026-11-14T08:00:01Z",
        status: "success",
        service_type: "voice",
      },
      {
        event_id: "EVT-TIE-1",
        transaction_id: "TX-TIE",
        attempt_id: "ATT-1",
        event_at: "2026-11-14T08:00:00Z",
        ingested_at: "2026-11-14T08:00:01Z",
        status: "failed",
        error_code: "E_SYN_TIMEOUT",
        service_type: "voice",
      },
    ];

    const summary = resolveTransactionState(tieEvents, new Date("2026-11-14T09:00:00Z"));
    // ATT-2 comes after ATT-1 in tie-breaking, so canonicalState is success
    expect(summary?.canonicalState).toBe("success");
  });

  it("8. Ranks top error codes deterministically", () => {
    const errorEvents: ChargingEvent[] = [
      {
        event_id: "E-1",
        transaction_id: "TX-E1",
        attempt_id: "ATT-1",
        event_at: "2026-11-14T08:00:00Z",
        ingested_at: "2026-11-14T08:00:01Z",
        status: "failed",
        error_code: "E_SYN_TIMEOUT",
        service_type: "voice",
      },
      {
        event_id: "E-2",
        transaction_id: "TX-E2",
        attempt_id: "ATT-1",
        event_at: "2026-11-14T08:01:00Z",
        ingested_at: "2026-11-14T08:01:01Z",
        status: "failed",
        error_code: "E_SYN_TIMEOUT",
        service_type: "voice",
      },
      {
        event_id: "E-3",
        transaction_id: "TX-E3",
        attempt_id: "ATT-1",
        event_at: "2026-11-14T08:02:00Z",
        ingested_at: "2026-11-14T08:02:01Z",
        status: "failed",
        error_code: "E_SYN_INSUFFICIENT_FUNDS",
        service_type: "sms",
      },
    ];

    const result = calculateMetrics(errorEvents, {
      from: "2026-11-14T08:00:00Z",
      to: "2026-11-14T08:05:00Z",
    });

    expect(result.topErrors.length).toBe(2);
    expect(result.topErrors[0].code).toBe("E_SYN_TIMEOUT");
    expect(result.topErrors[0].count).toBe(2);
    expect(result.topErrors[0].percentage).toBe(66.67);
    expect(result.topErrors[1].code).toBe("E_SYN_INSUFFICIENT_FUNDS");
    expect(result.topErrors[1].count).toBe(1);
    expect(result.topErrors[1].percentage).toBe(33.33);
  });
});
