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
          type="text"
          placeholder="Search policy name..."
          class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        />
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="fetchPolicies"
          :disabled="isLoading"
          class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        >
          <RefreshIcon :class="['h-4 w-4', { 'animate-spin': isLoading }]" />
          Refresh
        </button>
        <ButtonCreateDepreciationPolicy @created="fetchPolicies" />
      </div>
    </template>

    <template #head>
      <TableHeadCell>Actions</TableHeadCell>
      <TableHeadCell>Name</TableHeadCell>
      <TableHeadCell>Method</TableHeadCell>
      <TableHeadCell>Useful Life</TableHeadCell>
      <TableHeadCell>Salvage</TableHeadCell>
      <TableHeadCell>Status</TableHeadCell>
    </template>

    <tr v-if="isLoading">
      <td colspan="6" class="px-5 py-10 text-center sm:px-6">
        <p class="text-gray-500 text-theme-sm dark:text-gray-400">Loading depreciation policies...</p>
      </td>
    </tr>
    <tr v-else-if="errorMessage">
      <td colspan="6" class="px-5 py-10 text-center sm:px-6">
        <p class="text-error-600 text-theme-sm dark:text-error-500">{{ errorMessage }}</p>
      </td>
    </tr>
    <tr v-else-if="!filteredPolicies.length">
      <td colspan="6" class="px-5 py-10 text-center sm:px-6">
        <p class="text-gray-500 text-theme-sm dark:text-gray-400">No depreciation policies found.</p>
      </td>
    </tr>
    <tr
      v-for="policy in paginatedPolicies"
      v-else
      :key="policy.id"
      class="border-t border-gray-100 dark:border-gray-800"
    >
      <td class="px-5 py-4 sm:px-6">
        <ButtonUpdateDepreciationPolicy :policy="policy" @updated="fetchPolicies" />
      </td>
      <td class="px-5 py-4 sm:px-6">
        <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {{ policy.name }}
        </span>
      </td>
      <td class="px-5 py-4 sm:px-6">
        <Badge :color="policy.method === 'STRAIGHT_LINE' ? 'success' : 'warning'" size="sm">
          {{ formatLabel(policy.method) }}
        </Badge>
      </td>
      <td class="px-5 py-4 sm:px-6">
        <p class="text-gray-500 text-theme-sm dark:text-gray-400">{{ policy.useful_life_months }} months</p>
      </td>
      <td class="px-5 py-4 sm:px-6">
        <p class="text-gray-500 text-theme-sm dark:text-gray-400">
          {{ policy.salvage_value_type === 'PERCENT' ? `${policy.salvage_value}%` : formatCurrency(policy.salvage_value) }}
        </p>
      </td>
      <td class="px-5 py-4 sm:px-6">
        <Badge :color="policy.is_active ? 'success' : 'light'" size="sm">
          {{ policy.is_active ? 'Active' : 'Inactive' }}
        </Badge>
      </td>
    </tr>

    <template #pagination>
      <TablePagination
        :page="page"
        :limit="limit"
        :total="filteredPolicies.length"
        :total-pages="totalPages"
        :disabled="isLoading"
        item-label="policies"
        @update:page="(value) => (page = value)"
      />
    </template>
  </BaseTable>
</template>

<script setup>
import { ref, computed, watch, onMounted } from 'vue'
import { getDepreciationPolicies } from '@/service/axios'
import Badge from '@/components/ui/Badge.vue'
import BaseTable from '@/components/tables/BaseTable.vue'
import TableHeadCell from '@/components/tables/TableHeadCell.vue'
import TablePagination from '@/components/tables/TablePagination.vue'
import ButtonCreateDepreciationPolicy from '@/components/buttons/create/ButtonCreateDepreciationPolicy.vue'
import ButtonUpdateDepreciationPolicy from '@/components/buttons/update/ButtonUpdateDepreciationPolicy.vue'
import { RefreshIcon } from '@/icons'

const policies = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const search = ref('')
const page = ref(1)
const limit = 25

const filteredPolicies = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return policies.value
  return policies.value.filter((policy) => String(policy.name || '').toLowerCase().includes(term))
})

const totalPages = computed(() => Math.max(1, Math.ceil(filteredPolicies.value.length / limit)))

const paginatedPolicies = computed(() => {
  const start = (page.value - 1) * limit
  return filteredPolicies.value.slice(start, start + limit)
})

watch(search, () => {
  page.value = 1
})

watch(totalPages, (value) => {
  if (page.value > value) page.value = value
})

function formatLabel(value) {
  if (!value) return '-'
  return value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '-'
  const number = Number(value)
  if (Number.isNaN(number)) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number)
}

async function fetchPolicies() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const data = await getDepreciationPolicies()
    policies.value = data?.data ?? []
  } catch (err) {
    policies.value = []
    errorMessage.value = err?.response?.data?.message || 'Failed to load depreciation policies.'
  } finally {
    isLoading.value = false
  }
}

defineExpose({ fetchPolicies })

onMounted(fetchPolicies)
</script>
