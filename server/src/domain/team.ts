/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E5.2), consumer: routes team, gate: gate_3_implementation}
Dominio puro team (AD-9/AD-12): capacità complessiva e validazione periodi assenza (nessuna
sovrapposizione per lo stesso membro). Nessuna dipendenza da DB o UI.
*/
import type { Assenza } from "@ws/shared";

/** Somma dei punti capacità dei membri (AD-12). */
export function capacitaComplessiva(capacitaPunti: number[]): number {
  return capacitaPunti.reduce((somma, punti) => somma + punti, 0);
}

/**
 * True se il periodo [dal, al] è incluso come assenza già registrata per lo stesso membro
 * (sovrapposizione di date). Le assenze esistenti non devono sovrapporsi tra loro.
 */
export function assenzaSovrapposta(nuova: Pick<Assenza, "dal" | "al">, esistenti: Pick<Assenza, "dal" | "al">[]): boolean {
  return esistenti.some(a => nuova.dal <= a.al && a.dal <= nuova.al);
}
