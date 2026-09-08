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
          placeholder="Search permission, subject, or scope..."
          class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent py-2.5 pl-11 pr-4 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
        />
      </div>

      <div class="flex items-center gap-3">
        <button
          @click="fetchAssignments"
          :disabled="isLoading"
          class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
        >
          <RefreshIcon :class="['h-4 w-4', { 'animate-spin': isLoading }]" />
          Refresh
        </button>
        <ButtonCreatePermissionAssignments @created="fetchAssignments" />
      </div>
    </template>

    <template #head>
      <TableHeadCell>Permission</TableHeadCell>
      <TableHeadCell>Subject</TableHeadCell>
      <TableHeadCell>Access</TableHeadCell>
    </template>

    <tr v-if="isLoading">
      <td colspan="3" class="px-5 py-10 text-center sm:px-6">
        <p class="text-gray-500 text-theme-sm dark:text-gray-400">Loading permission assignments...</p>
      </td>
    </tr>
    <tr v-else-if="errorMessage">
      <td colspan="3" class="px-5 py-10 text-center sm:px-6">
        <p class="text-error-600 text-theme-sm dark:text-error-500">{{ errorMessage }}</p>
      </td>
    </tr>
    <tr v-else-if="!groupedAssignments.length">
      <td colspan="3" class="px-5 py-10 text-center sm:px-6">
        <p class="text-gray-500 text-theme-sm dark:text-gray-400">No permission assignments found.</p>
      </td>
    </tr>
    <tr
      v-for="group in groupedAssignments"
      v-else
      :key="group.key"
      class="border-t border-gray-100 dark:border-gray-800"
    >
      <td class="px-5 py-4 align-top sm:px-6">
        <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {{ group.permission_code }}
        </span>
        <span class="block text-gray-500 text-theme-xs dark:text-gray-400">{{ group.permission_name }}</span>
      </td>
      <td class="px-5 py-4 align-top sm:px-6">
        <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
          {{ resolveName(group.subject_type, group.subject_id) }}
        </span>
        <span class="block text-gray-500 text-theme-xs dark:text-gray-400">{{ group.subject_type }}</span>
      </td>
      <td class="px-5 py-4 align-top sm:px-6">
        <div class="flex flex-wrap gap-1.5">
          <Badge
            v-for="scope in group.scopes"
            :key="scope.id"
            :color="scope.is_active ? 'success' : 'light'"
            size="sm"
          >
            {{ scopeLabel(scope) }}
          </Badge>
        </div>
      </td>
    </tr>
  </BaseTable>
</template>

<script setup>
import { ref, reactive, computed, onMounted } from 'vue'
import {
  getPermissionAssignments,
  getDirectoryUsers,
  getDirectoryDepartments,
  getDirectoryCompanies,
} from '@/service/axios'
import Badge from '@/components/ui/Badge.vue'
import BaseTable from '@/components/tables/BaseTable.vue'
import TableHeadCell from '@/components/tables/TableHeadCell.vue'
import ButtonCreatePermissionAssignments from '@/components/buttons/create/ButtonCreatePermissionAssignments.vue'
import { RefreshIcon } from '@/icons'

const assignments = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const search = ref('')

const filteredAssignments = computed(() => {
  const term = search.value.trim().toLowerCase()
  if (!term) return assignments.value
  return assignments.value.filter((assignment) =>
    [
      assignment.permission_code,
      assignment.permission_name,
      assignment.subject_type,
      assignment.subject_id,
      assignment.access_scope_type,
      assignment.access_scope_id,
    ]
      .filter(Boolean)
      .some((value) => String(value).toLowerCase().includes(term))
  )
})

const groupedAssignments = computed(() => {
  const groups = new Map()
  for (const assignment of filteredAssignments.value) {
    const key = `${assignment.permission_code}::${assignment.subject_type}::${assignment.subject_id}`
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        permission_code: assignment.permission_code,
        permission_name: assignment.permission_name,
        subject_type: assignment.subject_type,
        subject_id: assignment.subject_id,
        scopes: [],
      })
    }
    groups.get(key).scopes.push(assignment)
  }
  return [...groups.values()]
})

function scopeLabel(scope) {
  if (scope.access_scope_type === 'GLOBAL') return 'GLOBAL'
  return `${scope.access_scope_type}: ${resolveName(scope.access_scope_type, scope.access_scope_id)}`
}

const directoryFetchers = {
  USER: getDirectoryUsers,
  DEPARTMENT: getDirectoryDepartments,
  COMPANY: getDirectoryCompanies,
}

const directoryNames = reactive({ USER: {}, DEPARTMENT: {}, COMPANY: {} })

function normalizeDirectoryList(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  const candidate = payload.items || payload.users || payload.departments || payload.companies || payload.data
  return Array.isArray(candidate) ? candidate : []
}

function directoryItemLabel(item) {
  return (
    item?.name ||
    item?.full_name ||
    item?.display_name ||
    item?.department_name ||
    item?.company_name ||
    item?.username ||
    item?.email ||
    ''
  )
}

async function loadDirectoryNames(type) {
  try {
    const list = normalizeDirectoryList((await directoryFetchers[type]())?.data)
    const map = {}
    for (const item of list) {
      const id = item?.id ?? item?.uuid ?? item?.user_id ?? item?.department_id ?? item?.company_id
      if (id === undefined || id === null || id === '') continue
      map[String(id)] = directoryItemLabel(item) || String(id)
    }
    directoryNames[type] = map
  } catch {
    // Ignore — table falls back to showing raw ids.
  }
}

function resolveName(type, id) {
  if (!id) return id
  return directoryNames[type]?.[String(id)] || id
}

async function fetchAssignments() {
  isLoading.value = true
  errorMessage.value = ''
  try {
    const data = await getPermissionAssignments()
    assignments.value = data?.data ?? []
  } catch (err) {
    assignments.value = []
    errorMessage.value = err?.response?.data?.message || 'Failed to load permission assignments.'
  } finally {
    isLoading.value = false
  }
}

onMounted(() => {
  fetchAssignments()
  loadDirectoryNames('USER')
  loadDirectoryNames('DEPARTMENT')
  loadDirectoryNames('COMPANY')
})
</script>
