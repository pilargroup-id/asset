<template>
  <BaseTable>
    <template #toolbar>
      <div class="relative w-full sm:max-w-[280px]">
        <span class="absolute -translate-y-1/2 left-3.5 top-1/2">
          <svg
            class="fill-gray-500 dark:fill-gray-400"
            width="18"
            height="18"
            viewBox="0 0 20 20"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M3.04175 9.37363C3.04175 5.87693 5.87711 3.04199 9.37508 3.04199C12.8731 3.04199 15.7084 5.87693 15.7084 9.37363C15.7084 12.8703 12.8731 15.7053 9.37508 15.7053C5.87711 15.7053 3.04175 12.8703 3.04175 9.37363ZM9.37508 1.54199C5.04902 1.54199 1.54175 5.04817 1.54175 9.37363C1.54175 13.6991 5.04902 17.2053 9.37508 17.2053C11.2674 17.2053 13.003 16.5344 14.357 15.4176L17.177 18.238C17.4699 18.5309 17.9448 18.5309 18.2377 18.238C18.5306 17.9451 18.5306 17.4703 18.2377 17.1774L15.418 14.3573C16.5365 13.0033 17.2084 11.2669 17.2084 9.37363C17.2084 5.04817 13.7011 1.54199 9.37508 1.54199Z"
              fill=""
            />
          </svg>
        </span>
        <input
          v-model="search"
          @input="onSearchInput"
          type="text"
          placeholder="Search asset number, name, or serial..."
          class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        />
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="fetchAssets(meta.page)"
          :disabled="isLoading"
          class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        >
          <RefreshIcon :class="['h-4 w-4', { 'animate-spin': isLoading }]" />
          Refresh
        </button>
        <ButtonCreateAssetsFixed @created="fetchAssets(1)" />
      </div>
    </template>

    <template #head>
      <TableHeadCell>Asset</TableHeadCell>
      <TableHeadCell>Category</TableHeadCell>
      <TableHeadCell>Brand / Model</TableHeadCell>
      <TableHeadCell>Location</TableHeadCell>
      <TableHeadCell>Condition</TableHeadCell>
      <TableHeadCell>Status</TableHeadCell>
      <TableHeadCell>Purchase Cost</TableHeadCell>
      <TableHeadCell>Action</TableHeadCell>
    </template>

    <tr v-if="isLoading">
      <td colspan="8" class="px-5 py-10 text-center sm:px-6">
        <p class="text-gray-500 text-theme-sm dark:text-gray-400">Loading assets...</p>
      </td>
    </tr>
    <tr v-else-if="errorMessage">
      <td colspan="8" class="px-5 py-10 text-center sm:px-6">
        <p class="text-error-600 text-theme-sm dark:text-error-500">{{ errorMessage }}</p>
      </td>
    </tr>
    <tr v-else-if="!assets.length">
      <td colspan="8" class="px-5 py-10 text-center sm:px-6">
        <p class="text-gray-500 text-theme-sm dark:text-gray-400">No fixed assets found.</p>
      </td>
    </tr>
    <tr
      v-for="asset in assets"
      v-else
      :key="asset.id"
      class="border-t border-gray-100 dark:border-gray-800"
    >
      <td class="px-5 py-4 sm:px-6">
        <div>
          <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {{ asset.asset_name }}
          </span>
          <span class="block text-gray-500 text-theme-xs dark:text-gray-400">
            {{ asset.asset_number }}<template v-if="asset.serial_number"> &middot; SN {{ asset.serial_number }}</template>
          </span>
        </div>
      </td>
      <td class="px-5 py-4 sm:px-6">
        <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ asset.category_name || '-' }}</p>
      </td>
      <td class="px-5 py-4 sm:px-6">
        <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ brandModel(asset) }}</p>
      </td>
      <td class="px-5 py-4 sm:px-6">
        <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ asset.current_location_name || '-' }}</p>
      </td>
      <td class="px-5 py-4 sm:px-6">
        <Badge :color="conditionColor(asset.asset_condition)" size="sm">
          {{ formatLabel(asset.asset_condition) }}
        </Badge>
      </td>
      <td class="px-5 py-4 sm:px-6">
        <Badge :color="statusColor(asset.status)" size="sm">
          {{ formatLabel(asset.status) }}
        </Badge>
      </td>
      <td class="px-5 py-4 sm:px-6">
        <div>
          <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {{ formatCurrency(asset.purchase_cost) }}
          </span>
          <span class="block text-gray-500 text-theme-xs dark:text-gray-400">
            {{ formatDate(asset.purchase_date) }}
          </span>
        </div>
      </td>
      <td class="px-5 py-4 sm:px-6">
        <div class="flex items-center gap-2">
          <ButtonAssetHistory :asset="asset" @changed="fetchAssets(meta.page)" />
          <ButtonUpdateAssetsFixed :asset="asset" @updated="fetchAssets(meta.page)" />
        </div>
      </td>
    </tr>

    <template #pagination>
      <TablePagination
        :page="meta.page"
        :limit="meta.limit"
        :total="meta.total"
        :total-pages="meta.totalPages"
        :disabled="isLoading"
        item-label="assets"
        @update:page="fetchAssets"
      />
    </template>
  </BaseTable>
</template>

<script setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { getAssets } from '@/service/axios'
import Badge from '@/components/ui/Badge.vue'
import BaseTable from '@/components/tables/BaseTable.vue'
import TableHeadCell from '@/components/tables/TableHeadCell.vue'
import TablePagination from '@/components/tables/TablePagination.vue'
import ButtonCreateAssetsFixed from '@/components/buttons/create/ButtonCreateAssetsFixed.vue'
import ButtonUpdateAssetsFixed from '@/components/buttons/update/ButtonUpdateAssetsFixed.vue'
import ButtonAssetHistory from '@/components/buttons/view/ButtonAssetHistory.vue'
import { RefreshIcon } from '@/icons'

const assets = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const search = ref('')
let searchTimer = null

const meta = reactive({ page: 1, limit: 25, total: 0, totalPages: 1 })

const STATUS_BADGE_COLOR = {
  REGISTERED: 'light',
  AVAILABLE: 'success',
  ASSIGNED: 'info',
  MAINTENANCE: 'warning',
  LOST: 'error',
  RETIRED: 'dark',
  DISPOSED: 'dark',
  VOID: 'error',
}

const CONDITION_BADGE_COLOR = {
  NEW: 'success',
  GOOD: 'success',
  FAIR: 'warning',
  POOR: 'warning',
  DAMAGED: 'error',
}

const statusColor = (status) => STATUS_BADGE_COLOR[status] || 'light'
const conditionColor = (condition) => CONDITION_BADGE_COLOR[condition] || 'light'

const formatLabel = (value) => {
  if (!value) return '-'
  return value.charAt(0) + value.slice(1).toLowerCase()
}

const brandModel = (asset) => {
  const parts = [asset.brand_name, asset.model_name].filter(Boolean)
  return parts.length ? parts.join(' / ') : '-'
}

const formatCurrency = (value) => {
  if (value === null || value === undefined || value === '') return '-'
  const number = Number(value)
  if (Number.isNaN(number)) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number)
}

const formatDate = (value) => {
  if (!value) return '-'
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return '-'
  return new Intl.DateTimeFormat('id-ID', { day: '2-digit', month: 'short', year: 'numeric' }).format(date)
}

async function fetchAssets(page = 1) {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const data = await getAssets({
      page,
      limit: meta.limit,
      ...(search.value ? { search: search.value } : {}),
    })
    assets.value = data?.data ?? []
    meta.page = data?.meta?.page ?? page
    meta.limit = data?.meta?.limit ?? meta.limit
    meta.total = data?.meta?.total ?? assets.value.length
    meta.totalPages = data?.meta?.totalPages ?? 1
  } catch (err) {
    assets.value = []
    errorMessage.value = err?.response?.data?.message || 'Failed to load fixed assets.'
  } finally {
    isLoading.value = false
  }
}

function onSearchInput() {
  clearTimeout(searchTimer)
  searchTimer = setTimeout(() => fetchAssets(1), 400)
}

onMounted(() => fetchAssets(1))
onUnmounted(() => clearTimeout(searchTimer))
</script>
