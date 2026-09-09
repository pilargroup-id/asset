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
      <TableHeadCell>Subject</TableHeadCell>
      <TableHeadCell>Access</TableHeadCell>
    </template>

    <tr v-if="isLoading">
      <td colspan="2" class="px-5 py-10 text-center sm:px-6">
        <p class="text-gray-500 text-theme-sm dark:text-gray-400">Loading permission assignments...</p>
      </td>
    </tr>
    <tr v-else-if="errorMessage">
      <td colspan="2" class="px-5 py-10 text-center sm:px-6">
        <p class="text-error-600 text-theme-sm dark:text-error-500">{{ errorMessage }}</p>
      </td>
    </tr>
    <tr v-else-if="!groupedBySubject.length">
      <td colspan="2" class="px-5 py-10 text-center sm:px-6">
        <p class="text-gray-500 text-theme-sm dark:text-gray-400">No permission assignments found.</p>
      </td>
    </tr>
    <template v-for="group in paginatedGroups" v-else :key="group.key">
      <tr
        class="cursor-pointer border-t border-gray-100 hover:bg-gray-50 dark:border-gray-800 dark:hover:bg-white/[0.03]"
        @click="toggleGroup(group.key)"
      >
        <td class="px-5 py-4 align-top sm:px-6">
          <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
            {{ group.subjectName }}
          </span>
          <span class="block text-gray-500 text-theme-xs dark:text-gray-400">{{ group.subject_type }}</span>
        </td>
        <td class="px-5 py-4 align-top sm:px-6">
          <div class="flex items-center justify-between gap-2">
            <Badge color="light" size="sm">
              {{ group.permissions.length }} permission{{ group.permissions.length === 1 ? '' : 's' }}
            </Badge>
            <ChevronDownIcon
              :class="[
                'h-4 w-4 shrink-0 text-gray-400 transition-transform duration-200',
                { 'rotate-180': expandedKeys.has(group.key) },
              ]"
            />
          </div>
        </td>
      </tr>
      <tr v-if="expandedKeys.has(group.key)" class="bg-gray-50/50 dark:bg-white/[0.02]">
        <td colspan="2" class="px-5 py-4 sm:px-6" @click.stop>
          <div class="overflow-hidden rounded-lg border border-gray-100 dark:border-gray-800">
            <table class="w-full text-left">
              <thead class="bg-gray-50 dark:bg-white/[0.03]">
                <tr>
                  <th class="px-4 py-2.5 text-theme-xs font-medium text-gray-500 dark:text-gray-400">Permission</th>
                  <th class="px-4 py-2.5 text-theme-xs font-medium text-gray-500 dark:text-gray-400">Access Scope</th>
                  <th class="px-4 py-2.5 text-theme-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-100 bg-white dark:divide-gray-800 dark:bg-gray-900">
                <template v-for="perm in group.permissions" :key="perm.key">
                  <tr v-for="scope in perm.scopes" :key="scope.id">
                    <td class="px-4 py-3 align-top">
                      <span class="block font-medium text-gray-800 text-theme-sm dark:text-white/90">
                        {{ perm.permission_code }}
                      </span>
                      <span class="block text-gray-500 text-theme-xs dark:text-gray-400">
                        {{ perm.permission_name }}
                      </span>
                    </td>
                    <td class="px-4 py-3 align-top">
                      <Badge :color="scope.is_active ? 'success' : 'light'" size="sm">
                        {{ scopeLabel(scope) }}
                      </Badge>
                    </td>
                    <td class="px-4 py-3 align-top">
                      <ToggleSwitch
                        :model-value="!!scope.is_active"
                        :disabled="togglingIds.has(scope.id)"
                        @update:model-value="(value) => toggleScopeStatus(scope, value)"
                      />
                    </td>
                  </tr>
                </template>
              </tbody>
            </table>
          </div>
          <div class="mt-3 flex justify-end">
            <ButtonCreatePermissionAssignments
              compact
              label="Add Permission"
              :subject-type="group.subject_type"
              :subject-id="group.subject_id"
              :subject-label="group.subjectName"
              :existing-permission-codes="group.permissions.map((perm) => perm.permission_code)"
              @created="fetchAssignments"
            />
          </div>
        </td>
      </tr>
    </template>

    <template #pagination>
      <TablePagination
        :page="page"
        :limit="limit"
        :total="groupedBySubject.length"
        :total-pages="totalPages"
        :disabled="isLoading"
        item-label="subjects"
        @update:page="(value) => (page = value)"
      />
    </template>
  </BaseTable>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted } from 'vue'
import {
  getPermissionAssignments,
  createPermissionAssignment,
  deletePermissionAssignment,
  getDirectoryUsers,
  getDirectoryDepartments,
  getDirectoryCompanies,
} from '@/service/axios'
import Badge from '@/components/ui/Badge.vue'
import BaseTable from '@/components/tables/BaseTable.vue'
import TableHeadCell from '@/components/tables/TableHeadCell.vue'
import TablePagination from '@/components/tables/TablePagination.vue'
import ToggleSwitch from '@/components/forms/FormElements/ToggleSwitch.vue'
import ButtonCreatePermissionAssignments from '@/components/buttons/create/ButtonCreatePermissionAssignments.vue'
import { ChevronDownIcon, RefreshIcon } from '@/icons'

const assignments = ref([])
const isLoading = ref(false)
const errorMessage = ref('')
const search = ref('')
const page = ref(1)
const limit = 25
const expandedKeys = reactive(new Set())
const togglingIds = reactive(new Set())

function toggleGroup(key) {
  if (expandedKeys.has(key)) {
    expandedKeys.delete(key)
  } else {
    expandedKeys.add(key)
  }
}

async function toggleScopeStatus(scope, nextActive) {
  if (togglingIds.has(scope.id)) return
  const previous = scope.is_active
  togglingIds.add(scope.id)
  scope.is_active = nextActive
  try {
    if (nextActive) {
      await createPermissionAssignment({
        permission_code: scope.permission_code,
        subject_type: scope.subject_type,
        subject_id: String(scope.subject_id),
        access_scope_type: scope.access_scope_type,
        access_scope_id: scope.access_scope_type === 'GLOBAL' ? '' : String(scope.access_scope_id || ''),
      })
    } else {
      await deletePermissionAssignment(scope.id)
    }
  } catch {
    scope.is_active = previous
  } finally {
    togglingIds.delete(scope.id)
  }
}

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

const permissionGroups = computed(() => {
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

const groupedBySubject = computed(() => {
  const groups = new Map()
  for (const perm of permissionGroups.value) {
    const key = `${perm.subject_type}::${perm.subject_id}`
    if (!groups.has(key)) {
      groups.set(key, {
        key,
        subject_type: perm.subject_type,
        subject_id: perm.subject_id,
        subjectName: resolveName(perm.subject_type, perm.subject_id),
        permissions: [],
      })
    }
    groups.get(key).permissions.push(perm)
  }
  return [...groups.values()].sort((a, b) =>
    String(a.subjectName).localeCompare(String(b.subjectName), undefined, { sensitivity: 'base' })
  )
})

const totalPages = computed(() => Math.max(1, Math.ceil(groupedBySubject.value.length / limit)))

const paginatedGroups = computed(() => {
  const start = (page.value - 1) * limit
  return groupedBySubject.value.slice(start, start + limit)
})

watch(search, () => {
  page.value = 1
})

watch(totalPages, (value) => {
  if (page.value > value) page.value = value
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
