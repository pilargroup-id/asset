<template>
  <Modal v-if="isOpen" full-screen-backdrop @close="close">
    <template #body>
      <div
        class="no-scrollbar relative w-full max-w-[560px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8"
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
          Create Permission Assignment
        </h4>
        <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Grant a permission to a user, department, or company within an access scope.
        </p>

        <form class="flex flex-col gap-5" @submit.prevent="submit">
          <div ref="permissionDropdownRef" class="relative">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Permission
            </label>
            <div
              @click="openPermissionDropdown"
              class="dark:bg-dark-900 flex min-h-11 w-full flex-wrap items-center gap-1.5 rounded-lg border border-gray-300 bg-transparent px-3 py-2 shadow-theme-xs focus-within:border-brand-300 focus-within:ring-3 focus-within:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900"
            >
              <span
                v-for="permission in selectedPermissions"
                :key="permission.code"
                class="group flex h-[26px] items-center justify-center rounded-full border-[0.7px] border-transparent bg-gray-100 py-1 pl-2.5 pr-2 text-xs font-medium text-gray-800 hover:border-gray-200 dark:bg-gray-800 dark:text-white/90 dark:hover:border-gray-800"
              >
                {{ permission.name }}
                <button
                  @click.stop="removePermission(permission.code)"
                  type="button"
                  class="pl-1.5 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
                  aria-label="Remove permission"
                >
                  <svg width="12" height="12" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      fill-rule="evenodd"
                      clip-rule="evenodd"
                      d="M3.40717 4.46881C3.11428 4.17591 3.11428 3.70104 3.40717 3.40815C3.70006 3.11525 4.17494 3.11525 4.46783 3.40815L6.99943 5.93975L9.53095 3.40822C9.82385 3.11533 10.2987 3.11533 10.5916 3.40822C10.8845 3.70112 10.8845 4.17599 10.5916 4.46888L8.06009 7.00041L10.5916 9.53193C10.8845 9.82482 10.8845 10.2997 10.5916 10.5926C10.2987 10.8855 9.82385 10.8855 9.53095 10.5926L6.99943 8.06107L4.46783 10.5927C4.17494 10.8856 3.70006 10.8856 3.40717 10.5927C3.11428 10.2998 3.11428 9.8249 3.40717 9.53201L5.93877 7.00041L3.40717 4.46881Z"
                      fill="currentColor"
                    />
                  </svg>
                </button>
              </span>
              <input
                ref="permissionSearchInput"
                v-model="permissionQuery"
                type="text"
                autocomplete="off"
                :placeholder="selectedPermissions.length ? '' : 'Search permission code or name...'"
                @focus="openPermissionDropdown"
                class="h-7 min-w-[120px] flex-1 bg-transparent text-sm text-gray-800 placeholder:text-gray-400 focus:outline-hidden dark:text-white/90 dark:placeholder:text-white/30"
              />
            </div>

            <div
              v-if="isPermissionDropdownOpen"
              class="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
            >
              <ul class="custom-scrollbar max-h-56 overflow-y-auto py-1" role="listbox" aria-multiselectable="true">
                <li v-if="!filteredPermissions.length" class="px-3 py-2 text-sm text-gray-400">
                  No permissions found.
                </li>
                <li
                  v-for="permission in filteredPermissions"
                  :key="permission.id"
                  @click="togglePermission(permission)"
                  role="option"
                  :aria-selected="isPermissionSelected(permission)"
                  class="flex cursor-pointer items-center justify-between px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
                  :class="{ 'bg-gray-50 dark:bg-white/[0.03]': isPermissionSelected(permission) }"
                >
                  <span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ permission.name }}</span>
                  <svg
                    v-if="isPermissionSelected(permission)"
                    class="h-4 w-4 shrink-0 text-brand-500"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    xmlns="http://www.w3.org/2000/svg"
                  >
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                </li>
              </ul>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div ref="subjectTypeDropdownRef" class="relative">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Subject Type
              </label>
              <button
                @click="toggleSubjectTypeDropdown"
                type="button"
                class="dark:bg-dark-900 flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-left text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-800"
              >
                <span class="truncate text-gray-800 dark:text-white/90">{{ subjectTypeOptionLabel }}</span>
                <ChevronDownIcon
                  class="ml-2 h-4 w-4 shrink-0 text-gray-400 transition-transform"
                  :class="{ 'rotate-180': isSubjectTypeDropdownOpen }"
                />
              </button>

              <div
                v-if="isSubjectTypeDropdownOpen"
                class="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <ul class="py-1" role="listbox">
                  <li
                    v-for="option in SUBJECT_TYPE_OPTIONS"
                    :key="option.value"
                    @click="selectSubjectType(option.value)"
                    role="option"
                    :aria-selected="form.subject_type === option.value"
                    class="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
                    :class="{ 'bg-gray-50 dark:bg-white/[0.03]': form.subject_type === option.value }"
                  >
                    <span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ option.label }}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div ref="subjectDropdownRef" class="relative">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                {{ subjectFieldLabel }}
              </label>
              <input
                ref="subjectSearchInput"
                v-model="subjectQuery"
                type="text"
                autocomplete="off"
                :placeholder="`Search ${subjectTypeLabel}...`"
                @focus="openSubjectDropdown"
                @click="openSubjectDropdown"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />

              <div
                v-if="isSubjectDropdownOpen"
                class="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <ul class="custom-scrollbar max-h-56 overflow-y-auto py-1" role="listbox">
                  <li v-if="isLoadingSubjects" class="px-3 py-2 text-sm text-gray-400">Loading...</li>
                  <li v-else-if="!filteredSubjects.length" class="px-3 py-2 text-sm text-gray-400">
                    No {{ subjectTypeLabel }} found.
                  </li>
                  <li
                    v-for="item in filteredSubjects"
                    :key="getSubjectId(item)"
                    @click="selectSubject(item)"
                    role="option"
                    :aria-selected="String(getSubjectId(item)) === String(form.subject_id)"
                    class="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
                    :class="{ 'bg-gray-50 dark:bg-white/[0.03]': String(getSubjectId(item)) === String(form.subject_id) }"
                  >
                    <span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ getSubjectLabel(item) }}</span>
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <div class="grid grid-cols-2 gap-4">
            <div ref="accessScopeDropdownRef" class="relative">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Access Scope
              </label>
              <button
                @click="toggleAccessScopeDropdown"
                type="button"
                class="dark:bg-dark-900 flex h-11 w-full items-center justify-between rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-left text-sm shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:focus:border-brand-800"
              >
                <span class="truncate text-gray-800 dark:text-white/90">{{ accessScopeOptionLabel }}</span>
                <ChevronDownIcon
                  class="ml-2 h-4 w-4 shrink-0 text-gray-400 transition-transform"
                  :class="{ 'rotate-180': isAccessScopeDropdownOpen }"
                />
              </button>

              <div
                v-if="isAccessScopeDropdownOpen"
                class="absolute z-20 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <ul class="py-1" role="listbox">
                  <li
                    v-for="option in ACCESS_SCOPE_OPTIONS"
                    :key="option.value"
                    @click="selectAccessScope(option.value)"
                    role="option"
                    :aria-selected="form.access_scope_type === option.value"
                    class="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
                    :class="{ 'bg-gray-50 dark:bg-white/[0.03]': form.access_scope_type === option.value }"
                  >
                    <span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ option.label }}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div v-if="form.access_scope_type !== 'GLOBAL'">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Access Scope ID
              </label>
              <input
                v-model="form.access_scope_id"
                type="text"
                :placeholder="`${scopeLabel} ID`"
                required
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
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
              {{
                isSubmitting
                  ? 'Creating...'
                  : selectedPermissions.length > 1
                    ? `Create (${selectedPermissions.length})`
                    : 'Create'
              }}
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
import { ChevronDownIcon } from '@/icons'
import {
  getPermissions,
  createPermissionAssignment,
  getDirectoryUsers,
  getDirectoryDepartments,
  getDirectoryCompanies,
} from '@/service/axios'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close', 'created'])

const isSubmitting = ref(false)
const errorMessage = ref('')
const permissions = ref([])

const isPermissionDropdownOpen = ref(false)
const permissionQuery = ref('')
const permissionDropdownRef = ref(null)
const permissionSearchInput = ref(null)
const selectedPermissions = ref([])

const form = reactive({
  subject_type: 'USER',
  subject_id: '',
  access_scope_type: 'GLOBAL',
  access_scope_id: '',
})

const SUBJECT_TYPE_OPTIONS = [
  { value: 'USER', label: 'User' },
  { value: 'DEPARTMENT', label: 'Department' },
  { value: 'COMPANY', label: 'Company' },
]

const ACCESS_SCOPE_OPTIONS = [
  { value: 'GLOBAL', label: 'Global' },
  { value: 'DEPARTMENT', label: 'Department' },
  { value: 'COMPANY', label: 'Company' },
]

const isSubjectTypeDropdownOpen = ref(false)
const subjectTypeDropdownRef = ref(null)
const isAccessScopeDropdownOpen = ref(false)
const accessScopeDropdownRef = ref(null)

const subjectTypeOptionLabel = computed(
  () => SUBJECT_TYPE_OPTIONS.find((option) => option.value === form.subject_type)?.label || ''
)

const accessScopeOptionLabel = computed(
  () => ACCESS_SCOPE_OPTIONS.find((option) => option.value === form.access_scope_type)?.label || ''
)

function toggleSubjectTypeDropdown() {
  isSubjectTypeDropdownOpen.value = !isSubjectTypeDropdownOpen.value
}

function selectSubjectType(value) {
  form.subject_type = value
  isSubjectTypeDropdownOpen.value = false
}

function toggleAccessScopeDropdown() {
  isAccessScopeDropdownOpen.value = !isAccessScopeDropdownOpen.value
}

function selectAccessScope(value) {
  form.access_scope_type = value
  isAccessScopeDropdownOpen.value = false
}

const subjectTypeLabel = computed(() => {
  if (form.subject_type === 'USER') return 'user'
  if (form.subject_type === 'DEPARTMENT') return 'department'
  return 'company'
})

const subjectFieldLabel = computed(
  () => subjectTypeLabel.value.charAt(0).toUpperCase() + subjectTypeLabel.value.slice(1)
)

const subjectFetchers = {
  USER: getDirectoryUsers,
  DEPARTMENT: getDirectoryDepartments,
  COMPANY: getDirectoryCompanies,
}

function normalizeDirectoryList(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  const candidate = payload.items || payload.users || payload.departments || payload.companies || payload.data
  return Array.isArray(candidate) ? candidate : []
}

function getSubjectId(item) {
  return item?.id ?? item?.uuid ?? item?.user_id ?? item?.department_id ?? item?.company_id ?? ''
}

function getSubjectLabel(item) {
  return (
    item?.name ||
    item?.full_name ||
    item?.display_name ||
    item?.department_name ||
    item?.company_name ||
    item?.username ||
    item?.email ||
    String(getSubjectId(item))
  )
}

const subjectsCache = reactive({ USER: null, DEPARTMENT: null, COMPANY: null })
const isLoadingSubjects = ref(false)
const isSubjectDropdownOpen = ref(false)
const subjectQuery = ref('')
const subjectDropdownRef = ref(null)
const subjectSearchInput = ref(null)

const subjectOptions = computed(() => subjectsCache[form.subject_type] || [])

const selectedSubject = computed(() =>
  subjectOptions.value.find((item) => String(getSubjectId(item)) === String(form.subject_id)) || null
)

const filteredSubjects = computed(() => {
  const term = subjectQuery.value.trim().toLowerCase()
  if (!term) return subjectOptions.value
  return subjectOptions.value.filter((item) =>
    [getSubjectLabel(item), getSubjectId(item)]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  )
})

async function loadSubjects(type) {
  if (subjectsCache[type]) return
  isLoadingSubjects.value = true
  try {
    const fetcher = subjectFetchers[type]
    const res = await fetcher()
    subjectsCache[type] = normalizeDirectoryList(res?.data)
  } catch {
    subjectsCache[type] = []
  } finally {
    isLoadingSubjects.value = false
  }
}

function openSubjectDropdown() {
  if (isSubjectDropdownOpen.value) return
  isSubjectDropdownOpen.value = true
  subjectQuery.value = ''
}

function closeSubjectDropdown() {
  isSubjectDropdownOpen.value = false
  subjectQuery.value = selectedSubject.value ? getSubjectLabel(selectedSubject.value) : ''
}

function selectSubject(item) {
  form.subject_id = String(getSubjectId(item))
  subjectQuery.value = getSubjectLabel(item)
  isSubjectDropdownOpen.value = false
}

watch(
  () => form.subject_type,
  (type) => {
    form.subject_id = ''
    subjectQuery.value = ''
    isSubjectDropdownOpen.value = false
    if (props.isOpen) loadSubjects(type)
  }
)

const scopeLabel = computed(() => {
  return form.access_scope_type === 'DEPARTMENT' ? 'Department' : 'Company'
})

const filteredPermissions = computed(() => {
  const term = permissionQuery.value.trim().toLowerCase()
  if (!term) return permissions.value
  return permissions.value.filter((permission) =>
    [permission.code, permission.name]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  )
})

function isPermissionSelected(permission) {
  return selectedPermissions.value.some((selected) => selected.code === permission.code)
}

function togglePermission(permission) {
  const index = selectedPermissions.value.findIndex((selected) => selected.code === permission.code)
  if (index === -1) {
    selectedPermissions.value.push(permission)
  } else {
    selectedPermissions.value.splice(index, 1)
  }
  permissionQuery.value = ''
}

function removePermission(code) {
  selectedPermissions.value = selectedPermissions.value.filter((selected) => selected.code !== code)
}

function openPermissionDropdown() {
  isPermissionDropdownOpen.value = true
}

function closePermissionDropdown() {
  isPermissionDropdownOpen.value = false
  permissionQuery.value = ''
}

function handleClickOutside(event) {
  if (permissionDropdownRef.value && !permissionDropdownRef.value.contains(event.target)) {
    closePermissionDropdown()
  }
  if (subjectDropdownRef.value && !subjectDropdownRef.value.contains(event.target)) {
    closeSubjectDropdown()
  }
  if (subjectTypeDropdownRef.value && !subjectTypeDropdownRef.value.contains(event.target)) {
    isSubjectTypeDropdownOpen.value = false
  }
  if (accessScopeDropdownRef.value && !accessScopeDropdownRef.value.contains(event.target)) {
    isAccessScopeDropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

function resetForm() {
  selectedPermissions.value = []
  form.subject_type = 'USER'
  form.subject_id = ''
  form.access_scope_type = 'GLOBAL'
  form.access_scope_id = ''
  errorMessage.value = ''
  permissionQuery.value = ''
  isPermissionDropdownOpen.value = false
  subjectQuery.value = ''
  isSubjectDropdownOpen.value = false
  isSubjectTypeDropdownOpen.value = false
  isAccessScopeDropdownOpen.value = false
}

async function loadPermissions() {
  if (permissions.value.length) return
  try {
    const data = await getPermissions()
    permissions.value = data?.data ?? []
  } catch {
    permissions.value = []
  }
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      loadPermissions()
      loadSubjects(form.subject_type)
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
  if (!selectedPermissions.value.length) {
    errorMessage.value = 'Please select at least one permission.'
    return
  }
  if (!form.subject_id) {
    errorMessage.value = `Please select a ${subjectTypeLabel.value}.`
    return
  }
  isSubmitting.value = true
  let currentCode = ''
  try {
    const created = []
    for (const permission of selectedPermissions.value) {
      currentCode = permission.code
      const payload = {
        permission_code: permission.code,
        subject_type: form.subject_type,
        subject_id: form.subject_id.trim(),
        access_scope_type: form.access_scope_type,
        access_scope_id: form.access_scope_type === 'GLOBAL' ? '' : form.access_scope_id.trim(),
      }
      const data = await createPermissionAssignment(payload)
      created.push(data?.data)
    }
    emit('created', created)
    close()
  } catch (err) {
    const message = err?.response?.data?.message || 'Failed to create permission assignment.'
    errorMessage.value = currentCode ? `${currentCode}: ${message}` : message
  } finally {
    isSubmitting.value = false
  }
}
</script>
