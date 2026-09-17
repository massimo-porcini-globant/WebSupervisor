/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E4.5), consumer: routes gantt, gate: gate_3_implementation}
CPM — Critical Path Method (AD-7): forward/backward pass su grafo DAG (cicli già impediti a monte).
Durate in giorni calendario inclusivi; date ISO YYYY-MM-DD. Funzioni pure.
*/
import type { Attivita, Dipendenza } from "@ws/shared";

const GIORNO_MS = 86_400_000;

export interface NodoCpm {
  earlyStart: number; // giorno 0-based dall'inizio progetto
  earlyFinish: number; // inclusivo
  lateStart: number;
  lateFinish: number;
  margine: number;
  critica: boolean;
}

export interface RisultatoCpm {
  nodi: Map<number, NodoCpm>;
  fineProgetto: number; // massimo EF (inclusivo, 0-based)
}

function ms(data: string): number {
  return new Date(data + "T00:00:00Z").getTime();
}

export function durataGiorni(inizio: string, fine: string): number {
  return Math.max(1, Math.round((ms(fine) - ms(inizio)) / GIORNO_MS) + 1);
}

/** Ordinamento topologico (Kahn): i predecessori precedono i successori. */
export function ordineTopologico(ids: number[], dipendenze: Dipendenza[]): number[] {
  const gradiEntrata = new Map<number, number>();
  for (const id of ids) gradiEntrata.set(id, 0);

  const successori = new Map<number, number[]>();
  for (const d of dipendenze) {
    gradiEntrata.set(d.taskId, (gradiEntrata.get(d.taskId) ?? 0) + 1);
    const lista = successori.get(d.dependsOn) ?? [];
    lista.push(d.taskId);
    successori.set(d.dependsOn, lista);
  }

  const coda = ids.filter(id => gradiEntrata.get(id) === 0);
  const ordine: number[] = [];
  while (coda.length > 0) {
    const nodo = coda.shift()!;
    ordine.push(nodo);
    for (const succ of successori.get(nodo) ?? []) {
      const resto = (gradiEntrata.get(succ) ?? 0) - 1;
      gradiEntrata.set(succ, resto);
      if (resto === 0) coda.push(succ);
    }
  }
  return ordine;
}

/**
 * CPM con forward pass (ordine topologico) e backward pass (ordine inverso).
 * ES di partenza = inizio pianificato (offset dal minimo); una dipendenza può ritardare
 * l'ES se il predecessore finisce dopo. Margine = LS − ES; critica ⟺ margine 0.
 * Presuppone dipendenze acicliche (garantito dalla validazione E3).
 */
export function calcolaCpm(
  attivita: Pick<Attivita, "id" | "inizio" | "fine">[],
  dipendenze: Dipendenza[]
): RisultatoCpm {
  if (attivita.length === 0) return { nodi: new Map(), fineProgetto: 0 };

  const ids = attivita.map(a => a.id);
  const inizioMinimo = Math.min(...attivita.map(a => ms(a.inizio)));
  const durata = new Map<number, number>();
  const es = new Map<number, number>();

  for (const a of attivita) {
    durata.set(a.id, durataGiorni(a.inizio, a.fine));
    es.set(a.id, Math.round((ms(a.inizio) - inizioMinimo) / GIORNO_MS));
  }

  const predecessori = new Map<number, Dipendenza[]>();
  const successori = new Map<number, Dipendenza[]>();
  for (const d of dipendenze) {
    const listaPred = predecessori.get(d.taskId) ?? [];
    listaPred.push(d);
    predecessori.set(d.taskId, listaPred);

    const listaSucc = successori.get(d.dependsOn) ?? [];
    listaSucc.push(d);
    successori.set(d.dependsOn, listaSucc);
  }

  const ordine = ordineTopologico(ids, dipendenze);

  // Forward pass
  const ef = new Map<number, number>();
  for (const id of ordine) {
    let esId = es.get(id)!;
    for (const d of predecessori.get(id) ?? []) {
      esId = Math.max(esId, ef.get(d.dependsOn)! + 1);
    }
    es.set(id, esId);
    ef.set(id, esId + durata.get(id)! - 1);
  }

  const fineProgetto = Math.max(...ef.values());

  // Backward pass: LF = min(LS dei successori) − 1 = min(LF_succ − durata_succ)
  const lf = new Map<number, number>();
  for (const id of [...ordine].reverse()) {
    const succ = successori.get(id) ?? [];
    lf.set(
      id,
      succ.length === 0 ? fineProgetto : Math.min(...succ.map(d => lf.get(d.taskId)! - durata.get(d.taskId)!))
    );
  }

  const nodi = new Map<number, NodoCpm>();
  for (const id of ids) {
    const ls = lf.get(id)! - durata.get(id)! + 1;
    const margine = ls - es.get(id)!;
    nodi.set(id, {
      earlyStart: es.get(id)!,
      earlyFinish: ef.get(id)!,
      lateStart: ls,
      lateFinish: lf.get(id)!,
      margine,
      critica: margine === 0,
    });
  }

  return { nodi, fineProgetto };
}
