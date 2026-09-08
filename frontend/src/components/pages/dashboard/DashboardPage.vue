<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <div class="flex items-center justify-end">
        <button
          @click="fetchDashboard"
          :disabled="isLoading"
          class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        >
          <RefreshIcon :class="['h-4 w-4', { 'animate-spin': isLoading }]" />
          Refresh
        </button>
      </div>

      <div
        v-if="isLoading && !hasLoadedOnce"
        class="rounded-2xl border border-gray-200 bg-white p-10 text-center dark:border-gray-800 dark:bg-white/[0.03]"
      >
        <p class="text-gray-500 text-theme-sm dark:text-gray-400">Loading dashboard...</p>
      </div>

      <div
        v-else-if="errorMessage"
        class="rounded-2xl border border-error-200 bg-error-50 p-6 text-center dark:border-error-500/30 dark:bg-error-500/10"
      >
        <p class="text-error-600 text-theme-sm dark:text-error-500">{{ errorMessage }}</p>
      </div>

      <template v-else>
        <p
          v-if="!assets && !consumables"
          class="rounded-2xl border border-gray-200 bg-white p-6 text-center text-gray-500 text-theme-sm dark:border-gray-800 dark:bg-white/[0.03] dark:text-gray-400"
        >
          You don't have permission to view any dashboard data.
        </p>

        <template v-else>
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4 md:gap-6">
            <div
              v-for="card in statCards"
              :key="card.key"
              class="rounded-2xl border border-gray-200 bg-white p-5 dark:border-gray-800 dark:bg-white/[0.03] md:p-6"
            >
              <div :class="['flex items-center justify-center w-12 h-12 rounded-xl', ICON_BG[card.color]]">
                <component :is="card.icon" :class="['h-6 w-6', ICON_COLOR[card.color]]" />
              </div>
              <div class="mt-5">
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ card.label }}</span>
                <h4 class="mt-2 font-bold text-gray-800 text-title-sm dark:text-white/90">
                  {{ formatNumber(card.value) }}
                </h4>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 md:gap-6 xl:grid-cols-2">
            <ComponentCard v-if="assets" title="Assets by Status">
              <VueApexCharts
                v-if="statusChartSeries.length"
                type="donut"
                height="300"
                :options="statusChartOptions"
                :series="statusChartSeries"
              />
              <p v-else class="text-gray-500 text-theme-sm dark:text-gray-400">No asset data yet.</p>
            </ComponentCard>
            <ComponentCard v-else title="Assets" desc="You don't have permission to view asset data.">
              <p class="text-gray-500 text-theme-sm dark:text-gray-400">-</p>
            </ComponentCard>

            <ComponentCard
              v-if="consumables"
              title="Low Stock Consumables"
              desc="Items at or below minimum stock level"
            >
              <BaseTable>
                <template #head>
                  <TableHeadCell>Code</TableHeadCell>
                  <TableHeadCell>Name</TableHeadCell>
                  <TableHeadCell>Stock</TableHeadCell>
                  <TableHeadCell>Minimum</TableHeadCell>
                </template>
                <tr v-if="!consumables.low_stock.length">
                  <td colspan="4" class="px-5 py-10 text-center sm:px-6">
                    <p class="text-gray-500 text-theme-sm dark:text-gray-400">
                      No low stock items. Everything is well stocked.
                    </p>
                  </td>
                </tr>
                <tr
                  v-for="item in consumables.low_stock"
                  v-else
                  :key="item.id"
                  class="border-t border-gray-100 dark:border-gray-800"
                >
                  <td class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ item.consumable_code }}</span>
                  </td>
                  <td class="px-5 py-4 sm:px-6">
                    <span class="font-medium text-gray-800 text-theme-sm dark:text-white/90">{{ item.name }}</span>
                  </td>
                  <td class="px-5 py-4 sm:px-6">
                    <Badge :color="Number(item.total_stock) <= 0 ? 'error' : 'warning'" size="sm">
                      {{ item.total_stock }}
                    </Badge>
                  </td>
                  <td class="px-5 py-4 sm:px-6">
                    <span class="text-gray-500 text-theme-sm dark:text-gray-400">{{ item.minimum_stock }}</span>
                  </td>
                </tr>
              </BaseTable>
            </ComponentCard>
            <ComponentCard v-else title="Consumables" desc="You don't have permission to view consumable data.">
              <p class="text-gray-500 text-theme-sm dark:text-gray-400">-</p>
            </ComponentCard>
          </div>
        </template>
      </template>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import VueApexCharts from 'vue3-apexcharts'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import BaseTable from '@/components/tables/BaseTable.vue'
import TableHeadCell from '@/components/tables/TableHeadCell.vue'
import Badge from '@/components/ui/Badge.vue'
import { getDashboard } from '@/service/axios'
import { RefreshIcon, BoxCubeIcon, ArchiveIcon, UserGroupIcon, TableIcon, WarningIcon } from '@/icons'

const currentPageTitle = ref('Dashboard')

const assets = ref(null)
const consumables = ref(null)
const isLoading = ref(false)
const hasLoadedOnce = ref(false)
const errorMessage = ref('')

const ICON_BG = {
  primary: 'bg-brand-50 dark:bg-brand-500/15',
  success: 'bg-success-50 dark:bg-success-500/15',
  error: 'bg-error-50 dark:bg-error-500/15',
  warning: 'bg-warning-50 dark:bg-warning-500/15',
  info: 'bg-blue-light-50 dark:bg-blue-light-500/15',
}

const ICON_COLOR = {
  primary: 'text-brand-500 dark:text-brand-400',
  success: 'text-success-600 dark:text-success-500',
  error: 'text-error-600 dark:text-error-500',
  warning: 'text-warning-600 dark:text-orange-400',
  info: 'text-blue-light-500 dark:text-blue-light-500',
}

const STATUS_CHART_COLOR = {
  REGISTERED: '#667085',
  AVAILABLE: '#12B76A',
  ASSIGNED: '#465FFF',
  MAINTENANCE: '#F79009',
  LOST: '#F04438',
  RETIRED: '#344054',
  DISPOSED: '#98A2B3',
  VOID: '#F04438',
}

const formatNumber = (value) => {
  const number = Number(value ?? 0)
  if (Number.isNaN(number)) return '0'
  return new Intl.NumberFormat('id-ID').format(number)
}

const formatLabel = (value) => {
  if (!value) return '-'
  return value.charAt(0) + value.slice(1).toLowerCase()
}

const statCards = computed(() => {
  const cards = []
  if (assets.value) {
    cards.push({ key: 'total-assets', label: 'Total Assets', value: assets.value.total, icon: BoxCubeIcon, color: 'primary' })
    cards.push({
      key: 'available-assets',
      label: 'Available',
      value: assets.value.by_status?.AVAILABLE ?? 0,
      icon: ArchiveIcon,
      color: 'success',
    })
    cards.push({
      key: 'assigned-assets',
      label: 'Assigned',
      value: assets.value.by_status?.ASSIGNED ?? 0,
      icon: UserGroupIcon,
      color: 'info',
    })
  }
  if (consumables.value) {
    cards.push({
      key: 'consumable-masters',
      label: 'Consumable Masters',
      value: consumables.value.total_masters,
      icon: TableIcon,
      color: 'primary',
    })
    cards.push({
      key: 'low-stock',
      label: 'Low Stock Alerts',
      value: consumables.value.low_stock.length,
      icon: WarningIcon,
      color: consumables.value.low_stock.length ? 'error' : 'success',
    })
  }
  return cards
})

const statusChartSeries = computed(() => {
  if (!assets.value) return []
  return Object.values(assets.value.by_status || {})
})

const statusChartOptions = computed(() => {
  const labels = assets.value ? Object.keys(assets.value.by_status || {}) : []
  return {
    chart: { fontFamily: 'Outfit, sans-serif' },
    labels: labels.map(formatLabel),
    colors: labels.map((status) => STATUS_CHART_COLOR[status] || '#98A2B3'),
    legend: { position: 'bottom' },
    dataLabels: { enabled: true },
    stroke: { width: 0 },
  }
})

async function fetchDashboard() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const response = await getDashboard()
    assets.value = response?.data?.assets ?? null
    consumables.value = response?.data?.consumables ?? null
  } catch (err) {
    assets.value = null
    consumables.value = null
    errorMessage.value = err?.response?.data?.message || 'Failed to load dashboard.'
  } finally {
    isLoading.value = false
    hasLoadedOnce.value = true
  }
}

onMounted(() => fetchDashboard())
</script>
