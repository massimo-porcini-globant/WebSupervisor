/*
flow: {phase: 6-verify, producer: agent/GLM-5.3-Flash (E9.3), consumer: gate_3 evidence, gate: gate_3_implementation}
Test unit dominio allocazione (E9.3): settimane ISO, intersezioni, carico, sovra-allocazione.
*/
import { describe, it, expect } from "vitest";
import { settimaneIntervallo, caricoSettimanale, avvisiSovra } from "./allocazione.js";

describe("settimaneIntervallo", () => {
  it("settimana singola (lun–ven)", () => {
    const s = settimaneIntervallo("2026-09-14", "2026-09-18");
    expect(s).toHaveLength(1);
    expect(s[0]!.inizio).toBe("2026-09-14");
    expect(s[0]!.fine).toBe("2026-09-18");
    expect(s[0]!.numero).toMatch(/^W\d+$/);
  });

  it("intervallo che attraversa due settimane", () => {
    const s = settimaneIntervallo("2026-09-17", "2026-09-22");
    expect(s).toHaveLength(2);
    expect(s[0]!.inizio).toBe("2026-09-14");
    expect(s[1]!.fine).toBe("2026-09-22"); // troncata alla fine intervallo
  });

  it("domenica singola → una settimana", () => {
    expect(settimaneIntervallo("2026-09-20", "2026-09-20")).toHaveLength(1);
  });
});

describe("caricoSettimanale", () => {
  const settimane = settimaneIntervallo("2026-09-14", "2026-09-27");

  it("somma assegnazioni sovrapposte e rapporta alla capacità", () => {
    const carico = caricoSettimanale(
      [
        { percento: 60, dal: "2026-09-14", al: "2026-09-18" },
        { percento: 60, dal: "2026-09-14", al: "2026-09-18" },
      ],
      80,
      settimane
    );
    expect(carico[0]!.impegno).toBe(150); // (60+60)/80 → 150%
    expect(carico[0]!.sovraallocata).toBe(true);
    expect(carico[1]!.impegno).toBe(0);
    expect(carico[1]!.sovraallocata).toBe(false);
  });

  it("intersezione parziale conta la settimana", () => {
    const carico = caricoSettimanale([{ percento: 50, dal: "2026-09-18", al: "2026-09-21" }], 100, settimane);
    expect(carico[0]!.impegno).toBe(50);
    expect(carico[1]!.impegno).toBe(50);
  });

  it("nessuna assegnazione → impegno 0", () => {
    const carico = caricoSettimanale([], 100, settimane);
    expect(carico.every(c => c.impegno === 0 && !c.sovraallocata)).toBe(true);
  });

  it("capacità 100: esattamente 100 non è sovra-allocazione", () => {
    const carico = caricoSettimanale([{ percento: 100, dal: "2026-09-14", al: "2026-09-14" }], 100, settimane);
    expect(carico[0]!.sovraallocata).toBe(false);
  });
});

describe("avvisiSovra", () => {
  it("genera avvisi solo per settimane sovra-allocate", () => {
    const avvisi = avvisiSovra([
      {
        memberId: 1,
        nome: "Luca",
        capacitaPunti: 80,
        carico: [
          { settimana: "W38", inizio: "2026-09-14", fine: "2026-09-18", impegno: 125, sovraallocata: true },
          { settimana: "W39", inizio: "2026-09-21", fine: "2026-09-27", impegno: 95, sovraallocata: false },
        ],
      },
    ]);
    expect(avvisi).toHaveLength(1);
    expect(avvisi[0]).toMatchObject({ nome: "Luca", settimana: "W38", impegno: 125, capacita: 80 });
  });
});
