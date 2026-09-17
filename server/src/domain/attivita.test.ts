/*
flow: {phase: 6-verify, producer: agent/GLM-5.3-Flash (E3.1/E3.3), consumer: gate_3 evidence, gate: gate_3_implementation}
Test unit dominio attività: rilevamento cicli dipendenze e KPI con date fisse.
*/
import { describe, it, expect } from "vitest";
import { rilevaCiclo, calcolaKpiProgetto } from "./attivita.js";
import type { Attivita } from "@ws/shared";

describe("rilevaCiclo (E3.1)", () => {
  it("auto-dipendenza → ciclo", () => {
    expect(rilevaCiclo(1, 1, [])).toBe(true);
  });

  it("catena lineare: aggiungere l'arco che chiude il cerchio crea ciclo, l'arco parallelo no", () => {
    const archi = [
      { taskId: 2, dependsOn: 1 },
      { taskId: 3, dependsOn: 2 },
    ];
    // 1→2 chiuderebbe 1→2→1 (ciclo)
    expect(rilevaCiclo(1, 2, archi)).toBe(true);
    // 3→1 è un arco parallelo inoffensivo
    expect(rilevaCiclo(3, 1, archi)).toBe(false);
  });

  it("chiusura di un ciclo indiretto → true", () => {
    const archi = [
      { taskId: 2, dependsOn: 1 },
      { taskId: 3, dependsOn: 2 },
    ];
    // 1 dipende da 3: 1→3→2→1 → ciclo
    expect(rilevaCiclo(1, 3, archi)).toBe(true);
  });

  it("dipendenza verso attività successiva (DAG) → false", () => {
    const archi = [{ taskId: 2, dependsOn: 1 }];
    expect(rilevaCiclo(2, 1, archi)).toBe(false);
  });

  it("grafo ramificato: ciclo su ramo separato non interferisce", () => {
    const archi = [
      { taskId: 2, dependsOn: 1 },
      { taskId: 3, dependsOn: 1 },
      { taskId: 4, dependsOn: 2 },
    ];
    expect(rilevaCiclo(3, 4, archi)).toBe(false);
    expect(rilevaCiclo(1, 4, archi)).toBe(true);
  });
});

function attivita(partial: Partial<Attivita> & { id: number }): Attivita {
  return {
    projectId: 1,
    nome: `A${partial.id}`,
    fase: null,
    inizio: "2026-09-01",
    fine: "2026-09-30",
    stato: "da-iniziare",
    stimaOre: null,
    lavorateOre: 0,
    ...partial,
  };
}

describe("calcolaKpiProgetto (E3.3)", () => {
  it("vuoto → tutti zero e nessuna scadenza", () => {
    const kpi = calcolaKpiProgetto([], "2026-09-17");
    expect(kpi).toEqual({ completate: 0, inCorso: 0, daIniziare: 0, inRitardo: 0, scadenzeProssime: [] });
  });

  it("conteggi per stato", () => {
    const kpi = calcolaKpiProgetto(
      [
        attivita({ id: 1, stato: "completata", fine: "2026-09-05" }),
        attivita({ id: 2, stato: "in-corso", fine: "2026-10-15" }),
        attivita({ id: 3, stato: "da-iniziare", fine: "2026-11-01" }),
        attivita({ id: 4, stato: "in-ritardo", fine: "2026-09-10" }),
      ],
      "2026-09-17"
    );
    expect(kpi.completate).toBe(1);
    expect(kpi.inCorso).toBe(1);
    expect(kpi.daIniziare).toBe(1);
    expect(kpi.inRitardo).toBe(1);
  });

  it("scadenze entro 10 giorni: include non completate, esclude completate e lontane", () => {
    const kpi = calcolaKpiProgetto(
      [
        attivita({ id: 1, stato: "da-iniziare", fine: "2026-09-20" }), // entro 10gg
        attivita({ id: 2, stato: "completata", fine: "2026-09-18" }), // completata → esclusa
        attivita({ id: 3, stato: "in-corso", fine: "2026-10-30" }), // lontana → esclusa
        attivita({ id: 4, stato: "in-ritardo", fine: "2026-09-16" }), // scaduta → inclusa
      ],
      "2026-09-17"
    );
    expect(kpi.scadenzeProssime.map(s => s.id)).toEqual([4, 1]); // ordinate per fine
  });
});
