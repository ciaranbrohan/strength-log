import { db } from './db';
import { newId } from '../lib/id';
import type { ProgramPack } from '../lib/packs';
import type { Template } from '../types';

/**
 * Adds a pack's templates, merging into existing data: exercises are matched by
 * name (case-insensitive, unarchived if needed) and templates with an existing
 * name are skipped.
 */
export async function addPack(pack: ProgramPack): Promise<{ added: string[]; skipped: string[] }> {
  return db.transaction('rw', db.exercises, db.templates, async () => {
    const exercises = await db.exercises.toArray();
    const byName = new Map(exercises.map((e) => [e.name.trim().toLowerCase(), e]));
    const existingTemplates = new Set((await db.templates.toArray()).map((t) => t.name.trim().toLowerCase()));

    const exerciseId = async (name: string) => {
      const found = byName.get(name.toLowerCase());
      if (found) {
        if (found.archived) await db.exercises.update(found.id, { archived: false });
        return found.id;
      }
      const created = { id: newId(), name };
      await db.exercises.add(created);
      byName.set(name.toLowerCase(), created);
      return created.id;
    };

    const added: string[] = [];
    const skipped: string[] = [];
    for (const t of pack.templates) {
      if (existingTemplates.has(t.name.toLowerCase())) {
        skipped.push(t.name);
        continue;
      }
      const template: Template = { id: newId(), name: t.name, exerciseIds: [], targets: {} };
      for (const ex of t.exercises) {
        const id = await exerciseId(ex.name);
        template.exerciseIds.push(id);
        template.targets![id] = { sets: ex.sets, reps: ex.reps };
      }
      await db.templates.add(template);
      added.push(t.name);
    }
    return { added, skipped };
  });
}
