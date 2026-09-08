import type { ActivityLogRecord } from '@/service/axios'

type ActivityRow = Partial<ActivityLogRecord>

const ACTION_VERB_MAP: Record<string, string> = {
  CREATE: 'membuat',
  UPDATE: 'memperbarui',
  ACTIVATE: 'mengaktifkan',
  DEACTIVATE: 'menonaktifkan',
  IMPORT: 'mengimpor',
  EXPORT: 'mengekspor',
  DOWNLOAD_TEMPLATE: 'mengunduh template',
  ASSIGN: 'menetapkan',
  RETURN: 'mengembalikan',
  TRANSFER: 'memindahkan',
  RECEIVE: 'menerima',
  ISSUE: 'mengeluarkan',
  ADJUST: 'menyesuaikan',
  WRITE_OFF: 'menghapusbukukan',
  OPENING_BALANCE: 'mencatat saldo awal',
  MAINTENANCE_CREATE: 'menjadwalkan pemeliharaan',
  MAINTENANCE_COMPLETE: 'menyelesaikan pemeliharaan',
  DEPRECIATION_UPDATE: 'memperbarui penyusutan',
  DEPRECIATION_RECALCULATE: 'menghitung ulang penyusutan',
  PERMISSION_GRANT: 'memberikan izin',
  PERMISSION_REVOKE: 'mencabut izin',
  EXTERNAL_REFERENCE_LINK: 'menautkan referensi eksternal',
  REQUEST_FAILED: 'gagal melakukan permintaan',
}

export function actorName(row: ActivityRow): string {
  return row.user_name_snapshot || row.username_snapshot || 'Sistem'
}

export function actionVerb(row: ActivityRow): string {
  const action = row.action || ''
  return ACTION_VERB_MAP[action] || action.toLowerCase().replace(/_/g, ' ') || 'melakukan aksi'
}

export function activityTarget(row: ActivityRow): string {
  return row.entity_name_snapshot || row.entity_reference || row.entity_type || row.module || ''
}

export function describeActivity(row: ActivityRow): string {
  const target = activityTarget(row)
  return target ? `${actionVerb(row)} ${target}` : actionVerb(row)
}

export function initials(name: string): string {
  return (name || '').trim().charAt(0).toUpperCase() || '?'
}
