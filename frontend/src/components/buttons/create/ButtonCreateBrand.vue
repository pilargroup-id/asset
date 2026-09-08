<template>
  <div>
    <button
      @click="isModalOpen = true"
      type="button"
      class="inline-flex items-center justify-center gap-2 rounded-lg bg-brand-500 px-4 py-2.5 text-theme-sm font-medium text-white shadow-theme-xs hover:bg-brand-600"
    >
      <PlusIcon class="h-4 w-4" />
      Create
    </button>

    <DialogCreateBrand
      :is-open="isModalOpen"
      @close="isModalOpen = false"
      @created="(payload) => emit('created', payload)"
    />
  </div>
</template>

<script setup>
import { ref } from 'vue'
import { PlusIcon } from '@/icons'
import DialogCreateBrand from '@/components/dialog/DialogCreateBrand.vue'

const emit = defineEmits(['created'])

const isModalOpen = ref(false)
</script>
