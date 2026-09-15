<template>
  <div class="relative">
    <input
      ref="inputRef"
      :value="modelValue"
      @input="$emit('update:modelValue', $event.target.value)"
      type="date"
      class="date-field dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-10 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
    />
    <button
      @click="openPicker"
      type="button"
      tabindex="-1"
      aria-label="Open calendar"
      class="absolute right-3 top-1/2 flex h-5 w-5 -translate-y-1/2 items-center justify-center text-gray-500 hover:text-brand-500 dark:text-gray-400 dark:hover:text-brand-400"
    >
      <Calendar2Line class="h-4 w-4" />
    </button>
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { Calendar2Line } from '@/icons'

defineProps({
  modelValue: {
    type: String,
    default: '',
  },
})

defineEmits(['update:modelValue'])

const inputRef = ref(null)

function openPicker() {
  const el = inputRef.value
  if (!el) return
  if (typeof el.showPicker === 'function') {
    try {
      el.showPicker()
      return
    } catch {
      // Some browsers throw if called outside a user gesture; fall back to focus.
    }
  }
  el.focus()
}
</script>

<style scoped>
.date-field::-webkit-calendar-picker-indicator {
  opacity: 0;
  pointer-events: none;
}
</style>
