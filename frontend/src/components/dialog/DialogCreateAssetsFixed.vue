<template>
  <Modal v-if="isOpen" full-screen-backdrop @close="close">
    <template #body>
      <div
        class="no-scrollbar relative max-h-[90vh] w-full max-w-[960px] overflow-y-auto rounded-3xl bg-white p-6 dark:bg-gray-900 lg:p-8"
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
          {{ isEditMode ? 'Edit Fixed Asset' : 'Create Fixed Asset' }}
        </h4>
        <p class="mb-6 text-sm text-gray-500 dark:text-gray-400">
          <template v-if="isEditMode">
            Update asset master data. Department, company, location, status, and asset number cannot be changed here.
          </template>
          <template v-else> Register a new serialized asset. Fields marked with * are required. </template>
        </p>

        <form class="flex flex-col gap-4" @submit.prevent="submit">
          <div class="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Asset Name *
              </label>
              <input
                v-model="form.asset_name"
                type="text"
                placeholder="e.g. Dell Latitude 5420 Laptop"
                required
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Category *
              </label>

              <div ref="categoryDropdownRef" class="relative">
                <div class="relative">
                  <input
                    v-model="categoryQuery"
                    type="text"
                    placeholder="Search or create category"
                    autocomplete="off"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    @focus="isCategoryDropdownOpen = true"
                    @keydown.enter.prevent="handleCategoryEnter"
                    @keydown.esc="isCategoryDropdownOpen = false"
                  />
                  <ChevronDownIcon
                    class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700 transition-transform dark:text-gray-400"
                    :class="{ 'rotate-180': isCategoryDropdownOpen }"
                  />
                </div>

                <transition
                  enter-active-class="transition duration-100 ease-out"
                  enter-from-class="transform scale-95 opacity-0"
                  enter-to-class="transform scale-100 opacity-100"
                  leave-active-class="transition duration-75 ease-in"
                  leave-from-class="transform scale-100 opacity-100"
                  leave-to-class="transform scale-95 opacity-0"
                >
                  <div
                    v-if="isCategoryDropdownOpen"
                    class="absolute z-10 mt-1 w-full rounded-lg bg-white shadow-lg dark:bg-gray-900"
                  >
                    <ul
                      class="custom-scrollbar max-h-60 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800"
                      role="listbox"
                    >
                      <li
                        v-for="item in filteredCategoryOptions"
                        :key="item.id"
                        @click="selectCategory(item)"
                        class="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                        :class="String(form.category_id) === String(item.id) ? 'bg-gray-50 text-gray-800 dark:bg-white/[0.03] dark:text-white/90' : 'text-gray-500 dark:text-gray-400'"
                      >
                        {{ item.name }}
                      </li>
                      <li
                        v-if="showCreateCategoryOption"
                        @click="createCategoryFromQuery"
                        class="cursor-pointer rounded-b-lg px-3 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-white/[0.03]"
                      >
                        {{ isCreatingCategory ? 'Creating...' : `+ Create "${categoryQuery.trim()}"` }}
                      </li>
                      <li
                        v-else-if="!filteredCategoryOptions.length && categoryQuery.trim()"
                        class="px-3 py-2 text-sm text-gray-400 dark:text-gray-500"
                      >
                        No matches
                      </li>
                    </ul>
                  </div>
                </transition>
              </div>
              <p v-if="categoryError" class="mt-1.5 text-xs text-error-600 dark:text-error-500">
                {{ categoryError }}
              </p>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Status
              </label>
              <SelectField v-if="!isEditMode" v-model="form.status">
                <option v-for="option in STATUS_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </SelectField>
              <input
                v-else
                type="text"
                disabled
                :value="formatLabel(form.status)"
                class="dark:bg-dark-900 h-11 w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-500 shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-400"
              />
            </div>

            <div :ref="(el) => (department.containerRef.value = el)" class="relative">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Managing Department *
              </label>
              <input
                v-model="department.query.value"
                type="text"
                autocomplete="off"
                placeholder="Search department..."
                required
                :disabled="isEditMode"
                @focus="department.open()"
                @click="department.open()"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 dark:disabled:bg-white/[0.03] dark:disabled:text-gray-400"
              />
              <div
                v-if="department.isOpen.value && !isEditMode"
                class="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <ul class="custom-scrollbar max-h-56 overflow-y-auto py-1" role="listbox">
                  <li v-if="department.isLoading.value" class="px-3 py-2 text-sm text-gray-400">Loading...</li>
                  <li v-else-if="!department.filtered.value.length" class="px-3 py-2 text-sm text-gray-400">
                    No departments found.
                  </li>
                  <li
                    v-for="item in department.filtered.value"
                    :key="getRecordId(item)"
                    @click="department.select(item)"
                    role="option"
                    class="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
                    :class="{ 'bg-gray-50 dark:bg-white/[0.03]': String(getRecordId(item)) === String(department.selectedId.value) }"
                  >
                    <span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ getRecordLabel(item) }}</span>
                  </li>
                </ul>
              </div>
            </div>
            <div :ref="(el) => (company.containerRef.value = el)" class="relative">
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Company *
              </label>
              <input
                v-model="company.query.value"
                type="text"
                autocomplete="off"
                placeholder="Search company..."
                required
                :disabled="isEditMode"
                @focus="company.open()"
                @click="company.open()"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 dark:disabled:bg-white/[0.03] dark:disabled:text-gray-400"
              />
              <div
                v-if="company.isOpen.value && !isEditMode"
                class="absolute z-30 mt-1 w-full rounded-lg border border-gray-200 bg-white shadow-lg dark:border-gray-800 dark:bg-gray-900"
              >
                <ul class="custom-scrollbar max-h-56 overflow-y-auto py-1" role="listbox">
                  <li v-if="company.isLoading.value" class="px-3 py-2 text-sm text-gray-400">Loading...</li>
                  <li v-else-if="!company.filtered.value.length" class="px-3 py-2 text-sm text-gray-400">
                    No companies found.
                  </li>
                  <li
                    v-for="item in company.filtered.value"
                    :key="getRecordId(item)"
                    @click="company.select(item)"
                    role="option"
                    class="cursor-pointer px-3 py-2 hover:bg-gray-100 dark:hover:bg-white/[0.03]"
                    :class="{ 'bg-gray-50 dark:bg-white/[0.03]': String(getRecordId(item)) === String(company.selectedId.value) }"
                  >
                    <span class="block text-sm font-medium text-gray-800 dark:text-white/90">{{ getRecordLabel(item) }}</span>
                  </li>
                </ul>
              </div>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Brand
              </label>

              <div ref="brandDropdownRef" class="relative">
                <div class="relative">
                  <input
                    v-model="brandQuery"
                    type="text"
                    placeholder="Search or create brand"
                    autocomplete="off"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    @focus="isBrandDropdownOpen = true"
                    @keydown.enter.prevent="handleBrandEnter"
                    @keydown.esc="isBrandDropdownOpen = false"
                  />
                  <ChevronDownIcon
                    class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700 transition-transform dark:text-gray-400"
                    :class="{ 'rotate-180': isBrandDropdownOpen }"
                  />
                </div>

                <transition
                  enter-active-class="transition duration-100 ease-out"
                  enter-from-class="transform scale-95 opacity-0"
                  enter-to-class="transform scale-100 opacity-100"
                  leave-active-class="transition duration-75 ease-in"
                  leave-from-class="transform scale-100 opacity-100"
                  leave-to-class="transform scale-95 opacity-0"
                >
                  <div
                    v-if="isBrandDropdownOpen"
                    class="absolute z-10 mt-1 w-full rounded-lg bg-white shadow-lg dark:bg-gray-900"
                  >
                    <ul
                      class="custom-scrollbar max-h-60 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800"
                      role="listbox"
                    >
                      <li
                        v-for="item in filteredBrandOptions"
                        :key="item.id"
                        @click="selectBrand(item)"
                        class="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                        :class="String(form.brand_id) === String(item.id) ? 'bg-gray-50 text-gray-800 dark:bg-white/[0.03] dark:text-white/90' : 'text-gray-500 dark:text-gray-400'"
                      >
                        {{ item.name }}
                      </li>
                      <li
                        v-if="showCreateBrandOption"
                        @click="createBrandFromQuery"
                        class="cursor-pointer rounded-b-lg px-3 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-white/[0.03]"
                      >
                        {{ isCreatingBrand ? 'Creating...' : `+ Create "${brandQuery.trim()}"` }}
                      </li>
                      <li
                        v-else-if="!filteredBrandOptions.length && brandQuery.trim()"
                        class="px-3 py-2 text-sm text-gray-400 dark:text-gray-500"
                      >
                        No matches
                      </li>
                    </ul>
                  </div>
                </transition>
              </div>
              <p v-if="brandError" class="mt-1.5 text-xs text-error-600 dark:text-error-500">
                {{ brandError }}
              </p>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Model
              </label>
              <SelectField v-model="form.model_id" placeholder="Select model">
                <option v-for="item in filteredModels" :key="item.id" :value="item.id">{{ item.name }}</option>
              </SelectField>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Serial Number
              </label>
              <input
                v-model="form.serial_number"
                type="text"
                placeholder="Serial number"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Current Location
              </label>
              <SelectField v-if="!isEditMode" v-model="form.current_location_id" placeholder="Select location">
                <option v-for="item in locations" :key="item.id" :value="item.id">{{ item.name }}</option>
              </SelectField>
              <input
                v-else
                type="text"
                disabled
                :value="props.asset?.current_location_name || '-'"
                class="dark:bg-dark-900 h-11 w-full cursor-not-allowed rounded-lg border border-gray-300 bg-gray-100 px-4 py-2.5 text-sm text-gray-500 shadow-theme-xs dark:border-gray-700 dark:bg-white/[0.03] dark:text-gray-400"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Condition
              </label>
              <SelectField v-model="form.asset_condition">
                <option v-for="option in CONDITION_OPTIONS" :key="option.value" :value="option.value">
                  {{ option.label }}
                </option>
              </SelectField>
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Vendor
              </label>

              <div ref="vendorDropdownRef" class="relative">
                <div class="relative">
                  <input
                    v-model="vendorQuery"
                    type="text"
                    placeholder="Search or create vendor"
                    autocomplete="off"
                    class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 pr-11 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
                    @focus="isVendorDropdownOpen = true"
                    @keydown.enter.prevent="handleVendorEnter"
                    @keydown.esc="isVendorDropdownOpen = false"
                  />
                  <ChevronDownIcon
                    class="pointer-events-none absolute right-4 top-1/2 h-4 w-4 -translate-y-1/2 text-gray-700 transition-transform dark:text-gray-400"
                    :class="{ 'rotate-180': isVendorDropdownOpen }"
                  />
                </div>

                <transition
                  enter-active-class="transition duration-100 ease-out"
                  enter-from-class="transform scale-95 opacity-0"
                  enter-to-class="transform scale-100 opacity-100"
                  leave-active-class="transition duration-75 ease-in"
                  leave-from-class="transform scale-100 opacity-100"
                  leave-to-class="transform scale-95 opacity-0"
                >
                  <div
                    v-if="isVendorDropdownOpen"
                    class="absolute z-10 mt-1 w-full rounded-lg bg-white shadow-lg dark:bg-gray-900"
                  >
                    <ul
                      class="custom-scrollbar max-h-60 divide-y divide-gray-100 overflow-y-auto dark:divide-gray-800"
                      role="listbox"
                    >
                      <li
                        v-for="item in filteredVendorOptions"
                        :key="item.id"
                        @click="selectVendor(item)"
                        class="cursor-pointer px-3 py-2 text-sm hover:bg-gray-50 dark:hover:bg-white/[0.03]"
                        :class="String(form.vendor_id) === String(item.id) ? 'bg-gray-50 text-gray-800 dark:bg-white/[0.03] dark:text-white/90' : 'text-gray-500 dark:text-gray-400'"
                      >
                        {{ item.name }}
                      </li>
                      <li
                        v-if="showCreateVendorOption"
                        @click="createVendorFromQuery"
                        class="cursor-pointer rounded-b-lg px-3 py-2 text-sm font-medium text-brand-500 hover:bg-brand-50 dark:hover:bg-white/[0.03]"
                      >
                        {{ isCreatingVendor ? 'Creating...' : `+ Create "${vendorQuery.trim()}"` }}
                      </li>
                      <li
                        v-else-if="!filteredVendorOptions.length && vendorQuery.trim()"
                        class="px-3 py-2 text-sm text-gray-400 dark:text-gray-500"
                      >
                        No matches
                      </li>
                    </ul>
                  </div>
                </transition>
              </div>
              <p v-if="vendorError" class="mt-1.5 text-xs text-error-600 dark:text-error-500">
                {{ vendorError }}
              </p>
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Purchase Date
              </label>
              <input
                v-model="form.purchase_date"
                type="date"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Purchase Cost
              </label>
              <input
                v-model="form.purchase_cost"
                type="number"
                min="0"
                step="0.01"
                placeholder="0"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
              />
            </div>

            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Warranty Until
              </label>
              <input
                v-model="form.warranty_until"
                type="date"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:focus:border-brand-800"
              />
            </div>
            <div>
              <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
                Asset Number
              </label>
              <input
                v-model="form.asset_number"
                type="text"
                placeholder="Auto-generated if left blank"
                :disabled="isEditMode"
                class="dark:bg-dark-900 h-11 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 disabled:cursor-not-allowed disabled:bg-gray-100 disabled:text-gray-500 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800 dark:disabled:bg-white/[0.03] dark:disabled:text-gray-400"
              />
            </div>
          </div>

          <div>
            <label class="mb-1.5 block text-sm font-medium text-gray-700 dark:text-gray-400">
              Notes
            </label>
            <textarea
              v-model="form.notes"
              rows="2"
              placeholder="Additional notes..."
              class="dark:bg-dark-900 w-full rounded-lg border border-gray-300 bg-transparent px-4 py-2.5 text-sm text-gray-800 shadow-theme-xs placeholder:text-gray-400 focus:border-brand-300 focus:outline-hidden focus:ring-3 focus:ring-brand-500/10 dark:border-gray-700 dark:bg-gray-900 dark:text-white/90 dark:placeholder:text-white/30 dark:focus:border-brand-800"
            />
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
import { ref, reactive, computed, watch, onMounted, onBeforeUnmount } from 'vue'
import Modal from '@/components/ui/Modal.vue'
import SelectField from '@/components/forms/FormElements/SelectField.vue'
import { ChevronDownIcon } from '@/icons'
import {
  getMasterData,
  createMasterData,
  createAsset,
  updateAsset,
  getDirectoryDepartments,
  getDirectoryCompanies,
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

const emit = defineEmits(['close', 'created', 'updated'])

const isEditMode = computed(() => !!props.asset)

const STATUS_OPTIONS = [
  { value: 'REGISTERED', label: 'Registered' },
  { value: 'AVAILABLE', label: 'Available' },
]

const CONDITION_OPTIONS = [
  { value: 'NEW', label: 'New' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
  { value: 'DAMAGED', label: 'Damaged' },
]

const isSubmitting = ref(false)
const errorMessage = ref('')

const categories = ref([])
const brands = ref([])
const models = ref([])
const locations = ref([])
const vendors = ref([])

const filteredModels = computed(() =>
  form.brand_id ? models.value.filter((m) => String(m.brand_id) === String(form.brand_id)) : models.value
)

function slugifyCode(value) {
  const base = (value || '')
    .toString()
    .trim()
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 30)
  return base || `CODE-${Date.now().toString(36).toUpperCase()}`
}

const categoryQuery = ref('')
const isCategoryDropdownOpen = ref(false)
const categoryDropdownRef = ref(null)
const isCreatingCategory = ref(false)
const categoryError = ref('')

const selectedCategoryLabel = computed(() => {
  const item = categories.value.find((c) => String(c.id) === String(form.category_id))
  return item ? item.name : ''
})

const filteredCategoryOptions = computed(() => {
  const q = categoryQuery.value.trim().toLowerCase()
  if (!q) return categories.value
  return categories.value.filter((item) =>
    [item.name, item.code].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
  )
})

const showCreateCategoryOption = computed(() => {
  const q = categoryQuery.value.trim()
  if (!q) return false
  return !categories.value.some((item) => item.name.toLowerCase() === q.toLowerCase())
})

watch(selectedCategoryLabel, (label) => {
  if (!isCategoryDropdownOpen.value) categoryQuery.value = label
})

watch(isCategoryDropdownOpen, (open) => {
  if (!open) categoryQuery.value = selectedCategoryLabel.value
})

function selectCategory(item) {
  form.category_id = item.id
  categoryQuery.value = item.name
  isCategoryDropdownOpen.value = false
}

function handleCategoryEnter() {
  if (showCreateCategoryOption.value) {
    createCategoryFromQuery()
  } else if (filteredCategoryOptions.value.length === 1) {
    selectCategory(filteredCategoryOptions.value[0])
  }
}

async function createCategoryFromQuery() {
  const name = categoryQuery.value.trim()
  if (!name) return

  isCreatingCategory.value = true
  categoryError.value = ''
  try {
    const data = await createMasterData('categories', {
      code: slugifyCode(name),
      name,
      tracking_type: 'SERIALIZED_ASSET',
      is_active: true,
    })
    const newCategory = data?.data
    if (newCategory) {
      categories.value = [...categories.value, newCategory]
      form.category_id = newCategory.id
      categoryQuery.value = newCategory.name
    }
    isCategoryDropdownOpen.value = false
  } catch (err) {
    categoryError.value = err?.response?.data?.message || 'Failed to create category.'
  } finally {
    isCreatingCategory.value = false
  }
}

const brandQuery = ref('')
const isBrandDropdownOpen = ref(false)
const brandDropdownRef = ref(null)
const isCreatingBrand = ref(false)
const brandError = ref('')

const selectedBrandLabel = computed(() => {
  const item = brands.value.find((b) => String(b.id) === String(form.brand_id))
  return item ? item.name : ''
})

const filteredBrandOptions = computed(() => {
  const q = brandQuery.value.trim().toLowerCase()
  if (!q) return brands.value
  return brands.value.filter((item) =>
    [item.name, item.code].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
  )
})

const showCreateBrandOption = computed(() => {
  const q = brandQuery.value.trim()
  if (!q) return false
  return !brands.value.some((item) => item.name.toLowerCase() === q.toLowerCase())
})

watch(selectedBrandLabel, (label) => {
  if (!isBrandDropdownOpen.value) brandQuery.value = label
})

watch(isBrandDropdownOpen, (open) => {
  if (!open) brandQuery.value = selectedBrandLabel.value
})

function selectBrand(item) {
  form.brand_id = item.id
  brandQuery.value = item.name
  isBrandDropdownOpen.value = false
}

function handleBrandEnter() {
  if (showCreateBrandOption.value) {
    createBrandFromQuery()
  } else if (filteredBrandOptions.value.length === 1) {
    selectBrand(filteredBrandOptions.value[0])
  }
}

async function createBrandFromQuery() {
  const name = brandQuery.value.trim()
  if (!name) return

  isCreatingBrand.value = true
  brandError.value = ''
  try {
    const data = await createMasterData('brands', {
      name,
      is_active: true,
    })
    const newBrand = data?.data
    if (newBrand) {
      brands.value = [...brands.value, newBrand]
      form.brand_id = newBrand.id
      brandQuery.value = newBrand.name
    }
    isBrandDropdownOpen.value = false
  } catch (err) {
    brandError.value = err?.response?.data?.message || 'Failed to create brand.'
  } finally {
    isCreatingBrand.value = false
  }
}

const vendorQuery = ref('')
const isVendorDropdownOpen = ref(false)
const vendorDropdownRef = ref(null)
const isCreatingVendor = ref(false)
const vendorError = ref('')

const selectedVendorLabel = computed(() => {
  const item = vendors.value.find((v) => String(v.id) === String(form.vendor_id))
  return item ? item.name : ''
})

const filteredVendorOptions = computed(() => {
  const q = vendorQuery.value.trim().toLowerCase()
  if (!q) return vendors.value
  return vendors.value.filter((item) =>
    [item.name, item.code].filter(Boolean).some((v) => String(v).toLowerCase().includes(q))
  )
})

const showCreateVendorOption = computed(() => {
  const q = vendorQuery.value.trim()
  if (!q) return false
  return !vendors.value.some((item) => item.name.toLowerCase() === q.toLowerCase())
})

watch(selectedVendorLabel, (label) => {
  if (!isVendorDropdownOpen.value) vendorQuery.value = label
})

watch(isVendorDropdownOpen, (open) => {
  if (!open) vendorQuery.value = selectedVendorLabel.value
})

function selectVendor(item) {
  form.vendor_id = item.id
  vendorQuery.value = item.name
  isVendorDropdownOpen.value = false
}

function handleVendorEnter() {
  if (showCreateVendorOption.value) {
    createVendorFromQuery()
  } else if (filteredVendorOptions.value.length === 1) {
    selectVendor(filteredVendorOptions.value[0])
  }
}

async function createVendorFromQuery() {
  const name = vendorQuery.value.trim()
  if (!name) return

  isCreatingVendor.value = true
  vendorError.value = ''
  try {
    const data = await createMasterData('vendors', {
      name,
      is_active: true,
    })
    const newVendor = data?.data
    if (newVendor) {
      vendors.value = [...vendors.value, newVendor]
      form.vendor_id = newVendor.id
      vendorQuery.value = newVendor.name
    }
    isVendorDropdownOpen.value = false
  } catch (err) {
    vendorError.value = err?.response?.data?.message || 'Failed to create vendor.'
  } finally {
    isCreatingVendor.value = false
  }
}

const form = reactive({
  asset_name: '',
  category_id: '',
  status: 'REGISTERED',
  brand_id: '',
  model_id: '',
  serial_number: '',
  current_location_id: '',
  asset_condition: 'GOOD',
  vendor_id: '',
  purchase_date: '',
  purchase_cost: '',
  warranty_until: '',
  asset_number: '',
  notes: '',
})

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
    String(getRecordId(item))
  )
}

function normalizeDirectoryList(payload) {
  if (Array.isArray(payload)) return payload
  if (!payload || typeof payload !== 'object') return []
  const candidate = payload.items || payload.departments || payload.companies || payload.data
  return Array.isArray(candidate) ? candidate : []
}

function createDirectoryField(fetcher) {
  const options = ref([])
  const loaded = ref(false)
  const isLoading = ref(false)
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
    if (loaded.value || isLoading.value) return
    isLoading.value = true
    try {
      const res = await fetcher()
      options.value = normalizeDirectoryList(res?.data)
    } catch {
      options.value = []
    } finally {
      isLoading.value = false
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
    loaded.value = false
    options.value = []
  }

  return { options, filtered, selected, selectedId, query, isOpen, isLoading, containerRef, load, open, select, setSelected, closeAndSync, reset }
}

const department = createDirectoryField(getDirectoryDepartments)
const company = createDirectoryField(getDirectoryCompanies)

function handleClickOutside(event) {
  if (department.containerRef.value && !department.containerRef.value.contains(event.target)) {
    department.closeAndSync()
  }
  if (company.containerRef.value && !company.containerRef.value.contains(event.target)) {
    company.closeAndSync()
  }
  if (categoryDropdownRef.value && !categoryDropdownRef.value.contains(event.target)) {
    isCategoryDropdownOpen.value = false
  }
  if (brandDropdownRef.value && !brandDropdownRef.value.contains(event.target)) {
    isBrandDropdownOpen.value = false
  }
  if (vendorDropdownRef.value && !vendorDropdownRef.value.contains(event.target)) {
    isVendorDropdownOpen.value = false
  }
}

onMounted(() => document.addEventListener('click', handleClickOutside))
onBeforeUnmount(() => document.removeEventListener('click', handleClickOutside))

async function loadMasterData() {
  const [categoryRes, brandRes, modelRes, locationRes, vendorRes] = await Promise.allSettled([
    getMasterData('categories', { tracking_type: 'SERIALIZED_ASSET', is_active: 1 }),
    getMasterData('brands', { is_active: 1 }),
    getMasterData('models', { is_active: 1 }),
    getMasterData('locations', { is_active: 1 }),
    getMasterData('vendors', { is_active: 1 }),
  ])
  categories.value = categoryRes.status === 'fulfilled' ? categoryRes.value?.data ?? [] : []
  brands.value = brandRes.status === 'fulfilled' ? brandRes.value?.data ?? [] : []
  models.value = modelRes.status === 'fulfilled' ? modelRes.value?.data ?? [] : []
  locations.value = locationRes.status === 'fulfilled' ? locationRes.value?.data ?? [] : []
  vendors.value = vendorRes.status === 'fulfilled' ? vendorRes.value?.data ?? [] : []
}

function formatLabel(value) {
  if (!value) return '-'
  return value.charAt(0) + value.slice(1).toLowerCase()
}

function toDateInputValue(value) {
  if (!value) return ''
  return String(value).slice(0, 10)
}

function populateFormFromAsset(asset) {
  form.asset_name = asset.asset_name || ''
  form.category_id = asset.category_id ?? ''
  form.status = asset.status || ''
  form.brand_id = asset.brand_id ?? ''
  form.model_id = asset.model_id ?? ''
  form.serial_number = asset.serial_number || ''
  form.current_location_id = asset.current_location_id ?? ''
  form.asset_condition = asset.asset_condition || 'GOOD'
  form.vendor_id = asset.vendor_id ?? ''
  form.purchase_date = toDateInputValue(asset.purchase_date)
  form.purchase_cost = asset.purchase_cost ?? ''
  form.warranty_until = toDateInputValue(asset.warranty_until)
  form.asset_number = asset.asset_number || ''
  form.notes = asset.notes || ''
  department.setSelected(asset.managing_department_id)
  company.setSelected(asset.company_id)
}

function resetForm() {
  form.asset_name = ''
  form.category_id = ''
  form.status = 'REGISTERED'
  form.brand_id = ''
  form.model_id = ''
  form.serial_number = ''
  form.current_location_id = ''
  form.asset_condition = 'GOOD'
  form.vendor_id = ''
  form.purchase_date = ''
  form.purchase_cost = ''
  form.warranty_until = ''
  form.asset_number = ''
  form.notes = ''
  errorMessage.value = ''
  department.reset()
  company.reset()
  categoryQuery.value = ''
  categoryError.value = ''
  isCategoryDropdownOpen.value = false
  brandQuery.value = ''
  brandError.value = ''
  isBrandDropdownOpen.value = false
  vendorQuery.value = ''
  vendorError.value = ''
  isVendorDropdownOpen.value = false
}

watch(
  () => props.isOpen,
  (open) => {
    if (open) {
      loadMasterData()
      if (isEditMode.value) populateFormFromAsset(props.asset)
    } else {
      resetForm()
    }
  }
)

function close() {
  emit('close')
}

function buildEditablePayload() {
  const payload = {
    asset_name: form.asset_name.trim(),
    category_id: form.category_id,
  }
  if (form.brand_id) payload.brand_id = form.brand_id
  if (form.model_id) payload.model_id = form.model_id
  if (form.serial_number.trim()) payload.serial_number = form.serial_number.trim()
  if (form.asset_condition) payload.asset_condition = form.asset_condition
  if (form.purchase_date) payload.purchase_date = form.purchase_date
  if (form.purchase_cost !== '' && form.purchase_cost !== null) payload.purchase_cost = Number(form.purchase_cost)
  if (form.vendor_id) payload.vendor_id = form.vendor_id
  if (form.warranty_until) payload.warranty_until = form.warranty_until
  if (form.notes.trim()) payload.notes = form.notes.trim()
  return payload
}

async function submit() {
  errorMessage.value = ''
  if (!form.asset_name.trim()) {
    errorMessage.value = 'Asset name is required.'
    return
  }
  if (!form.category_id) {
    errorMessage.value = 'Category is required.'
    return
  }
  if (!isEditMode.value) {
    if (!department.selectedId.value) {
      errorMessage.value = 'Managing department is required.'
      return
    }
    if (!company.selectedId.value) {
      errorMessage.value = 'Company is required.'
      return
    }
  }

  isSubmitting.value = true
  try {
    if (isEditMode.value) {
      const data = await updateAsset(props.asset.id, buildEditablePayload())
      emit('updated', data?.data)
    } else {
      const payload = {
        ...buildEditablePayload(),
        managing_department_id: department.selectedId.value,
        company_id: company.selectedId.value,
      }
      if (form.asset_number.trim()) payload.asset_number = form.asset_number.trim()
      if (form.current_location_id) payload.current_location_id = form.current_location_id
      if (form.status) payload.status = form.status

      const data = await createAsset(payload)
      emit('created', data?.data)
    }
    close()
  } catch (err) {
    errorMessage.value = err?.response?.data?.message || `Failed to ${isEditMode.value ? 'update' : 'create'} asset.`
  } finally {
    isSubmitting.value = false
  }
}
</script>
