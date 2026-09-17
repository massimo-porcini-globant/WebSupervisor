/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E1.1), consumer: client/server, gate: gate_3_implementation}
Dizionario UI italiano (RNF-08). Le chiavi sono stabili; i testi sono i contenuti dei mockup F01.
*/
export const it = {
  app: { nome: "WebSupervisor" },
  nav: { progetti: "Progetti", gantt: "Gantt", team: "Team", risorse: "Risorse" },
  auth: {
    login: "Accedi",
    logout: "Esci",
    username: "Nome utente",
    password: "Password",
    credenzialiErrate: "Credenziali non valide",
  },
  ruoli: {
    amministratore: "Amministratore",
    project_manager: "Project Manager",
    membro: "Membro del team",
    osservatore: "Osservatore",
  },
  progetti: {
    titolo: "Progetti",
    kpiAttivi: "Progetti attivi",
    kpiInLinea: "In linea",
    kpiARischio: "A rischio",
    kpiInRitardo: "In ritardo",
    avlzTitolo: "Avanzamento progetti",
    avlzNota: "calcolato da attività completate / totali (RF-05)",
    colStato: "Stato",
    colProgetto: "Progetto",
    colTeam: "Team",
    colPriorita: "Priorità",
    colAvanzamento: "Avanzamento",
    colFine: "Fine prevista",
    nomeStato: { "in-linea": "In linea", "a-rischio": "A rischio", "in-ritardo": "In ritardo" },
    filtroTutti: "Tutti",
    filtroPrioritaAlta: "Priorità alta",
    nuovoProgetto: "Nuovo progetto",
    nessunProgetto: "Nessun progetto",
    nessunProgettoTesto: "Crea il tuo primo progetto per iniziare a pianificare attività, team e scadenze.",
    creaPrimoProgetto: "Crea il primo progetto",
    avanzamentoND: "—",
    erroreCaricamento: "Errore nel caricamento dei progetti",
    formTitolo: "Nuovo progetto",
    formNome: "Nome",
    formDescrizione: "Descrizione",
    formPriorita: "Priorità",
    formInizio: "Inizio",
    formFine: "Fine",
    formAnnulla: "Annulla",
    formCrea: "Crea",
    priorita: { alta: "Alta", media: "Media", bassa: "Bassa" },
  },
} as const;

export type Dizionario = typeof it;
