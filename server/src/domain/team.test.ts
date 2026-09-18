/*
flow: {phase: 6-verify, producer: agent/GLM-5.3-Flash (E5.2), consumer: gate_3 evidence, gate: gate_3_implementation}
Test unit dominio team (E5.2).
*/
import { describe, it, expect } from "vitest";
import { capacitaComplessiva, assenzaSovrapposta } from "./team.js";

describe("capacitaComplessiva", () => {
  it("somma i punti capacità", () => {
    expect(capacitaComplessiva([100, 50, 80])).toBe(230);
  });

  it("vuoto → 0", () => {
    expect(capacitaComplessiva([])).toBe(0);
  });
});

describe("assenzaSovrapposta", () => {
  const esistenti = [{ dal: "2026-07-01", al: "2026-07-10" }];

  it("sovrapposizione parziale → true", () => {
    expect(assenzaSovrapposta({ dal: "2026-07-10", al: "2026-07-15" }, esistenti)).toBe(true);
    expect(assenzaSovrapposta({ dal: "2026-06-25", al: "2026-07-01" }, esistenti)).toBe(true);
  });

  it("contenuta → true", () => {
    expect(assenzaSovrapposta({ dal: "2026-07-03", al: "2026-07-05" }, esistenti)).toBe(true);
  });

  it("adiacente (giorno dopo) → false", () => {
    expect(assenzaSovrapposta({ dal: "2026-07-11", al: "2026-07-15" }, esistenti)).toBe(false);
    expect(assenzaSovrapposta({ dal: "2026-06-20", al: "2026-06-30" }, esistenti)).toBe(false);
  });

  it("lista vuota → false", () => {
    expect(assenzaSovrapposta({ dal: "2026-07-01", al: "2026-07-10" }, [])).toBe(false);
  });
});
