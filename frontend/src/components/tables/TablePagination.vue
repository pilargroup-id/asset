<template>
  <p class="text-gray-500 text-theme-xs dark:text-gray-400">
    Showing {{ rangeStart }}-{{ rangeEnd }} of {{ total }} {{ itemLabel }}
  </p>
  <div class="flex items-center gap-2">
    <button
      @click="requestPage(page - 1)"
      :disabled="disabled || page <= 1"
      class="rounded-lg border border-gray-300 px-3 py-1.5 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03]"
    >
      Previous
    </button>
    <span class="text-gray-500 text-theme-sm dark:text-gray-400">
      Page {{ page }} of {{ totalPages }}
    </span>
    <button
      @click="requestPage(page + 1)"
      :disabled="disabled || page >= totalPages"
      class="rounded-lg border border-gray-300 px-3 py-1.5 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-gray-700 dark:text-gray-400 dark:hover:bg-white/[0.03]"
    >
      Next
    </button>
  </div>
</template>

<script setup>
import { computed } from 'vue'

const props = defineProps({
  page: { type: Number, required: true },
  limit: { type: Number, required: true },
  total: { type: Number, required: true },
  totalPages: { type: Number, required: true },
  disabled: { type: Boolean, default: false },
  itemLabel: { type: String, default: 'items' },
})

const emit = defineEmits(['update:page'])

const rangeStart = computed(() => (props.total === 0 ? 0 : (props.page - 1) * props.limit + 1))
const rangeEnd = computed(() => Math.min(props.page * props.limit, props.total))

function requestPage(page) {
  if (props.disabled || page < 1 || page > props.totalPages || page === props.page) return
  emit('update:page', page)
}
</script>
