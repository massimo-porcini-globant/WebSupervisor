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
} as const;

export type Dizionario = typeof it;
