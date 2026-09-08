<template>
  <label
    class="inline-flex select-none items-center gap-3"
    :class="disabled ? 'cursor-not-allowed opacity-60' : 'cursor-pointer'"
  >
    <span class="relative inline-flex h-6 w-11 shrink-0 items-center">
      <input
        type="checkbox"
        class="peer sr-only"
        :checked="modelValue"
        :disabled="disabled"
        @change="$emit('update:modelValue', $event.target.checked)"
      />
      <span
        class="absolute inset-0 rounded-full bg-gray-200 transition-colors duration-200 peer-checked:bg-brand-500 dark:bg-white/10"
      ></span>
      <span
        class="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-white shadow-theme-xs transition-transform duration-200 peer-checked:translate-x-5"
      ></span>
    </span>
    <span v-if="label" class="text-sm font-medium text-gray-700 dark:text-gray-400">
      {{ modelValue ? onLabel : offLabel }}
    </span>
  </label>
</template>

<script setup>
defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  label: {
    type: Boolean,
    default: true,
  },
  onLabel: {
    type: String,
    default: 'Active',
  },
  offLabel: {
    type: String,
    default: 'Inactive',
  },
  disabled: {
    type: Boolean,
    default: false,
  },
})

defineEmits(['update:modelValue'])
</script>
