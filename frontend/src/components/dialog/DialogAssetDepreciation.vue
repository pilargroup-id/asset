<template>
  <Modal v-if="isOpen" full-screen-backdrop @close="close">
    <template #body>
      <div
        class="relative flex max-h-[90vh] w-full max-w-[900px] flex-col overflow-hidden rounded-3xl bg-white shadow-theme-lg dark:bg-gray-900"
      >
        <!-- Header -->
        <div class="flex items-start justify-between gap-3 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div class="min-w-0">
            <h4 class="truncate text-lg font-semibold text-gray-800 dark:text-white/90">
              Depreciation &middot; {{ props.asset?.asset_name || '-' }}
            </h4>
            <p class="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
              {{ props.asset?.asset_number || '-' }}
            </p>
          </div>
          <div class="flex shrink-0 items-center gap-1.5">
            <button
              @click="loadAll"
              :disabled="isLoading"
              type="button"
              title="Refresh"
              class="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-300"
            >
              <RefreshIcon class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
            </button>
            <button
              @click="close"
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-300"
            >
              <svg class="fill-current" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z"
                  fill=""
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Action bar -->
        <div v-if="!isLoading && !loadError" class="flex flex-wrap items-center gap-2 border-b border-gray-100 px-6 py-3 dark:border-gray-800">
          <button
            v-if="!hasConfig"
            @click="openConfigure"
            type="button"
            class="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-theme-xs font-medium shadow-theme-xs"
            :class="
              activeAction === 'configure'
                ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]'
            "
          >
            Configure Depreciation
          </button>
          <template v-else>
            <button
              @click="openRevise"
              type="button"
              class="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-theme-xs font-medium shadow-theme-xs"
              :class="
                activeAction === 'revise'
                  ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]'
              "
            >
              Revise
            </button>
            <button
              @click="openGenerate"
              type="button"
              class="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-theme-xs font-medium shadow-theme-xs"
              :class="
                activeAction === 'generate'
                  ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                  : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]'
              "
            >
              Generate Ledger
            </button>
          </template>
        </div>

        <!-- Inline action forms -->
        <div v-if="activeAction" class="border-b border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <!-- Configure -->
          <form v-if="activeAction === 'configure'" @submit.prevent="submitConfigure" class="flex flex-col gap-3">
            <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Configure Depreciation</p>
            <p v-if="suggestion" class="text-xs text-gray-500 dark:text-gray-400">
              Category default: <span class="font-medium text-gray-700 dark:text-gray-300">{{ suggestion.policy_name }}</span>
              ({{ suggestion.useful_life_months }} months)
            </p>

            <div class="flex items-center gap-4 text-theme-xs">
              <label class="inline-flex items-center gap-1.5">
                <input type="radio" value="policy" v-model="configureForm.mode" :disabled="!policies.length" />
                Use a policy
              </label>
              <label class="inline-flex items-center gap-1.5">
                <input type="radio" value="manual" v-model="configureForm.mode" />
                Manual
              </label>
            </div>

            <div v-if="configureForm.mode === 'policy'" class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Policy *</label>
                <SelectField v-model="configureForm.depreciation_policy_id">
                  <option v-for="item in policies" :key="item.id" :value="item.id">
                    {{ item.name }} ({{ item.useful_life_months }}mo)
                  </option>
                </SelectField>
                <p v-if="!policies.length" class="mt-1 text-theme-xs text-gray-400">
                  No matching Straight Line policy for this department. Use manual entry instead.
                </p>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Start Date</label>
                <DateField v-model="configureForm.depreciation_start_date" />
              </div>
            </div>

            <div v-else class="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Useful Life (months) *</label>
                <input
                  v-model.number="configureForm.useful_life_months"
                  type="number"
                  min="1"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Salvage Type</label>
                <SelectField v-model="configureForm.salvage_value_type">
                  <option value="FIXED">Fixed Amount</option>
                  <option value="PERCENT">Percent</option>
                </SelectField>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Salvage Value</label>
                <input
                  v-model.number="configureForm.salvage_value"
                  type="number"
                  min="0"
                  step="0.01"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Start Date</label>
                <DateField v-model="configureForm.depreciation_start_date" />
              </div>
            </div>

            <p v-if="actionError" class="text-xs text-error-600 dark:text-error-500">{{ actionError }}</p>
            <div class="flex items-center gap-2">
              <button
                type="submit"
                :disabled="isSubmittingAction"
                class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-theme-xs font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ isSubmittingAction ? 'Saving...' : 'Save Configuration' }}
              </button>
              <button
                type="button"
                @click="closeAction"
                class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                Cancel
              </button>
            </div>
          </form>

          <!-- Revise -->
          <form v-else-if="activeAction === 'revise'" @submit.prevent="submitRevise" class="flex flex-col gap-3">
            <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Revise Depreciation</p>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-2">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Effective Date *</label>
                <DateField v-model="reviseForm.effective_date" />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Reason *</label>
                <input
                  v-model="reviseForm.reason"
                  type="text"
                  placeholder="e.g. Corrected useful life per finance review"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-4">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Useful Life (months)</label>
                <input
                  v-model.number="reviseForm.useful_life_months"
                  type="number"
                  min="1"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Salvage Type</label>
                <SelectField v-model="reviseForm.salvage_value_type">
                  <option value="FIXED">Fixed Amount</option>
                  <option value="PERCENT">Percent</option>
                </SelectField>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Salvage Value</label>
                <input
                  v-model.number="reviseForm.salvage_value"
                  type="number"
                  min="0"
                  step="0.01"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Start Date</label>
                <DateField v-model="reviseForm.depreciation_start_date" />
              </div>
            </div>
            <p class="text-theme-xs text-gray-400 dark:text-gray-500">
              Finalized ledger periods are never rewritten; the revision only affects future calculations.
            </p>
            <p v-if="actionError" class="text-xs text-error-600 dark:text-error-500">{{ actionError }}</p>
            <div class="flex items-center gap-2">
              <button
                type="submit"
                :disabled="isSubmittingAction"
                class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-theme-xs font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ isSubmittingAction ? 'Saving...' : 'Save Revision' }}
              </button>
              <button
                type="button"
                @click="closeAction"
                class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                Cancel
              </button>
            </div>
          </form>

          <!-- Generate -->
          <form v-else-if="activeAction === 'generate'" @submit.prevent="submitGenerate" class="flex flex-col gap-3">
            <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Generate Depreciation Ledger</p>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Through Date</label>
                <DateField v-model="generateForm.through_date" />
              </div>
            </div>
            <p class="text-theme-xs text-gray-400 dark:text-gray-500">
              Creates or refreshes monthly periods up to this date. Already finalized periods are left untouched.
            </p>
            <p v-if="actionError" class="text-xs text-error-600 dark:text-error-500">{{ actionError }}</p>
            <div class="flex items-center gap-2">
              <button
                type="submit"
                :disabled="isSubmittingAction"
                class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-theme-xs font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ isSubmittingAction ? 'Generating...' : 'Generate' }}
              </button>
              <button
                type="button"
                @click="closeAction"
                class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <!-- Tabs -->
        <div class="custom-scrollbar flex gap-1 overflow-x-auto border-b border-gray-100 px-6 dark:border-gray-800">
          <button
            v-for="tab in TABS"
            :key="tab.key"
            type="button"
            @click="activeTab = tab.key"
            class="whitespace-nowrap border-b-2 px-3 py-2.5 text-theme-sm font-medium transition-colors"
            :class="
              activeTab === tab.key
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            "
          >
            {{ tab.label }}<template v-if="tab.key !== 'overview'"> ({{ tabCount(tab.key) }})</template>
          </button>
        </div>

        <!-- Content -->
        <div class="custom-scrollbar flex-1 overflow-y-auto px-6 py-4">
          <div v-if="isLoading" class="flex items-center justify-center py-14 text-sm text-gray-400">
            Loading depreciation data...
          </div>

          <div v-else-if="loadError" class="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <p class="text-sm text-error-600 dark:text-error-500">{{ loadError }}</p>
            <button @click="loadAll" class="text-sm font-medium text-brand-500 hover:underline">Retry</button>
          </div>

          <template v-else>
            <!-- Overview -->
            <div v-if="activeTab === 'overview'">
              <div v-if="!hasConfig" class="py-10 text-center text-sm text-gray-400">
                This asset has not been configured for depreciation yet.
              </div>
              <div v-else class="grid grid-cols-1 gap-4 sm:grid-cols-3">
                <div class="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <p class="text-theme-xs text-gray-400 dark:text-gray-500">Policy / Method</p>
                  <p class="mt-1 font-medium text-gray-800 dark:text-white/90">{{ formatLabel(config.depreciation_method) }}</p>
                </div>
                <div class="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <p class="text-theme-xs text-gray-400 dark:text-gray-500">Useful Life</p>
                  <p class="mt-1 font-medium text-gray-800 dark:text-white/90">{{ config.useful_life_months }} months</p>
                </div>
                <div class="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <p class="text-theme-xs text-gray-400 dark:text-gray-500">Salvage Value</p>
                  <p class="mt-1 font-medium text-gray-800 dark:text-white/90">
                    {{ config.salvage_value_type === 'PERCENT' ? `${config.salvage_value}%` : formatCurrency(config.salvage_value) }}
                  </p>
                </div>
                <div class="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <p class="text-theme-xs text-gray-400 dark:text-gray-500">Purchase Cost</p>
                  <p class="mt-1 font-medium text-gray-800 dark:text-white/90">{{ formatCurrency(config.purchase_cost_snapshot) }}</p>
                </div>
                <div class="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <p class="text-theme-xs text-gray-400 dark:text-gray-500">Depreciation Start</p>
                  <p class="mt-1 font-medium text-gray-800 dark:text-white/90">{{ formatAbsoluteTime(config.depreciation_start_date) }}</p>
                </div>
                <div class="rounded-xl border border-gray-100 p-4 dark:border-gray-800">
                  <p class="text-theme-xs text-gray-400 dark:text-gray-500">Monthly Depreciation</p>
                  <p class="mt-1 font-medium text-gray-800 dark:text-white/90">{{ formatCurrency(monthlyDepreciation) }}</p>
                </div>
                <div class="rounded-xl border border-gray-100 p-4 dark:border-gray-800 sm:col-span-3">
                  <p class="text-theme-xs text-gray-400 dark:text-gray-500">Current Book Value (last generated period)</p>
                  <p class="mt-1 text-lg font-semibold text-gray-800 dark:text-white/90">{{ formatCurrency(currentBookValue) }}</p>
                </div>
              </div>
            </div>

            <!-- Ledger -->
            <BaseTable v-else-if="activeTab === 'ledger'">
              <template #head>
                <TableHeadCell>Period</TableHeadCell>
                <TableHeadCell>Opening</TableHeadCell>
                <TableHeadCell>Depreciation</TableHeadCell>
                <TableHeadCell>Accumulated</TableHeadCell>
                <TableHeadCell>Closing</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Action</TableHeadCell>
              </template>
              <tr v-if="!ledger.length">
                <td colspan="7" class="px-5 py-10 text-center text-theme-sm text-gray-400">No ledger periods generated yet.</td>
              </tr>
              <tr v-for="row in ledger" :key="row.id" class="border-t border-gray-100 dark:border-gray-800">
                <td class="whitespace-nowrap px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                  {{ String(row.period_month).padStart(2, '0') }}/{{ row.period_year }}
                </td>
                <td class="px-5 py-3 text-theme-sm text-gray-500 dark:text-gray-400">{{ formatCurrency(row.opening_book_value) }}</td>
                <td class="px-5 py-3 text-theme-sm text-gray-500 dark:text-gray-400">{{ formatCurrency(row.depreciation_amount) }}</td>
                <td class="px-5 py-3 text-theme-sm text-gray-500 dark:text-gray-400">{{ formatCurrency(row.accumulated_depreciation) }}</td>
                <td class="px-5 py-3 text-theme-sm font-medium text-gray-700 dark:text-gray-200">{{ formatCurrency(row.closing_book_value) }}</td>
                <td class="px-5 py-3">
                  <Badge :color="row.is_final ? 'success' : 'light'" size="sm">{{ row.is_final ? 'Final' : 'Draft' }}</Badge>
                </td>
                <td class="px-5 py-3">
                  <button
                    v-if="!row.is_final"
                    type="button"
                    @click="finalizePeriod(row)"
                    :disabled="isFinalizing"
                    class="text-theme-xs font-medium text-brand-500 hover:underline disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    Finalize
                  </button>
                  <span v-else class="text-theme-xs text-gray-400">-</span>
                </td>
              </tr>
            </BaseTable>

            <!-- Revisions -->
            <BaseTable v-else-if="activeTab === 'revisions'">
              <template #head>
                <TableHeadCell>Effective Date</TableHeadCell>
                <TableHeadCell>Reason</TableHeadCell>
                <TableHeadCell>Changed By</TableHeadCell>
                <TableHeadCell>Recorded At</TableHeadCell>
              </template>
              <tr v-if="!revisions.length">
                <td colspan="4" class="px-5 py-10 text-center text-theme-sm text-gray-400">No revisions recorded.</td>
              </tr>
              <tr v-for="row in revisions" :key="row.id" class="border-t border-gray-100 dark:border-gray-800">
                <td class="whitespace-nowrap px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400">
                  {{ formatAbsoluteTime(row.effective_date) }}
                </td>
                <td class="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-300">{{ row.reason }}</td>
                <td class="whitespace-nowrap px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400">{{ shortId(row.changed_by) }}</td>
                <td class="whitespace-nowrap px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400">
                  {{ formatAbsoluteTime(row.created_at) }}
                </td>
              </tr>
            </BaseTable>
          </template>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Badge from '@/components/ui/Badge.vue'
import BaseTable from '@/components/tables/BaseTable.vue'
import TableHeadCell from '@/components/tables/TableHeadCell.vue'
import SelectField from '@/components/forms/FormElements/SelectField.vue'
import DateField from '@/components/forms/FormElements/DateField.vue'
import { RefreshIcon } from '@/icons'
import { formatAbsoluteTime } from '@/utils/formatTime'
import {
  getAssetDepreciation,
  getDepreciationSuggestion,
  getDepreciationPolicies,
  configureAssetDepreciation,
  reviseAssetDepreciation,
  generateDepreciationLedger,
  finalizeDepreciationPeriod,
} from '@/service/axios'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  asset: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'changed'])

const TABS = [
  { key: 'overview', label: 'Overview' },
  { key: 'ledger', label: 'Ledger' },
  { key: 'revisions', label: 'Revisions' },
]

const assetDetail = ref(null)
const config = ref(null)
const revisions = ref([])
const ledger = ref([])
const suggestion = ref(null)
const policies = ref([])

const isLoading = ref(false)
const loadError = ref('')
const isFinalizing = ref(false)

const activeTab = ref('overview')
const activeAction = ref('')
const actionError = ref('')
const isSubmittingAction = ref(false)

const hasConfig = computed(() => !!config.value)

function tabCount(key) {
  if (key === 'ledger') return ledger.value.length
  if (key === 'revisions') return revisions.value.length
  return 0
}

function toDateInputValue(value) {
  if (!value) return ''
  const date = new Date(value)
  if (Number.isNaN(date.getTime())) return ''
  return date.toISOString().slice(0, 10)
}

function shortId(id) {
  if (!id) return '-'
  const text = String(id)
  return text.length > 8 ? `${text.slice(0, 8)}…` : text
}

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

const monthlyDepreciation = computed(() => {
  if (!config.value) return null
  const cost = Number(config.value.purchase_cost_snapshot)
  const salvage =
    config.value.salvage_value_type === 'PERCENT'
      ? (cost * Number(config.value.salvage_value)) / 100
      : Number(config.value.salvage_value)
  const life = Number(config.value.useful_life_months) || 1
  return (cost - salvage) / life
})

const currentBookValue = computed(() => {
  if (!ledger.value.length) return config.value ? Number(config.value.purchase_cost_snapshot) : null
  return Number(ledger.value[ledger.value.length - 1].closing_book_value)
})

const configureForm = reactive({
  mode: 'policy',
  depreciation_policy_id: '',
  useful_life_months: 12,
  salvage_value_type: 'FIXED',
  salvage_value: 0,
  depreciation_start_date: '',
})

const reviseForm = reactive({
  effective_date: '',
  reason: '',
  useful_life_months: 12,
  salvage_value_type: 'FIXED',
  salvage_value: 0,
  depreciation_start_date: '',
})

const generateForm = reactive({
  through_date: '',
})

function openConfigure() {
  actionError.value = ''
  activeAction.value = 'configure'
  configureForm.mode = policies.value.length ? 'policy' : 'manual'
  configureForm.depreciation_policy_id = suggestion.value?.depreciation_policy_id || policies.value[0]?.id || ''
  configureForm.useful_life_months = suggestion.value?.useful_life_months || 12
  configureForm.salvage_value_type = suggestion.value?.salvage_value_type || 'FIXED'
  configureForm.salvage_value = Number(suggestion.value?.salvage_value || 0)
  configureForm.depreciation_start_date = toDateInputValue(assetDetail.value?.purchase_date) || toDateInputValue(new Date())
}

function openRevise() {
  actionError.value = ''
  activeAction.value = 'revise'
  reviseForm.effective_date = toDateInputValue(new Date())
  reviseForm.reason = ''
  reviseForm.useful_life_months = config.value?.useful_life_months || 12
  reviseForm.salvage_value_type = config.value?.salvage_value_type || 'FIXED'
  reviseForm.salvage_value = Number(config.value?.salvage_value || 0)
  reviseForm.depreciation_start_date = toDateInputValue(config.value?.depreciation_start_date)
}

function openGenerate() {
  actionError.value = ''
  activeAction.value = 'generate'
  generateForm.through_date = toDateInputValue(new Date())
}

function closeAction() {
  activeAction.value = ''
  actionError.value = ''
}

async function afterMutate() {
  closeAction()
  await loadAll()
  emit('changed')
}

async function submitConfigure() {
  actionError.value = ''
  const payload = {}
  if (configureForm.mode === 'policy') {
    if (!configureForm.depreciation_policy_id) {
      actionError.value = 'Select a depreciation policy.'
      return
    }
    payload.depreciation_policy_id = configureForm.depreciation_policy_id
  } else {
    if (!configureForm.useful_life_months || configureForm.useful_life_months <= 0) {
      actionError.value = 'Useful life (months) must be greater than zero.'
      return
    }
    payload.depreciation_method = 'STRAIGHT_LINE'
    payload.useful_life_months = configureForm.useful_life_months
    payload.salvage_value_type = configureForm.salvage_value_type
    payload.salvage_value = configureForm.salvage_value
  }
  if (configureForm.depreciation_start_date) payload.depreciation_start_date = configureForm.depreciation_start_date

  isSubmittingAction.value = true
  try {
    await configureAssetDepreciation(props.asset.id, payload)
    await afterMutate()
  } catch (err) {
    actionError.value = err?.response?.data?.message || 'Failed to configure depreciation.'
  } finally {
    isSubmittingAction.value = false
  }
}

async function submitRevise() {
  actionError.value = ''
  if (!reviseForm.effective_date) {
    actionError.value = 'Effective date is required.'
    return
  }
  if (!reviseForm.reason.trim()) {
    actionError.value = 'Reason is required.'
    return
  }
  isSubmittingAction.value = true
  try {
    const payload = {
      effective_date: reviseForm.effective_date,
      reason: reviseForm.reason.trim(),
      useful_life_months: reviseForm.useful_life_months,
      salvage_value_type: reviseForm.salvage_value_type,
      salvage_value: reviseForm.salvage_value,
    }
    if (reviseForm.depreciation_start_date) payload.depreciation_start_date = reviseForm.depreciation_start_date
    await reviseAssetDepreciation(props.asset.id, payload)
    await afterMutate()
  } catch (err) {
    actionError.value = err?.response?.data?.message || 'Failed to revise depreciation.'
  } finally {
    isSubmittingAction.value = false
  }
}

async function submitGenerate() {
  actionError.value = ''
  isSubmittingAction.value = true
  try {
    const payload = {}
    if (generateForm.through_date) payload.through_date = generateForm.through_date
    const result = await generateDepreciationLedger(props.asset.id, payload)
    ledger.value = result?.data ?? ledger.value
    closeAction()
    activeTab.value = 'ledger'
    emit('changed')
  } catch (err) {
    actionError.value = err?.response?.data?.message || 'Failed to generate depreciation ledger.'
  } finally {
    isSubmittingAction.value = false
  }
}

async function finalizePeriod(row) {
  isFinalizing.value = true
  try {
    await finalizeDepreciationPeriod(props.asset.id, { period_year: row.period_year, period_month: row.period_month })
    await loadAll()
    emit('changed')
  } catch (err) {
    loadError.value = err?.response?.data?.message || 'Failed to finalize depreciation period.'
  } finally {
    isFinalizing.value = false
  }
}

async function loadAll() {
  if (!props.asset?.id) return
  isLoading.value = true
  loadError.value = ''
  try {
    const res = await getAssetDepreciation(props.asset.id)
    const data = res?.data
    assetDetail.value = data?.asset || null
    config.value = data?.config || null
    revisions.value = data?.revisions ?? []
    ledger.value = data?.ledger ?? []

    if (!config.value) {
      try {
        const suggestionRes = await getDepreciationSuggestion(props.asset.id)
        suggestion.value = suggestionRes?.data || null
      } catch {
        suggestion.value = null
      }
    } else {
      suggestion.value = null
    }
  } catch (err) {
    loadError.value = err?.response?.data?.message || 'Failed to load asset depreciation.'
  } finally {
    isLoading.value = false
  }
}

async function loadPolicies() {
  try {
    const res = await getDepreciationPolicies()
    const all = res?.data ?? []
    const dept = props.asset?.managing_department_id
    const company = props.asset?.company_id
    policies.value = all.filter((policy) => {
      if (policy.method !== 'STRAIGHT_LINE' || !policy.is_active) return false
      if (String(policy.managing_department_id) !== String(dept)) return false
      if (policy.company_id != null && String(policy.company_id) !== String(company)) return false
      return true
    })
  } catch {
    policies.value = []
  }
}

function close() {
  emit('close')
}

watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    activeTab.value = 'overview'
    activeAction.value = ''
    actionError.value = ''
    loadAll()
    loadPolicies()
  }
)
</script>
