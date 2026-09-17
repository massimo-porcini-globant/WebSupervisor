# Documento dei Requisiti
## Applicazione Web per la Gestione dei Progetti

**Versione:** 1.0
**Data:** 17 settembre 2026
**Stato:** Bozza

---

## 1. Introduzione

### 1.1 Scopo del documento

Questo documento descrive i requisiti funzionali e non funzionali per lo sviluppo di un'applicazione web dedicata alla gestione dei progetti, con particolare focus su monitoraggio avanzamento, pianificazione temporale (Gantt), gestione dei team e reportistica.

### 1.2 Obiettivi dell'applicazione

- Fornire una visione chiara e centralizzata dello stato di avanzamento dei progetti
- Pianificare e visualizzare le attività su una timeline (diagramma di Gantt)
- Gestire i membri del team e la loro allocazione sui progetti/attività
- Consentire l'esportazione dei dati in formato Excel per reportistica e condivisione
- Validare l'esperienza utente delle schermate principali attraverso mockup realizzati con le capacità di frontend design di Anthropic, prima dell'avvio dello sviluppo

### 1.3 Destinatari

- Project manager
- Team leader / responsabili di reparto
- Membri del team assegnati alle attività
- Management / stakeholder che necessitano di report periodici

---

## 2. Utenti e Ruoli

| Ruolo | Descrizione | Permessi principali |
|---|---|---|
| Amministratore | Gestisce l'intera piattaforma | Configurazione sistema, gestione utenti, accesso a tutti i progetti |
| Project Manager | Gestisce uno o più progetti | Crea/modifica progetti, gestisce team, alloca risorse, esporta report |
| Membro del team | Esegue le attività assegnate | Visualizza progetti a cui è assegnato, aggiorna stato delle proprie attività |
| Osservatore | Visualizza solo | Accesso in sola lettura a progetti selezionati |

---

## 3. Requisiti Funzionali

### 3.1 Gestione Progetti

| ID | Requisito | Priorità |
|----|-----------|----------|
| RF-01 | Il sistema deve permettere la creazione di un nuovo progetto (nome, descrizione, data inizio/fine, priorità) | Alta |
| RF-02 | Il sistema deve permettere la modifica e l'archiviazione dei progetti | Alta |
| RF-03 | Il sistema deve organizzare i progetti in un elenco/dashboard filtrabile per stato, priorità e team | Media |

### 3.2 Avanzamento del Progetto

| ID | Requisito | Priorità |
|----|-----------|----------|
| RF-04 | Il sistema deve mostrare una dashboard con lo stato di avanzamento (% completamento) di ogni progetto | Alta |
| RF-05 | Il sistema deve calcolare automaticamente l'avanzamento in base allo stato delle attività (es. completate/totali, oppure ore lavorate/stimate) | Alta |
| RF-06 | Il sistema deve segnalare visivamente attività/progetti in ritardo (indicatori di stato: in linea, a rischio, in ritardo) | Alta |
| RF-07 | Il sistema deve fornire una vista di riepilogo (KPI: attività completate, in corso, in ritardo, scadenze imminenti) | Media |

### 3.3 Diagramma di Gantt

| ID | Requisito | Priorità |
|----|-----------|----------|
| RF-08 | Il sistema deve visualizzare le attività di progetto in un diagramma di Gantt interattivo | Alta |
| RF-09 | L'utente deve poter modificare date di inizio/fine delle attività direttamente dal Gantt (drag & drop) | Alta |
| RF-10 | Il sistema deve supportare le dipendenze tra attività (es. "attività B inizia dopo il completamento di A") | Alta |
| RF-11 | Il sistema deve evidenziare il percorso critico (critical path) del progetto | Media |
| RF-12 | Il sistema deve permettere di raggruppare le attività per fasi/milestone all'interno del Gantt | Media |
| RF-13 | Il sistema deve permettere lo zoom temporale della vista Gantt (giorno, settimana, mese, trimestre) | Media |

### 3.4 Gestione Team

| ID | Requisito | Priorità |
|----|-----------|----------|
| RF-14 | Il sistema deve permettere di aggiungere/rimuovere membri del team (nome, ruolo, competenze, email) | Alta |
| RF-15 | Il sistema deve permettere di creare team associati a uno o più progetti | Alta |
| RF-16 | Il sistema deve mantenere un'anagrafica dei membri con disponibilità (es. % tempo, ferie/assenze) | Media |
| RF-17 | Il sistema deve inviare notifiche ai membri del team quando vengono assegnati a un'attività | Bassa |

### 3.5 Allocazione delle Risorse

| ID | Requisito | Priorità |
|----|-----------|----------|
| RF-18 | Il sistema deve permettere di assegnare uno o più membri del team a ciascuna attività | Alta |
| RF-19 | Il sistema deve mostrare un piano di allocazione delle risorse (chi lavora su cosa e quando) | Alta |
| RF-20 | Il sistema deve evidenziare situazioni di sovra-allocazione (un membro assegnato oltre la propria capacità) | Alta |
| RF-21 | Il sistema deve fornire una vista "carico di lavoro" per persona/team su un intervallo temporale | Media |

### 3.6 Esportazione Dati

| ID | Requisito | Priorità |
|----|-----------|----------|
| RF-22 | Il sistema deve permettere l'esportazione in formato Excel (.xlsx) dell'elenco attività con relativi stati e date | Alta |
| RF-23 | Il sistema deve permettere l'esportazione del piano di allocazione risorse in Excel | Alta |
| RF-24 | Il sistema deve permettere l'esportazione dei dati di avanzamento/KPI in Excel | Media |
| RF-25 | Il file Excel esportato deve mantenere formattazione leggibile (intestazioni, colori di stato, filtri automatici) | Bassa |

### 3.7 Autenticazione e Permessi

| ID | Requisito | Priorità |
|----|-----------|----------|
| RF-26 | Il sistema deve richiedere login con credenziali (username/password o SSO) | Alta |
| RF-27 | Il sistema deve applicare i permessi in base al ruolo utente (vedi sezione 2) | Alta |

### 3.8 Mockup e Prototipazione UI

| ID | Requisito | Priorità |
|----|-----------|----------|
| RF-28 | Prima dell'avvio dello sviluppo, il team deve produrre mockup ad alta fedeltà delle schermate principali (Dashboard, Gantt, Gestione Team, Allocazione Risorse) utilizzando le capacità di frontend design di Anthropic | Alta |
| RF-29 | I mockup devono riprodurre i flussi chiave descritti nelle user story (sezione 5) e includere gli stati principali dell'interfaccia (es. vuoto, popolato, in ritardo/a rischio, sovra-allocazione) | Media |
| RF-30 | I mockup devono essere condivisi con gli stakeholder per la validazione e aggiornati in base al feedback raccolto prima del congelamento dei requisiti per l'MVP | Media |

---

## 4. Requisiti Non Funzionali

| ID | Categoria | Requisito |
|----|-----------|-----------|
| RNF-01 | Usabilità | L'interfaccia deve essere utilizzabile senza formazione specifica da un project manager non tecnico |
| RNF-02 | Prestazioni | Il caricamento della dashboard e del Gantt non deve superare i 2-3 secondi con progetti fino a 500 attività |
| RNF-03 | Compatibilità | L'applicazione deve funzionare sui principali browser desktop (Chrome, Edge, Firefox, Safari) |
| RNF-04 | Responsività | L'applicazione deve essere fruibile anche da tablet per la sola consultazione |
| RNF-05 | Sicurezza | I dati devono essere protetti tramite connessione HTTPS e accessi autenticati |
| RNF-06 | Scalabilità | Il sistema deve supportare la crescita del numero di progetti e utenti senza degrado significativo delle prestazioni |
| RNF-07 | Affidabilità | Il sistema deve garantire un backup periodico dei dati |
| RNF-08 | Localizzazione | L'interfaccia deve essere disponibile in italiano (eventualmente predisposta per altre lingue) |

---

## 5. User Stories Principali

1. Come project manager, voglio vedere una dashboard con l'avanzamento di tutti i miei progetti, così da capire rapidamente dove intervenire.
2. Come project manager, voglio pianificare le attività su un Gantt, così da definire tempistiche e dipendenze.
3. Come project manager, voglio aggiungere membri al team e assegnarli alle attività, così da distribuire il carico di lavoro.
4. Come project manager, voglio vedere se qualcuno è sovra-allocato, così da ribilanciare le assegnazioni.
5. Come membro del team, voglio vedere le attività a me assegnate e aggiornarne lo stato.
6. Come management, voglio esportare i dati in Excel per condividerli in riunioni o con chi non ha accesso al sistema.

---

## 6. Fuori Ambito (Out of Scope) — v1.0

- Integrazione con strumenti di time tracking esterni
- Fatturazione e gestione budget dettagliata
- App mobile nativa (solo versione web responsive)
- Gestione documentale avanzata (allegati oltre a semplici file di progetto)

Questi punti possono essere considerati per versioni successive.

---

## 7. Prossimi Passi

1. Validazione dei requisiti con gli stakeholder
2. Produzione dei mockup delle schermate principali (Dashboard, Gantt, Team, Allocazione) utilizzando le capacità di frontend design di Anthropic, come da requisito RF-28
3. Revisione dei mockup con gli stakeholder e raccolta feedback
4. Stima di massima dello sviluppo e definizione delle priorità per la prima release (MVP)
