/*
flow: {phase: 6-verify, producer: agent/GLM-5.3-Flash (E2.4), consumer: gate_3 evidence, gate: gate_3_implementation}
Test unit dominio avanzamento (AD-6): pesi, casi limite, derivazione stato con date fisse.
*/
import { describe, it, expect } from "vitest";
import { calcolaAvanzamentoProgetto, derivaStatoProgetto } from "./avanzamento.js";

describe("calcolaAvanzamentoProgetto (E2.4)", () => {
  it("nessuna attività → null", () => {
    expect(calcolaAvanzamentoProgetto([])).toBeNull();
  });

  it("pesi uniformi senza stima ore", () => {
    const r = calcolaAvanzamentoProgetto([
      { stato: "completata", stimaOre: null },
      { stato: "da-iniziare", stimaOre: null },
    ]);
    expect(r).toBe(50);
  });

  it("peso per stima ore", () => {
    const r = calcolaAvanzamentoProgetto([
      { stato: "completata", stimaOre: 8 },
      { stato: "da-iniziare", stimaOre: 4 },
    ]);
    expect(r).toBe(67); // 4/6 = 66,67 → 67
  });

  it("tutte completate → 100", () => {
    const r = calcolaAvanzamentoProgetto([
      { stato: "completata", stimaOre: 10 },
      { stato: "completata", stimaOre: 6 },
    ]);
    expect(r).toBe(100);
  });

  it("stima ore nulla o zero → peso 1", () => {
    const r = calcolaAvanzamentoProgetto([
      { stato: "completata", stimaOre: 0 },
      { stato: "in-corso", stimaOre: null },
      { stato: "da-iniziare", stimaOre: null },
    ]);
    expect(r).toBe(33); // 1/3
  });
});

describe("derivaStatoProgetto", () => {
  const progetto = { inizio: "2026-09-01", fine: "2026-09-30" };

  it("avanzamento in linea con il piano → in-linea", () => {
    // a metà periodo, atteso 50%, tolleranza 15 → 50 ok
    expect(derivaStatoProgetto(progetto, 50, "2026-09-15")).toBe("in-linea");
  });

  it("avanzamento sotto attesa → a-rischio", () => {
    // a metà periodo, atteso 50%, avanzamento 30 < 35
    expect(derivaStatoProgetto(progetto, 30, "2026-09-15")).toBe("a-rischio");
  });

  it("oltre la fine non completato → in-ritardo", () => {
    expect(derivaStatoProgetto(progetto, 90, "2026-10-05")).toBe("in-ritardo");
  });

  it("completato → in-linea anche oltre la fine", () => {
    expect(derivaStatoProgetto(progetto, 100, "2026-10-05")).toBe("in-linea");
  });

  it("nessuna attività prima dell'inizio → in-linea", () => {
    expect(derivaStatoProgetto(progetto, null, "2026-08-20")).toBe("in-linea");
  });

  it("avanzamento appena sotto attesa dentro tolleranza → in-linea", () => {
    // atteso a 2026-09-25 ≈ 83%, tolleranza 15 → soglia 68; 70 → ok
    expect(derivaStatoProgetto(progetto, 70, "2026-09-25")).toBe("in-linea");
  });
});
