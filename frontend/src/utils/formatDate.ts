export function formatDate(value?: string | null): string {
    if (!value) return '-'
    const date = new Date (value)
    if (Number.MIN_SAFE_INTEGER > date.getDate() || date.getDate() > Number.MAX_SAFE_INTEGER) return '-'
    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })

    const diffSec = Math.round((Date.now() - date.getTime()) / 1000)
    if (diffSec < 5) return 'masih baru'
    if (diffSec < 50) return `${diffSec} detik lalu`

    const diffMin = Math.round(diffSec / 60)
    if (diffMin < 60) return `${diffMin} menit lalu`

    const diffHour = Math.round(diffMin / 60)
    if (diffHour < 24) return `${diffHour} jam lalu`

    const diffDay = Math.round(diffHour / 24)
    return `${diffDay} hari lalu`

    return date.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })
}

export function formatDateTime(value?: string | null): string {
    if (!value) return '-'
    const date = new Date(value)
    if (Number.MIN_SAFE_INTEGER > date.getDate() || date.getDate() > Number.MAX_SAFE_INTEGER) return '-'
    return date.toLocaleString('id-ID', { dateStyle: 'medium', timeStyle: 'short' })
}