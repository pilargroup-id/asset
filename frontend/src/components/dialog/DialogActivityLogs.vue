<template>
  <Modal v-if="isOpen" full-screen-backdrop @close="close">
    <template #body>
      <div
        class="relative flex max-h-[85vh] w-full max-w-[640px] flex-col overflow-hidden rounded-3xl bg-white shadow-theme-lg dark:bg-gray-900"
      >
        <div class="flex items-center justify-between gap-3 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div>
            <h4 class="text-lg font-semibold text-gray-800 dark:text-white/90">Log Aktivitas</h4>
            <p class="text-theme-xs text-gray-500 dark:text-gray-400">Riwayat aktivitas pada sistem</p>
          </div>
          <div class="flex items-center gap-1.5">
            <button
              @click="refreshActiveTab"
              :disabled="activeState.loading"
              type="button"
              title="Refresh"
              class="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-300"
            >
              <RefreshIcon class="h-4 w-4" :class="{ 'animate-spin': activeState.loading }" />
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

        <div class="custom-scrollbar flex gap-1 overflow-x-auto border-b border-gray-100 px-6 dark:border-gray-800">
          <button
            v-for="tab in TABS"
            :key="tab.key"
            type="button"
            @click="selectTab(tab.key)"
            class="whitespace-nowrap border-b-2 px-3 py-2.5 text-theme-sm font-medium transition-colors"
            :class="
              activeTab === tab.key
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            "
          >
            {{ tab.label }}
          </button>
        </div>

        <div class="custom-scrollbar flex-1 overflow-y-auto px-6 py-4">
          <div v-if="activeState.loading" class="flex items-center justify-center py-14 text-sm text-gray-400">
            Memuat aktivitas...
          </div>

          <div v-else-if="activeState.error" class="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <p class="text-sm text-error-600 dark:text-error-500">{{ activeState.error }}</p>
            <button @click="refreshActiveTab" class="text-sm font-medium text-brand-500 hover:underline">
              Coba lagi
            </button>
          </div>

          <ul v-else-if="activeState.rows.length" class="flex flex-col">
            <li
              v-for="row in activeState.rows"
              :key="row.id"
              class="flex gap-3 border-b border-gray-100 py-3 last:border-b-0 dark:border-gray-800"
            >
              <span
                class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-brand-50 text-sm font-semibold text-brand-600 dark:bg-brand-500/15 dark:text-brand-400"
              >
                {{ initials(actorName(row)) }}
              </span>

              <div class="min-w-0 flex-1">
                <div class="flex items-start justify-between gap-2">
                  <p class="text-theme-sm text-gray-700 dark:text-gray-300">
                    <span class="font-medium text-gray-800 dark:text-white/90">{{ actorName(row) }}</span>
                    {{ describeActivity(row) }}
                  </p>
                  <Badge :color="row.status === 'FAILED' ? 'error' : 'success'" size="sm">{{ row.status }}</Badge>
                </div>

                <p v-if="row.description" class="mt-0.5 truncate text-theme-xs text-gray-500 dark:text-gray-400">
                  {{ row.description }}
                </p>

                <div class="mt-1 flex flex-wrap items-center gap-2 text-theme-xs text-gray-400 dark:text-gray-500">
                  <span>{{ row.module }}</span>
                  <span class="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                  <span>{{ row.source }}</span>
                  <span class="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                  <span :title="formatAbsoluteTime(row.created_at)">{{ formatRelativeTime(row.created_at) }}</span>
                </div>
              </div>
            </li>
          </ul>

          <div v-else class="flex items-center justify-center py-14 text-sm text-gray-400">
            Belum ada aktivitas untuk tab ini.
          </div>
        </div>

        <div
          v-if="!activeState.loading && !activeState.error && activeState.total > 0"
          class="flex flex-col gap-3 border-t border-gray-100 px-6 py-3 dark:border-gray-800 sm:flex-row sm:items-center sm:justify-between"
        >
          <TablePagination
            :page="activeState.page"
            :limit="activeState.limit"
            :total="activeState.total"
            :total-pages="activeState.totalPages"
            :disabled="activeState.loading"
            item-label="aktivitas"
            @update:page="changePage"
          />
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { reactive, ref, computed, watch } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Badge from '@/components/ui/Badge.vue'
import TablePagination from '@/components/tables/TablePagination.vue'
import { RefreshIcon } from '@/icons'
import { getActivityLogs } from '@/service/axios'
import { authState } from '@/service/auth'
import { formatRelativeTime, formatAbsoluteTime } from '@/utils/formatTime'
import { actorName, describeActivity, initials } from '@/utils/activityLog'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['close'])

const TABS = [
  {
    key: 'asset-create',
    label: 'Asset Dibuat',
    getParams: () => ({ module: 'ASSET', action: 'CREATE' }),
  },
  {
    key: 'my-activity',
    label: 'Aktivitas Saya',
    getParams: () => ({ user_id: authState.user?.id }),
  },
  {
    key: 'entity-asset',
    label: 'Entitas Asset',
    getParams: () => ({ entity_type: 'ASSET' }),
  },
  {
    key: 'source-web',
    label: 'Sumber Web',
    getParams: () => ({ source: 'APPLICATION' }),
  },
]

const activeTab = ref(TABS[0].key)

function createTabState() {
  return { rows: [], page: 1, limit: 8, total: 0, totalPages: 1, loading: false, error: '', loaded: false }
}

const tabState = reactive(Object.fromEntries(TABS.map((tab) => [tab.key, createTabState()])))

const activeState = computed(() => tabState[activeTab.value])

async function fetchTab(key, page = 1) {
  const tab = TABS.find((t) => t.key === key)
  const state = tabState[key]
  state.loading = true
  state.error = ''
  try {
    const res = await getActivityLogs({ ...tab.getParams(), page, limit: state.limit })
    state.rows = res?.data ?? []
    state.page = res?.meta?.page ?? page
    state.total = res?.meta?.total ?? state.rows.length
    state.totalPages = res?.meta?.totalPages ?? 1
    state.loaded = true
  } catch (err) {
    state.rows = []
    state.total = 0
    state.totalPages = 1
    state.error = err?.response?.data?.message || 'Gagal memuat log aktivitas.'
  } finally {
    state.loading = false
  }
}

function selectTab(key) {
  activeTab.value = key
  if (!tabState[key].loaded) fetchTab(key, 1)
}

function changePage(page) {
  fetchTab(activeTab.value, page)
}

function refreshActiveTab() {
  fetchTab(activeTab.value, activeState.value.page)
}

function close() {
  emit('close')
}

watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    activeTab.value = TABS[0].key
    TABS.forEach((tab) => Object.assign(tabState[tab.key], createTabState()))
    fetchTab(activeTab.value, 1)
  }
)
</script>
