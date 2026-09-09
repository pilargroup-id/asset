<template>
  <div class="relative" ref="dropdownRef">
    <button
      class="flex items-center text-gray-700 dark:text-gray-400"
      @click.prevent="toggleDropdown"
    >
      <span class="relative mr-3 flex h-11 w-11 shrink-0 items-center justify-center">
        <span
          class="avatar-badge flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold text-gray-800 dark:text-white"
        >
          {{ initials }}
        </span>
        <span
          class="status-dot-online absolute -bottom-0.5 -right-0.5 h-3 w-3 rounded-full ring-2 ring-white dark:ring-gray-dark"
        ></span>
      </span>

      <span class="block mr-1 font-medium text-theme-sm">{{ displayName }}</span>

      <ChevronDownIcon :class="{ 'rotate-180': dropdownOpen }" />
    </button>

    <!-- Dropdown Start -->
    <div
      v-if="dropdownOpen"
      class="absolute right-0 mt-[17px] flex w-[260px] flex-col rounded-2xl border border-gray-200 bg-white p-3 shadow-theme-lg dark:border-gray-800 dark:bg-gray-dark"
    >
      <div>
        <span class="block font-medium text-gray-700 text-theme-sm dark:text-gray-400">
          {{ displayName }}
        </span>
        <span class="mt-0.5 block text-theme-xs text-gray-500 dark:text-gray-400">
          {{ displayEmail }}
        </span>
      </div>

      <router-link
        to="/signin"
        @click="signOut"
        class="flex items-center gap-3 px-3 py-2 mt-3 font-medium text-gray-700 rounded-lg group text-theme-sm hover:bg-gray-100 hover:text-gray-700 dark:text-gray-400 dark:hover:bg-white/5 dark:hover:text-gray-300"
      >
        <LogoutIcon
          class="text-gray-500 group-hover:text-gray-700 dark:group-hover:text-gray-300"
        />
        Back Pilargroup
      </router-link>
    </div>
    <!-- Dropdown End -->
  </div>
</template>

<script setup>
import { ChevronDownIcon, LogoutIcon } from '@/icons'
import { RouterLink } from 'vue-router'
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { authState, fetchCurrentUser, getDisplayName, getDisplayEmail, logout } from '@/service/auth'

const dropdownOpen = ref(false)
const dropdownRef = ref(null)

const displayName = computed(() => getDisplayName(authState.user))
const displayEmail = computed(() => getDisplayEmail(authState.user))
const initials = computed(() => {
  const parts = displayName.value.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[1][0]).toUpperCase()
})

const toggleDropdown = () => {
  dropdownOpen.value = !dropdownOpen.value
}

const closeDropdown = () => {
  dropdownOpen.value = false
}

const signOut = () => {
  logout()
  closeDropdown()
}

const handleClickOutside = (event) => {
  if (dropdownRef.value && !dropdownRef.value.contains(event.target)) {
    closeDropdown()
  }
}

onMounted(() => {
  document.addEventListener('click', handleClickOutside)

  if (!authState.user) {
    fetchCurrentUser().catch(() => {})
  }
})

onUnmounted(() => {
  document.removeEventListener('click', handleClickOutside)
})
</script>
