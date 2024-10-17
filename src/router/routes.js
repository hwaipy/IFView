const routes = [
  {
    path: '/',
    component: () => import('layouts/MainLayout.vue'),
    children: [
      { path: '', meta: { title: 'InteractionFree View' }, component: () => import('pages/IndexPage.vue') },
      { path: 'dashboard', meta: { title: 'Dashboard - InteractionFree View' }, component: () => import('pages/DashBoard.vue') },
      { path: 'tdcviewer', meta: { title: 'TDCViewer - InteractionFree View' }, component: () => import('pages/TDCViewer.vue') },
      { path: 'tdcencoding', meta: { title: 'TDCEncoding - InteractionFree View' }, component: () => import('pages/TDCEncoding.vue') },
      { path: 'config', meta: { title: 'Config - InteractionFree View' }, component: () => import('pages/TFConfig.vue') },
      { path: 'tfmonitor', meta: { title: 'Monitor - InteractionFree View' }, component: () => import('pages/TFMonitor.vue') },
    ]
  },

  // Always leave this as last one,
  // but you can also remove it
  {
    path: '/:catchAll(.*)*',
    component: () => import('pages/ErrorNotFound.vue')
  }
]

export default routes
