<template>
  <div>
    <button
      @click="isModalOpen = true"
      type="button"
      class="inline-flex items-center justify-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-theme-xs font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
    >
      <PieChartIcon class="h-4 w-4" />
      Depreciation
    </button>

    <DialogAssetDepreciation
      :is-open="isModalOpen"
      :asset="asset"
      @close="isModalOpen = false"
      @changed="emit('changed')"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { PieChartIcon } from '@/icons'
import DialogAssetDepreciation from '@/components/dialog/DialogAssetDepreciation.vue'

defineProps({
  asset: {
    type: Object,
    required: true,
  },
})

const emit = defineEmits(['changed'])

const isModalOpen = ref(false)
</script>
