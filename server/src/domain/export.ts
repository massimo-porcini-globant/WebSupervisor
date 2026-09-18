/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E10.1), consumer: routes export, gate: gate_3_implementation}
Dominio puro export Excel (AD-25, RF-22/23): fogli attività e allocazione con intestazioni in
grassetto, filtri automatici e colonne dimensionate (base RF-25).
*/
import ExcelJS from "exceljs";
import type { Attivita, AvvisoSovra, RigaPiano } from "@ws/shared";

const TESTATA = { font: { bold: true } as ExcelJS.Font };

function dimensiona(foglio: ExcelJS.Worksheet, larghezze: number[]): void {
  foglio.columns = larghezze.map(larghezza => ({ width: larghezza }));
}

/** RF-22: foglio attività di un progetto (nome, fase, date, stato, ore). */
export function foglioAttivita(
  workbook: ExcelJS.Workbook,
  dati: { progetto: string; attivita: (Pick<Attivita, "nome" | "fase" | "inizio" | "fine" | "stato" | "stimaOre" | "lavorateOre"> & { critica?: boolean })[] }
): ExcelJS.Worksheet {
  const foglio = workbook.addWorksheet("Attività");
  foglio.addRow(["Progetto", dati.progetto]);
  foglio.addRow([]);
  const testata = foglio.addRow(["Attività", "Fase", "Inizio", "Fine", "Stato", "Stima ore", "Lavorate ore", "Critica (CPM)"]);
  testata.eachCell(cellula => (cellula.font = TESTATA.font));
  for (const a of dati.attivita) {
    foglio.addRow([a.nome, a.fase ?? "", a.inizio, a.fine, a.stato, a.stimaOre ?? "", a.lavorateOre ?? "", a.critica ? "Sì" : ""]);
  }
  foglio.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: 8 } };
  dimensiona(foglio, [30, 16, 12, 12, 14, 10, 12, 13]);
  return foglio;
}

/** RF-23: fogli piano allocazione + avvisi sovra-allocazione. */
export function foglioAllocazione(
  workbook: ExcelJS.Workbook,
  dati: { dal: string; al: string; righe: RigaPiano[]; avvisi: AvvisoSovra[] }
): ExcelJS.Worksheet {
  const foglio = workbook.addWorksheet("Allocazione");
  foglio.addRow(["Intervallo", `${dati.dal} → ${dati.al}`]);
  foglio.addRow([]);

  const testata = foglio.addRow(["Membro", "Assegnazione (attività · progetto · %)", "Periodo", "Settimana", "Impegno %", "Sovra-allocazione"]);
  testata.eachCell(cellula => (cellula.font = TESTATA.font));

  for (const riga of dati.righe) {
    if (riga.assegnazioni.length === 0) {
      foglio.addRow([riga.nome, "—", "", "", "", ""]);
      for (const c of riga.carico) foglio.addRow(["", "", "", c.settimana, c.impegno, c.sovraallocata ? "SÌ" : ""]);
      continue;
    }
    for (const assegnazione of riga.assegnazioni) {
      const [prima, ...altre] = riga.carico;
      foglio.addRow([
        riga.nome,
        `${assegnazione.attivita} · ${assegnazione.progetto} · ${assegnazione.assegnazione.percento}%`,
        `${assegnazione.assegnazione.dal} → ${assegnazione.assegnazione.al}`,
        prima?.settimana ?? "",
        prima?.impegno ?? "",
        prima?.sovraallocata ? "SÌ" : "",
      ]);
      for (const c of altre ?? []) {
        foglio.addRow(["", "", "", c.settimana, c.impegno, c.sovraallocata ? "SÌ" : ""]);
      }
    }
  }
  foglio.autoFilter = { from: { row: 3, column: 1 }, to: { row: 3, column: 6 } };
  dimensiona(foglio, [20, 46, 26, 12, 12, 20]);

  const avvisi = workbook.addWorksheet("Sovra-allocazioni");
  const testataAvvisi = avvisi.addRow(["Membro", "Settimana", "Impegno %", "Capacità %"]);
  testataAvvisi.eachCell(cellula => (cellula.font = TESTATA.font));
  for (const a of dati.avvisi) {
    avvisi.addRow([a.nome, a.settimana, a.impegno, a.capacita]);
  }
  dimensiona(avvisi, [24, 14, 12, 12]);
  return foglio;
}

/** Serializza il workbook in Buffer per la risposta HTTP. */
export async function scrivi(workbook: ExcelJS.Workbook): Promise<Buffer> {
  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer as ArrayBuffer);
}
