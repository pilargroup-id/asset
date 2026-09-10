<template>
  <AdminLayout>
    <PageBreadcrumb :pageTitle="currentPageTitle" />
    <div class="space-y-5 sm:space-y-6">
      <ComponentCard
        title="Depreciation Policies"
        desc="Department-level templates for useful life and salvage value. Editing a policy does not change assets already configured."
      >
        <DepreciationPoliciesTable />
      </ComponentCard>

      <ComponentCard
        title="Category Default Policy"
        desc="Suggest a policy automatically when an asset in a category is configured for depreciation."
      >
        <DepreciationCategoryDefaultCard />
      </ComponentCard>
    </div>
  </AdminLayout>
</template>

<script setup>
import { ref } from 'vue'
import AdminLayout from '@/components/layout/AdminLayout.vue'
import PageBreadcrumb from '@/components/common/PageBreadcrumb.vue'
import ComponentCard from '@/components/common/ComponentCard.vue'
import DepreciationPoliciesTable from '@/components/tables/DepreciationPoliciesTable.vue'
import DepreciationCategoryDefaultCard from '@/components/pages/depreciation/DepreciationCategoryDefaultCard.vue'

const currentPageTitle = ref('Depreciation Policies')
</script>
