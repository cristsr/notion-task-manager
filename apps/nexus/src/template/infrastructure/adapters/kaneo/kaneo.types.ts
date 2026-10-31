import { Nullable } from '@shared/domain/types';

export interface KaneoRecurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly';
  interval: number;
  weekdays?: number[];
  timeZone: string;
}

export interface KaneoTask {
  id: string;
  title: string;
  description: Nullable<string>;
  priority: string;
  dueDate: Nullable<string>;
  recurrence: Nullable<KaneoRecurrence>;
}

export interface KaneoBoardResponse {
  data: {
    columns: { tasks: KaneoTask[] }[];
    archivedTasks: KaneoTask[];
    plannedTasks: KaneoTask[];
  };
  pagination: { totalPages: number };
}

export interface KaneoNewTask {
  title: string;
  description: string;
  priority: string;
  status: string;
  dueDate: string;
}

export interface KaneoBoard {
  /**
   * Tasks that are still on the board, planned ones included
   */
  open: KaneoTask[];

  /**
   * Tasks that were archived after being completed
   */
  archived: KaneoTask[];
}
