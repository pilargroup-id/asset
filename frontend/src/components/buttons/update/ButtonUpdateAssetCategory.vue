<template>
  <div>
    <button
      @click="isModalOpen = true"
      type="button"
      class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
    >
      <svg
        class="h-4 w-4"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="1.5"
        xmlns="http://www.w3.org/2000/svg"
      >
        <path
          stroke-linecap="round"
          stroke-linejoin="round"
          d="m16.862 4.487 1.687-1.688a1.875 1.875 0 1 1 2.652 2.652L10.582 16.07a4.5 4.5 0 0 1-1.897 1.13L6 18l.8-2.685a4.5 4.5 0 0 1 1.13-1.897l8.932-8.931Zm0 0L19.5 7.125M18 14v4.75A2.25 2.25 0 0 1 15.75 21H5.25A2.25 2.25 0 0 1 3 18.75V8.25A2.25 2.25 0 0 1 5.25 6H10"
        />
      </svg>
      Edit
    </button>

    <DialogCreateAssetCategory
      :is-open="isModalOpen"
      :category="category"
      @close="isModalOpen = false"
      @updated="(payload) => emit('updated', payload)"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import DialogCreateAssetCategory from '@/components/dialog/DialogCreateAssetCategory.vue'

defineProps({
  category: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['updated'])

const isModalOpen = ref(false)
</script>
