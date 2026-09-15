<template>
  <Modal v-if="isOpen" full-screen-backdrop @close="close">
    <template #body>
      <div
        class="relative flex max-h-[90vh] w-full max-w-[1000px] flex-col overflow-hidden rounded-3xl bg-white shadow-theme-lg dark:bg-gray-900"
      >
        <!-- Header -->
        <div class="flex items-start justify-between gap-3 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div class="min-w-0">
            <h4 class="truncate text-lg font-semibold text-gray-800 dark:text-white/90">
              {{ consumableDetail?.name || '-' }}
            </h4>
            <p class="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
              {{ consumableDetail?.consumable_code || '-' }}
              <template v-if="brandVariant"> &middot; {{ brandVariant }}</template>
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge :color="consumableDetail?.is_active ? 'success' : 'light'" size="sm">
                {{ consumableDetail?.is_active ? 'Active' : 'Inactive' }}
              </Badge>
              <Badge v-if="isLowStock" color="warning" size="sm">Low stock</Badge>
              <span class="text-theme-xs text-gray-400 dark:text-gray-500">
                &middot; Stock: {{ formatQuantity(totalStock) }} {{ consumableDetail?.uom_code || '' }}
              </span>
            </div>
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
        <div v-if="consumableDetail" class="flex flex-wrap items-center gap-2 border-b border-gray-100 px-6 py-3 dark:border-gray-800">
          <button
            @click="openAction('movement')"
            type="button"
            class="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-theme-xs font-medium shadow-theme-xs"
            :class="
              activeAction === 'movement'
                ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]'
            "
          >
            Record Movement
          </button>
        </div>

        <!-- Inline action form -->
        <div v-if="activeAction === 'movement'" class="border-b border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <form @submit.prevent="submitMovement" class="flex flex-col gap-3">
            <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Record Consumable Movement</p>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Movement Type *</label>
                <SelectField v-model="form.movement_type">
                  <option v-for="opt in MOVEMENT_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </SelectField>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Quantity *</label>
                <input
                  v-model="form.quantity"
                  type="number"
                  step="0.01"
                  placeholder="0"
                  required
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
                <p v-if="form.movement_type === 'ADJUSTMENT'" class="mt-1 text-theme-xs text-gray-400">
                  Use a negative number to decrease stock.
                </p>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Transaction Date</label>
                <DateField v-model="form.transaction_date" />
              </div>

              <div v-if="showFromLocation">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">From Location *</label>
                <SelectField v-model="form.from_location_id" placeholder="Select location">
                  <option v-for="item in locations" :key="item.id" :value="item.id">{{ item.name }}</option>
                </SelectField>
              </div>
              <div v-if="showToLocation">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">To Location *</label>
                <SelectField v-model="form.to_location_id" placeholder="Select location">
                  <option v-for="item in locations" :key="item.id" :value="item.id">{{ item.name }}</option>
                </SelectField>
              </div>

              <div v-if="showRecipient">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Recipient Type *</label>
                <SelectField v-model="form.recipient_type">
                  <option v-for="opt in RECIPIENT_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </SelectField>
              </div>
              <div
                v-if="showRecipient && form.recipient_type === 'USER'"
                :ref="(el) => (recipientUserField.containerRef.value = el)"
                class="relative sm:col-span-2"
              >
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Recipient User *</label>
                <input
                  v-model="recipientUserField.query.value"
                  type="text"
                  autocomplete="off"
                  placeholder="Search user..."
                  @focus="recipientUserField.open()"
                  @click="recipientUserField.open()"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
                <div
                  v-if="recipientUserField.isOpen.value"
                  class="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
                >
                  <ul class="custom-scrollbar max-h-56 overflow-y-auto py-1" role="listbox">
                    <li v-if="recipientUserField.isLoading.value" class="px-3 py-2 text-sm text-gray-400">Loading...</li>
                    <li v-else-if="!recipientUserField.filtered.value.length" class="px-3 py-2 text-sm text-gray-400">No users found.</li>
                    <li
                      v-for="item in recipientUserField.filtered.value"
                      :key="getRecordId(item)"
                      @click="recipientUserField.select(item)"
                      role="option"
                      class="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
                    >
                      <span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ getRecordLabel(item) }}</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div
                v-else-if="showRecipient && form.recipient_type === 'DEPARTMENT'"
                :ref="(el) => (recipientDepartmentField.containerRef.value = el)"
                class="relative sm:col-span-2"
              >
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Recipient Department *</label>
                <input
                  v-model="recipientDepartmentField.query.value"
                  type="text"
                  autocomplete="off"
                  placeholder="Search department..."
                  @focus="recipientDepartmentField.open()"
                  @click="recipientDepartmentField.open()"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
                <div
                  v-if="recipientDepartmentField.isOpen.value"
                  class="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
                >
                  <ul class="custom-scrollbar max-h-56 overflow-y-auto py-1" role="listbox">
                    <li v-if="recipientDepartmentField.isLoading.value" class="px-3 py-2 text-sm text-gray-400">Loading...</li>
                    <li v-else-if="!recipientDepartmentField.filtered.value.length" class="px-3 py-2 text-sm text-gray-400">
                      No departments found.
                    </li>
                    <li
                      v-for="item in recipientDepartmentField.filtered.value"
                      :key="getRecordId(item)"
                      @click="recipientDepartmentField.select(item)"
                      role="option"
                      class="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
                    >
                      <span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ getRecordLabel(item) }}</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div
                v-else-if="showRecipient && form.recipient_type === 'ASSET'"
                :ref="(el) => (recipientAssetField.containerRef.value = el)"
                class="relative sm:col-span-2"
              >
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Recipient Asset *</label>
                <input
                  v-model="recipientAssetField.query.value"
                  type="text"
                  autocomplete="off"
                  placeholder="Search asset..."
                  @focus="recipientAssetField.open()"
                  @click="recipientAssetField.open()"
                  @input="recipientAssetField.onQueryInput()"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
                <div
                  v-if="recipientAssetField.isOpen.value"
                  class="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
                >
                  <ul class="custom-scrollbar max-h-56 overflow-y-auto py-1" role="listbox">
                    <li v-if="recipientAssetField.isLoading.value" class="px-3 py-2 text-sm text-gray-400">Loading...</li>
                    <li v-else-if="!recipientAssetField.options.value.length" class="px-3 py-2 text-sm text-gray-400">No assets found.</li>
                    <li
                      v-for="item in recipientAssetField.options.value"
                      :key="getRecordId(item)"
                      @click="recipientAssetField.select(item)"
                      role="option"
                      class="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
                    >
                      <span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ getRecordLabel(item) }}</span>
                    </li>
                  </ul>
                </div>
              </div>
              <div v-else-if="showRecipient && form.recipient_type === 'LOCATION'" class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Recipient Location *</label>
                <SelectField v-model="form.recipient_location_id" placeholder="Select location">
                  <option v-for="item in locations" :key="item.id" :value="item.id">{{ item.name }}</option>
                </SelectField>
              </div>
              <p v-else-if="showRecipient && form.recipient_type === 'GENERAL_USAGE'" class="flex items-end pb-2.5 text-theme-xs text-gray-400 sm:col-span-2">
                Issued for general usage, not tied to a specific recipient.
              </p>

              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Unit Cost</label>
                <input
                  v-model="form.unit_cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Reference Number</label>
                <input
                  v-model="form.reference_number"
                  type="text"
                  placeholder="e.g. PO-2026-0001"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Purpose</label>
                <input
                  v-model="form.purpose"
                  type="text"
                  placeholder="e.g. Office supplies"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              <div class="sm:col-span-3">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Notes</label>
                <textarea
                  v-model="form.notes"
                  rows="2"
                  placeholder="Additional notes..."
                  class="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>
            <p v-if="actionError" class="text-xs text-error-600 dark:text-error-500">{{ actionError }}</p>
            <div class="flex items-center gap-2">
              <button
                type="submit"
                :disabled="isSubmittingAction"
                class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-theme-xs font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ isSubmittingAction ? 'Saving...' : 'Record Movement' }}
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
            {{ tab.label }} ({{ tabCount(tab.key) }})
          </button>
        </div>

        <!-- Content -->
        <div class="custom-scrollbar flex-1 overflow-y-auto px-6 py-4">
          <div v-if="isLoading" class="flex items-center justify-center py-14 text-sm text-gray-400">
            Loading consumable history...
          </div>

          <div v-else-if="loadError" class="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <p class="text-sm text-error-600 dark:text-error-500">{{ loadError }}</p>
            <button @click="loadAll" class="text-sm font-medium text-brand-500 hover:underline">Retry</button>
          </div>

          <template v-else>
            <!-- Movements -->
            <BaseTable v-if="activeTab === 'movements'">
              <template #head>
                <TableHeadCell>Transaction</TableHeadCell>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>Quantity</TableHeadCell>
                <TableHeadCell>From / To</TableHeadCell>
                <TableHeadCell>Recipient</TableHeadCell>
                <TableHeadCell>Date</TableHeadCell>
                <TableHeadCell>By</TableHeadCell>
              </template>
              <tr v-if="!transactions.length">
                <td colspan="7" class="px-5 py-10 text-center text-theme-sm text-gray-400">No movements recorded yet.</td>
              </tr>
              <tr v-for="row in transactions" :key="row.id" class="border-t border-gray-100 dark:border-gray-800">
                <td class="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400">
                  <div>{{ row.transaction_number }}</div>
                  <div v-if="row.reference_number" class="text-gray-400 dark:text-gray-500">Ref: {{ row.reference_number }}</div>
                </td>
                <td class="whitespace-nowrap px-5 py-3">
                  <Badge :color="MOVEMENT_BADGE[row.movement_type] || 'light'" size="sm">{{ formatLabel(row.movement_type) }}</Badge>
                </td>
                <td class="whitespace-nowrap px-5 py-3 text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ formatMovementQuantity(row) }}
                </td>
                <td class="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                  <span v-if="row.from_location_id">{{ row.from_location_name || locationName(row.from_location_id) }}</span>
                  <span v-if="row.from_location_id && row.to_location_id"> &rarr; </span>
                  <span v-if="row.to_location_id">{{ row.to_location_name || locationName(row.to_location_id) }}</span>
                  <span v-if="!row.from_location_id && !row.to_location_id">-</span>
                </td>
                <td class="px-5 py-3 text-theme-sm text-gray-500 dark:text-gray-400">{{ recipientDescription(row) }}</td>
                <td class="whitespace-nowrap px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400">
                  {{ formatAbsoluteTime(row.transaction_date) }}
                </td>
                <td class="whitespace-nowrap px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400">
                  {{ userName(row.created_by) }}
                </td>
              </tr>
            </BaseTable>

            <!-- Balances -->
            <BaseTable v-else-if="activeTab === 'balances'">
              <template #head>
                <TableHeadCell>Location</TableHeadCell>
                <TableHeadCell>Quantity</TableHeadCell>
              </template>
              <tr v-if="!balances.length">
                <td colspan="2" class="px-5 py-10 text-center text-theme-sm text-gray-400">No stock balances recorded.</td>
              </tr>
              <tr v-for="row in balances" :key="row.location_id" class="border-t border-gray-100 dark:border-gray-800">
                <td class="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                  {{ row.location_name }} <span v-if="row.location_code" class="text-gray-400">({{ row.location_code }})</span>
                </td>
                <td class="px-5 py-3 text-theme-sm font-medium text-gray-700 dark:text-gray-300">
                  {{ formatQuantity(row.quantity) }} {{ consumableDetail?.uom_code || '' }}
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
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Badge from '@/components/ui/Badge.vue'
import BaseTable from '@/components/tables/BaseTable.vue'
import TableHeadCell from '@/components/tables/TableHeadCell.vue'
import SelectField from '@/components/forms/FormElements/SelectField.vue'
import DateField from '@/components/forms/FormElements/DateField.vue'
import { RefreshIcon } from '@/icons'
import { formatAbsoluteTime } from '@/utils/formatTime'
import {
  getConsumableHistory,
  createConsumableMovement,
  getMasterData,
  getDirectoryDepartments,
  getDirectoryUsers,
  getAssets,
} from '@/service/axios'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  consumable: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'changed'])

const TABS = [
  { key: 'movements', label: 'Movements' },
  { key: 'balances', label: 'Balances' },
]

const MOVEMENT_TYPE_OPTIONS = [
  { value: 'RECEIVE', label: 'Receive' },
  { value: 'ISSUE', label: 'Issue' },
  { value: 'TRANSFER', label: 'Transfer' },
  { value: 'ADJUSTMENT', label: 'Adjustment' },
  { value: 'RETURN', label: 'Return' },
  { value: 'WRITE_OFF', label: 'Write Off' },
  { value: 'OPENING_BALANCE', label: 'Opening Balance' },
]

const RECIPIENT_TYPE_OPTIONS = [
  { value: 'USER', label: 'User' },
  { value: 'DEPARTMENT', label: 'Department' },
  { value: 'ASSET', label: 'Asset' },
  { value: 'LOCATION', label: 'Location' },
  { value: 'GENERAL_USAGE', label: 'General Usage' },
]

const MOVEMENT_BADGE = {
  OPENING_BALANCE: 'light',
  RECEIVE: 'success',
  ISSUE: 'warning',
  TRANSFER: 'info',
  ADJUSTMENT: 'dark',
  WRITE_OFF: 'error',
  RETURN: 'success',
}

const FROM_LOCATION_TYPES = ['ISSUE', 'WRITE_OFF', 'TRANSFER']
const TO_LOCATION_TYPES = ['OPENING_BALANCE', 'RECEIVE', 'RETURN', 'TRANSFER', 'ADJUSTMENT']

const consumableDetail = ref(null)
const balances = ref([])
const transactions = ref([])
const isLoading = ref(false)
const loadError = ref('')

const activeTab = ref('movements')
const activeAction = ref('')
const actionError = ref('')
const isSubmittingAction = ref(false)

const locations = ref([])
const lookupsLoaded = ref(false)

function tabCount(key) {
  if (key === 'movements') return transactions.value.length
  if (key === 'balances') return balances.value.length
  return 0
}

const brandVariant = computed(() => {
  const parts = [consumableDetail.value?.brand_name, consumableDetail.value?.variant].filter(Boolean)
  return parts.length ? parts.join(' / ') : ''
})

const totalStock = computed(() => balances.value.reduce((sum, row) => sum + Number(row.quantity ?? 0), 0))

const isLowStock = computed(() => {
  const minimum = Number(consumableDetail.value?.minimum_stock ?? 0)
  return minimum > 0 && totalStock.value < minimum
})

function formatQuantity(value) {
  if (value === null || value === undefined || value === '') return '-'
  const number = Number(value)
  if (Number.isNaN(number)) return '-'
  return new Intl.NumberFormat('id-ID', { maximumFractionDigits: 2 }).format(number)
}

function formatLabel(value) {
  if (!value) return '-'
  return value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

function formatMovementQuantity(row) {
  const qty = Number(row.quantity)
  if (Number.isNaN(qty)) return '-'
  const abs = formatQuantity(Math.abs(qty))
  if (row.movement_type === 'ADJUSTMENT') return qty >= 0 ? `+${abs}` : `-${abs}`
  if (['ISSUE', 'WRITE_OFF'].includes(row.movement_type)) return `-${abs}`
  return `+${abs}`
}

function getRecordId(item) {
  return item?.id ?? item?.uuid ?? item?.department_id ?? ''
}

function getRecordLabel(item) {
  return (
    item?.name ||
    item?.full_name ||
    item?.display_name ||
    item?.department_name ||
    item?.username ||
    item?.email ||
    (item?.asset_name ? `${item.asset_name}${item.asset_number ? ` (${item.asset_number})` : ''}` : '') ||
    String(getRecordId(item))
  )
}

function normalizeDirectoryList(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  const candidate = payload.items || payload.departments || payload.users || payload.data
  return Array.isArray(candidate) ? candidate : []
}

function createDirectoryField(fetcher) {
  const options = ref([])
  const loaded = ref(false)
  const isLoadingField = ref(false)
  const isOpen = ref(false)
  const query = ref('')
  const selectedId = ref('')
  const containerRef = ref(null)

  const filtered = computed(() => {
    const term = query.value.trim().toLowerCase()
    if (!term) return options.value
    return options.value.filter((item) =>
      [getRecordLabel(item), getRecordId(item)].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))
    )
  })

  const selected = computed(() => options.value.find((item) => String(getRecordId(item)) === String(selectedId.value)) || null)

  async function load() {
    if (loaded.value || isLoadingField.value) return
    isLoadingField.value = true
    try {
      const res = await fetcher()
      options.value = normalizeDirectoryList(res?.data)
    } catch {
      options.value = []
    } finally {
      isLoadingField.value = false
      loaded.value = true
    }
  }

  function open() {
    isOpen.value = true
    if (!loaded.value) load()
  }

  function select(item) {
    selectedId.value = String(getRecordId(item))
    query.value = getRecordLabel(item)
    isOpen.value = false
  }

  function closeAndSync() {
    isOpen.value = false
    query.value = selected.value ? getRecordLabel(selected.value) : ''
  }

  function reset() {
    selectedId.value = ''
    query.value = ''
    isOpen.value = false
  }

  return { options, filtered, selected, selectedId, query, isOpen, isLoading: isLoadingField, containerRef, load, open, select, closeAndSync, reset }
}

function createAssetSearchField() {
  const options = ref([])
  const isLoadingField = ref(false)
  const isOpen = ref(false)
  const query = ref('')
  const selectedId = ref('')
  const containerRef = ref(null)
  let searchTimer = null

  const selected = computed(() => options.value.find((item) => String(getRecordId(item)) === String(selectedId.value)) || null)

  async function search(term) {
    isLoadingField.value = true
    try {
      const res = await getAssets({ search: term, limit: 20 })
      options.value = res?.data ?? []
    } catch {
      options.value = []
    } finally {
      isLoadingField.value = false
    }
  }

  function open() {
    isOpen.value = true
    if (!options.value.length) search(query.value.trim())
  }

  function onQueryInput() {
    clearTimeout(searchTimer)
    searchTimer = setTimeout(() => search(query.value.trim()), 350)
  }

  function select(item) {
    selectedId.value = String(getRecordId(item))
    query.value = getRecordLabel(item)
    isOpen.value = false
  }

  function closeAndSync() {
    isOpen.value = false
    query.value = selected.value ? getRecordLabel(selected.value) : query.value
  }

  function reset() {
    clearTimeout(searchTimer)
    selectedId.value = ''
    query.value = ''
    isOpen.value = false
    options.value = []
  }

  return { options, selected, selectedId, query, isOpen, isLoading: isLoadingField, containerRef, open, onQueryInput, select, closeAndSync, reset }
}

const recipientUserField = createDirectoryField(getDirectoryUsers)
const recipientDepartmentField = createDirectoryField(getDirectoryDepartments)
const recipientAssetField = createAssetSearchField()

function handleClickOutside(event) {
  ;[recipientUserField, recipientDepartmentField, recipientAssetField].forEach((field) => {
    if (field.containerRef.value && !field.containerRef.value.contains(event.target)) field.closeAndSync()
  })
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

const locationMap = computed(() => new Map(locations.value.map((i) => [String(i.id), i.name])))
const departmentMap = computed(() => new Map(recipientDepartmentField.options.value.map((i) => [String(getRecordId(i)), getRecordLabel(i)])))
const userMap = computed(() => new Map(recipientUserField.options.value.map((i) => [String(getRecordId(i)), getRecordLabel(i)])))

function shortId(id) {
  if (id === null || id === undefined || id === '') return '-'
  const text = String(id)
  return text.length > 8 ? `${text.slice(0, 8)}…` : text
}

function locationName(id) {
  if (!id) return '-'
  return locationMap.value.get(String(id)) || `#${id}`
}
function departmentName(id) {
  if (!id) return '-'
  return departmentMap.value.get(String(id)) || `#${id}`
}
function userName(id) {
  if (!id) return '-'
  return userMap.value.get(String(id)) || shortId(id)
}

function recipientDescription(row) {
  if (!row.recipient_type) return '-'
  switch (row.recipient_type) {
    case 'USER':
      return row.recipient_user_name_snapshot || userName(row.recipient_user_id)
    case 'DEPARTMENT':
      return row.recipient_department_name_snapshot || departmentName(row.recipient_department_id)
    case 'ASSET':
      return row.recipient_asset_number ? `Asset ${row.recipient_asset_number}` : `Asset #${row.recipient_asset_id}`
    case 'LOCATION':
      return locationName(row.recipient_location_id)
    case 'GENERAL_USAGE':
      return 'General Usage'
    default:
      return '-'
  }
}

const showFromLocation = computed(() => FROM_LOCATION_TYPES.includes(form.movement_type))
const showToLocation = computed(() => TO_LOCATION_TYPES.includes(form.movement_type))
const showRecipient = computed(() => form.movement_type === 'ISSUE')

const form = reactive({
  movement_type: 'RECEIVE',
  quantity: '',
  from_location_id: '',
  to_location_id: '',
  recipient_type: '',
  recipient_location_id: '',
  unit_cost: '',
  transaction_date: '',
  reference_number: '',
  purpose: '',
  notes: '',
})

function openAction(name) {
  actionError.value = ''
  activeAction.value = name
  if (name === 'movement') {
    form.movement_type = 'RECEIVE'
    form.quantity = ''
    form.from_location_id = ''
    form.to_location_id = ''
    form.recipient_type = ''
    form.recipient_location_id = ''
    form.unit_cost = ''
    form.transaction_date = ''
    form.reference_number = ''
    form.purpose = ''
    form.notes = ''
    recipientUserField.reset()
    recipientDepartmentField.reset()
    recipientAssetField.reset()
  }
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

async function submitMovement() {
  actionError.value = ''
  const qty = Number(form.quantity)
  if (!Number.isFinite(qty) || qty === 0) {
    actionError.value = 'Quantity must be a non-zero number.'
    return
  }
  if (form.movement_type !== 'ADJUSTMENT' && qty < 0) {
    actionError.value = 'Quantity must be positive except for Adjustment.'
    return
  }
  if (showFromLocation.value && !form.from_location_id) {
    actionError.value = 'From location is required.'
    return
  }
  if (showToLocation.value && !form.to_location_id) {
    actionError.value = 'To location is required.'
    return
  }
  if (
    form.movement_type === 'TRANSFER' &&
    form.from_location_id &&
    form.to_location_id &&
    String(form.from_location_id) === String(form.to_location_id)
  ) {
    actionError.value = 'From and to location must differ.'
    return
  }
  if (showRecipient.value) {
    if (!form.recipient_type) {
      actionError.value = 'Recipient type is required for Issue.'
      return
    }
    if (form.recipient_type === 'USER' && !recipientUserField.selectedId.value) {
      actionError.value = 'Recipient user is required.'
      return
    }
    if (form.recipient_type === 'DEPARTMENT' && !recipientDepartmentField.selectedId.value) {
      actionError.value = 'Recipient department is required.'
      return
    }
    if (form.recipient_type === 'ASSET' && !recipientAssetField.selectedId.value) {
      actionError.value = 'Recipient asset is required.'
      return
    }
    if (form.recipient_type === 'LOCATION' && !form.recipient_location_id) {
      actionError.value = 'Recipient location is required.'
      return
    }
  }

  isSubmittingAction.value = true
  try {
    const payload = { movement_type: form.movement_type, quantity: qty }
    if (showFromLocation.value) payload.from_location_id = form.from_location_id
    if (showToLocation.value) payload.to_location_id = form.to_location_id
    if (showRecipient.value) {
      payload.recipient_type = form.recipient_type
      if (form.recipient_type === 'USER') {
        payload.recipient_user_id = recipientUserField.selectedId.value
        if (recipientUserField.selected.value) payload.recipient_user_name_snapshot = getRecordLabel(recipientUserField.selected.value)
      } else if (form.recipient_type === 'DEPARTMENT') {
        payload.recipient_department_id = recipientDepartmentField.selectedId.value
        if (recipientDepartmentField.selected.value)
          payload.recipient_department_name_snapshot = getRecordLabel(recipientDepartmentField.selected.value)
      } else if (form.recipient_type === 'ASSET') {
        payload.recipient_asset_id = recipientAssetField.selectedId.value
      } else if (form.recipient_type === 'LOCATION') {
        payload.recipient_location_id = form.recipient_location_id
      }
    }
    if (form.unit_cost !== '' && form.unit_cost !== null) payload.unit_cost = Number(form.unit_cost)
    if (form.transaction_date) payload.transaction_date = form.transaction_date
    if (form.reference_number.trim()) payload.reference_number = form.reference_number.trim()
    if (form.purpose.trim()) payload.purpose = form.purpose.trim()
    if (form.notes.trim()) payload.notes = form.notes.trim()

    await createConsumableMovement(consumableDetail.value.id, payload)
    await afterMutate()
  } catch (err) {
    const typeLabel = MOVEMENT_TYPE_OPTIONS.find((opt) => opt.value === form.movement_type)?.label || form.movement_type
    const message = err?.response?.data?.message
    actionError.value = message ? `${message} (movement type: ${typeLabel})` : 'Failed to record movement.'
  } finally {
    isSubmittingAction.value = false
  }
}

async function loadAll() {
  if (!props.consumable?.id) return
  isLoading.value = true
  loadError.value = ''
  try {
    const res = await getConsumableHistory(props.consumable.id)
    const data = res?.data
    consumableDetail.value = data?.consumable || null
    balances.value = data?.balances ?? []
    transactions.value = data?.transactions ?? []
  } catch (err) {
    loadError.value = err?.response?.data?.message || 'Failed to load consumable history.'
  } finally {
    isLoading.value = false
  }
}

async function loadLookups() {
  if (lookupsLoaded.value) return
  const locRes = await getMasterData('locations', { is_active: 1 }).catch(() => null)
  locations.value = locRes?.data ?? []
  recipientUserField.load()
  recipientDepartmentField.load()
  lookupsLoaded.value = true
}

function close() {
  emit('close')
}

watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    consumableDetail.value = props.consumable
    activeTab.value = 'movements'
    activeAction.value = ''
    actionError.value = ''
    loadAll()
    loadLookups()
  }
)
</script>
