export function formatRelativeTime(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'

  const diffSec = Math.round((Date.now() - date.getTime()) / 1000)
  if (diffSec < 5) return 'baru saja'
  if (diffSec < 60) return `${diffSec} detik lalu`

  const diffMin = Math.round(diffSec / 60)
  if (diffMin < 60) return `${diffMin} menit lalu`

  const diffHour = Math.round(diffMin / 60)
  if (diffHour < 24) return `${diffHour} jam lalu`

  const diffDay = Math.round(diffHour / 24)
  if (diffDay < 7) return `${diffDay} hari lalu`

  return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatAbsoluteTime(value?: string | null): string {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}
