<template>
  <Modal v-if="isOpen" full-screen-backdrop @close="close">
    <template #body>
      <div
        class="relative flex max-h-[90vh] w-full max-w-[1100px] flex-col overflow-hidden rounded-3xl bg-white shadow-theme-lg dark:bg-gray-900"
      >
        <!-- Header -->
        <div class="flex items-start justify-between gap-3 border-b border-gray-100 px-6 py-5 dark:border-gray-800">
          <div class="min-w-0">
            <h4 class="truncate text-lg font-semibold text-gray-800 dark:text-white/90">
              {{ assetDetail?.asset_name || '-' }}
            </h4>
            <p class="mt-0.5 text-theme-xs text-gray-500 dark:text-gray-400">
              {{ assetDetail?.asset_number || '-' }}
              <template v-if="assetDetail?.serial_number"> &middot; SN {{ assetDetail.serial_number }}</template>
            </p>
            <div class="mt-2 flex flex-wrap items-center gap-1.5">
              <Badge :color="statusColor(assetDetail?.status)" size="sm">{{ formatLabel(assetDetail?.status) }}</Badge>
              <Badge :color="conditionColor(assetDetail?.asset_condition)" size="sm">{{ formatLabel(assetDetail?.asset_condition) }}</Badge>
              <span v-if="assetDetail?.current_location_name" class="text-theme-xs text-gray-400 dark:text-gray-500">
                &middot; {{ assetDetail.current_location_name }}
              </span>
            </div>
          </div>
          <div class="flex shrink-0 items-center gap-1.5">
            <button
              @click="loadAll"
              :disabled="isLoading"
              type="button"
              title="Refresh"
              class="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 disabled:cursor-not-allowed disabled:opacity-50 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-300"
            >
              <RefreshIcon class="h-4 w-4" :class="{ 'animate-spin': isLoading }" />
            </button>
            <button
              @click="close"
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-full text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:text-gray-400 dark:hover:bg-white/[0.05] dark:hover:text-gray-300"
            >
              <svg class="fill-current" width="18" height="18" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  fill-rule="evenodd"
                  clip-rule="evenodd"
                  d="M6.04289 16.5418C5.65237 16.9323 5.65237 17.5655 6.04289 17.956C6.43342 18.3465 7.06658 18.3465 7.45711 17.956L11.9987 13.4144L16.5408 17.9565C16.9313 18.347 17.5645 18.347 17.955 17.9565C18.3455 17.566 18.3455 16.9328 17.955 16.5423L13.4129 12.0002L17.955 7.45808C18.3455 7.06756 18.3455 6.43439 17.955 6.04387C17.5645 5.65335 16.9313 5.65335 16.5408 6.04387L11.9987 10.586L7.45711 6.04439C7.06658 5.65386 6.43342 5.65386 6.04289 6.04439C5.65237 6.43491 5.65237 7.06808 6.04289 7.4586L10.5845 12.0002L6.04289 16.5418Z"
                  fill=""
                />
              </svg>
            </button>
          </div>
        </div>

        <!-- Action bar -->
        <div v-if="assetDetail" class="flex flex-wrap items-center gap-2 border-b border-gray-100 px-6 py-3 dark:border-gray-800">
          <button
            v-if="canAssign"
            @click="openAction('assign')"
            type="button"
            class="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-theme-xs font-medium shadow-theme-xs"
            :class="
              activeAction === 'assign'
                ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]'
            "
          >
            Assign
          </button>
          <button
            v-if="canReturn"
            @click="openAction('return')"
            type="button"
            class="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-theme-xs font-medium shadow-theme-xs"
            :class="
              activeAction === 'return'
                ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]'
            "
          >
            Return
          </button>
          <button
            v-if="canTransfer"
            @click="openAction('transfer')"
            type="button"
            class="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-theme-xs font-medium shadow-theme-xs"
            :class="
              activeAction === 'transfer'
                ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]'
            "
          >
            Transfer
          </button>
          <button
            v-if="canMaintenance"
            @click="openAction('maintenance')"
            type="button"
            class="inline-flex items-center justify-center rounded-lg border px-3 py-2 text-theme-xs font-medium shadow-theme-xs"
            :class="
              activeAction === 'maintenance'
                ? 'border-brand-500 bg-brand-50 text-brand-600 dark:bg-brand-500/15 dark:text-brand-400'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]'
            "
          >
            Start Maintenance
          </button>
          <button
            v-if="canLifecycle"
            @click="openAction('lifecycle')"
            type="button"
            class="ml-auto inline-flex items-center justify-center rounded-lg border px-3 py-2 text-theme-xs font-medium shadow-theme-xs"
            :class="
              activeAction === 'lifecycle'
                ? 'border-error-500 bg-error-50 text-error-600 dark:bg-error-500/15 dark:text-error-500'
                : 'border-gray-300 bg-white text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]'
            "
          >
            Lifecycle
          </button>
        </div>

        <!-- Inline action forms -->
        <div v-if="activeAction" class="border-b border-gray-100 bg-gray-50/60 px-6 py-4 dark:border-gray-800 dark:bg-white/[0.02]">
          <!-- Assign -->
          <form v-if="activeAction === 'assign'" @submit.prevent="submitAssign" class="flex flex-col gap-3">
            <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Assign Asset</p>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Assignment Type *</label>
                <SelectField v-model="assignForm.assignment_type">
                  <option v-for="opt in ASSIGNMENT_TYPE_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </SelectField>
              </div>

              <div
                v-if="assignForm.assignment_type === 'USER'"
                :ref="(el) => (assignUserField.containerRef.value = el)"
                class="relative sm:col-span-2"
              >
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">User *</label>
                <input
                  v-model="assignUserField.query.value"
                  type="text"
                  autocomplete="off"
                  placeholder="Search user..."
                  @focus="assignUserField.open()"
                  @click="assignUserField.open()"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
                <div
                  v-if="assignUserField.isOpen.value"
                  class="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
                >
                  <ul class="custom-scrollbar max-h-56 overflow-y-auto py-1" role="listbox">
                    <li v-if="assignUserField.isLoading.value" class="px-3 py-2 text-sm text-gray-400">Loading...</li>
                    <li v-else-if="!assignUserField.filtered.value.length" class="px-3 py-2 text-sm text-gray-400">No users found.</li>
                    <li
                      v-for="item in assignUserField.filtered.value"
                      :key="getRecordId(item)"
                      @click="assignUserField.select(item)"
                      role="option"
                      class="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
                    >
                      <span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ getRecordLabel(item) }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div
                v-else-if="assignForm.assignment_type === 'DEPARTMENT'"
                :ref="(el) => (assignDepartmentField.containerRef.value = el)"
                class="relative sm:col-span-2"
              >
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Department *</label>
                <input
                  v-model="assignDepartmentField.query.value"
                  type="text"
                  autocomplete="off"
                  placeholder="Search department..."
                  @focus="assignDepartmentField.open()"
                  @click="assignDepartmentField.open()"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
                <div
                  v-if="assignDepartmentField.isOpen.value"
                  class="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
                >
                  <ul class="custom-scrollbar max-h-56 overflow-y-auto py-1" role="listbox">
                    <li v-if="assignDepartmentField.isLoading.value" class="px-3 py-2 text-sm text-gray-400">Loading...</li>
                    <li v-else-if="!assignDepartmentField.filtered.value.length" class="px-3 py-2 text-sm text-gray-400">
                      No departments found.
                    </li>
                    <li
                      v-for="item in assignDepartmentField.filtered.value"
                      :key="getRecordId(item)"
                      @click="assignDepartmentField.select(item)"
                      role="option"
                      class="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
                    >
                      <span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ getRecordLabel(item) }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div v-else-if="assignForm.assignment_type === 'LOCATION'" class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Location *</label>
                <SelectField v-model="assignForm.assigned_location_id" placeholder="Select location">
                  <option v-for="item in locations" :key="item.id" :value="item.id">{{ item.name }}</option>
                </SelectField>
              </div>
              <p v-else class="flex items-end pb-2.5 text-theme-xs text-gray-400 sm:col-span-2">
                Asset will be placed in the shared pool, available to anyone in scope.
              </p>

              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Assigned At</label>
                <DateField v-model="assignForm.assigned_at" />
              </div>
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Purpose</label>
                <input
                  v-model="assignForm.purpose"
                  type="text"
                  placeholder="e.g. Daily operations"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>
            <p v-if="actionError" class="text-xs text-error-600 dark:text-error-500">{{ actionError }}</p>
            <div class="flex items-center gap-2">
              <button
                type="submit"
                :disabled="isSubmittingAction"
                class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-theme-xs font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ isSubmittingAction ? 'Saving...' : 'Assign' }}
              </button>
              <button
                type="button"
                @click="closeAction"
                class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                Cancel
              </button>
            </div>
          </form>

          <!-- Return -->
          <form v-else-if="activeAction === 'return'" @submit.prevent="submitReturn" class="flex flex-col gap-3">
            <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Return Asset</p>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Condition</label>
                <SelectField v-model="returnForm.return_condition">
                  <option v-for="opt in CONDITION_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </SelectField>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Return Location</label>
                <SelectField v-model="returnForm.return_location_id" placeholder="Select location">
                  <option v-for="item in locations" :key="item.id" :value="item.id">{{ item.name }}</option>
                </SelectField>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Returned At</label>
                <DateField v-model="returnForm.returned_at" />
              </div>
              <div class="sm:col-span-3">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Note</label>
                <textarea
                  v-model="returnForm.return_note"
                  rows="2"
                  placeholder="Condition notes..."
                  class="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>
            <p v-if="actionError" class="text-xs text-error-600 dark:text-error-500">{{ actionError }}</p>
            <div class="flex items-center gap-2">
              <button
                type="submit"
                :disabled="isSubmittingAction"
                class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-theme-xs font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ isSubmittingAction ? 'Saving...' : 'Return' }}
              </button>
              <button
                type="button"
                @click="closeAction"
                class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                Cancel
              </button>
            </div>
          </form>

          <!-- Transfer -->
          <form v-else-if="activeAction === 'transfer'" @submit.prevent="submitTransfer" class="flex flex-col gap-3">
            <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Transfer Asset</p>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div :ref="(el) => (transferCompanyField.containerRef.value = el)" class="relative">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">To Company</label>
                <input
                  v-model="transferCompanyField.query.value"
                  type="text"
                  autocomplete="off"
                  placeholder="Search company..."
                  @focus="transferCompanyField.open()"
                  @click="transferCompanyField.open()"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
                <div
                  v-if="transferCompanyField.isOpen.value"
                  class="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
                >
                  <ul class="custom-scrollbar max-h-56 overflow-y-auto py-1" role="listbox">
                    <li v-if="transferCompanyField.isLoading.value" class="px-3 py-2 text-sm text-gray-400">Loading...</li>
                    <li v-else-if="!transferCompanyField.filtered.value.length" class="px-3 py-2 text-sm text-gray-400">
                      No companies found.
                    </li>
                    <li
                      v-for="item in transferCompanyField.filtered.value"
                      :key="getRecordId(item)"
                      @click="transferCompanyField.select(item)"
                      role="option"
                      class="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
                    >
                      <span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ getRecordLabel(item) }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div :ref="(el) => (transferDepartmentField.containerRef.value = el)" class="relative">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">To Department</label>
                <input
                  v-model="transferDepartmentField.query.value"
                  type="text"
                  autocomplete="off"
                  placeholder="Search department..."
                  @focus="transferDepartmentField.open()"
                  @click="transferDepartmentField.open()"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
                <div
                  v-if="transferDepartmentField.isOpen.value"
                  class="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
                >
                  <ul class="custom-scrollbar max-h-56 overflow-y-auto py-1" role="listbox">
                    <li v-if="transferDepartmentField.isLoading.value" class="px-3 py-2 text-sm text-gray-400">Loading...</li>
                    <li v-else-if="!transferDepartmentField.filtered.value.length" class="px-3 py-2 text-sm text-gray-400">
                      No departments found.
                    </li>
                    <li
                      v-for="item in transferDepartmentField.filtered.value"
                      :key="getRecordId(item)"
                      @click="transferDepartmentField.select(item)"
                      role="option"
                      class="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
                    >
                      <span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ getRecordLabel(item) }}</span>
                    </li>
                  </ul>
                </div>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">To Location</label>
                <SelectField v-model="transferForm.to_location_id" placeholder="Select location">
                  <option v-for="item in locations" :key="item.id" :value="item.id">{{ item.name }}</option>
                </SelectField>
              </div>

              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Transfer Date</label>
                <DateField v-model="transferForm.transfer_date" />
              </div>
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Reason</label>
                <input
                  v-model="transferForm.reason"
                  type="text"
                  placeholder="e.g. Department reorganization"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              <div class="sm:col-span-3">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Notes</label>
                <textarea
                  v-model="transferForm.notes"
                  rows="2"
                  placeholder="Additional notes..."
                  class="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>
            <p v-if="actionError" class="text-xs text-error-600 dark:text-error-500">{{ actionError }}</p>
            <div class="flex items-center gap-2">
              <button
                type="submit"
                :disabled="isSubmittingAction"
                class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-theme-xs font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ isSubmittingAction ? 'Saving...' : 'Transfer' }}
              </button>
              <button
                type="button"
                @click="closeAction"
                class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                Cancel
              </button>
            </div>
          </form>

          <!-- Start maintenance -->
          <form v-else-if="activeAction === 'maintenance'" @submit.prevent="submitMaintenance" class="flex flex-col gap-3">
            <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Start Maintenance</p>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Type *</label>
                <input
                  v-model="maintenanceForm.maintenance_type"
                  type="text"
                  placeholder="e.g. Preventive, Repair"
                  required
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Vendor</label>
                <SelectField v-model="maintenanceForm.vendor_id" placeholder="Select vendor (optional)">
                  <option v-for="item in vendors" :key="item.id" :value="item.id">{{ item.name }}</option>
                </SelectField>
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Start Date</label>
                <DateField v-model="maintenanceForm.start_date" />
              </div>
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Estimated Cost</label>
                <input
                  v-model="maintenanceForm.cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Problem Description</label>
                <textarea
                  v-model="maintenanceForm.problem_description"
                  rows="2"
                  placeholder="Describe the problem..."
                  class="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              <div class="sm:col-span-3">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Notes</label>
                <textarea
                  v-model="maintenanceForm.notes"
                  rows="2"
                  placeholder="Additional notes..."
                  class="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>
            <p v-if="actionError" class="text-xs text-error-600 dark:text-error-500">{{ actionError }}</p>
            <div class="flex items-center gap-2">
              <button
                type="submit"
                :disabled="isSubmittingAction"
                class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-theme-xs font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ isSubmittingAction ? 'Saving...' : 'Start Maintenance' }}
              </button>
              <button
                type="button"
                @click="closeAction"
                class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                Cancel
              </button>
            </div>
          </form>

          <!-- Complete maintenance -->
          <form
            v-else-if="activeAction === 'complete-maintenance'"
            @submit.prevent="submitCompleteMaintenance"
            class="flex flex-col gap-3"
          >
            <p class="text-sm font-semibold text-gray-800 dark:text-white/90">
              Complete Maintenance
              <span v-if="completingMaintenance" class="font-normal text-gray-500 dark:text-gray-400">
                &middot; {{ completingMaintenance.maintenance_type }} (started {{ formatAbsoluteTime(completingMaintenance.start_date) }})
              </span>
            </p>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Completion Date</label>
                <DateField v-model="completeMaintenanceForm.completion_date" />
              </div>
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Final Cost</label>
                <input
                  v-model="completeMaintenanceForm.cost"
                  type="number"
                  min="0"
                  step="0.01"
                  placeholder="0"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              <div class="sm:col-span-3">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Result</label>
                <textarea
                  v-model="completeMaintenanceForm.result"
                  rows="2"
                  placeholder="What was done..."
                  class="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
              <div class="sm:col-span-3">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Notes</label>
                <textarea
                  v-model="completeMaintenanceForm.notes"
                  rows="2"
                  placeholder="Additional notes..."
                  class="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>
            <p v-if="actionError" class="text-xs text-error-600 dark:text-error-500">{{ actionError }}</p>
            <div class="flex items-center gap-2">
              <button
                type="submit"
                :disabled="isSubmittingAction"
                class="inline-flex items-center justify-center rounded-lg bg-brand-500 px-4 py-2 text-theme-xs font-medium text-white hover:bg-brand-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ isSubmittingAction ? 'Saving...' : 'Complete' }}
              </button>
              <button
                type="button"
                @click="closeAction"
                class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                Cancel
              </button>
            </div>
          </form>

          <!-- Lifecycle -->
          <form v-else-if="activeAction === 'lifecycle'" @submit.prevent="submitLifecycle" class="flex flex-col gap-3">
            <p class="text-sm font-semibold text-gray-800 dark:text-white/90">Update Lifecycle Status</p>
            <div class="grid grid-cols-1 gap-3 sm:grid-cols-3">
              <div>
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">New Status *</label>
                <SelectField v-model="lifecycleForm.status">
                  <option v-for="opt in LIFECYCLE_STATUS_OPTIONS" :key="opt.value" :value="opt.value">{{ opt.label }}</option>
                </SelectField>
              </div>
              <div class="sm:col-span-2">
                <label class="mb-1.5 block text-xs font-medium text-gray-700 dark:text-gray-400">Reason</label>
                <input
                  v-model="lifecycleForm.reason"
                  type="text"
                  placeholder="e.g. End of useful life"
                  class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                />
              </div>
            </div>
            <p v-if="actionError" class="text-xs text-error-600 dark:text-error-500">{{ actionError }}</p>
            <div class="flex items-center gap-2">
              <button
                type="submit"
                :disabled="isSubmittingAction"
                class="inline-flex items-center justify-center rounded-lg bg-error-500 px-4 py-2 text-theme-xs font-medium text-white hover:bg-error-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {{ isSubmittingAction ? 'Saving...' : 'Update Status' }}
              </button>
              <button
                type="button"
                @click="closeAction"
                class="inline-flex items-center justify-center rounded-lg border border-gray-300 bg-white px-4 py-2 text-theme-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:bg-gray-800 dark:text-gray-400 dark:hover:bg-white/[0.03]"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>

        <!-- Tabs -->
        <div class="custom-scrollbar flex gap-1 overflow-x-auto border-b border-gray-100 px-6 dark:border-gray-800">
          <button
            v-for="tab in TABS"
            :key="tab.key"
            type="button"
            @click="activeTab = tab.key"
            class="whitespace-nowrap border-b-2 px-3 py-2.5 text-theme-sm font-medium transition-colors"
            :class="
              activeTab === tab.key
                ? 'border-brand-500 text-brand-600 dark:text-brand-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200'
            "
          >
            {{ tab.label }} ({{ tabCount(tab.key) }})
          </button>
        </div>

        <!-- Content -->
        <div class="custom-scrollbar flex-1 overflow-y-auto px-6 py-4">
          <div v-if="isLoading" class="flex items-center justify-center py-14 text-sm text-gray-400">
            Loading asset history...
          </div>

          <div v-else-if="loadError" class="flex flex-col items-center justify-center gap-2 py-14 text-center">
            <p class="text-sm text-error-600 dark:text-error-500">{{ loadError }}</p>
            <button @click="loadAll" class="text-sm font-medium text-brand-500 hover:underline">Retry</button>
          </div>

          <template v-else>
            <!-- History timeline -->
            <ul v-if="activeTab === 'history'" class="flex flex-col">
              <li v-if="!historyEntries.length" class="py-14 text-center text-sm text-gray-400">No history recorded yet.</li>
              <li
                v-for="entry in historyEntries"
                :key="entry.id"
                class="flex gap-3 border-b border-gray-100 py-3 last:border-b-0 dark:border-gray-800"
              >
                <Badge :color="EVENT_BADGE[entry.event_type] || 'light'" size="sm" class="mt-0.5 shrink-0">
                  {{ formatEventType(entry.event_type) }}
                </Badge>
                <div class="min-w-0 flex-1">
                  <p class="text-theme-sm text-gray-700 dark:text-gray-300">{{ historyDetail(entry) }}</p>
                  <div class="mt-1 flex flex-wrap items-center gap-2 text-theme-xs text-gray-400 dark:text-gray-500">
                    <span>{{ formatAbsoluteTime(entry.event_date) }}</span>
                    <template v-if="entry.performed_by">
                      <span class="h-1 w-1 rounded-full bg-gray-300 dark:bg-gray-600"></span>
                      <span>by {{ userName(entry.performed_by) }}</span>
                    </template>
                  </div>
                </div>
              </li>
            </ul>

            <!-- Assignments -->
            <BaseTable v-else-if="activeTab === 'assignments'">
              <template #head>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>Target</TableHeadCell>
                <TableHeadCell>Purpose</TableHeadCell>
                <TableHeadCell>Assigned At</TableHeadCell>
                <TableHeadCell>Returned At</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
              </template>
              <tr v-if="!assignments.length">
                <td colspan="6" class="px-5 py-10 text-center text-theme-sm text-gray-400">No assignments recorded.</td>
              </tr>
              <tr v-for="row in assignments" :key="row.id" class="border-t border-gray-100 dark:border-gray-800">
                <td class="whitespace-nowrap px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                  {{ formatLabel(row.assignment_type) }}
                </td>
                <td class="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-300">{{ assignmentTarget(row) }}</td>
                <td class="px-5 py-3 text-theme-sm text-gray-500 dark:text-gray-400">{{ row.purpose || '-' }}</td>
                <td class="whitespace-nowrap px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400">
                  {{ formatAbsoluteTime(row.assigned_at) }}
                </td>
                <td class="whitespace-nowrap px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400">
                  {{ formatAbsoluteTime(row.returned_at) }}
                </td>
                <td class="px-5 py-3">
                  <Badge :color="row.returned_at ? 'light' : 'success'" size="sm">{{ row.returned_at ? 'Returned' : 'Active' }}</Badge>
                </td>
              </tr>
            </BaseTable>

            <!-- Transfers -->
            <BaseTable v-else-if="activeTab === 'transfers'">
              <template #head>
                <TableHeadCell>Date</TableHeadCell>
                <TableHeadCell>From</TableHeadCell>
                <TableHeadCell>To</TableHeadCell>
                <TableHeadCell>Reason</TableHeadCell>
                <TableHeadCell>By</TableHeadCell>
              </template>
              <tr v-if="!transfers.length">
                <td colspan="5" class="px-5 py-10 text-center text-theme-sm text-gray-400">No transfers recorded.</td>
              </tr>
              <tr v-for="row in transfers" :key="row.id" class="border-t border-gray-100 dark:border-gray-800">
                <td class="whitespace-nowrap px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400">
                  {{ formatAbsoluteTime(row.transfer_date) }}
                </td>
                <td class="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                  {{ locationName(row.from_location_id) }} &middot; {{ departmentName(row.from_managing_department_id) }} &middot;
                  {{ companyName(row.from_company_id) }}
                </td>
                <td class="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                  {{ locationName(row.to_location_id) }} &middot; {{ departmentName(row.to_managing_department_id) }} &middot;
                  {{ companyName(row.to_company_id) }}
                </td>
                <td class="px-5 py-3 text-theme-sm text-gray-500 dark:text-gray-400">{{ row.reason || '-' }}</td>
                <td class="whitespace-nowrap px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400">
                  {{ userName(row.transferred_by) }}
                </td>
              </tr>
            </BaseTable>

            <!-- Maintenance -->
            <BaseTable v-else-if="activeTab === 'maintenance'">
              <template #head>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>Vendor</TableHeadCell>
                <TableHeadCell>Start</TableHeadCell>
                <TableHeadCell>Completion</TableHeadCell>
                <TableHeadCell>Cost</TableHeadCell>
                <TableHeadCell>Status</TableHeadCell>
                <TableHeadCell>Action</TableHeadCell>
              </template>
              <tr v-if="!maintenances.length">
                <td colspan="7" class="px-5 py-10 text-center text-theme-sm text-gray-400">No maintenance records.</td>
              </tr>
              <tr v-for="row in maintenances" :key="row.id" class="border-t border-gray-100 dark:border-gray-800">
                <td class="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-300">{{ row.maintenance_type }}</td>
                <td class="px-5 py-3 text-theme-sm text-gray-500 dark:text-gray-400">{{ row.vendor_name || '-' }}</td>
                <td class="whitespace-nowrap px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400">
                  {{ formatAbsoluteTime(row.start_date) }}
                </td>
                <td class="whitespace-nowrap px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400">
                  {{ formatAbsoluteTime(row.completion_date) }}
                </td>
                <td class="whitespace-nowrap px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-300">
                  {{ formatCurrency(row.cost) }}
                </td>
                <td class="px-5 py-3">
                  <Badge :color="MAINTENANCE_BADGE[row.status] || 'light'" size="sm">{{ formatLabel(row.status) }}</Badge>
                </td>
                <td class="px-5 py-3">
                  <button
                    v-if="row.status === 'OPEN' || row.status === 'IN_PROGRESS'"
                    type="button"
                    @click="openCompleteMaintenance(row)"
                    class="text-theme-xs font-medium text-brand-500 hover:underline"
                  >
                    Complete
                  </button>
                  <span v-else class="text-theme-xs text-gray-400">-</span>
                </td>
              </tr>
            </BaseTable>

            <!-- External references -->
            <BaseTable v-else-if="activeTab === 'references'">
              <template #head>
                <TableHeadCell>Source</TableHeadCell>
                <TableHeadCell>Type</TableHeadCell>
                <TableHeadCell>Reference</TableHeadCell>
                <TableHeadCell>Linked At</TableHeadCell>
              </template>
              <tr v-if="!externalReferences.length">
                <td colspan="4" class="px-5 py-10 text-center text-theme-sm text-gray-400">No external references linked.</td>
              </tr>
              <tr v-for="row in externalReferences" :key="row.id" class="border-t border-gray-100 dark:border-gray-800">
                <td class="px-5 py-3 text-theme-sm text-gray-600 dark:text-gray-300">{{ row.source_system }}</td>
                <td class="px-5 py-3 text-theme-sm text-gray-500 dark:text-gray-400">{{ row.reference_type }}</td>
                <td class="px-5 py-3 text-theme-sm text-gray-500 dark:text-gray-400">{{ row.reference_number || row.reference_id }}</td>
                <td class="whitespace-nowrap px-5 py-3 text-theme-xs text-gray-500 dark:text-gray-400">
                  {{ formatAbsoluteTime(row.linked_at) }}
                </td>
              </tr>
            </BaseTable>
          </template>
        </div>
      </div>
    </template>
  </Modal>
</template>

<script setup>
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import Badge from '@/components/ui/Badge.vue'
import BaseTable from '@/components/tables/BaseTable.vue'
import TableHeadCell from '@/components/tables/TableHeadCell.vue'
import SelectField from '@/components/forms/FormElements/SelectField.vue'
import DateField from '@/components/forms/FormElements/DateField.vue'
import { RefreshIcon } from '@/icons'
import { formatAbsoluteTime } from '@/utils/formatTime'
import {
  getAssetHistory,
  assignAsset,
  returnAsset,
  transferAsset,
  createAssetMaintenance,
  completeAssetMaintenance,
  updateAssetLifecycle,
  getMasterData,
  getDirectoryDepartments,
  getDirectoryCompanies,
  getDirectoryUsers,
} from '@/service/axios'

const props = defineProps({
  isOpen: {
    type: Boolean,
    default: false,
  },
  asset: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['close', 'changed'])

const TABS = [
  { key: 'history', label: 'History' },
  { key: 'assignments', label: 'Assignments' },
  { key: 'transfers', label: 'Transfers' },
  { key: 'maintenance', label: 'Maintenance' },
  { key: 'references', label: 'References' },
]

const ASSIGNMENT_TYPE_OPTIONS = [
  { value: 'USER', label: 'User' },
  { value: 'DEPARTMENT', label: 'Department' },
  { value: 'LOCATION', label: 'Location' },
  { value: 'SHARED_POOL', label: 'Shared Pool' },
]

const CONDITION_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
  { value: 'DAMAGED', label: 'Damaged' },
]

const LIFECYCLE_STATUS_OPTIONS = [
  { value: 'RETIRED', label: 'Retired' },
  { value: 'DISPOSED', label: 'Disposed' },
  { value: 'VOID', label: 'Void' },
  { value: 'LOST', label: 'Lost' },
]

const STATUS_BADGE_COLOR = {
  REGISTERED: 'light',
  AVAILABLE: 'success',
  ASSIGNED: 'info',
  MAINTENANCE: 'warning',
  LOST: 'error',
  RETIRED: 'dark',
  DISPOSED: 'dark',
  VOID: 'error',
}

const CONDITION_BADGE_COLOR = {
  NEW: 'success',
  GOOD: 'success',
  FAIR: 'warning',
  POOR: 'warning',
  DAMAGED: 'error',
}

const EVENT_BADGE = {
  CREATED: 'light',
  UPDATED: 'light',
  ASSIGNED: 'info',
  RETURNED: 'success',
  TRANSFERRED: 'warning',
  MAINTENANCE_STARTED: 'warning',
  MAINTENANCE_COMPLETED: 'success',
  RETIRED: 'dark',
  DISPOSED: 'dark',
  VOID: 'error',
  LOST: 'error',
}

const MAINTENANCE_BADGE = {
  OPEN: 'warning',
  IN_PROGRESS: 'info',
  COMPLETED: 'success',
  CANCELED: 'error',
}

const assetDetail = ref(null)
const historyEntries = ref([])
const assignments = ref([])
const transfers = ref([])
const maintenances = ref([])
const externalReferences = ref([])
const isLoading = ref(false)
const loadError = ref('')

const activeTab = ref('history')
const activeAction = ref('')
const actionError = ref('')
const isSubmittingAction = ref(false)
const completingMaintenanceId = ref(null)

const locations = ref([])
const vendors = ref([])
const lookupsLoaded = ref(false)

function tabCount(key) {
  if (key === 'history') return historyEntries.value.length
  if (key === 'assignments') return assignments.value.length
  if (key === 'transfers') return transfers.value.length
  if (key === 'maintenance') return maintenances.value.length
  if (key === 'references') return externalReferences.value.length
  return 0
}

const statusColor = (status) => STATUS_BADGE_COLOR[status] || 'light'
const conditionColor = (condition) => CONDITION_BADGE_COLOR[condition] || 'light'

function formatLabel(value) {
  if (!value) return '-'
  return value.charAt(0) + value.slice(1).toLowerCase()
}

function formatEventType(value) {
  if (!value) return '-'
  return value
    .split('_')
    .map((word) => word.charAt(0) + word.slice(1).toLowerCase())
    .join(' ')
}

function formatCurrency(value) {
  if (value === null || value === undefined || value === '') return '-'
  const number = Number(value)
  if (Number.isNaN(number)) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(number)
}

function getRecordId(item) {
  return item?.id ?? item?.uuid ?? item?.department_id ?? item?.company_id ?? ''
}

function getRecordLabel(item) {
  return (
    item?.name ||
    item?.full_name ||
    item?.display_name ||
    item?.department_name ||
    item?.company_name ||
    item?.username ||
    item?.email ||
    String(getRecordId(item))
  )
}

function normalizeDirectoryList(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  const candidate = payload.items || payload.departments || payload.companies || payload.users || payload.data
  return Array.isArray(candidate) ? candidate : []
}

function createDirectoryField(fetcher) {
  const options = ref([])
  const loaded = ref(false)
  const isLoadingField = ref(false)
  const isOpen = ref(false)
  const query = ref('')
  const selectedId = ref('')
  const containerRef = ref(null)

  const filtered = computed(() => {
    const term = query.value.trim().toLowerCase()
    if (!term) return options.value
    return options.value.filter((item) =>
      [getRecordLabel(item), getRecordId(item)].filter(Boolean).some((v) => String(v).toLowerCase().includes(term))
    )
  })

  const selected = computed(
    () => options.value.find((item) => String(getRecordId(item)) === String(selectedId.value)) || null
  )

  async function load() {
    if (loaded.value || isLoadingField.value) return
    isLoadingField.value = true
    try {
      const res = await fetcher()
      options.value = normalizeDirectoryList(res?.data)
    } catch {
      options.value = []
    } finally {
      isLoadingField.value = false
      loaded.value = true
    }
  }

  function open() {
    isOpen.value = true
    if (!loaded.value) load()
  }

  function select(item) {
    selectedId.value = String(getRecordId(item))
    query.value = getRecordLabel(item)
    isOpen.value = false
  }

  function setSelected(id) {
    selectedId.value = id !== null && id !== undefined && id !== '' ? String(id) : ''
    query.value = selectedId.value
    if (selectedId.value) {
      load().then(() => {
        if (selected.value) query.value = getRecordLabel(selected.value)
      })
    }
  }

  function closeAndSync() {
    isOpen.value = false
    query.value = selected.value ? getRecordLabel(selected.value) : ''
  }

  function reset() {
    selectedId.value = ''
    query.value = ''
    isOpen.value = false
  }

  return {
    options,
    filtered,
    selected,
    selectedId,
    query,
    isOpen,
    isLoading: isLoadingField,
    containerRef,
    load,
    open,
    select,
    setSelected,
    closeAndSync,
    reset,
  }
}

const assignUserField = createDirectoryField(getDirectoryUsers)
const assignDepartmentField = createDirectoryField(getDirectoryDepartments)
const transferCompanyField = createDirectoryField(getDirectoryCompanies)
const transferDepartmentField = createDirectoryField(getDirectoryDepartments)

function handleClickOutside(event) {
  ;[assignUserField, assignDepartmentField, transferCompanyField, transferDepartmentField].forEach((field) => {
    if (field.containerRef.value && !field.containerRef.value.contains(event.target)) field.closeAndSync()
  })
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

const locationMap = computed(() => new Map(locations.value.map((i) => [String(getRecordId(i)), getRecordLabel(i)])))
const companyMap = computed(
  () => new Map(transferCompanyField.options.value.map((i) => [String(getRecordId(i)), getRecordLabel(i)]))
)
const departmentMap = computed(
  () => new Map(assignDepartmentField.options.value.map((i) => [String(getRecordId(i)), getRecordLabel(i)]))
)
const userMap = computed(() => new Map(assignUserField.options.value.map((i) => [String(getRecordId(i)), getRecordLabel(i)])))

function shortId(id) {
  const text = String(id)
  return text.length > 8 ? `${text.slice(0, 8)}…` : text
}

function locationName(id) {
  if (!id) return '-'
  return locationMap.value.get(String(id)) || `#${id}`
}
function companyName(id) {
  if (!id) return '-'
  return companyMap.value.get(String(id)) || `#${id}`
}
function departmentName(id) {
  if (!id) return '-'
  return departmentMap.value.get(String(id)) || `#${id}`
}
function userName(id) {
  if (!id) return '-'
  return userMap.value.get(String(id)) || shortId(id)
}

function assignmentTarget(row) {
  if (!row) return '-'
  switch (row.assignment_type) {
    case 'USER':
      return row.assigned_user_name_snapshot || userName(row.assigned_user_id)
    case 'DEPARTMENT':
      return row.assigned_department_name_snapshot || departmentName(row.assigned_department_id)
    case 'LOCATION':
      return row.assigned_location_name_snapshot || locationName(row.assigned_location_id)
    case 'SHARED_POOL':
      return 'Shared Pool'
    default:
      return '-'
  }
}

function historyDetail(entry) {
  const details = typeof entry.details === 'string' ? safeParseJson(entry.details) : entry.details
  switch (entry.event_type) {
    case 'ASSIGNED':
      if (!details) return entry.description || '-'
      return `Assigned to ${assignmentTarget(details)}${details.purpose ? ` — ${details.purpose}` : ''}`
    case 'RETURNED':
      return details?.return_condition ? `Returned in ${formatLabel(details.return_condition)} condition` : entry.description || '-'
    case 'TRANSFERRED':
      if (!details?.to) return entry.description || '-'
      return `To ${companyName(details.to.company_id)} / ${departmentName(details.to.department_id)} / ${locationName(details.to.location_id)}${details.reason ? ` — ${details.reason}` : ''}`
    case 'MAINTENANCE_STARTED':
      return details?.maintenance_type ? `Type: ${details.maintenance_type}` : entry.description || '-'
    case 'MAINTENANCE_COMPLETED':
      return details?.result ? details.result : entry.description || '-'
    case 'CREATED':
      return details?.asset_number ? `Asset number ${details.asset_number}` : entry.description || '-'
    default:
      return entry.description || '-'
  }
}

function safeParseJson(value) {
  try {
    return JSON.parse(value)
  } catch {
    return null
  }
}

const TERMINAL_ASSIGN_BLOCK = ['RETIRED', 'DISPOSED', 'VOID', 'LOST']
const canAssign = computed(
  () => !!assetDetail.value && !assetDetail.value.current_assignment_id && !TERMINAL_ASSIGN_BLOCK.includes(assetDetail.value.status)
)
const canReturn = computed(() => !!assetDetail.value?.current_assignment_id)
const canTransfer = computed(() => !!assetDetail.value)
const canMaintenance = computed(() => !!assetDetail.value && !['RETIRED', 'DISPOSED', 'VOID'].includes(assetDetail.value.status))
const canLifecycle = computed(() => !!assetDetail.value && !assetDetail.value.current_assignment_id)

const completingMaintenance = computed(
  () => maintenances.value.find((m) => m.id === completingMaintenanceId.value) || null
)

const assignForm = reactive({
  assignment_type: 'USER',
  assigned_location_id: '',
  purpose: '',
  assigned_at: '',
})

const returnForm = reactive({
  returned_at: '',
  return_condition: 'GOOD',
  return_location_id: '',
  return_note: '',
})

const transferForm = reactive({
  to_location_id: '',
  reason: '',
  notes: '',
  transfer_date: '',
})

const maintenanceForm = reactive({
  maintenance_type: '',
  vendor_id: '',
  start_date: '',
  cost: '',
  problem_description: '',
  notes: '',
})

const completeMaintenanceForm = reactive({
  completion_date: '',
  result: '',
  cost: '',
  notes: '',
})

const lifecycleForm = reactive({
  status: 'RETIRED',
  reason: '',
})

function openAction(name) {
  actionError.value = ''
  activeAction.value = name
  if (name === 'assign') {
    assignForm.assignment_type = 'USER'
    assignForm.assigned_location_id = ''
    assignForm.purpose = ''
    assignForm.assigned_at = ''
    assignUserField.reset()
    assignDepartmentField.reset()
  } else if (name === 'return') {
    returnForm.returned_at = ''
    returnForm.return_condition = assetDetail.value?.asset_condition || 'GOOD'
    returnForm.return_location_id = assetDetail.value?.current_location_id || ''
    returnForm.return_note = ''
  } else if (name === 'transfer') {
    transferForm.reason = ''
    transferForm.notes = ''
    transferForm.transfer_date = ''
    transferForm.to_location_id = assetDetail.value?.current_location_id || ''
    transferCompanyField.reset()
    transferDepartmentField.reset()
    if (assetDetail.value?.company_id) transferCompanyField.setSelected(assetDetail.value.company_id)
    if (assetDetail.value?.managing_department_id) transferDepartmentField.setSelected(assetDetail.value.managing_department_id)
  } else if (name === 'maintenance') {
    maintenanceForm.maintenance_type = ''
    maintenanceForm.vendor_id = ''
    maintenanceForm.start_date = ''
    maintenanceForm.cost = ''
    maintenanceForm.problem_description = ''
    maintenanceForm.notes = ''
  } else if (name === 'lifecycle') {
    lifecycleForm.status = 'RETIRED'
    lifecycleForm.reason = ''
  }
}

function openCompleteMaintenance(row) {
  actionError.value = ''
  activeAction.value = 'complete-maintenance'
  completingMaintenanceId.value = row.id
  completeMaintenanceForm.completion_date = ''
  completeMaintenanceForm.result = ''
  completeMaintenanceForm.cost = row.cost ?? ''
  completeMaintenanceForm.notes = ''
}

function closeAction() {
  activeAction.value = ''
  actionError.value = ''
  completingMaintenanceId.value = null
}

async function afterMutate() {
  closeAction()
  await loadAll()
  emit('changed')
}

async function submitAssign() {
  actionError.value = ''
  if (assignForm.assignment_type === 'USER' && !assignUserField.selectedId.value) {
    actionError.value = 'User is required.'
    return
  }
  if (assignForm.assignment_type === 'DEPARTMENT' && !assignDepartmentField.selectedId.value) {
    actionError.value = 'Department is required.'
    return
  }
  if (assignForm.assignment_type === 'LOCATION' && !assignForm.assigned_location_id) {
    actionError.value = 'Location is required.'
    return
  }
  isSubmittingAction.value = true
  try {
    const payload = { assignment_type: assignForm.assignment_type }
    if (assignForm.assignment_type === 'USER') {
      payload.assigned_user_id = assignUserField.selectedId.value
      if (assignUserField.selected.value) payload.assigned_user_name_snapshot = getRecordLabel(assignUserField.selected.value)
    }
    if (assignForm.assignment_type === 'DEPARTMENT') {
      payload.assigned_department_id = assignDepartmentField.selectedId.value
      if (assignDepartmentField.selected.value)
        payload.assigned_department_name_snapshot = getRecordLabel(assignDepartmentField.selected.value)
    }
    if (assignForm.assignment_type === 'LOCATION') {
      payload.assigned_location_id = assignForm.assigned_location_id
      const location = locations.value.find((item) => String(getRecordId(item)) === String(assignForm.assigned_location_id))
      if (location) payload.assigned_location_name_snapshot = getRecordLabel(location)
    }
    if (assignForm.purpose.trim()) payload.purpose = assignForm.purpose.trim()
    if (assignForm.assigned_at) payload.assigned_at = assignForm.assigned_at
    await assignAsset(assetDetail.value.id, payload)
    await afterMutate()
  } catch (err) {
    actionError.value = err?.response?.data?.message || 'Failed to assign asset.'
  } finally {
    isSubmittingAction.value = false
  }
}

async function submitReturn() {
  actionError.value = ''
  isSubmittingAction.value = true
  try {
    const payload = {}
    if (returnForm.returned_at) payload.returned_at = returnForm.returned_at
    if (returnForm.return_condition) payload.return_condition = returnForm.return_condition
    if (returnForm.return_location_id) payload.return_location_id = returnForm.return_location_id
    if (returnForm.return_note.trim()) payload.return_note = returnForm.return_note.trim()
    await returnAsset(assetDetail.value.id, payload)
    await afterMutate()
  } catch (err) {
    actionError.value = err?.response?.data?.message || 'Failed to return asset.'
  } finally {
    isSubmittingAction.value = false
  }
}

async function submitTransfer() {
  actionError.value = ''
  isSubmittingAction.value = true
  try {
    const payload = {}
    if (transferCompanyField.selectedId.value) payload.to_company_id = transferCompanyField.selectedId.value
    if (transferDepartmentField.selectedId.value) payload.to_managing_department_id = transferDepartmentField.selectedId.value
    if (transferForm.to_location_id) payload.to_location_id = transferForm.to_location_id
    if (transferForm.reason.trim()) payload.reason = transferForm.reason.trim()
    if (transferForm.notes.trim()) payload.notes = transferForm.notes.trim()
    if (transferForm.transfer_date) payload.transfer_date = transferForm.transfer_date
    await transferAsset(assetDetail.value.id, payload)
    await afterMutate()
  } catch (err) {
    actionError.value = err?.response?.data?.message || 'Failed to transfer asset.'
  } finally {
    isSubmittingAction.value = false
  }
}

async function submitMaintenance() {
  actionError.value = ''
  if (!maintenanceForm.maintenance_type.trim()) {
    actionError.value = 'Maintenance type is required.'
    return
  }
  isSubmittingAction.value = true
  try {
    const payload = { maintenance_type: maintenanceForm.maintenance_type.trim() }
    if (maintenanceForm.vendor_id) payload.vendor_id = maintenanceForm.vendor_id
    if (maintenanceForm.start_date) payload.start_date = maintenanceForm.start_date
    if (maintenanceForm.cost !== '' && maintenanceForm.cost !== null) payload.cost = Number(maintenanceForm.cost)
    if (maintenanceForm.problem_description.trim()) payload.problem_description = maintenanceForm.problem_description.trim()
    if (maintenanceForm.notes.trim()) payload.notes = maintenanceForm.notes.trim()
    await createAssetMaintenance(assetDetail.value.id, payload)
    await afterMutate()
  } catch (err) {
    actionError.value = err?.response?.data?.message || 'Failed to start maintenance.'
  } finally {
    isSubmittingAction.value = false
  }
}

async function submitCompleteMaintenance() {
  actionError.value = ''
  if (!completingMaintenanceId.value) return
  isSubmittingAction.value = true
  try {
    const payload = {}
    if (completeMaintenanceForm.completion_date) payload.completion_date = completeMaintenanceForm.completion_date
    if (completeMaintenanceForm.result.trim()) payload.result = completeMaintenanceForm.result.trim()
    if (completeMaintenanceForm.cost !== '' && completeMaintenanceForm.cost !== null) payload.cost = Number(completeMaintenanceForm.cost)
    if (completeMaintenanceForm.notes.trim()) payload.notes = completeMaintenanceForm.notes.trim()
    await completeAssetMaintenance(assetDetail.value.id, completingMaintenanceId.value, payload)
    await afterMutate()
  } catch (err) {
    actionError.value = err?.response?.data?.message || 'Failed to complete maintenance.'
  } finally {
    isSubmittingAction.value = false
  }
}

async function submitLifecycle() {
  actionError.value = ''
  isSubmittingAction.value = true
  try {
    const payload = { status: lifecycleForm.status }
    if (lifecycleForm.reason.trim()) payload.reason = lifecycleForm.reason.trim()
    await updateAssetLifecycle(assetDetail.value.id, payload)
    await afterMutate()
  } catch (err) {
    actionError.value = err?.response?.data?.message || 'Failed to update asset lifecycle.'
  } finally {
    isSubmittingAction.value = false
  }
}

async function loadAll() {
  if (!props.asset?.id) return
  isLoading.value = true
  loadError.value = ''
  try {
    const res = await getAssetHistory(props.asset.id)
    const data = res?.data
    assetDetail.value = data?.asset || null
    historyEntries.value = data?.history ?? []
    assignments.value = data?.assignments ?? []
    transfers.value = data?.transfers ?? []
    maintenances.value = data?.maintenances ?? []
    externalReferences.value = data?.external_references ?? []
  } catch (err) {
    loadError.value = err?.response?.data?.message || 'Failed to load asset history.'
  } finally {
    isLoading.value = false
  }
}

async function loadLookups() {
  if (lookupsLoaded.value) return
  const [locRes, vendorRes] = await Promise.allSettled([
    getMasterData('locations', { is_active: 1 }),
    getMasterData('vendors', { is_active: 1 }),
  ])
  locations.value = locRes.status === 'fulfilled' ? locRes.value?.data ?? [] : []
  vendors.value = vendorRes.status === 'fulfilled' ? vendorRes.value?.data ?? [] : []
  assignUserField.load()
  assignDepartmentField.load()
  transferCompanyField.load()
  transferDepartmentField.load()
  lookupsLoaded.value = true
}

function close() {
  emit('close')
}

watch(
  () => props.isOpen,
  (open) => {
    if (!open) return
    assetDetail.value = props.asset
    activeTab.value = 'history'
    activeAction.value = ''
    actionError.value = ''
    loadAll()
    loadLookups()
  }
)
</script>
