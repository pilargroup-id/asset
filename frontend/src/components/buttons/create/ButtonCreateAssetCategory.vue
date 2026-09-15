<template>
  <div>
    <button
      @click="isModalOpen = true"
      type="button"
      class="inline-flex items-center justify-center gap-2 rounded-lg btn-sidebar-gradient px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs"
    >
      <PlusIcon class="h-4 w-4" />
      Create
    </button>

    <DialogCreateAssetCategory
      :is-open="isModalOpen"
      @close="isModalOpen = false"
      @created="(payload) => emit('created', payload)"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { PlusIcon } from '@/icons'
import DialogCreateAssetCategory from '@/components/dialog/DialogCreateAssetCategory.vue'

const emit = defineEmits(['created'])

const isModalOpen = ref(false)
</script>
