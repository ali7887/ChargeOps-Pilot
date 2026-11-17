import { describe, it, expect } from "vitest";
import {
  retrieveRunbookSections,
  isSectionActive,
  SYNTHETIC_RUNBOOKS,
} from "../lib/retrieval";

describe("Phase 4: Operational Runbook Retrieval & Citations", () => {
  it("1. Performs exact error-code lookup for E_SYN_TIMEOUT and returns citations", async () => {
    const result = await retrieveRunbookSections({ errorCode: "E_SYN_TIMEOUT" });

    expect(result.matchType).toBe("exact");
    expect(result.totalFound).toBeGreaterThanOrEqual(1);

    const section = result.sections[0];
    expect(section.doc_id).toBe("RB-SYN-001");
    expect(section.version).toBe("v1.2");
    expect(section.section_id).toBe("SEC-TIMEOUT");
    expect(section.excerpt).toContain("پنجره زمانی مجاز");
    expect(section.errorCodes).toContain("E_SYN_TIMEOUT");
  });

  it("2. Returns none for unknown error codes without fabricating documentation", async () => {
    const result = await retrieveRunbookSections({ errorCode: "UNKNOWN_NONEXISTENT_CODE" });

    expect(result.matchType).toBe("none");
    expect(result.sections).toHaveLength(0);
    expect(result.totalFound).toBe(0);
  });

  it("3. Strictly excludes deprecated or expired runbook sections", async () => {
    // SEC-DEPRECATED in RB-SYN-004 has status 'deprecated' and expired effective_to
    const deprecatedSection = SYNTHETIC_RUNBOOKS.find(
      (s) => s.section_id === "SEC-DEPRECATED"
    );
    expect(deprecatedSection).toBeDefined();

    // Verification through isSectionActive
    const active = isSectionActive(deprecatedSection!);
    expect(active).toBe(false);

    // Verification through retrieval
    const result = await retrieveRunbookSections({ errorCode: "E_SYN_OLD_LIMIT" });
    expect(result.totalFound).toBe(0);
  });

  it("4. Performs lexical full-text search and preserves citation structure", async () => {
    const result = await retrieveRunbookSections({ searchTerm: "سوکت TCP" });

    expect(result.matchType).toBe("full_text");
    expect(result.totalFound).toBe(1);

    const section = result.sections[0];
    expect(section.doc_id).toBe("RB-SYN-002");
    expect(section.section_id).toBe("SEC-NET-DROP");
    expect(section.title).toContain("قطعی نشست شبکه");
  });

  it("5. Asserts citations contain doc_id, version, and section_id", async () => {
    const result = await retrieveRunbookSections({ errorCode: "E_SYN_GATEWAY_ERR" });

    expect(result.totalFound).toBe(1);
    const section = result.sections[0];
    expect(section.doc_id).toBeDefined();
    expect(section.version).toBeDefined();
    expect(section.section_id).toBeDefined();
  });
});
