export interface PackExercise {
  name: string;
  sets: number;
  reps: string;
}

export interface ProgramPack {
  id: string;
  name: string;
  source?: string;
  templates: { name: string; exercises: PackExercise[] }[];
}

const JUMP_OLY_THROW: PackExercise = { name: 'Jump / Olympic Lift / Throw', sets: 5, reps: '3-5' };

export const PACKS: ProgramPack[] = [
  {
    id: 'grapplestrong-90',
    name: 'Grapplestrong — Upper & Lower',
    source: 'jaybell1 / grapplestrong.co',
    templates: [
      {
        name: 'Upper Strength / Pump',
        exercises: [
          JUMP_OLY_THROW,
          { name: 'Bench Press', sets: 5, reps: '4' },
          { name: 'Chin-up', sets: 5, reps: '4, last AMRAP' },
          { name: 'Incline DB Bench', sets: 4, reps: '9-12' },
          { name: 'DB Row', sets: 4, reps: '11/11' },
          { name: 'Alternating Hammer Curl', sets: 4, reps: '20' },
          { name: 'Telle Extension', sets: 4, reps: '20' },
        ],
      },
      {
        name: 'Lower Strength',
        exercises: [
          JUMP_OLY_THROW,
          { name: 'Back Squat', sets: 5, reps: '4' },
          { name: 'Contrast Jump (after squat)', sets: 5, reps: '3-5' },
          { name: 'Lunge / Step-up', sets: 3, reps: '11/11' },
          { name: 'Nordic / RDL / Leg Curl', sets: 3, reps: '3-7' },
          { name: 'Core', sets: 3, reps: '10' },
        ],
      },
    ],
  },
];
