/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E2.4), consumer: routes progetti, gate: gate_3_implementation}
Dominio avanzamento progetti (AD-6): funzioni pure, nessuna dipendenza DB/UI. Date ISO YYYY-MM-DD, "oggi" iniettato.
*/

export type StatoTask = "da-iniziare" | "in-corso" | "completata" | "in-ritardo";
export type StatoProgetto = "in-linea" | "a-rischio" | "in-ritardo";

export interface AttivitaPerAvanzamento {
  stato: StatoTask;
  stimaOre: number | null;
  lavorateOre?: number | null;
}

const GIORNO_MS = 86_400_000;

function ms(data: string): number {
  return new Date(data + "T00:00:00Z").getTime();
}

/**
 * % avanzamento pesato (stima_ore se presente e > 0, altrimenti peso 1). null se nessuna attività.
 * F11 (AD-28): per attività con stima ore, il contributo incorpora le ore lavorate
 * (clamp 0..stima) quando non completate; completata = pieno peso. Senza stima ore, solo lo stato.
 */
export function calcolaAvanzamentoProgetto(attivita: AttivitaPerAvanzamento[]): number | null {
  let pesoTotale = 0;
  let pesoAvanzato = 0;
  for (const a of attivita) {
    const peso = a.stimaOre !== null && a.stimaOre > 0 ? a.stimaOre : 1;
    pesoTotale += peso;
    if (a.stato === "completata") {
      pesoAvanzato += peso;
    } else if (a.stimaOre !== null && a.stimaOre > 0 && typeof a.lavorateOre === "number") {
      pesoAvanzato += Math.max(0, Math.min(a.lavorateOre, a.stimaOre));
    }
  }
  if (pesoTotale === 0) return null;
  return Math.round((pesoAvanzato / pesoTotale) * 100);
}

/**
 * Stato derivato: completato/da-iniziare → in-linea; oltre fine non completato → in-ritardo;
 * avanzamento sotto la curva attesa (tolleranza 15 punti) → a-rischio.
 */
export function derivaStatoProgetto(
  progetto: { inizio: string; fine: string },
  avanzamento: number | null,
  oggi: string
): StatoProgetto {
  const durataGiorni = Math.max(1, Math.round((ms(progetto.fine) - ms(progetto.inizio)) / GIORNO_MS));
  const giorniTrascorsi = Math.round((ms(oggi) - ms(progetto.inizio)) / GIORNO_MS);
  const giorniRitardo = Math.round((ms(oggi) - ms(progetto.fine)) / GIORNO_MS);

  if (avanzamento !== null && avanzamento >= 100) return "in-linea";
  if (giorniRitardo > 0) return "in-ritardo";
  if (avanzamento === null) return "in-linea";

  const trascorsiClampati = Math.max(0, Math.min(durataGiorni, giorniTrascorsi));
  const atteso = Math.floor((100 * trascorsiClampati) / durataGiorni);
  const tolleranza = 15;
  if (avanzamento < atteso - tolleranza) return "a-rischio";
  return "in-linea";
}
