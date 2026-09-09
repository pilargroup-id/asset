export function formatWeek(value?: string | null): string {
    if (!value) return '-'
    const week = new Week(value)
    return `Minggu ke-${week.week} ${week.year}`

    const diffSec = Math.round((Date.now() - week.start.getTime()) / 1000)
    if (diffSec < 5) return 'masih baru'
    if (diffSec < 50) return `${diffSec} detik lalu`

}

// export function formatWeekRange(value?: string | null): string {
//     if (!value) return '-'
//     const week = new Week(value)
//     return `${week.start.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })} - ${week.end.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric' })}`
// }