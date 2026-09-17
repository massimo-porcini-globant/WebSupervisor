# Release Notes — F06-gantt-cpm

flow: {phase: 7-release, producer: agent/GLM-5.3-Flash (E4), consumer: Gate 4 / merge, gate: gate_4_release}

## Iniziativa
F06-gantt-cpm (feature, Epica E4 — Diagramma di Gantt e CPM).

## Consegnato
- **E4.5 — Dominio CPM puro** (`server/src/domain/cpm.ts`): forward/backward pass su grafo DAG con ordinamento topologico di Kahn; durate in giorni calendario inclusivi; ES di partenza = inizio pianificato (offset dal minimo), le dipendenze possono ritardare l'ES; margine = LS − ES; attività critica ⟺ margine 0. `ordineTopologico` e `durataGiorni` esportate e testate. 11 test unit (catena, rami paralleli, rombo, attività isolata, durata 1 giorno, dipendenza ritardata).
- **E4.1 — API Gantt** (`server/src/routes/gantt.ts`): `GET /api/v1/progetti/:idProgetto/gantt` → `{ attivita: [...+critica], dipendenze, cpm: { fineProgetto, critiche } }`; autenticazione richiesta; 401/400/404 gestiti. Contratto `Gantt`/`AttivitaConCritica` in `shared` (AD-5).
- **E4.2 — Rendering** (`client/src/components/SchermataGantt.tsx`): frappe-gantt 1.2.2 (AD-1), selezione progetto, zoom Giorno/Settimana/Mese, filtro "solo critiche", legenda; navigazione `/gantt` in App (history API + popstate).
- **E4.3 — Modifica date drag&drop** (RF-09): evento `date_change` → conferma (`window.confirm`) → `PATCH /api/v1/attivita/:id` → ricarica CPM; annullamento ripristina lo stato.
- **E4.4 — Dipendenze** (RF-10): frecce frappe-gantt da `dependencies`; editor elenco/aggiungi/rimuovi via API dipendenze esistenti; anti-ciclo server-side già in E3.
- **E4.6 — Percorso critico overlay** (RF-11): barra rossa `custom_class="barra-critica"` per attività critiche, legenda dedicata.
- Milestone: attività con inizio = fine → barra a 1 giorno (RFC-05). Raggruppamento per fase: MVP con fasi nel nome attività (AD-1).

## Test
- 58/58 test pass (8 suite): +11 unit CPM, +2 integrazione API gantt.
- Lint: 0 errori/warning · Typecheck: 0 diagnostici · Build client: OK.

## Note
- Fix durante lo sviluppo: backward pass LF = min(LF_succ − durata_succ) (era min(LF_succ − 1)).
- CSS frappe-gantt vendonizzato in `client/src/assets/` (exports del pacchetto non espone lo stile per import diretto in build).
- Dichiarazione tipi `frappe-gantt.d.ts` minimale (la libreria non pubblica tipi).

## Conformità
- Fasi M2 (F01): zoom, drag&drop, frecce, criticità rosse, legenda.
- RF-08 (server-side CPM, AD-7), RF-09, RF-10, RF-11.
