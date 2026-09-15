<template>
  <div class="flex flex-col gap-4">
    <p class="text-sm text-gray-500 dark:text-gray-400">
      Set the default depreciation policy a category should suggest for new assets in a department. This does not
      change assets that are already configured.
    </p>

    <form class="flex flex-col gap-4" @submit.prevent="submit">
      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Category *</label>
          <SelectField v-model="form.category_id">
            <option v-for="item in categories" :key="item.id" :value="item.id">{{ item.name }}</option>
          </SelectField>
        </div>
        <div :ref="(el) => (department.containerRef.value = el)" class="relative">
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Managing Department *</label>
          <input
            v-model="department.query.value"
            type="text"
            autocomplete="off"
            placeholder="Search department..."
            @focus="department.open()"
            @click="department.open()"
            class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
          <div
            v-if="department.isOpen.value"
            class="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
          >
            <ul class="custom-scrollbar max-h-56 overflow-y-auto py-1" role="listbox">
              <li v-if="department.isLoading.value" class="px-3 py-2 text-sm text-gray-400">Loading...</li>
              <li v-else-if="!department.filtered.value.length" class="px-3 py-2 text-sm text-gray-400">No departments found.</li>
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
      </div>

      <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div :ref="(el) => (company.containerRef.value = el)" class="relative">
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Company</label>
          <input
            v-model="company.query.value"
            type="text"
            autocomplete="off"
            placeholder="Search company (optional)..."
            @focus="company.open()"
            @click="company.open()"
            class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
          />
          <div
            v-if="company.isOpen.value"
            class="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
          >
            <ul class="custom-scrollbar max-h-56 overflow-y-auto py-1" role="listbox">
              <li v-if="company.isLoading.value" class="px-3 py-2 text-sm text-gray-400">Loading...</li>
              <li v-else-if="!company.filtered.value.length" class="px-3 py-2 text-sm text-gray-400">No companies found.</li>
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
        <div>
          <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Depreciation Policy *</label>
          <SelectField v-model="form.depreciation_policy_id">
            <option v-for="item in policies" :key="item.id" :value="item.id">
              {{ item.name }} ({{ item.useful_life_months }}mo)
            </option>
          </SelectField>
          <p v-if="!policies.length" class="mt-1 text-xs text-gray-400 dark:text-gray-500">
            No active policies yet. Create one above first.
          </p>
        </div>
      </div>

      <p v-if="errorMessage" class="text-sm text-error-600 dark:text-error-500">{{ errorMessage }}</p>
      <p v-if="successResult" class="text-sm text-success-600 dark:text-success-500">
        Default set: {{ successResult.policy_name }} ({{ successResult.useful_life_months }} months) will now be
        suggested for this category and department.
      </p>

      <div>
        <button
          type="submit"
          :disabled="isSubmitting"
          class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {{ isSubmitting ? 'Saving...' : 'Save Default' }}
        </button>
      </div>
    </form>
  </div>
</template>

<script setup>
import { ref, reactive, computed, onMounted, onBeforeUnmount } from 'vue'
import SelectField from '@/components/forms/FormElements/SelectField.vue'
import {
  getMasterData,
  getDepreciationPolicies,
  setCategoryDepreciationDefault,
  getDirectoryDepartments,
  getDirectoryCompanies,
} from '@/service/axios'

const categories = ref([])
const policies = ref([])
const isSubmitting = ref(false)
const errorMessage = ref('')
const successResult = ref(null)

const form = reactive({
  category_id: '',
  depreciation_policy_id: '',
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

  function closeAndSync() {
    isOpen.value = false
    query.value = selected.value ? getRecordLabel(selected.value) : ''
  }

  return { options, filtered, selected, selectedId, query, isOpen, isLoading, containerRef, load, open, select, closeAndSync }
}

const department = createDirectoryField(getDirectoryDepartments)
const company = createDirectoryField(getDirectoryCompanies)

function handleClickOutside(event) {
  if (department.containerRef.value && !department.containerRef.value.contains(event.target)) department.closeAndSync()
  if (company.containerRef.value && !company.containerRef.value.contains(event.target)) company.closeAndSync()
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)
  loadOptions()
})
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

async function loadOptions() {
  try {
    const data = await getMasterData('categories', { tracking_type: 'SERIALIZED_ASSET', is_active: 1 })
    categories.value = (data?.data ?? []).filter((item) => item.is_depreciable)
    if (categories.value.length) form.category_id = categories.value[0].id
  } catch {
    categories.value = []
  }
  try {
    const data = await getDepreciationPolicies()
    policies.value = (data?.data ?? []).filter((item) => item.is_active)
    if (policies.value.length) form.depreciation_policy_id = policies.value[0].id
  } catch {
    policies.value = []
  }
}

async function submit() {
  errorMessage.value = ''
  successResult.value = null
  if (!form.category_id) {
    errorMessage.value = 'Category is required.'
    return
  }
  if (!department.selectedId.value) {
    errorMessage.value = 'Managing department is required.'
    return
  }
  if (!form.depreciation_policy_id) {
    errorMessage.value = 'Depreciation policy is required.'
    return
  }

  isSubmitting.value = true
  try {
    const payload = {
      category_id: form.category_id,
      managing_department_id: department.selectedId.value,
      depreciation_policy_id: form.depreciation_policy_id,
    }
    if (company.selectedId.value) payload.company_id = company.selectedId.value
    const data = await setCategoryDepreciationDefault(payload)
    successResult.value = data?.data || null
  } catch (err) {
    errorMessage.value = err?.response?.data?.message || 'Failed to set category default.'
  } finally {
    isSubmitting.value = false
  }
}
</script>
