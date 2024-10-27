<template>
  <q-layout view="lHh lpR fFf" class="bg-grey-1">
    <q-header elevated class="bg-white text-grey-8 q-py-xs" height-hint="58">
      <q-toolbar>
        <q-btn flat dense round @click="toggleLeftDrawer" aria-label="Menu" icon="bi-justify" style="padding-left: 0px; padding-right: 0px" />

        <div style="width: 20px"></div>
        <!-- <PingDot /> -->
        <!-- <q-ajax-bar ref="bar" position="bottom" color="accent" size="10px" /> -->
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
          <!-- <q-btn round size="10px" flat :style="{ border: '3px solid ' + hbColor }">
            <q-avatar size="30px">
              <img src="https://cdn.quasar.dev/img/boy-avatar.png">
            </q-avatar>
            <q-tooltip>Account</q-tooltip>
          </q-btn> -->
          <q-btn round :style="{ color: hbColor, backgroundColor: '#E0E0E0', border: '0px solid black' }" icon="cloud"
            size="12px" unelevated @click="showSetServerDialog = false">
            <q-tooltip anchor="center left" self="center right">
              {{ hbDelay }} ms
            </q-tooltip>
          </q-btn>
        </div>
      </q-toolbar>
    </q-header>

    <q-drawer v-model="leftDrawerOpen" show-if-above bordered :width="250">
      <q-scroll-area class="fit" style="background-color: rgb(60, 76, 100);">
        <!-- <q-btn flat no-caps no-wrap class="q-ml-xs" v-if="$q.screen.gt.xs" href="#/">
          <q-icon name="img:favicon.ico" color="red" size="28px" />
          <q-toolbar-title shrink class="text-weight-bold">
            <NameBrand></NameBrand>
          </q-toolbar-title>
        </q-btn> -->
        <div
          style="height: 58px; background-color: rgb(48, 61, 84); display: flex; justify-content: center; align-items: center;">
          <NameBrand></NameBrand>
        </div>
        <q-list padding>
          <div v-for="link in links" :key="link.text">
            <div v-if="link.type == 'item'">
              <q-item v-ripple clickable :href="link.href" style="text-decoration: none">
                <q-item-section avatar>
                  <q-icon color="white" :name="link.icon" />
                </q-item-section>
                <q-item-section>
                  <q-item-label class="text-white">{{ link.text }}</q-item-label>
                </q-item-section>
              </q-item>
            </div>
            <div v-else-if="link.type == 'separator'">
              <q-separator class="q-my-md" />
            </div>
            <div v-else-if="link.type == 'title'">
              <q-item-label header class="text-weight-bold text-uppercase text-white">
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
      <q-page class="flex flex-col">
        <q-scroll-area class="scroll-area" style="flex: 1; min-height: 0;">
          <router-view />
        </q-scroll-area>
      </q-page>
    </q-page-container>
  </q-layout>
  <q-dialog v-model="showSetServerDialog" persistent backdrop-filter="blur(4px)">
    <q-card>
      <q-card-section class="row items-center">
        <q-avatar icon="signal_wifi_off" color="primary" text-color="white" />
        <span class="q-ml-sm">You are currently not connected to any network.</span>
      </q-card-section>

      <q-card-actions align="right">
        <q-btn flat label="Cancel" color="primary" v-close-popup />
        <q-btn flat label="Turn on Wifi" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
  <q-dialog v-model="showLoadingApplicationConfigErrorDialog">
    <q-card>
      <q-card-section class="row">
        <q-icon color="red" size="28px" :name="'warning'" style="padding-right: 8px" />
        <div class="text-h5" style="margin-left: 10px">Error</div>
      </q-card-section>
      <q-card-section class="q-pt-none">
        <div v-html="loadingApplicationConfigErrorInfo"></div>
      </q-card-section>
      <q-card-actions align="right">
        <q-btn flat label="OK" color="primary" v-close-popup />
      </q-card-actions>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import NameBrand from 'src/components/NameBrand.vue';
import worker from '../services/IFWorker'
import { colors } from 'quasar'
const { getPaletteColor, hexToRgb, rgbToHex } = colors

const leftDrawerOpen = ref(false)
const showSetServerDialog = ref(false)
const showLoadingApplicationConfigErrorDialog = ref(false)
const applicationConfigFileURL = ref('/config.json')
const loadingApplicationConfigErrorInfo = ref('')

function toggleLeftDrawer() {
  leftDrawerOpen.value = !leftDrawerOpen.value
}

const links = ref([
  { type: 'item', icon: 'bi-speedometer2', text: 'Dashboard', href: '#/dashboard' },
  { type: 'separator' },
  { type: 'title', text: 'TF-QKD' },
  { type: 'item', icon: 'bi-graph-up', text: 'TDCViewer', href: '#/tdcviewer?tdcservice=TFTDCServer&collection=TFQKD_TDC' },
  { type: 'item', icon: 'bi-grid-3x2-gap', text: 'Encoding', href: '#/tdcencoding?collection=TFQKD_TDC' },
  { type: 'item', icon: 'bi-gear', text: 'Config', href: '#/config?tdcservice=TFTDCServer&collection=TFQKD_TDC' },
  { type: 'item', icon: 'bi-display', text: 'Monitor', href: '#/tfmonitor?collection=TFQKD_TDC' },
  { type: 'separator' },
])

onMounted(async () => {
  await loadApplicationConfig();
})

async function loadApplicationConfig() {
  let response
  try {
    response = await fetch(applicationConfigFileURL.value);
    if (response == undefined || !response.ok) {
      const link = `<a href="${applicationConfigFileURL.value}" target="_blank">${applicationConfigFileURL.value}</a>`;
      loadingApplicationConfigErrorInfo.value = `The application config file ${link} is not valid.`
      showLoadingApplicationConfigErrorDialog.value = true
      return
    }
  } catch (error) {
    loadingApplicationConfigErrorInfo.value = 'Error occurs during fetching the url: ' + applicationConfigFileURL.value
    showLoadingApplicationConfigErrorDialog.value = true
    return
  }
  try {
    const data = await response.json();
    const applications = data["Applications"]
    console.log(applications);

  } catch (error) {
    loadingApplicationConfigErrorInfo.value = 'Error occurs during parsing the config file: ' + error
    showLoadingApplicationConfigErrorDialog.value = true
    return
  }
}

function onLoadingApplicationConfigError(error) {

}

const hbDelay = worker.hbDelay

const colorMap = [
  [-1, hexToRgb(getPaletteColor('grey-8'))],
  [0, hexToRgb(getPaletteColor('teal'))],
  [20, hexToRgb(getPaletteColor('teal'))],
  [100, hexToRgb(getPaletteColor('orange'))],
  [200, hexToRgb(getPaletteColor('deep-orange'))],
  [500, hexToRgb(getPaletteColor('red'))],
]
const getMixedColor = (color1, value1, color2, value2, value) => {
  if (value <= value1) return color1
  if (value >= value2) return color2
  const getMixedInt = (int1, int2) => {
    return parseInt((value - value1) * (int2 - int1) / (value2 - value1) + int1)
  }
  return {
    r: getMixedInt(color1.r, color2.r),
    g: getMixedInt(color1.g, color2.g),
    b: getMixedInt(color1.b, color2.b),
  }
}
const getPingColor = (delay) => {
  for (let i = 0; i < colorMap.length; i++) {
    if (i == 0) continue
    if (delay > colorMap[i][0]) continue
    return getMixedColor(colorMap[i - 1][1], colorMap[i - 1][0], colorMap[i][1], colorMap[i][0], delay)
  }
  return colorMap[colorMap.length - 1][1]
}
const hbColor = computed(() => {
  return rgbToHex(getPingColor(hbDelay.value))
})

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

<style lang="sass" scoped>
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

:deep(aside)
  position: fixed

:deep(.q-btn__content)
  padding-left: 0px
  padding-right: 0px

</style>
