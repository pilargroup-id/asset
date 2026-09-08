<template>
  <Modal v-if="isOpen" full-screen-backdrop @close="close">
    <template #body>
      <div
        class="no-scrollbar relative max-h-[90vh] w-full max-w-[720px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8"
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
          {{ isEditMode ? 'Edit Numbering Config' : 'Create Numbering Config' }}
        </h4>
        <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
          <template v-if="isEditMode">
            Department, company, and sequence type cannot be changed here.
          </template>
          <template v-else>Fields marked with * are required.</template>
        </p>

        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
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
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Company</label>
              <input
                v-model="company.query.value"
                type="text"
                autocomplete="off"
                placeholder="Search company..."
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
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Sequence Type *</label>
              <SelectField v-if="!isEditMode" v-model="form.sequence_type">
                <option value="ASSET">Asset</option>
                <option value="CONSUMABLE">Consumable</option>
              </SelectField>
              <input
                v-else
                type="text"
                disabled
                :value="form.sequence_type"
                class="dark:bg-dark-900 h-11 w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-500 shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-400"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Name *</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="e.g. IT Asset Numbering"
                required
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Prefix</label>
              <input
                v-model="form.prefix"
                type="text"
                placeholder="e.g. AST"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Reset Period</label>
              <SelectField v-model="form.reset_period">
                <option value="NEVER">Never</option>
                <option value="YEARLY">Yearly</option>
                <option value="MONTHLY">Monthly</option>
              </SelectField>
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Company Token</label>
              <input
                v-model="form.company_token"
                type="text"
                placeholder="e.g. HQ"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Department Token</label>
              <input
                v-model="form.department_token"
                type="text"
                placeholder="e.g. IT"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Sequence Length</label>
              <input
                v-model.number="form.sequence_length"
                type="number"
                min="1"
                max="20"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
            </div>
          </div>

          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Pattern *</label>
              <input
                v-model="form.pattern"
                type="text"
                placeholder="e.g. {PREFIX}-{DEPARTMENT}-{YYYY}-{SEQ:5}"
                required
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
              <p class="mt-1 text-xs text-gray-400 dark:text-gray-500">
                Tokens: {PREFIX} {COMPANY} {DEPARTMENT} {YYYY} {YY} {MM} {SEQ} or {SEQ:n}
              </p>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Starting Sequence</label>
              <input
                v-model.number="form.starting_sequence"
                type="number"
                min="1"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Status</label>
            <ToggleSwitch v-model="form.is_active" on-label="Active" off-label="Inactive" />
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
import {
  createNumberingConfig,
  updateNumberingConfig,
  getDirectoryDepartments,
  getDirectoryCompanies,
} from '@/service/axios'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  config: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'created', 'updated'])

const isEditMode = computed(() => !!props.config)

const isSubmitting = ref(false)
const errorMessage = ref('')

const form = reactive({
  sequence_type: 'ASSET',
  name: '',
  prefix: '',
  company_token: '',
  department_token: '',
  pattern: '',
  sequence_length: 5,
  starting_sequence: 1,
  reset_period: 'NEVER',
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
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

function populateForm(config) {
  form.sequence_type = config.sequence_type || 'ASSET'
  form.name = config.name || ''
  form.prefix = config.prefix || ''
  form.company_token = config.company_token || ''
  form.department_token = config.department_token || ''
  form.pattern = config.pattern || ''
  form.sequence_length = config.sequence_length ?? 5
  form.starting_sequence = config.starting_sequence ?? 1
  form.reset_period = config.reset_period || 'NEVER'
  form.is_active = config.is_active === undefined ? true : !!config.is_active
  department.setSelected(config.managing_department_id)
  company.setSelected(config.company_id)
}

function resetForm() {
  form.sequence_type = 'ASSET'
  form.name = ''
  form.prefix = ''
  form.company_token = ''
  form.department_token = ''
  form.pattern = ''
  form.sequence_length = 5
  form.starting_sequence = 1
  form.reset_period = 'NEVER'
  form.is_active = true
  errorMessage.value = ''
  department.reset()
  company.reset()
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      if (isEditMode.value) populateForm(props.config)
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
    pattern: form.pattern.trim(),
    reset_period: form.reset_period,
    sequence_length: form.sequence_length,
    starting_sequence: form.starting_sequence,
    is_active: form.is_active,
  }
  payload.prefix = form.prefix.trim() || null
  payload.company_token = form.company_token.trim() || null
  payload.department_token = form.department_token.trim() || null
  return payload
}

async function submit() {
  errorMessage.value = ''
  if (!form.name.trim()) {
    errorMessage.value = 'Name is required.'
    return
  }
  if (!form.pattern.trim()) {
    errorMessage.value = 'Pattern is required.'
    return
  }
  if (!isEditMode.value && !department.selectedId.value) {
    errorMessage.value = 'Managing department is required.'
    return
  }

  isSubmitting.value = true
  try {
    if (isEditMode.value) {
      const data = await updateNumberingConfig(props.config.id, buildEditablePayload())
      emit('updated', data?.data)
    } else {
      const payload = {
        ...buildEditablePayload(),
        managing_department_id: department.selectedId.value,
        sequence_type: form.sequence_type,
      }
      if (company.selectedId.value) payload.company_id = company.selectedId.value
      const data = await createNumberingConfig(payload)
      emit('created', data?.data)
    }
    close()
  } catch (err) {
    errorMessage.value = err?.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} numbering config.`
  } finally {
    isSubmitting.value = false
  }
}
</script>
