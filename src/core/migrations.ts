// Versioned data: when a feature needs a new field shape, bump the version constant in types.ts
// and add ONE step here that upgrades data from version N to N+1. Old files then keep working.

import { COURSE_SCHEMA_VERSION, USERDATA_SCHEMA_VERSION } from './types.ts';

export type MigrationStep = (data: Record<string, unknown>) => Record<string, unknown>;

/** steps[N] upgrades data from version N to N+1. */
export type MigrationSteps = Record<number, MigrationStep>;

export interface MigrationResult {
  data: unknown;
  fromVersion?: number;
  error?: string;
}

export const courseMigrations: MigrationSteps = {
  // v1 -> v2: language support and question hints were added as optional fields.
  // Nothing has to be rewritten, so the step only stamps the new version. The validator
  // and the resolver treat every v1 shape as valid v2 content.
  1: (c) => ({ ...c, schemaVersion: 2 })
};

export const userDataMigrations: MigrationSteps = {
  // v1 -> v2: the `mastery` store (per-skill mastery points and the mistake log) was added.
  // Nothing in the old shape has to be rewritten, so the step only stamps the new version.
  1: (d) => ({ ...d, schemaVersion: 2 }),
  // v2 -> v3: spaced re-review of missed questions added optional fields to the mastery records
  // (`lastPracticedAt`, `timesMissed` and the per-question `reviews` schedule). Older records are
  // still valid, so this step only stamps the new version.
  2: (d) => ({ ...d, schemaVersion: 3 })
};

export function runMigrations(
  data: unknown,
  target: number,
  steps: MigrationSteps
): MigrationResult {
  if (typeof data !== 'object' || data === null || Array.isArray(data)) return { data };
  let current = data as Record<string, unknown>;
  const version = current.schemaVersion;
  if (typeof version !== 'number' || !Number.isInteger(version)) return { data: current };
  if (version > target) {
    return {
      data: current,
      fromVersion: version,
      error: `This file uses format version ${version}, but this app only understands up to version ${target}. Update the app first.`
    };
  }
  let v = version;
  while (v < target) {
    const step = steps[v];
    if (!step) {
      return { data: current, fromVersion: version, error: `No upgrade path from format version ${v}.` };
    }
    current = step(current);
    v += 1;
    current.schemaVersion = v;
  }
  return { data: current, fromVersion: version };
}

export function migrateCourse(raw: unknown): MigrationResult {
  return runMigrations(raw, COURSE_SCHEMA_VERSION, courseMigrations);
}

export function migrateBackup(raw: unknown): MigrationResult {
  return runMigrations(raw, USERDATA_SCHEMA_VERSION, userDataMigrations);
}
