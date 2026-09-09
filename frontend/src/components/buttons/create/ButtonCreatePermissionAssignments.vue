<template>
  <div>
    <button
      @click="isModalOpen = true"
      type="button"
      :class="
        compact
          ? 'inline-flex items-center justify-center gap-1.5 rounded-lg border border-dashed border-gray-300 px-3 py-2 text-theme-xs font-medium text-gray-600 hover:border-brand-400 hover:text-brand-600 dark:border-gray-700 dark:text-gray-400 dark:hover:border-brand-700 dark:hover:text-brand-400'
          : 'inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600'
      "
    >
      <PlusIcon :class="compact ? 'h-3.5 w-3.5' : 'h-4 w-4'" />
      {{ label }}
    </button>

    <DialogPermissionAssignments
      :is-open="isModalOpen"
      :locked-subject-type="subjectType"
      :locked-subject-id="subjectId ? String(subjectId) : ''"
      :locked-subject-label="subjectLabel"
      :existing-permission-codes="existingPermissionCodes"
      @close="isModalOpen = false"
      @created="(payload) => emit('created', payload)"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { PlusIcon } from '@/icons'
import DialogPermissionAssignments from '@/components/dialog/DialogPermissionAssignments.vue'

defineProps({
  subjectType: {
    type: String,
    default: '',
  },
  subjectId: {
    type: [String, Number],
    default: '',
  },
  subjectLabel: {
    type: String,
    default: '',
  },
  existingPermissionCodes: {
    type: Array,
    default: () => [],
  },
  label: {
    type: String,
    default: 'Create',
  },
  compact: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['created'])

const isModalOpen = ref(false)
</script>
