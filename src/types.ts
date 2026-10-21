export interface Exercise {
  id: string;
  name: string;
  archived?: boolean;
}

export interface TemplateTarget {
  sets: number;
  /** Free text from the program, e.g. "4", "9-12", "11/11", "4, last AMRAP". */
  reps: string;
}

export interface Template {
  id: string;
  name: string;
  exerciseIds: string[];
  /** Target sets × reps, keyed by exercise id. */
  targets?: Record<string, TemplateTarget>;
}

export interface SetEntry {
  weightKg: number;
  reps: number;
  done: boolean;
}

export interface WorkoutEntry {
  exerciseId: string;
  sets: SetEntry[];
}

export interface Workout {
  id: string;
  startedAt: string;
  finishedAt?: string;
  templateId?: string;
  notes?: string;
  entries: WorkoutEntry[];
}

export interface BodyEntry {
  date: string;
  weightKg?: number;
  bodyFatPct?: number;
}

export interface Backup {
  version: number;
  exportedAt: string;
  exercises: Exercise[];
  templates: Template[];
  workouts: Workout[];
  body: BodyEntry[];
}
