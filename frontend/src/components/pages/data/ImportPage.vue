<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard title="1. Choose Type &amp; File" desc="Download the template, fill it in, then upload it here for validation.">
        <div class="flex flex-col gap-4">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Import Type</label>
              <SelectField v-model="importType" :disabled="!!preview">
                <option v-for="opt in IMPORT_TYPES" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
              </SelectField>
            </div>
            <div class="flex items-end">
              <button
                @click="downloadTemplate"
                :disabled="isDownloadingTemplate"
                type="button"
                class="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 shadow-theme-xs hover:bg-gray-50 hover:text-gray-800 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03] dark:hover:text-gray-200"
              >
                <DocsIcon class="h-4 w-4" />
                {{ isDownloadingTemplate ? 'Preparing...' : 'Download Template' }}
              </button>
            </div>
          </div>

          <div v-if="!preview">
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">Import File (.xlsx, .xls, .csv)</label>
            <input
              ref="fileInputRef"
              @change="onFileChange"
              type="file"
              accept=".xlsx,.xls,.csv"
              class="focus:border-ring-brand-300 h-11 w-full overflow-hidden rounded-lg border border-gray-300 bg-transparent text-sm text-gray-500 shadow-theme-xs transition-colors file:mr-5 file:border-collapse file:cursor-pointer file:rounded-l-lg file:border-0 file:border-r file:border-solid file:border-gray-200 file:bg-gray-50 file:py-3 file:pl-3.5 file:pr-3 file:text-sm file:text-gray-700 placeholder:text-gray-400 hover:file:bg-gray-100 focus:outline-hidden focus:file:ring-brand-300 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-400 dark:text-white/90 dark:file:border-gray-800 dark:file:bg-white/[0.03] dark:file:text-gray-400 dark:placeholder:text-gray-400"
            />
          </div>

          <p v-if="uploadError" class="text-sm text-error-600 dark:text-error-500">{{ uploadError }}</p>

          <div v-if="!preview">
            <button
              @click="submitPreview"
              :disabled="!selectedFile || isUploading"
              type="button"
              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ isUploading ? 'Validating...' : 'Upload &amp; Preview' }}
            </button>
          </div>
        </div>
      </ComponentCard>

      <ComponentCard v-if="preview" title="2. Preview Results" :desc="`File: ${preview.original_filename}`">
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap gap-2">
            <Badge color="light" size="md">Total {{ preview.summary.total }}</Badge>
            <Badge color="success" size="md">Valid {{ preview.summary.valid }}</Badge>
            <Badge color="warning" size="md">Warnings {{ preview.summary.warnings }}</Badge>
            <Badge color="error" size="md">Invalid {{ preview.summary.invalid }}</Badge>
          </div>

          <BaseTable>
            <template #head>
              <TableHeadCell>Row</TableHeadCell>
              <TableHeadCell>Action</TableHeadCell>
              <TableHeadCell>Status</TableHeadCell>
              <TableHeadCell>Data</TableHeadCell>
              <TableHeadCell>Notes</TableHeadCell>
            </template>
            <tr v-for="row in paginatedRows" :key="row.source_row" class="border-t border-gray-100 dark:border-gray-800">
              <td class="whitespace-nowrap px-5 py-3 text-theme-sm text-gray-500 dark:text-gray-400">{{ row.source_row }}</td>
              <td class="whitespace-nowrap px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-300">{{ row.action }}</td>
              <td class="px-5 py-3">
                <Badge :color="STATUS_BADGE[row.status] || 'light'" size="sm">{{ row.status }}</Badge>
              </td>
              <td class="max-w-xs truncate px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400" :title="rowSummary(row)">
                {{ rowSummary(row) }}
              </td>
              <td class="px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400">
                <p v-for="(err, idx) in row.errors" :key="`e${idx}`" class="text-error-600 dark:text-error-500">{{ err }}</p>
                <p v-for="(warn, idx) in row.warnings" :key="`w${idx}`" class="text-warning-600 dark:text-orange-400">{{ warn }}</p>
              </td>
            </tr>
          </BaseTable>

          <TablePagination
            :page="page"
            :limit="limit"
            :total="preview.rows.length"
            :total-pages="totalPages"
            item-label="rows"
            @update:page="(value) => (page = value)"
          />

          <p v-if="commitError" class="text-sm text-error-600 dark:text-error-500">{{ commitError }}</p>

          <div class="flex items-center gap-3">
            <button
              @click="submitCommit"
              :disabled="!preview.summary.valid && !preview.summary.warnings || isCommitting"
              type="button"
              class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2.5 text-sm font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {{ isCommitting ? 'Committing...' : 'Commit Import' }}
            </button>
            <button
              @click="cancelPreview"
              :disabled="isCommitting || isCanceling"
              type="button"
              class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
            >
              {{ isCanceling ? 'Canceling...' : 'Cancel Preview' }}
            </button>
          </div>
        </div>
      </ComponentCard>

      <ComponentCard v-if="commitResult" title="3. Import Result">
        <div class="flex flex-col gap-4">
          <div class="flex flex-wrap gap-2">
            <Badge color="light" size="md">Total {{ commitResult.summary.total }}</Badge>
            <Badge color="success" size="md">Success {{ commitResult.summary.success }}</Badge>
            <Badge color="error" size="md">Failed {{ commitResult.summary.failed }}</Badge>
          </div>
          <p class="text-sm text-gray-500 dark:text-gray-400">
            Import reference: <span class="font-medium text-gray-700 dark:text-gray-300">{{ commitResult.import_reference }}</span>
          </p>

          <button
            v-if="commitResult.error_file_token"
            @click="downloadErrors"
            :disabled="isDownloadingErrors"
            type="button"
            class="inline-flex w-fit items-center justify-center gap-2 rounded-lg border border-error-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-error-600 shadow-theme-xs hover:bg-error-50 disabled:cursor-not-allowed disabled:opacity-60 dark:border-error-500/40 dark:bg-gray-800 dark:text-error-500 dark:hover:bg-white/[0.03]"
          >
            {{ isDownloadingErrors ? 'Preparing...' : 'Download Error Report' }}
          </button>

          <button
            @click="resetWizard"
            type="button"
            class="inline-flex w-fit items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-theme-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
          >
            Start New Import
          </button>
        </div>
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref, computed } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import BaseTable from '@/components/tables/BaseTable.vue'
import TableHeadCell from '@/components/tables/TableHeadCell.vue'
import TablePagination from '@/components/tables/TablePagination.vue'
import SelectField from '@/components/forms/FormElements/SelectField.vue'
import Badge from '@/components/ui/Badge.vue'
import { DocsIcon } from '@/icons'
import {
  previewImport,
  commitImport,
  cancelImportPreview,
  downloadImportTemplate,
  downloadImportErrors,
} from '@/service/axios'
import { triggerBlobDownload, parseBlobErrorMessage } from '@/utils/download'

const currentPageTitle = ref('Import')

const IMPORT_TYPES = [
  { value: 'ASSET', label: 'Asset' },
  { value: 'CONSUMABLE', label: 'Consumable' },
  { value: 'CONSUMABLE_OPENING_STOCK', label: 'Consumable Opening Stock' },
  { value: 'CATEGORY', label: 'Category' },
  { value: 'LOCATION', label: 'Location' },
  { value: 'VENDOR', label: 'Vendor' },
  { value: 'BRAND', label: 'Brand' },
  { value: 'MODEL', label: 'Model' },
  { value: 'DEPRECIATION_POLICY', label: 'Depreciation Policy' },
]

const STATUS_BADGE = {
  VALID: 'success',
  WARNING: 'warning',
  INVALID: 'error',
  FAILED: 'error',
}

const importType = ref('ASSET')
const fileInputRef = ref(null)
const selectedFile = ref(null)
const uploadError = ref('')
const isUploading = ref(false)
const isDownloadingTemplate = ref(false)

const preview = ref(null)
const page = ref(1)
const limit = 20
const commitError = ref('')
const isCommitting = ref(false)
const isCanceling = ref(false)

const commitResult = ref(null)
const isDownloadingErrors = ref(false)

const totalPages = computed(() => Math.max(1, Math.ceil((preview.value?.rows.length || 0) / limit)))
const paginatedRows = computed(() => {
  if (!preview.value) return []
  const start = (page.value - 1) * limit
  return preview.value.rows.slice(start, start + limit)
})

function rowSummary(row) {
  const entries = Object.entries(row.original || {}).filter(([, value]) => value !== null && value !== '')
  return entries.map(([key, value]) => `${key}: ${value}`).join(' | ') || '-'
}

function onFileChange(event) {
  selectedFile.value = event.target.files?.[0] || null
}

async function downloadTemplate() {
  isDownloadingTemplate.value = true
  try {
    const { blob, filename } = await downloadImportTemplate(importType.value)
    triggerBlobDownload(blob, filename)
  } catch (err) {
    uploadError.value = await parseBlobErrorMessage(err, 'Failed to download import template.')
  } finally {
    isDownloadingTemplate.value = false
  }
}

async function submitPreview() {
  if (!selectedFile.value) return
  uploadError.value = ''
  isUploading.value = true
  try {
    const data = await previewImport(importType.value, selectedFile.value)
    preview.value = data?.data || null
    page.value = 1
  } catch (err) {
    uploadError.value = err?.response?.data?.message || 'Failed to validate import file.'
  } finally {
    isUploading.value = false
  }
}

async function submitCommit() {
  if (!preview.value) return
  commitError.value = ''
  isCommitting.value = true
  try {
    const data = await commitImport(preview.value.preview_token)
    commitResult.value = data?.data || null
    preview.value = null
  } catch (err) {
    commitError.value = err?.response?.data?.message || 'Failed to commit import.'
  } finally {
    isCommitting.value = false
  }
}

async function cancelPreview() {
  if (!preview.value) return
  isCanceling.value = true
  try {
    await cancelImportPreview(preview.value.preview_token)
  } catch {
    // preview will expire on its own even if the cancel call fails
  } finally {
    isCanceling.value = false
    preview.value = null
    selectedFile.value = null
    if (fileInputRef.value) fileInputRef.value.value = ''
  }
}

async function downloadErrors() {
  if (!commitResult.value?.error_file_token) return
  isDownloadingErrors.value = true
  try {
    const { blob, filename } = await downloadImportErrors(commitResult.value.error_file_token)
    triggerBlobDownload(blob, filename)
  } catch (err) {
    commitError.value = await parseBlobErrorMessage(err, 'Failed to download error report.')
  } finally {
    isDownloadingErrors.value = false
  }
}

function resetWizard() {
  preview.value = null
  commitResult.value = null
  selectedFile.value = null
  uploadError.value = ''
  commitError.value = ''
  page.value = 1
  if (fileInputRef.value) fileInputRef.value.value = ''
}
</script>
