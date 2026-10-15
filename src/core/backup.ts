// Backup age: how long ago the user last exported a backup, and whether to nudge them.

export const BACKUP_WARNING_DAYS = 14;

const DAY_MS = 24 * 60 * 60 * 1000;

/** Whole days since an ISO timestamp, or null when there is none / it is unreadable. */
export function daysSince(iso: string | null | undefined, now: Date = new Date()): number | null {
  if (typeof iso !== 'string' || iso.trim() === '') return null;
  const then = new Date(iso);
  if (Number.isNaN(then.getTime())) return null;
  const diff = now.getTime() - then.getTime();
  if (diff <= 0) return 0;
  return Math.floor(diff / DAY_MS);
}

export interface BackupStatus {
  /** Whole days since the last export, or null when a backup was never made. */
  days: number | null;
  /** True once the last backup is older than the warning threshold, or missing. */
  stale: boolean;
}

export function backupStatus(lastBackupAt: string | null | undefined, now: Date = new Date()): BackupStatus {
  const days = daysSince(lastBackupAt, now);
  return { days, stale: days === null || days > BACKUP_WARNING_DAYS };
}
