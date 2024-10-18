// src/boot/loading-bar.js
import { LoadingBar } from 'quasar'

export default async ({ app, router }) => {
  // Configure loading bar appearance
  LoadingBar.setDefaults({
    color: 'blue',  // 设置进度条颜色
    size: '4px',    // 设置进度条高度
    position: 'top' // 设置进度条显示在顶部
  })

  // 显示进度条时机
  router.beforeEach((to, from, next) => {
    console.log('loading');
    LoadingBar.start()  // 开始显示进度条
    // Loading.show()
    next()
  })

  router.afterEach(() => {
    console.log('loaded');
    LoadingBar.stop()   // 停止进度条
    // Loading.hide()
  })
}
