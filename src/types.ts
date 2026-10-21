export interface Exercise {
  id: string;
  name: string;
  archived?: boolean;
}

export interface Template {
  id: string;
  name: string;
  exerciseIds: string[];
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
