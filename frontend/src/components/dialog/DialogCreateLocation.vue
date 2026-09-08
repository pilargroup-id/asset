<template>
  <Modal v-if="isOpen" full-screen-backdrop @close="close">
    <template #body>
      <div
        class="no-scrollbar relative max-h-[90vh] w-full max-w-[560px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8"
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
          {{ isEditMode ? 'Edit Location' : 'Create Location' }}
        </h4>
        <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Fields marked with * are required.
        </p>

        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Name *</label>
              <input
                v-model="form.name"
                type="text"
                placeholder="e.g. Head Office"
                required
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Location Type</label>
              <input
                v-model="form.location_type"
                type="text"
                placeholder="e.g. WAREHOUSE, OFFICE, BRANCH"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Parent Location</label>

              <div ref="parentDropdownRef" class="relative">
                <div class="relative">
                  <input
                    v-model="parentQuery"
                    type="text"
                    placeholder="Search or create parent location"
                    autocomplete="off"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    @focus="isParentDropdownOpen = true"
                    @keydown.enter.prevent="handleParentEnter"
                    @keydown.esc="isParentDropdownOpen = false"
                  />
                  <button
                    v-if="form.parent_id"
                    @click="clearParent"
                    type="button"
                    aria-label="Clear parent location"
                    class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                  >
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        fill-rule="evenodd"
                        clip-rule="evenodd"
                        d="M3.40717 4.46881C3.11428 4.17591 3.11428 3.70104 3.40717 3.40815C3.70006 3.11525 4.17494 3.11525 4.46783 3.40815L6.99943 5.93975L9.53095 3.40822C9.82385 3.11533 10.2987 3.11533 10.5916 3.40822C10.8845 3.70112 10.8845 4.17599 10.5916 4.46888L8.06009 7.00041L10.5916 9.53193C10.8845 9.82482 10.8845 10.2997 10.5916 10.5926C10.2987 10.8855 9.82385 10.8855 9.53095 10.5926L6.99943 8.06107L4.46783 10.5927C4.17494 10.8856 3.70006 10.8856 3.40717 10.5927C3.11428 10.2998 3.11428 9.8249 3.40717 9.53201L5.93877 7.00041L3.40717 4.46881Z"
                        fill="currentColor"
                      />
                    </svg>
                  </button>
                  <ChevronDownIcon
                    v-else
                    class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700 transition-transform dark:text-gray-400"
                    :class="{ 'rotate-180': isParentDropdownOpen }"
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
                    v-if="isParentDropdownOpen"
                    class="absolute z-10 mt-1 w-full rounded-lg bg-white shadow-lg dark:bg-gray-900"
                  >
                    <ul
                      class="custom-scrollbar max-h-60 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800"
                      role="listbox"
                    >
                      <li
                        v-if="!parentQuery.trim()"
                        @click="clearParent"
                        class="cursor-pointer px-3 py-2 text-sm first:rounded-t-lg hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                        :class="!form.parent_id ? 'bg-gray-50 text-gray-800 dark:bg-white/[0.03] dark:text-white/90' : 'text-gray-500 dark:text-gray-400'"
                      >
                        No parent
                      </li>
                      <li
                        v-for="item in filteredParentOptions"
                        :key="item.id"
                        @click="selectParent(item)"
                        class="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                        :class="String(form.parent_id) === String(item.id) ? 'bg-gray-50 text-gray-800 dark:bg-white/[0.03] dark:text-white/90' : 'text-gray-500 dark:text-gray-400'"
                      >
                        {{ item.name }}
                      </li>
                      <li
                        v-if="showCreateParentOption"
                        @click="createParentFromQuery"
                        class="cursor-pointer rounded-b-lg px-3 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-white/[0.03]"
                      >
                        {{ isCreatingParent ? 'Creating...' : `+ Create "${parentQuery.trim()}"` }}
                      </li>
                      <li
                        v-else-if="!filteredParentOptions.length && parentQuery.trim()"
                        class="px-3 py-2 text-sm text-gray-400 dark:text-gray-500"
                      >
                        No matches
                      </li>
                    </ul>
                  </div>
                </transition>
              </div>
              <p v-if="parentError" class="mt-1.5 text-xs text-error-600 dark:text-error-500">
                {{ parentError }}
              </p>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Company</label>
              <SelectField v-model="form.company_id" placeholder="Select company">
                <option v-for="item in companies" :key="getRecordId(item)" :value="getRecordId(item)">
                  {{ getRecordLabel(item) }}
                </option>
              </SelectField>
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
import { ChevronDownIcon } from '@/icons'
import { createMasterData, updateMasterData, getMasterData, getDirectoryCompanies } from '@/service/axios'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  location: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'created', 'updated'])

const isEditMode = computed(() => !!props.location)

const isSubmitting = ref(false)
const errorMessage = ref('')
const locations = ref([])
const companies = ref([])

const parentQuery = ref('')
const isParentDropdownOpen = ref(false)
const parentDropdownRef = ref(null)
const isCreatingParent = ref(false)
const parentError = ref('')

const parentOptions = computed(() =>
  locations.value.filter((item) => !isEditMode.value || String(item.id) !== String(props.location.id))
)

const selectedParentLabel = computed(
  () => parentOptions.value.find((item) => String(item.id) === String(form.parent_id))?.name || ''
)

const filteredParentOptions = computed(() => {
  const q = parentQuery.value.trim().toLowerCase()
  if (!q) return parentOptions.value
  return parentOptions.value.filter((item) => item.name.toLowerCase().includes(q))
})

const showCreateParentOption = computed(() => {
  const q = parentQuery.value.trim()
  if (!q) return false
  return !parentOptions.value.some((item) => item.name.toLowerCase() === q.toLowerCase())
})

watch(selectedParentLabel, (label) => {
  if (!isParentDropdownOpen.value) parentQuery.value = label
})

watch(isParentDropdownOpen, (open) => {
  if (!open) parentQuery.value = selectedParentLabel.value
})

function selectParent(item) {
  form.parent_id = item.id
  parentQuery.value = item.name
  isParentDropdownOpen.value = false
}

function clearParent() {
  form.parent_id = ''
  parentQuery.value = ''
  isParentDropdownOpen.value = false
}

function handleParentEnter() {
  if (showCreateParentOption.value) {
    createParentFromQuery()
  } else if (filteredParentOptions.value.length === 1) {
    selectParent(filteredParentOptions.value[0])
  }
}

async function createParentFromQuery() {
  const name = parentQuery.value.trim()
  if (!name) return

  isCreatingParent.value = true
  parentError.value = ''
  try {
    const data = await createMasterData('locations', {
      code: slugifyCode(name),
      name,
      is_active: true,
    })
    const newLocation = data?.data
    if (newLocation) {
      locations.value = [...locations.value, newLocation]
      form.parent_id = newLocation.id
      parentQuery.value = newLocation.name
    }
    isParentDropdownOpen.value = false
  } catch (err) {
    parentError.value = err?.response?.data?.message || 'Failed to create location.'
  } finally {
    isCreatingParent.value = false
  }
}

function handleParentDropdownClickOutside(event) {
  if (parentDropdownRef.value && !parentDropdownRef.value.contains(event.target)) {
    isParentDropdownOpen.value = false
  }
}

onMounted(() => {
  document.addEventListener('click', handleParentDropdownClickOutside)
})

onBeforeUnmount(() => {
  document.removeEventListener('click', handleParentDropdownClickOutside)
})

function getRecordId(item) {
  return item?.id ?? item?.company_id ?? ''
}

function getRecordLabel(item) {
  return item?.name || item?.company_name || item?.display_name || String(getRecordId(item))
}

const form = reactive({
  name: '',
  location_type: '',
  parent_id: '',
  company_id: '',
  is_active: true,
})

function slugifyCode(value) {
  const base = (value || '')
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
  return base || `LOC-${Date.now().toString(36).toUpperCase()}`
}

async function loadReferenceData() {
  const [locationRes, companyRes] = await Promise.allSettled([getMasterData('locations'), getDirectoryCompanies()])
  locations.value = locationRes.status === 'fulfilled' ? locationRes.value?.data ?? [] : []
  const companyData = companyRes.status === 'fulfilled' ? companyRes.value?.data : []
  companies.value = Array.isArray(companyData) ? companyData : []
}

function populateForm(location) {
  form.name = location.name || ''
  form.location_type = location.location_type || ''
  form.parent_id = location.parent_id ?? ''
  form.company_id = location.company_id ?? ''
  form.is_active = location.is_active === undefined ? true : !!location.is_active
}

function resetForm() {
  form.name = ''
  form.location_type = ''
  form.parent_id = ''
  form.company_id = ''
  form.is_active = true
  errorMessage.value = ''
  parentQuery.value = ''
  parentError.value = ''
  isParentDropdownOpen.value = false
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      loadReferenceData()
      if (isEditMode.value) populateForm(props.location)
    } else {
      resetForm()
    }
  }
)

function close() {
  emit('close')
}

async function submit() {
  errorMessage.value = ''
  if (!form.name.trim()) {
    errorMessage.value = 'Name is required.'
    return
  }

  const payload = {
    name: form.name.trim(),
    is_active: form.is_active,
  }
  if (!isEditMode.value) payload.code = slugifyCode(form.name)
  payload.location_type = form.location_type.trim() || null
  payload.parent_id = form.parent_id || null
  payload.company_id = form.company_id || null

  isSubmitting.value = true
  try {
    if (isEditMode.value) {
      const data = await updateMasterData('locations', props.location.id, payload)
      emit('updated', data?.data)
    } else {
      const data = await createMasterData('locations', payload)
      emit('created', data?.data)
    }
    close()
  } catch (err) {
    errorMessage.value = err?.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} location.`
  } finally {
    isSubmitting.value = false
  }
}
</script>
