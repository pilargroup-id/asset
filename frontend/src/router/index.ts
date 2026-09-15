import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  scrollBehavior(to, from, savedPosition) {
    return savedPosition || { left: 0, top: 0 }
  },
  routes: [
    {
      path: '/',
      name: 'Dashboard',
      component: () => import('../components/pages/dashboard/DashboardPage.vue'),
      meta: {
        title: 'Dashboard',
      },
    },
    {
      path: '/calendar',
      name: 'Calendar',
      component: () => import('../views/Others/Calendar.vue'),
      meta: {
        title: 'Calendar',
      },
    },
    {
      path: '/profile',
      name: 'Profile',
      component: () => import('../views/Others/UserProfile.vue'),
      meta: {
        title: 'Profile',
      },
    },
    {
      path: '/asset/fixed',
      name: 'Asset Fixed',
      component: () => import('../components/pages/assets/AssetFixed.vue'),
      meta: {
        title: 'Asset Fixed',
      },
    },
    {
      path: '/asset/consumeable',
      name: 'Asset Consumeable',
      component: () => import('../components/pages/assets/AssetConsumeable.vue'),
      meta: {
        title: 'Asset Consumeable',
      },
    },
    {
      path: '/master/categories',
      name: 'Asset Categories',
      component: () => import('../components/pages/master/AssetCategoriesPage.vue'),
      meta: {
        title: 'Asset Categories',
      },
    },
    {
      path: '/master/brands',
      name: 'Brands',
      component: () => import('../components/pages/master/BrandsPage.vue'),
      meta: {
        title: 'Brands',
      },
    },
    {
      path: '/master/locations',
      name: 'Locations',
      component: () => import('../components/pages/master/LocationsPage.vue'),
      meta: {
        title: 'Locations',
      },
    },
    {
      path: '/master/uoms',
      name: 'Units of Measure',
      component: () => import('../components/pages/master/UomsPage.vue'),
      meta: {
        title: 'Units of Measure',
      },
    },
    {
      path: '/master/numbering',
      name: 'Numbering',
      component: () => import('../components/pages/master/NumberingPage.vue'),
      meta: {
        title: 'Numbering',
      },
    },
    {
      path: '/depreciation/policies',
      name: 'Depreciation Policies',
      component: () => import('../components/pages/depreciation/DepreciationPoliciesPage.vue'),
      meta: {
        title: 'Depreciation Policies',
      },
    },
    {
      path: '/data/import',
      name: 'Import',
      component: () => import('../components/pages/data/ImportPage.vue'),
      meta: {
        title: 'Import',
      },
    },
    {
      path: '/data/export',
      name: 'Export',
      component: () => import('../components/pages/data/ExportPage.vue'),
      meta: {
        title: 'Export & Reports',
      },
    },
    {
      path: '/permissions/list',
      name: 'Permission List',
      component: () => import('../components/pages/permissions/PermissionListPage.vue'),
      meta: {
        title: 'Permission List',
      },
    },
    {
      path: '/permissions/assignments',
      name: 'Permission Assignments',
      component: () => import('../components/pages/permissions/PermissionAssignments.vue'),
      meta: {
        title: 'Permission Assignments',
      },
    },
    {
      path: '/form-elements',
      name: 'Form Elements',
      component: () => import('../views/Forms/FormElements.vue'),
      meta: {
        title: 'Form Elements',
      },
    },
    {
      path: '/basic-tables',
      name: 'Basic Tables',
      component: () => import('../views/Tables/BasicTables.vue'),
      meta: {
        title: 'Basic Tables',
      },
    },
    {
      path: '/line-chart',
      name: 'Line Chart',
      component: () => import('../views/Chart/LineChart/LineChart.vue'),
    },
    {
      path: '/bar-chart',
      name: 'Bar Chart',
      component: () => import('../views/Chart/BarChart/BarChart.vue'),
    },
    {
      path: '/alerts',
      name: 'Alerts',
      component: () => import('../views/UiElements/Alerts.vue'),
      meta: {
        title: 'Alerts',
      },
    },
    {
      path: '/avatars',
      name: 'Avatars',
      component: () => import('../views/UiElements/Avatars.vue'),
      meta: {
        title: 'Avatars',
      },
    },
    {
      path: '/badge',
      name: 'Badge',
      component: () => import('../views/UiElements/Badges.vue'),
      meta: {
        title: 'Badge',
      },
    },

    {
      path: '/buttons',
      name: 'Buttons',
      component: () => import('../views/UiElements/Buttons.vue'),
      meta: {
        title: 'Buttons',
      },
    },

    {
      path: '/images',
      name: 'Images',
      component: () => import('../views/UiElements/Images.vue'),
      meta: {
        title: 'Images',
      },
    },
    {
      path: '/videos',
      name: 'Videos',
      component: () => import('../views/UiElements/Videos.vue'),
      meta: {
        title: 'Videos',
      },
    },
    {
      path: '/blank',
      name: 'Blank',
      component: () => import('../views/Pages/BlankPage.vue'),
      meta: {
        title: 'Blank',
      },
    },

    {
      path: '/error-404',
      name: '404 Error',
      component: () => import('../views/Errors/FourZeroFour.vue'),
      meta: {
        title: '404 Error',
      },
    },

    {
      path: '/signin',
      name: 'Signin',
      component: () => import('../views/Auth/Signin.vue'),
      meta: {
        title: 'Signin',
      },
    },
    {
      path: '/signup',
      name: 'Signup',
      component: () => import('../views/Auth/Signup.vue'),
      meta: {
        title: 'Signup',
      },
    },
  ],
})

export default router

router.beforeEach((to, from, next) => {
  document.title = `${to.meta.title} | Asset Management System`
  next()
})
