/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E9.3), consumer: routes allocazione, gate: gate_3_implementation}
Dominio puro allocazione (AD-19, RF-19..21): settimane ISO, carico settimanale, sovra-allocazione.
Date ISO YYYY-MM-DD; settimane lunedì–domenica; intersezioni inclusive.
*/
import type { Assegnazione, AvvisoSovra, CaricoSettimana } from "@ws/shared";

const GIORNO_MS = 86_400_000;

function ms(data: string): number {
  return new Date(data + "T00:00:00Z").getTime();
}

function iso(data: Date): string {
  return data.toISOString().slice(0, 10);
}

/** Lunedì della settimana ISO contenente la data. */
function lunediDi(data: string): Date {
  const d = new Date(ms(data));
  const giorno = (d.getUTCDay() + 6) % 7; // 0 = lunedì
  d.setUTCDate(d.getUTCDate() - giorno);
  return d;
}

export interface Settimana {
  numero: string; // "W38"
  inizio: string;
  fine: string;
}

/**
 * Settimane ISO (lun–dom) che coprono [dal, al], incluse anche parziali.
 * Un intervallo che termina di sabato genera comunque la settimana in corso (troncata a al).
 */
export function settimaneIntervallo(dal: string, al: string): Settimana[] {
  const settimane: Settimana[] = [];
  let corrente = lunediDi(dal);
  const fine = ms(al);
  let guardia = 0;
  while (ms(iso(corrente)) <= fine && guardia < 520) {
    const inizioSettimana = new Date(corrente);
    const fineSettimanaMs = ms(iso(corrente)) + 6 * GIORNO_MS;
    const fineEffettiva = fineSettimanaMs > fine ? new Date(fine) : new Date(fineSettimanaMs);
    const anno = corrente.getUTCFullYear();
    const inizioAnno = new Date(Date.UTC(anno, 0, 1));
    const giornoAnno = Math.round((ms(iso(corrente)) - ms(iso(inizioAnno))) / GIORNO_MS);
    const numero = Math.ceil((giornoAnno + 1) / 7);
    settimane.push({ numero: `W${numero}`, inizio: iso(inizioSettimana), fine: iso(fineEffettiva) });
    corrente = new Date(ms(iso(corrente)) + 7 * GIORNO_MS);
    guardia += 1;
  }
  return settimane;
}

/** Intersezione inclusiva assegnazione ↔ settimana. */
function interseca(a: Pick<Assegnazione, "dal" | "al">, settimana: Settimana): boolean {
  return a.dal <= settimana.fine && settimana.inizio <= a.al;
}

/**
 * Carico settimanale per un membro: somma delle % delle assegnazioni che intersecano la
 * settimana, rapportata alla capacità (capacitaPunti = % di impegno pieno dichiarata).
 */
export function caricoSettimanale(
  assegnazioni: Pick<Assegnazione, "percento" | "dal" | "al">[],
  capacitaPunti: number,
  settimane: Settimana[]
): CaricoSettimana[] {
  return settimane.map(settimana => {
    const impegno = assegnazioni
      .filter(a => interseca(a, settimana))
      .reduce((somma, a) => somma + a.percento, 0);
    const rapportato = capacitaPunti > 0 ? Math.round((impegno / capacitaPunti) * 100) : impegno;
    return {
      settimana: settimana.numero,
      inizio: settimana.inizio,
      fine: settimana.fine,
      impegno: rapportato,
      sovraallocata: rapportato > 100,
    };
  });
}

/** Avvisi di sovra-allocazione (RF-20) dalle righe carico. */
export function avvisiSovra(righe: { memberId: number; nome: string; capacitaPunti: number; carico: CaricoSettimana[] }[]): AvvisoSovra[] {
  const avvisi: AvvisoSovra[] = [];
  for (const riga of righe) {
    for (const settimana of riga.carico) {
      if (settimana.sovraallocata) {
        avvisi.push({
          memberId: riga.memberId,
          nome: riga.nome,
          settimana: settimana.settimana,
          impegno: settimana.impegno,
          capacita: riga.capacitaPunti,
        });
      }
    }
  }
  return avvisi;
}
