/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E1.1), consumer: client + server, gate: gate_3_implementation}
Punto di ingresso del pacchetto condiviso (contratto API-first, ASD §6.2 AD-5).
*/
export * from "./types/index.js";
export * from "./schemas/auth.js";
export * from "./schemas/progetti.js";
export * from "./schemas/attivita.js";
export * from "./schemas/team.js";
export * from "./schemas/allocazione.js";
export * from "./i18n/it.js";
