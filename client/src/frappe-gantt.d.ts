/*
flow: {phase: 5-implement, producer: agent/GLM-5.3-Flash (E4.2), consumer: SchermataGantt, gate: gate_3_implementation}
Dichiarazione tipi minimale per frappe-gantt (la libreria non pubblica tipi TS).
*/
declare module "frappe-gantt" {
  export interface AttivitaGantt {
    id: string;
    name: string;
    start: string | Date;
    end: string | Date;
    progress?: number;
    dependencies?: string;
    custom_class?: string;
  }

  export interface OpzioniGantt {
    view_mode?: "Hour" | "Quarter Day" | "Half Day" | "Day" | "Week" | "Month" | "Year";
    language?: string;
    readonly_dates?: boolean;
    on_date_change?: (task: AttivitaGantt, inizio: Date, fine: Date) => void;
    on_click?: (task: AttivitaGantt) => void;
  }

  export default class Gantt {
    constructor(wrapper: HTMLElement | string, tasks: AttivitaGantt[], opzioni?: OpzioniGantt);
    change_view_mode(modo?: string): void;
  }
}
