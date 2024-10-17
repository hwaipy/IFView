<template>
  <q-layout view="hHh lpR fFf" class="bg-grey-1">
    <q-header elevated class="bg-white text-grey-8 q-py-xs" height-hint="58">
      <q-toolbar>
        <q-btn flat dense round @click="toggleLeftDrawer" aria-label="Menu" icon="menu" />

        <q-btn flat no-caps no-wrap class="q-ml-xs" v-if="$q.screen.gt.xs" href="#/">
          <q-icon name="img:favicon.ico" color="red" size="28px" />
          <q-toolbar-title shrink class="text-weight-bold">
            <NameBrand></NameBrand>
          </q-toolbar-title>
        </q-btn>
        <div style="width: 20px"></div>
        <PingDot />

        <q-space />

        <!-- <div class="YL__toolbar-input-container row no-wrap">
          <q-input dense outlined square v-model="search" placeholder="Search" class="bg-white col" />
          <q-btn class="YL__toolbar-input-btn" color="grey-3" text-color="grey-8" icon="search" unelevated />
        </div> -->

        <q-space />

        <div class="q-gutter-sm row items-center no-wrap">
          <!-- <q-btn round dense flat color="grey-8" icon="video_call" v-if="$q.screen.gt.sm">
            <q-tooltip>Create a video or post</q-tooltip>
          </q-btn>
          <q-btn round dense flat color="grey-8" icon="apps" v-if="$q.screen.gt.sm">
            <q-tooltip>Apps</q-tooltip>
          </q-btn>
          <q-btn round dense flat color="grey-8" icon="message" v-if="$q.screen.gt.sm">
            <q-tooltip>Messages</q-tooltip>
          </q-btn>
          <q-btn round dense flat color="grey-8" icon="notifications">
            <q-badge color="red" text-color="white" floating>
              2
            </q-badge>
            <q-tooltip>Notifications</q-tooltip>
          </q-btn> -->
          <!-- <q-btn round flat>
            <q-avatar size="26px">
              <img src="https://cdn.quasar.dev/img/boy-avatar.png">
            </q-avatar>
            <q-tooltip>Account</q-tooltip>
          </q-btn> -->
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered class="bg-grey-2" :width="200">
      <q-scroll-area class="fit">
        <q-list padding>
          <div v-for="link in links" :key="link.text">
            <div v-if="link.type == 'item'">
              <q-item v-ripple clickable :href="link.href">
                <q-item-section avatar>
                  <q-icon color="grey" :name="link.icon" />
                </q-item-section>
                <q-item-section>
                  <q-item-label>{{ link.text }}</q-item-label>
                </q-item-section>
              </q-item>
            </div>
            <div v-else-if="link.type == 'separator'">
              <q-separator class="q-my-md" />
            </div>
            <div v-else-if="link.type == 'title'"> <q-item-label header class="text-weight-bold text-uppercase">
                {{ link.text }}
              </q-item-label>
            </div>
          </div>
          <!-- <div class="q-px-md text-grey-9">
            <div class="row items-center q-gutter-x-sm q-gutter-y-xs">
              <a v-for="button in buttons1" :key="button.text" class="YL__drawer-footer-link" href="javascript:void(0)">
                {{ button.text }}
              </a>
            </div>
          </div>
          <div class="q-py-md q-px-md text-grey-9">
            <div class="row items-center q-gutter-x-sm q-gutter-y-xs">
              <a v-for="button in buttons2" :key="button.text" class="YL__drawer-footer-link" href="javascript:void(0)">
                {{ button.text }}
              </a>
            </div>
          </div> -->
        </q-list>
      </q-scroll-area>
    </q-drawer>
    <q-page-container>
      <!-- <q-scroll-area class="flex"> -->
      <router-view />
      <!-- </q-scroll-area> -->
    </q-page-container>
  </q-layout>
</template>

<script setup>
import { ref } from 'vue'
import PingDot from 'src/components/PingDot.vue';
import NameBrand from 'src/components/NameBrand.vue';

const leftDrawerOpen = ref(false)

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const links = [
  { type: 'item', icon: 'speed', text: 'Dashboard', href: '#/dashboard' },
  { type: 'separator' },
  { type: 'title', text: 'TF-QKD' },
  { type: 'item', icon: 'timeline', text: 'TDCViewer', href: '#/tdcviewer?tdcservice=TFTDCServer&collection=TFQKD_TDC' },
  { type: 'item', icon: 'leaderboard', text: 'Encoding', href: '#/tdcencoding?collection=TFQKD_TDC' },
  { type: 'item', icon: 'settings', text: 'Config', href: '#/config?tdcservice=TFTDCServer&collection=TFQKD_TDC' },
  { type: 'item', icon: 'monitor', text: 'Monitor', href: '#/tfmonitor?collection=TFQKD_TDC' },
  { type: 'separator' },
]

// const buttons1 = [
//   { text: 'About' },
//   { text: 'Press' },
//   { text: 'Copyright' },
//   { text: 'Contact us' },
//   { text: 'Creators' },
//   { text: 'Advertise' },
//   { text: 'Developers' }
// ]
// const buttons2 = [
//   { text: 'Terms' },
//   { text: 'Privacy' },
//   { text: 'Policy & Safety' },
//   { text: 'Test new features' }
// ]
</script>

<style lang="sass">
.YL

  &__toolbar-input-container
    min-width: 100px
    width: 55%

  &__toolbar-input-btn
    border-radius: 0
    border-style: solid
    border-width: 1px 1px 1px 0
    border-color: rgba(0,0,0,.24)
    max-width: 60px
    width: 100%

  &__drawer-footer-link
    color: inherit
    text-decoration: none
    font-weight: 500
    font-size: .75rem

    &:hover
      color: #000
</style>
