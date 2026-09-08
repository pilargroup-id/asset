<template>
  <Modal v-if="isOpen" full-screen-backdrop @close="close">
    <template #body>
      <div
        class="no-scrollbar relative max-h-[90vh] w-full max-w-[480px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8"
      >
        <button
          @click="close"
          type="button"
          class="transition-color absolute right-5 top-5 z-999 flex h-9 w-9 items-center justify-center rounded-full bg-gray-100 text-gray-400 hover:bg-gray-200 hover:text-gray-600 dark:bg-white/[0.05] dark:text-gray-400 dark:hover:bg-white/[0.07] dark:hover:text-gray-300"
        >
          <svg class="fill-current" width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
            <path
              fill-rule="evenodd"
              clip-rule="evenodd"
              d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z"
              fill=""
            />
          </svg>
        </button>

        <h4 class="mb-1 text-xl font-semibold text-gray-800 dark:text-white/90">
          {{ isEditMode ? 'Edit Brand' : 'Create Brand' }}
        </h4>
        <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
          Fields marked with * are required.
        </p>

        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Name *</label>
            <input
              v-model="form.name"
              type="text"
              placeholder="e.g. Dell"
              required
              class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Status</label>
            <ToggleSwitch v-model="form.is_active" on-label="Active" off-label="Inactive" />
          </div>

          <p v-if="errorMessage" class="text-sm text-error-600 dark:text-error-500">
            {{ errorMessage }}
          </p>

          <div class="flex items-center justify-end gap-3 pt-2">
            <button
              @click="close"
              type="button"
              class="flex justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
            >
              Cancel
            </button>
            <button
              type="submit"
              :disabled="isSubmitting"
              class="flex justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ isSubmitting ? (isEditMode ? 'Updating...' : 'Creating...') : isEditMode ? 'Update' : 'Create' }}
            </button>
          </div>
        </form>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, reactive, computed, watch } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import ToggleSwitch from '@/components/forms/FormElements/ToggleSwitch.vue'
import { createMasterData, updateMasterData } from '@/service/axios'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  brand: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'created', 'updated'])

const isEditMode = computed(() => !!props.brand)

const isSubmitting = ref(false)
const errorMessage = ref('')

const form = reactive({
  name: '',
  is_active: true,
})

function slugifyCode(value) {
  const base = (value || '')
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
  return base || `BRD-${Date.now().toString(36).toUpperCase()}`
}

function populateForm(brand) {
  form.name = brand.name || ''
  form.is_active = brand.is_active === undefined ? true : !!brand.is_active
}

function resetForm() {
  form.name = ''
  form.is_active = true
  errorMessage.value = ''
}

watch(
  () => props.isOpen,
  (open) => {
    if (open && isEditMode.value) populateForm(props.brand)
    else if (!open) resetForm()
  }
)

function close() {
  emit('close')
}

async function submit() {
  errorMessage.value = ''
  if (!form.name.trim()) {
    errorMessage.value = 'Name is required.'
    return
  }

  const payload = {
    name: form.name.trim(),
    is_active: form.is_active,
  }
  if (!isEditMode.value) payload.code = slugifyCode(form.name)

  isSubmitting.value = true
  try {
    if (isEditMode.value) {
      const data = await updateMasterData('brands', props.brand.id, payload)
      emit('updated', data?.data)
    } else {
      const data = await createMasterData('brands', payload)
      emit('created', data?.data)
    }
    close()
  } catch (err) {
    errorMessage.value = err?.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} brand.`
  } finally {
    isSubmitting.value = false
  }
}
</script>
