<template>
  <Modal v-if="isOpen" full-screen-backdrop @close="close">
    <template #body>
      <div
        class="no-scrollbar relative max-h-[90vh] w-full max-w-[760px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8"
      >
        <button
          @click="close"
          type="button"
          class="transition-color absolute right-5 top-5 z-999 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-300"
        >
          <svg class="fill-current" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z"
              fill=""
            />
          </svg>
        </button>

        <h4 class="mb-1 text-xl font-semibold text-gray-800 dark:text-white/90">
          {{ isEditMode ? 'Edit Consumable' : 'Create Consumable' }}
        </h4>
        <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
          <template v-if="isEditMode">
            Update consumable master data. Department, company, and consumable code cannot be changed here.
          </template>
          <template v-else> Register a new consumable item. Fields marked with * are required. </template>
        </p>

        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Name *
              </label>
              <input
                v-model="form.name"
                type="text"
                placeholder="e.g. A4 Paper 80gsm"
                required
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Category *
              </label>

              <div ref="categoryDropdownRef" class="relative">
                <div class="relative">
                  <input
                    v-model="categoryQuery"
                    type="text"
                    placeholder="Search or create category"
                    autocomplete="off"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    @focus="isCategoryDropdownOpen = true"
                    @keydown.enter.prevent="handleCategoryEnter"
                    @keydown.esc="isCategoryDropdownOpen = false"
                  />
                  <ChevronDownIcon
                    class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700 transition-transform dark:text-gray-400"
                    :class="{ 'rotate-180': isCategoryDropdownOpen }"
                  />
                </div>

                <transition
                  enter-active-class="transition duration-100 ease-out"
                  enter-from-class="transform scale-95 opacity-0"
                  enter-to-class="transform scale-100 opacity-100"
                  leave-active-class="transition duration-75 ease-in"
                  leave-from-class="transform scale-100 opacity-100"
                  leave-to-class="transform scale-95 opacity-0"
                >
                  <div
                    v-if="isCategoryDropdownOpen"
                    class="absolute z-10 mt-1 w-full rounded-lg bg-white shadow-lg dark:bg-gray-900"
                  >
                    <ul
                      class="custom-scrollbar max-h-60 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800"
                      role="listbox"
                    >
                      <li
                        v-for="item in filteredCategoryOptions"
                        :key="item.id"
                        @click="selectCategory(item)"
                        class="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                        :class="String(form.category_id) === String(item.id) ? 'bg-gray-50 text-gray-800 dark:bg-white/[0.03] dark:text-white/90' : 'text-gray-500 dark:text-gray-400'"
                      >
                        {{ item.name }}
                      </li>
                      <li
                        v-if="showCreateCategoryOption"
                        @click="createCategoryFromQuery"
                        class="cursor-pointer rounded-b-lg px-3 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-white/[0.03]"
                      >
                        {{ isCreatingCategory ? 'Creating...' : `+ Create "${categoryQuery.trim()}"` }}
                      </li>
                      <li
                        v-else-if="!filteredCategoryOptions.length && categoryQuery.trim()"
                        class="px-3 py-2 text-sm text-gray-400 dark:text-gray-500"
                      >
                        No matches
                      </li>
                    </ul>
                  </div>
                </transition>
              </div>
              <p v-if="categoryError" class="mt-1.5 text-xs text-error-600 dark:text-error-500">
                {{ categoryError }}
              </p>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Brand
              </label>
              <SelectField v-model="form.brand_id" placeholder="Select brand">
                <option v-for="item in brands" :key="item.id" :value="item.id">{{ item.name }}</option>
              </SelectField>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Variant
              </label>
              <input
                v-model="form.variant"
                type="text"
                placeholder="e.g. White / 500 sheets"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Unit of Measure *
              </label>

              <div ref="uomDropdownRef" class="relative">
                <div class="relative">
                  <input
                    v-model="uomQuery"
                    type="text"
                    placeholder="Search or create unit"
                    autocomplete="off"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    @focus="isUomDropdownOpen = true"
                    @keydown.enter.prevent="handleUomEnter"
                    @keydown.esc="isUomDropdownOpen = false"
                  />
                  <ChevronDownIcon
                    class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700 transition-transform dark:text-gray-400"
                    :class="{ 'rotate-180': isUomDropdownOpen }"
                  />
                </div>

                <transition
                  enter-active-class="transition duration-100 ease-out"
                  enter-from-class="transform scale-95 opacity-0"
                  enter-to-class="transform scale-100 opacity-100"
                  leave-active-class="transition duration-75 ease-in"
                  leave-from-class="transform scale-100 opacity-100"
                  leave-to-class="transform scale-95 opacity-0"
                >
                  <div
                    v-if="isUomDropdownOpen"
                    class="absolute z-10 mt-1 w-full rounded-lg bg-white shadow-lg dark:bg-gray-900"
                  >
                    <ul
                      class="custom-scrollbar max-h-60 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800"
                      role="listbox"
                    >
                      <li
                        v-for="item in filteredUomOptions"
                        :key="item.id"
                        @click="selectUom(item)"
                        class="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                        :class="String(form.uom_id) === String(item.id) ? 'bg-gray-50 text-gray-800 dark:bg-white/[0.03] dark:text-white/90' : 'text-gray-500 dark:text-gray-400'"
                      >
                        {{ item.name }} ({{ item.code }})
                      </li>
                      <li
                        v-if="showCreateUomOption"
                        @click="createUomFromQuery"
                        class="cursor-pointer rounded-b-lg px-3 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-white/[0.03]"
                      >
                        {{ isCreatingUom ? 'Creating...' : `+ Create "${uomQuery.trim()}"` }}
                      </li>
                      <li
                        v-else-if="!filteredUomOptions.length && uomQuery.trim()"
                        class="px-3 py-2 text-sm text-gray-400 dark:text-gray-500"
                      >
                        No matches
                      </li>
                    </ul>
                  </div>
                </transition>
              </div>
              <p v-if="uomError" class="mt-1.5 text-xs text-error-600 dark:text-error-500">
                {{ uomError }}
              </p>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Minimum Stock
              </label>
              <input
                v-model="form.minimum_stock"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <div :ref="(el) => (department.containerRef.value = el)" class="relative">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Managing Department *
              </label>
              <input
                v-model="department.query.value"
                type="text"
                autocomplete="off"
                placeholder="Search department..."
                required
                :disabled="isEditMode"
                @focus="department.open()"
                @click="department.open()"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 dark:disabled:bg-white/[0.03] dark:disabled:text-gray-400"
              />
              <div
                v-if="department.isOpen.value && !isEditMode"
                class="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <ul class="custom-scrollbar max-h-56 overflow-y-auto py-1" role="listbox">
                  <li v-if="department.isLoading.value" class="px-3 py-2 text-sm text-gray-400">Loading...</li>
                  <li v-else-if="!department.filtered.value.length" class="px-3 py-2 text-sm text-gray-400">
                    No departments found.
                  </li>
                  <li
                    v-for="item in department.filtered.value"
                    :key="getRecordId(item)"
                    @click="department.select(item)"
                    role="option"
                    class="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
                    :class="{ 'bg-gray-50 dark:bg-white/[0.03]': String(getRecordId(item)) === String(department.selectedId.value) }"
                  >
                    <span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ getRecordLabel(item) }}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div :ref="(el) => (company.containerRef.value = el)" class="relative">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Company *
              </label>
              <input
                v-model="company.query.value"
                type="text"
                autocomplete="off"
                placeholder="Search company..."
                required
                :disabled="isEditMode"
                @focus="company.open()"
                @click="company.open()"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 dark:disabled:bg-white/[0.03] dark:disabled:text-gray-400"
              />
              <div
                v-if="company.isOpen.value && !isEditMode"
                class="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <ul class="custom-scrollbar max-h-56 overflow-y-auto py-1" role="listbox">
                  <li v-if="company.isLoading.value" class="px-3 py-2 text-sm text-gray-400">Loading...</li>
                  <li v-else-if="!company.filtered.value.length" class="px-3 py-2 text-sm text-gray-400">
                    No companies found.
                  </li>
                  <li
                    v-for="item in company.filtered.value"
                    :key="getRecordId(item)"
                    @click="company.select(item)"
                    role="option"
                    class="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
                    :class="{ 'bg-gray-50 dark:bg-white/[0.03]': String(getRecordId(item)) === String(company.selectedId.value) }"
                  >
                    <span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ getRecordLabel(item) }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div v-if="!isEditMode">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Consumable Code
              </label>
              <input
                v-model="form.consumable_code"
                type="text"
                placeholder="Auto-generated if left blank"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            <div v-else>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Status
              </label>
              <ToggleSwitch v-model="form.is_active" on-label="Active" off-label="Inactive" />
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Notes
            </label>
            <textarea
              v-model="form.notes"
              rows="2"
              placeholder="Additional notes..."
              class="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>

          <p v-if="errorMessage" class="text-sm text-error-600 dark:text-error-500">
            {{ errorMessage }}
          </p>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              @click="close"
              type="button"
              class="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : isEditMode ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import SelectField from '@/components/forms/FormElements/SelectField.vue'
import ToggleSwitch from '@/components/forms/FormElements/ToggleSwitch.vue'
import { ChevronDownIcon } from '@/icons'
import {
  getMasterData,
  createMasterData,
  createConsumable,
  updateConsumable,
  getDirectoryDepartments,
  getDirectoryCompanies,
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

const emit = defineEmits(['close', 'created', 'updated'])

const isEditMode = computed(() => !!props.consumable)

const isSubmitting = ref(false)
const errorMessage = ref('')

const categories = ref([])
const brands = ref([])
const uoms = ref([])

const categoryQuery = ref('')
const isCategoryDropdownOpen = ref(false)
const categoryDropdownRef = ref(null)
const isCreatingCategory = ref(false)
const categoryError = ref('')

const selectedCategoryLabel = computed(() => {
  const item = categories.value.find((c) => String(c.id) === String(form.category_id))
  return item ? item.name : ''
})

const filteredCategoryOptions = computed(() => {
  const q = categoryQuery.value.trim().toLowerCase()
  if (!q) return categories.value
  return categories.value.filter((item) =>
    [item.name, item.code].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
  )
})

const showCreateCategoryOption = computed(() => {
  const q = categoryQuery.value.trim()
  if (!q) return false
  return !categories.value.some((item) => item.name.toLowerCase() === q.toLowerCase())
})

watch(selectedCategoryLabel, (label) => {
  if (!isCategoryDropdownOpen.value) categoryQuery.value = label
})

watch(isCategoryDropdownOpen, (open) => {
  if (!open) categoryQuery.value = selectedCategoryLabel.value
})

function selectCategory(item) {
  form.category_id = item.id
  categoryQuery.value = item.name
  isCategoryDropdownOpen.value = false
}

function handleCategoryEnter() {
  if (showCreateCategoryOption.value) {
    createCategoryFromQuery()
  } else if (filteredCategoryOptions.value.length === 1) {
    selectCategory(filteredCategoryOptions.value[0])
  }
}

async function createCategoryFromQuery() {
  const name = categoryQuery.value.trim()
  if (!name) return

  isCreatingCategory.value = true
  categoryError.value = ''
  try {
    const data = await createMasterData('categories', {
      code: slugifyCode(name),
      name,
      tracking_type: 'CONSUMABLE',
      is_active: true,
    })
    const newCategory = data?.data
    if (newCategory) {
      categories.value = [...categories.value, newCategory]
      form.category_id = newCategory.id
      categoryQuery.value = newCategory.name
    }
    isCategoryDropdownOpen.value = false
  } catch (err) {
    categoryError.value = err?.response?.data?.message || 'Failed to create category.'
  } finally {
    isCreatingCategory.value = false
  }
}

const uomQuery = ref('')
const isUomDropdownOpen = ref(false)
const uomDropdownRef = ref(null)
const isCreatingUom = ref(false)
const uomError = ref('')

const selectedUomLabel = computed(() => {
  const item = uoms.value.find((u) => String(u.id) === String(form.uom_id))
  return item ? `${item.name} (${item.code})` : ''
})

const filteredUomOptions = computed(() => {
  const q = uomQuery.value.trim().toLowerCase()
  if (!q) return uoms.value
  return uoms.value.filter((item) =>
    [item.name, item.code].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
  )
})

const showCreateUomOption = computed(() => {
  const q = uomQuery.value.trim()
  if (!q) return false
  return !uoms.value.some(
    (item) => item.name.toLowerCase() === q.toLowerCase() || String(item.code).toLowerCase() === q.toLowerCase()
  )
})

watch(selectedUomLabel, (label) => {
  if (!isUomDropdownOpen.value) uomQuery.value = label
})

watch(isUomDropdownOpen, (open) => {
  if (!open) uomQuery.value = selectedUomLabel.value
})

function selectUom(item) {
  form.uom_id = item.id
  uomQuery.value = `${item.name} (${item.code})`
  isUomDropdownOpen.value = false
}

function handleUomEnter() {
  if (showCreateUomOption.value) {
    createUomFromQuery()
  } else if (filteredUomOptions.value.length === 1) {
    selectUom(filteredUomOptions.value[0])
  }
}

async function createUomFromQuery() {
  const name = uomQuery.value.trim()
  if (!name) return

  isCreatingUom.value = true
  uomError.value = ''
  try {
    const data = await createMasterData('uoms', {
      code: slugifyCode(name),
      name,
      is_active: true,
    })
    const newUom = data?.data
    if (newUom) {
      uoms.value = [...uoms.value, newUom]
      form.uom_id = newUom.id
      uomQuery.value = `${newUom.name} (${newUom.code})`
    }
    isUomDropdownOpen.value = false
  } catch (err) {
    uomError.value = err?.response?.data?.message || 'Failed to create unit of measure.'
  } finally {
    isCreatingUom.value = false
  }
}

function slugifyCode(value) {
  const base = (value || '')
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
  return base || `UOM-${Date.now().toString(36).toUpperCase()}`
}

const form = reactive({
  name: '',
  category_id: '',
  brand_id: '',
  variant: '',
  uom_id: '',
  minimum_stock: '',
  consumable_code: '',
  notes: '',
  is_active: true,
})

function getRecordId(item) {
  return item?.id ?? item?.uuid ?? item?.department_id ?? item?.company_id ?? ''
}

function getRecordLabel(item) {
  return (
    item?.name ||
    item?.full_name ||
    item?.display_name ||
    item?.department_name ||
    item?.company_name ||
    String(getRecordId(item))
  )
}

function normalizeDirectoryList(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  const candidate = payload.items || payload.departments || payload.companies || payload.data
  return Array.isArray(candidate) ? candidate : []
}

function createDirectoryField(fetcher) {
  const options = ref([])
  const loaded = ref(false)
  const isLoading = ref(false)
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

  const selected = computed(
    () => options.value.find((item) => String(getRecordId(item)) === String(selectedId.value)) || null
  )

  async function load() {
    if (loaded.value || isLoading.value) return
    isLoading.value = true
    try {
      const res = await fetcher()
      options.value = normalizeDirectoryList(res?.data)
    } catch {
      options.value = []
    } finally {
      isLoading.value = false
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

  function setSelected(id) {
    selectedId.value = id !== null && id !== undefined && id !== '' ? String(id) : ''
    query.value = selectedId.value
    if (selectedId.value) {
      load().then(() => {
        if (selected.value) query.value = getRecordLabel(selected.value)
      })
    }
  }

  function closeAndSync() {
    isOpen.value = false
    query.value = selected.value ? getRecordLabel(selected.value) : ''
  }

  function reset() {
    selectedId.value = ''
    query.value = ''
    isOpen.value = false
    loaded.value = false
    options.value = []
  }

  return { options, filtered, selected, selectedId, query, isOpen, isLoading, containerRef, load, open, select, setSelected, closeAndSync, reset }
}

const department = createDirectoryField(getDirectoryDepartments)
const company = createDirectoryField(getDirectoryCompanies)

function handleClickOutside(event) {
  if (department.containerRef.value && !department.containerRef.value.contains(event.target)) {
    department.closeAndSync()
  }
  if (company.containerRef.value && !company.containerRef.value.contains(event.target)) {
    company.closeAndSync()
  }
  if (uomDropdownRef.value && !uomDropdownRef.value.contains(event.target)) {
    isUomDropdownOpen.value = false
  }
  if (categoryDropdownRef.value && !categoryDropdownRef.value.contains(event.target)) {
    isCategoryDropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

async function loadMasterData() {
  const [categoryRes, brandRes, uomRes] = await Promise.allSettled([
    getMasterData('categories', { tracking_type: 'CONSUMABLE', is_active: 1 }),
    getMasterData('brands', { is_active: 1 }),
    getMasterData('uoms', { is_active: 1 }),
  ])
  categories.value = categoryRes.status === 'fulfilled' ? categoryRes.value?.data ?? [] : []
  brands.value = brandRes.status === 'fulfilled' ? brandRes.value?.data ?? [] : []
  uoms.value = uomRes.status === 'fulfilled' ? uomRes.value?.data ?? [] : []
}

function populateFormFromConsumable(consumable) {
  form.name = consumable.name || ''
  form.category_id = consumable.category_id ?? ''
  form.brand_id = consumable.brand_id ?? ''
  form.variant = consumable.variant || ''
  form.uom_id = consumable.uom_id ?? ''
  form.minimum_stock = consumable.minimum_stock ?? ''
  form.consumable_code = consumable.consumable_code || ''
  form.notes = consumable.notes || ''
  form.is_active = consumable.is_active === undefined ? true : !!consumable.is_active
  department.setSelected(consumable.managing_department_id)
  company.setSelected(consumable.company_id)
}

function resetForm() {
  form.name = ''
  form.category_id = ''
  form.brand_id = ''
  form.variant = ''
  form.uom_id = ''
  form.minimum_stock = ''
  form.consumable_code = ''
  form.notes = ''
  form.is_active = true
  errorMessage.value = ''
  department.reset()
  company.reset()
  uomQuery.value = ''
  uomError.value = ''
  isUomDropdownOpen.value = false
  categoryQuery.value = ''
  categoryError.value = ''
  isCategoryDropdownOpen.value = false
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      loadMasterData()
      if (isEditMode.value) populateFormFromConsumable(props.consumable)
    } else {
      resetForm()
    }
  }
)

function close() {
  emit('close')
}

function buildEditablePayload() {
  const payload = {
    name: form.name.trim(),
    category_id: form.category_id,
    uom_id: form.uom_id,
  }
  if (form.brand_id) payload.brand_id = form.brand_id
  if (form.variant.trim()) payload.variant = form.variant.trim()
  if (form.minimum_stock !== '' && form.minimum_stock !== null) payload.minimum_stock = Number(form.minimum_stock)
  if (form.notes.trim()) payload.notes = form.notes.trim()
  if (isEditMode.value) payload.is_active = form.is_active
  return payload
}

async function submit() {
  errorMessage.value = ''
  if (!form.name.trim()) {
    errorMessage.value = 'Name is required.'
    return
  }
  if (!form.category_id) {
    errorMessage.value = 'Category is required.'
    return
  }
  if (!form.uom_id) {
    errorMessage.value = 'Unit of measure is required.'
    return
  }
  if (!isEditMode.value) {
    if (!department.selectedId.value) {
      errorMessage.value = 'Managing department is required.'
      return
    }
    if (!company.selectedId.value) {
      errorMessage.value = 'Company is required.'
      return
    }
  }

  isSubmitting.value = true
  try {
    if (isEditMode.value) {
      const data = await updateConsumable(props.consumable.id, buildEditablePayload())
      emit('updated', data?.data)
    } else {
      const payload = {
        ...buildEditablePayload(),
        managing_department_id: department.selectedId.value,
        company_id: company.selectedId.value,
      }
      if (form.consumable_code.trim()) payload.consumable_code = form.consumable_code.trim()

      const data = await createConsumable(payload)
      emit('created', data?.data)
    }
    close()
  } catch (err) {
    errorMessage.value = err?.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} consumable.`
  } finally {
    isSubmitting.value = false
  }
}
</script>
