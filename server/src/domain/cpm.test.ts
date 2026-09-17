/*
flow: {phase: 6-verify, producer: agent/GLM-5.3-Flash (E4.5), consumer: gate_3 evidence, gate: gate_3_implementation}
Test unit CPM (AD-7): catena, rami paralleli, rombo, attività isolate, durate 1 giorno, margine e criticità.
*/
import { describe, it, expect } from "vitest";
import { calcolaCpm, durataGiorni, ordineTopologico } from "./cpm.js";

function a(id: number, inizio: string, fine: string) {
  return { id, inizio, fine };
}

describe("durataGiorni", () => {
  it("stesso giorno → 1", () => {
    expect(durataGiorni("2026-09-01", "2026-09-01")).toBe(1);
  });

  it("settimana inclusiva → 7", () => {
    expect(durataGiorni("2026-09-01", "2026-09-07")).toBe(7);
  });

  it("date invertite → minimo 1", () => {
    expect(durataGiorni("2026-09-07", "2026-09-01")).toBe(1);
  });
});

describe("ordineTopologico", () => {
  it("catena a→b→c", () => {
    const ordine = ordineTopologico([1, 2, 3], [
      { taskId: 2, dependsOn: 1 },
      { taskId: 3, dependsOn: 2 },
    ]);
    expect(ordine.indexOf(1)).toBeLessThan(ordine.indexOf(2));
    expect(ordine.indexOf(2)).toBeLessThan(ordine.indexOf(3));
  });

  it("senza dipendenze → qualunque ordine completo", () => {
    expect(ordineTopologico([3, 1, 2], []).sort()).toEqual([1, 2, 3]);
  });
});

describe("calcolaCpm", () => {
  it("vuoto → mappa vuota", () => {
    const r = calcolaCpm([], []);
    expect(r.nodi.size).toBe(0);
    expect(r.fineProgetto).toBe(0);
  });

  it("catena: tutti critici, margine 0", () => {
    // A 1-5 set (5gg) → B 5-9 (5gg) → C 9-10 (2gg)
    const r = calcolaCpm(
      [a(1, "2026-09-01", "2026-09-05"), a(2, "2026-09-05", "2026-09-09"), a(3, "2026-09-09", "2026-09-10")],
      [
        { taskId: 2, dependsOn: 1 },
        { taskId: 3, dependsOn: 2 },
      ]
    );
    for (const nodo of r.nodi.values()) {
      expect(nodo.critica).toBe(true);
      expect(nodo.margine).toBe(0);
    }
    // C parte al più presto il 11/9 (B EF=9, offset 9 → C ES 10)
    expect(r.fineProgetto).toBe(11);
  });

  it("due rami paralleli: solo il ramo più lungo è critico", () => {
    // A (10gg) → B (5gg); A → C (2gg). Critico: A, B. C ha margine 3.
    const r = calcolaCpm(
      [a(1, "2026-09-01", "2026-09-10"), a(2, "2026-09-11", "2026-09-15"), a(3, "2026-09-11", "2026-09-12")],
      [
        { taskId: 2, dependsOn: 1 },
        { taskId: 3, dependsOn: 1 },
      ]
    );
    expect(r.nodi.get(1)!.critica).toBe(true);
    expect(r.nodi.get(2)!.critica).toBe(true);
    expect(r.nodi.get(3)!.critica).toBe(false);
    expect(r.nodi.get(3)!.margine).toBe(3);
    // B parte al più presto il giorno successivo alla fine di A
    expect(r.nodi.get(2)!.earlyStart).toBe(10);
    expect(r.nodi.get(3)!.earlyStart).toBe(10);
  });

  it("rombo (divergenza+convergenza): margine del ramo corto", () => {
    // A(4) → B(10) e A → C(3); B e C → D(5)
    const r = calcolaCpm(
      [a(1, "2026-09-01", "2026-09-04"), a(2, "2026-09-05", "2026-09-14"), a(3, "2026-09-05", "2026-09-07"), a(4, "2026-09-15", "2026-09-19")],
      [
        { taskId: 2, dependsOn: 1 },
        { taskId: 3, dependsOn: 1 },
        { taskId: 4, dependsOn: 2 },
        { taskId: 4, dependsOn: 3 },
      ]
    );
    expect(r.nodi.get(2)!.critica).toBe(true);
    expect(r.nodi.get(3)!.critica).toBe(false);
    expect(r.nodi.get(3)!.margine).toBe(7); // C può finire al più tardi il giorno prima di B EF
    expect(r.nodi.get(4)!.critica).toBe(true);
  });

  it("attività isolata: margine fino a fine progetto, non critica se altre più lunghe", () => {
    const r = calcolaCpm([a(1, "2026-09-01", "2026-09-02"), a(2, "2026-09-01", "2026-09-30")], []);
    expect(r.nodi.get(1)!.critica).toBe(false);
    expect(r.nodi.get(2)!.critica).toBe(true);
    expect(r.nodi.get(1)!.margine).toBe(28);
  });

  it("dipendenza che ritarda l'ES rispetto all'inizio pianificato", () => {
    // A 1-10; B pianificato 9-12 ma deve aspettare A (finisce il 10) → ES 11
    const r = calcolaCpm(
      [a(1, "2026-09-01", "2026-09-10"), a(2, "2026-09-09", "2026-09-12")],
      [{ taskId: 2, dependsOn: 1 }]
    );
    expect(r.nodi.get(2)!.earlyStart).toBe(10); // offset: A EF = 9 (10gg dal 0), B ES = 10
    expect(r.nodi.get(2)!.critica).toBe(true);
  });
});
