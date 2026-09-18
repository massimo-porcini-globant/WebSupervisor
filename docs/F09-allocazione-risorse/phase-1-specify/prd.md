# PRD — F09-allocazione-risorse (Epica E6: Allocazione risorse, RF-18..21)

flow: {phase: 1-specify, producer: agent/GLM-5.3-Flash (T1), consumer: gate_2 architecture, gate: gate_1_specify}

## Revision Log
- 0.1.0 - 2026-09-18 - Prima stesura (agent/GLM-5.3-Flash).

## 1. Contesto
Con F05/F06/F07/F08 completate, il dato mancante dell'MVP è il legame membri ↔ attività
(`assignments` esiste nello schema ma non ha endpoint né UI). E6 chiude RF-18..21 e rende
operativo l'RBAC "membro assegnato" (oggi mappato via corrispondenza `users.username = members.nome`,
documentato come compromesso MVP in F05 ASD §5).

## 2. Obiettivo
Piano di allocazione risorse conforme mockup M-allocation: assegnazioni attività→membri con periodo
e %, evidenziazione sovra-allocazioni (RF-20), carico di lavoro per persona su intervallo (RF-21).

## 3. Perimetro
**In scope:**
- RF-18: assegnare uno o più membri a ciascuna attività (percento, periodo dal–al).
- RF-19: piano di allocazione "chi lavora su cosa e quando" (vista Risorse per intervallo).
- RF-20: evidenziazione sovra-allocazione (somma % assegnazioni attive > capacitaPunti del membro,
  avvisi e righe evidenziate).
- RF-21: carico di lavoro per persona (% impegno settimanale) su intervallo temporale.
- **FK utente↔membro**: migration `members.user_id → users.id` e sostituzione della corrispondenza
  MVP in `membroAssegnato` (F05 ASD §5, debito tecnico noto).

**Fuori scope:** impatto assenze sul carico (calcolo MVP su sola capacità — assenze informative),
esportazione Excel (RF-23 → E7), riequilibrio automatico (consulenza, non automatico).

## 4. Interfaccia (contratto M-allocation)
- Navigazione `/risorse` (già presente, disabilitata in App).
- Avvisi sovra-allocazione (`.avviso in-ritardo`) per membro/settimana (RF-20).
- Tabella "Chi lavora su cosa e quando" (RF-19): riga membro → tag assegnazioni → % settimanali.
- Carico di lavoro per persona (RF-21): colonne settimana con % vs capacità, riga evidenziata in sovra.
- Stato vuoto M ("Nessuna allocazione" + CTA).
- Form assegnazione: membro (del team del progetto), attività, %, periodo.

## 5. Vincoli
- Endpoint assignments inesistenti: creazione API completa (POST/DELETE + lettura piano/carico).
- Calcolo carico: somma `percento` delle assegnazioni che intersecano la settimana, rapportata a
  `capacitaPunti` del membro; assenze/ferie non impattano il calcolo MVP (nota in ASD).
- RBAC: scrittura PM/admin; lettura tutti gli utenti; "membro assegnato" via nuova FK `user_id`.
- Intervallo carico: default settimana corrente + 3 successive (settimane ISO).

## 6. Criteri di Accettazione (Gate 1)
- [x] Perimetro chiuso: RF-18..21; assenze-impact ed export rimandati.
- [x] Debito tecnico F05 (mapping nome↔username) incluso: migration + sostituzione logica.
- [x] Contratto UI M-allocation identificato (mockup approvato).
