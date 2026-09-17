/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E3.1/E3.3), consumer: routes attivita, gate: gate_3_implementation}
Dominio attività (AD-6): rilevamento cicli dipendenze (DFS) e KPI riepilogo. Funzioni pure, "oggi" iniettato.
*/
import type { Attivita, KpiProgetto } from "@ws/shared";

const GIORNO_MS = 86_400_000;
const GIORNI_SCADENZE = 10;

/**
 * Verifica se l'arco (taskId → dependsOn) crea un ciclo nel grafo delle dipendenze esistenti.
 * archi: coppie [task, dipendenza] già presenti (task dipende da dipendenza).
 * Restituisce true se l'aggiunta crea un ciclo.
 */
export function rilevaCiclo(
  taskId: number,
  dependsOn: number,
  archi: ReadonlyArray<{ taskId: number; dependsOn: number }>
): boolean {
  if (taskId === dependsOn) return true;

  // Percorriamo all'indietro da dependsOn: se risalendo le dipendenze raggiungiamo taskId, si crea un ciclo.
  const dipendenzeDi = new Map<number, number[]>();
  for (const arco of archi) {
    const lista = dipendenzeDi.get(arco.taskId) ?? [];
    lista.push(arco.dependsOn);
    dipendenzeDi.set(arco.taskId, lista);
  }

  const daVisitare = [dependsOn];
  const visti = new Set<number>();
  while (daVisitare.length > 0) {
    const attuale = daVisitare.pop()!;
    if (attuale === taskId) return true;
    if (visti.has(attuale)) continue;
    visti.add(attuale);
    for (const successivo of dipendenzeDi.get(attuale) ?? []) daVisitare.push(successivo);
  }
  return false;
}

/** Conteggi per stato + scadenze non completate entro GIORNI_SCADENZE da oggi (date ISO YYYY-MM-DD). */
export function calcolaKpiProgetto(attivita: Attivita[], oggi: string): KpiProgetto {
  const limite = new Date(oggi + "T00:00:00Z").getTime() + GIORNI_SCADENZE * GIORNO_MS;
  const conteggi: KpiProgetto = {
    completate: 0,
    inCorso: 0,
    daIniziare: 0,
    inRitardo: 0,
    scadenzeProssime: [],
  };
  for (const a of attivita) {
    if (a.stato === "completata") conteggi.completate++;
    else if (a.stato === "in-corso") conteggi.inCorso++;
    else if (a.stato === "da-iniziare") conteggi.daIniziare++;
    else if (a.stato === "in-ritardo") conteggi.inRitardo++;

    const fineAttivita = new Date(a.fine + "T00:00:00Z").getTime();
    if (a.stato !== "completata" && fineAttivita <= limite) {
      conteggi.scadenzeProssime.push({ id: a.id, nome: a.nome, fine: a.fine, stato: a.stato });
    }
  }
  conteggi.scadenzeProssime.sort((x, y) => x.fine.localeCompare(y.fine));
  return conteggi;
}
