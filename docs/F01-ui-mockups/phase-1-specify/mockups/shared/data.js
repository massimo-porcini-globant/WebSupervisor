/*
flow: {phase: 5-implement, producer: frontend-design (T1), consumer: mockup M1-M4 renderers, gate: gate_3_implementation}
F01-ui-mockups — Dati fittizi condivisi (ASD §2.4). Scenari: progetti in linea / a rischio / in ritardo, un membro sovra-allocato.
*/
window.MOCK = {
  oggi: new Date(2026, 8, 17),

  progetti: [
    { id: "P1", nome: "Piattaforma E-commerce", team: "Digital", priorita: "alta", stato: "in-linea", inizio: "2026-08-03", fine: "2026-11-27", completamento: 42 },
    { id: "P2", nome: "Migrazione CRM", team: "Systems", stato: "a-rischio", priorita: "alta", inizio: "2026-07-20", fine: "2026-10-30", completamento: 58 },
    { id: "P3", nome: "Portale Intranet", team: "Infrastrutture", stato: "in-ritardo", priorita: "media", inizio: "2026-06-15", fine: "2026-09-25", completamento: 64 },
    { id: "P4", nome: "App Prenotazioni", team: "Digital", stato: "in-linea", priorita: "bassa", inizio: "2026-09-01", fine: "2026-12-18", completamento: 11 }
  ],

  attivita: [
    // Percorso critico: A1 → A4 → A7 (dipendenze fine→inizio)
    { id: "A1", progetto: "P1", nome: "Analisi requisiti", fase: "Analisi", inizio: "2026-08-03", fine: "2026-08-14", stato: "completata", critica: true, dipendenze: [], assegnatari: ["m1", "m2"] },
    { id: "A2", progetto: "P1", nome: "Ricerca utenti", fase: "Analisi", inizio: "2026-08-10", fine: "2026-08-19", stato: "completata", critica: false, dipendenze: [], assegnatari: ["m3"] },
    { id: "A3", progetto: "P1", nome: "Wireframe UI", fase: "Progettazione", inizio: "2026-08-17", fine: "2026-09-04", stato: "completata", critica: false, dipendenze: ["A1"], assegnatari: ["m4"] },
    { id: "A4", progetto: "P1", nome: "Progettazione API", fase: "Progettazione", inizio: "2026-09-07", fine: "2026-09-25", stato: "in-corso", critica: true, dipendenze: ["A3"], assegnatari: ["m1"] },
    { id: "A5", progetto: "P1", nome: "Design interfaccia", fase: "Progettazione", inizio: "2026-08-24", fine: "2026-09-18", stato: "in-corso", critica: false, dipendenze: ["A3"], assegnatari: ["m4"] },
    { id: "A6", progetto: "P1", nome: "Setup ambiente di test", fase: "Progettazione", inizio: "2026-09-07", fine: "2026-09-25", stato: "in-ritardo", critica: false, dipendenze: [], assegnatari: ["m5"] },
    { id: "A7", progetto: "P1", nome: "Sviluppo front-end", fase: "Sviluppo", inizio: "2026-09-28", fine: "2026-11-06", stato: "da-iniziare", critica: true, dipendenze: ["A4", "A5"], assegnatari: ["m2", "m3"] },
    { id: "M1", progetto: "P1", nome: "Milestone: rilascio MVP", fase: "Sviluppo", inizio: "2026-11-06", fine: "2026-11-06", tipo: "milestone", critica: true, dipendenze: ["A7"], assegnatari: [] }
  ],

  membri: [
    { id: "m1", nome: "Sara Bianchi", ruolo: "Project Manager", competenze: ["Pianificazione", "Agile"], email: "sara.bianchi@example.com", capacita: 100, ferie: "21–25 dic" },
    { id: "m2", nome: "Luca Ferrari", ruolo: "Sviluppatore Front-end", competenze: ["React", "TypeScript"], email: "luca.ferrari@example.com", capacita: 80, assenze: "14–16 ott (ferie)" },
    { id: "m3", nome: "Giulia Moretti", ruolo: "UX Designer", competenze: ["Research", "Figma"], email: "giulia.moretti@example.com", capacita: 100, assenze: "12 ott (formazione)" },
    { id: "m4", nome: "Marco Conti", ruolo: "Architetto Software", competenze: ["Node.js", "Architettura"], email: "marco.conti@example.com", capacita: 60, assenze: "28 set – 2 ott (ferie)" },
    { id: "m5", nome: "Anna Ricci", ruolo: "DevOps", competenze: ["CI/CD", "Docker"], email: "anna.ricci@example.com", capacita: 100, assenze: "5 nov (smart working)" }
  ],

  allocazioni: [
    // settimane: W38 (14–18 set) ... W43; percentuali sul impegno settimanale
    { membro: "m1", attivita: "Progettazione API (P1)", settimana: "W38", percento: 50 },
    { membro: "m1", attivita: "Pianificazione Q4 (cross)", settimana: "W38", percento: 40 },
    { membro: "m2", attivita: "Sviluppo front-end (P1)", settimana: "W38", percento: 90 },
    { membro: "m2", attivita: "App Prenotazioni (P4)", settimana: "W38", percento: 45 },   // sovra-allocazione: 80% capienza
    { membro: "m3", attivita: "Design interfaccia (P1)", settimana: "W38", percento: 70 },
    { membro: "m4", attivita: "Progettazione API (P1)", settimana: "W38", percento: 60 },
    { membro: "m5", attivita: "Setup ambiente (P1)", settimana: "W38", percento: 85 },
    { membro: "m1", attivita: "Progettazione API (P1)", settimana: "W39", percento: 90 },
    { membro: "m2", attivita: "Sviluppo front-end (P1)", settimana: "W39", percento: 70 },
    { membro: "m3", attivita: "Design interfaccia (P1)", settimana: "W39", percento: 40 },
    { membro: "m4", attivita: "Progettazione API (P1)", settimana: "W39", percento: 50 },
    { membro: "m5", attivita: "Setup ambiente (P1)", settimana: "W39", percento: 30 }
  ],

  scadenze: [
    { progetto: "Portale Intranet", attivita: "Integrazione Single Sign-On", data: "2026-09-19", stato: "in-ritardo" },
    { progetto: "Migrazione CRM", attivita: "Migrazione dati anagrafici", inizio: "2026-09-24", stato: "a-rischio" },
    { progetto: "Piattaforma E-commerce", attivita: "Progettazione API", data: "2026-09-25", stato: "in-linea" }
  ]
};
