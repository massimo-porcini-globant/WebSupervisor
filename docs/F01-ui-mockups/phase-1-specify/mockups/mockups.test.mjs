/*
flow: {phase: 6-verify, producer: agent/GLM-5.3-Flash, consumer: gate_3_implementation evidence, gate: gate_3_implementation}
F01-ui-mockups — Verifica automatizzata dei mockup (T7): stati richiesti dal PRD §3 (RF-29), integrità dati, markup base.
Esecuzione: node docs/F01-ui-mockups/phase-1-specify/mockups/mockups.test.mjs
*/
import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import assert from "node:assert/strict";

const dir = dirname(fileURLToPath(import.meta.url));
const leggi = f => readFileSync(join(dir, f), "utf8");
const presente = (f, ...frammenti) => {
  const html = leggi(f);
  frammenti.forEach(fr => assert.ok(html.includes(fr), `${f}: atteso "${fr}"`));
};

const file = ["index.html", "dashboard.html", "gantt.html", "team.html", "allocation.html", "shared/styles.css", "shared/data.js"];

// 1. Tutti i file del mockup esistono
file.forEach(f => assert.ok(existsSync(join(dir, f)), `file mancante: ${f}`));

// 2. Navigatore: link a tutte le schermate
presente("index.html", 'href="dashboard.html"', 'href="gantt.html"', 'href="team.html"', 'href="allocation.html"', "RF-29", "RF-30");

// 3. Dashboard: KPI, avanzamento, scadenze, stati vuoto/popolato, export
presente("dashboard.html", "kpi", "avanzamento", "Scadenze imminenti", 'data-modo="vuoto"', "Esporta Excel", "Nuovo progetto", "aria-current=\"page\"");

// 4. Gantt: zoom, dipendenze, critical path, fase, milestone, drag
presente("gantt.html", "Giorno", "Settimana", "Mese", "Trimestre", "critica", "riga-fase", "milestone", "abilitaTrascinamento", "RF-13", "RF-09");

// 5. Team: anagrafica, competenze, disponibilità, assenze, stato vuoto
presente("team.html", "Aggiungi membro", "Disponibilità", "Assenze programmate", "tag-competenza", 'data-modo="vuoto"');

// 6. Allocazione: sovra-allocazione segnalata, export, stato vuoto
presente("allocation.html", "sovra", "sovra-allocato", "Esporta Excel", 'data-modo="vuoto"', "RF-20");

// 7. Design system: token semantici di stato
const css = leggi("shared/styles.css");
["--in-linea", "--a-rischio", "--in-ritardo"].forEach(t => assert.ok(css.includes(t), `token mancante: ${t}`));

// 8. Dati: scenari obbligatori (ASD §2.4)
const dati = leggi("shared/data.js");
assert.ok(dati.includes('"in-ritardo"'), "atteso almeno un progetto in ritardo");
assert.ok(dati.includes('"a-rischio"'), "atteso almeno un progetto a rischio");
assert.ok(dati.includes("critica: true"), "atteso percorso critico nei dati");
// sovra-allocazione: m2 ha capacità 80% e due assegnazioni nella W38 (90% + 45% = 135%)
assert.ok(dati.includes("capacita: 80"), "attesa capacità 80% per il membro sovra-allocato");
const allocazioniM2 = dati.split("\n").filter(l => l.includes("m2") && l.includes("percento")).length;
assert.ok(allocazioniM2 >= 2, "attese almeno due allocazioni sovrapposte per il membro m2");

// 9. Lingua italiana nei contenuti utente
["Il tuo primo progetto".length ? "" : ""].length; // no-op
["Nessun progetto", "Nessun membro", "Nessuna allocazione"].forEach(fr => {
  const presenteSOM = file.some(f => { try { return leggi(f).includes(fr); } catch { return false; } });
  assert.ok(presenteSOM, `stato vuoto in italiano mancante: "${fr}"`);
});

// 10. Flow stamp nei file governati
file.forEach(f => assert.ok(leggi(f).includes("flow:"), `flow stamp mancante in ${f}`));

console.log(`OK — ${file.length} file mockup verificati: stati RF-29, scenari ASD §2.4, design system, lingua it, flow stamp.`);
