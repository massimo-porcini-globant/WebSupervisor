/*
flow: {phase: 6-verify, producer: agent/GLM-5.3-Flash (E10.1), consumer: gate_3 evidence, gate: gate_3_implementation}
Test unit dominio export Excel (E10.1).
*/
import { describe, it, expect } from "vitest";
import ExcelJS from "exceljs";
import { foglioAttivita, foglioAllocazione, scrivi } from "./export.js";

describe("foglioAttivita", () => {
  it("crea foglio con intestazione, righe attività e filtro automatico", async () => {
    const wb = new ExcelJS.Workbook();
    const foglio = foglioAttivita(wb, {
      progetto: "Demo",
      attivita: [
        { nome: "Analisi", fase: "Analisi", inizio: "2026-09-01", fine: "2026-09-05", stato: "in-corso", stimaOre: 8, lavorateOre: 4, critica: true },
        { nome: "Design", fase: null, inizio: "2026-09-06", fine: "2026-09-09", stato: "da-iniziare", stimaOre: null, lavorateOre: null },
      ],
    });
    expect(foglio.name).toBe("Attività");
    expect(foglio.getRow(3).getCell(1).value).toBe("Attività");
    expect(foglio.getRow(3).getCell(1).font?.bold).toBe(true);
    expect(foglio.getRow(4).getCell(1).value).toBe("Analisi");
    expect(foglio.getRow(4).getCell(8).value).toBe("Sì");
    expect(foglio.autoFilter).toEqual({ from: { row: 3, column: 1 }, to: { row: 3, column: 8 } });
  });

  it("serializza in buffer con firma ZIP (PK)", async () => {
    const wb = new ExcelJS.Workbook();
    foglioAttivita(wb, { progetto: "Demo", attivita: [] });
    const buffer = await scrivi(wb);
    expect(buffer.length).toBeGreaterThan(0);
    expect(buffer.subarray(0, 2).toString("latin1")).toBe("PK");
  });
});

describe("foglioAllocazione", () => {
  it("crea fogli allocazione + sovra con righe carico", async () => {
    const wb = new ExcelJS.Workbook();
    foglioAllocazione(wb, {
      dal: "2026-09-14",
      al: "2026-09-27",
      righe: [
        {
          memberId: 1,
          nome: "Luca",
          capacitaPunti: 80,
          assegnazioni: [
            { assegnazione: { id: 1, taskId: 1, memberId: 1, percento: 60, dal: "2026-09-14", al: "2026-09-18" }, attivita: "Front-end", progetto: "Demo" },
          ],
          carico: [
            { settimana: "W38", inizio: "2026-09-14", fine: "2026-09-18", impegno: 75, sovraallocata: false },
            { settimana: "W39", inizio: "2026-09-21", fine: "2026-09-27", impegno: 0, sovraallocata: false },
          ],
        },
      ],
      avvisi: [{ memberId: 2, nome: "Sara", settimana: "W38", impegno: 125, capacita: 80 }],
    });
    const allocazione = wb.getWorksheet("Allocazione")!;
    expect(allocazione.getRow(3).getCell(1).value).toBe("Membro");
    const avvisi = wb.getWorksheet("Sovra-allocazioni")!;
    expect(avvisi.getRow(2).getCell(1).value).toBe("Sara");
    expect(avvisi.getRow(2).getCell(3).value).toBe(125);
  });
});
