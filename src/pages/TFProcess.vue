<template>
  <q-card class="histogram-card" bordered>
    <q-card-section class="bg-card-head" style="height: 48px; padding-left: 16px; padding-top: 0px;">
      <div class="row">
        <q-item-label class="text-h6" style="margin-top: 12px;">TDCServer & Atomic Clocks</q-item-label>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section horizontal>
      <q-card-section style="width: 100%;" class="row">
        <q-card v-for="tdcToggle in tdcToggles" :key="tdcToggle.key" class="row items-center justify-between"
          style="margin-top: 0px; margin-bottom: 8px; padding-left: 4px; padding-right: 4px; margin-right: 12px">
          <q-toggle v-model="tdcToggle.value" @update:model-value="(v) => tdcToggle.set(v)" size="xs" />
          <div class="q-pa-md row histogram-info-label" style="font-weight: bold; margin-right: 8px;">
            <div class="self-center"> {{ tdcToggle.name }} </div>
          </div>
        </q-card>
        <q-card class="row items-center justify-between"
          style="margin-top: 0px; margin-bottom: 8px; padding-left: 4px; padding-right: 4px; margin-right: 12px">
          <div class="q-pa-md row histogram-info-label"
            style="font-weight: bold; margin-right: 0px; padding-top: 0px; padding-bottom: 0px">
            <div class="row" style="padding-top: 16px; padding-bottom: 16px; margin-right: 12px">
              <div>
                Latest data: {{ latestTDCDataTime }}
                <q-tooltip>
                  The FetchTime of the latest data saved by TDCServer.
                </q-tooltip>
              </div>
            </div>
            <!-- <div class="row" style="margin-top: 8px; margin-bottom: 8px;">
              <q-btn square unelevated color="green-4" style="padding-left: 4px; padding-right: 4px;" @click="adjustCharlie1pps(100)">&lt;&lt;</q-btn>
              <q-btn square unelevated color="green-4" style="padding-left: 8px; padding-right: 8px;" @click="adjustCharlie1pps(10)">&lt;</q-btn>
              <q-btn square unelevated color="green-4" style="padding-left: 8px; padding-right: 8px;" @click="adjustCharlie1pps(-10)">&gt;</q-btn>
              <q-btn square unelevated color="green-4" style="padding-left: 4px; padding-right: 4px;" @click="adjustCharlie1pps(-100)">&gt;&gt;</q-btn>
            </div> -->
          </div>
        </q-card>
        <q-card class="row items-center justify-between"
          style="margin-top: 0px; margin-bottom: 8px; padding-left: 4px; padding-right: 4px; margin-right: 12px">
          <div class="q-pa-md row histogram-info-label"
            style="font-weight: bold; margin-right: 8px; padding-top: 0px; padding-bottom: 0px; padding-right: 6px">
            <div class="row">
              <div class="row" style="padding-top: 16px; padding-bottom: 16px;">
                <div style="margin-right: 4px;">{{ nameC }} 1 pps @ </div>
                <div>{{ isNaN(c1ppsTime) ? 'NaN' : moment(c1ppsTime * 1000).format('YYYY-MM-DD HH:mm:ss.SSS') }}</div>
                <div style="margin-left: 6px; margin-right: 6px;"> with lag </div>
                <div
                  :style="{ 'color': (isNaN(ch0Offset) || ch0Offset < 90000 || ch0Offset > 200000) ? 'red' : 'blue' }">
                  {{ new Intl.NumberFormat('ja-JP').format(ch0Offset / 1000.0) }}</div>
                <div style="margin-left: 4px;"> ns</div>
              </div>
              <q-btn :disable="fixCH0OffsetButtonDisabled || isNaN(ch0Offset)" color="green-4" unelevated
                style="margin-top: 8px; margin-bottom: 8px; margin-left: 18px; margin-right: 0px;"
                @click="fixCH0Offset">
                Fix
                <q-tooltip>
                  Synchronize the 1 PPS signal to whole 1-second intervals, by step size of 1 ms. Meanwhile, set the lag
                  to 100 ns.
                </q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-card>
        <q-card class="row items-center justify-between"
          style="margin-top: 0px; margin-bottom: 8px; padding-left: 4px; padding-right: 4px; margin-right: 12px">
          <div class="q-pa-md row histogram-info-label"
            style="font-weight: bold; margin-right: 8px; padding-top: 0px; padding-bottom: 0px; padding-right: 6px">
            <div class="row">
              <div class="row" style="padding-top: 16px; padding-bottom: 16px;">
                <div style="margin-right: 4px;">Alice 0.1 pps @ </div>
                <div>{{ isNaN(alice1ppsTime) ? 'NaN' : moment(alice1ppsTime * 1000).format('YYYY-MM-DD HH:mm:ss.SSS') }}
                </div>
              </div>
              <q-btn color="green-4" unelevated :disable="isNaN(alice1ppsTime)"
                style="margin-top: 8px; margin-bottom: 8px; margin-left: 18px; margin-right: 0px;"
                @click="fixAlice1pps">
                Fix
                <q-tooltip>
                  Synchronize the 0.1 PPS signal to whole 10-second intervals, by step size of N * 40 ms.
                </q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-card>
        <q-card class="row items-center justify-between"
          style="margin-top: 0px; margin-bottom: 8px; padding-left: 4px; padding-right: 4px; margin-right: 12px">
          <div class="q-pa-md row histogram-info-label"
            style="font-weight: bold; margin-right: 8px; padding-top: 0px; padding-bottom: 0px; padding-right: 6px">
            <div class="row">
              <div class="row" style="padding-top: 16px; padding-bottom: 16px;">
                <div style="margin-right: 4px;">Bob 0.1 pps @ </div>
                <div>{{ isNaN(bob1ppsTime) ? 'NaN' : moment(bob1ppsTime * 1000).format('YYYY-MM-DD HH:mm:ss.SSS') }}
                </div>
              </div>
              <q-btn color="green-4" unelevated :disable="isNaN(bob1ppsTime)"
                style="margin-top: 8px; margin-bottom: 8px; margin-left: 18px; margin-right: 0px;" @click="fixBob1pps">
                Fix
                <q-tooltip>
                  Synchronize the 0.1 PPS signal to whole 10-second intervals, by step size of N * 40 ms.
                </q-tooltip>
              </q-btn>
            </div>
          </div>
        </q-card>
        <!-- <q-card class="row"
          style="margin-top: 0px; margin-bottom: 8px; padding-left: 16px; padding-right: 16px; margin-right: 12px">
          <q-btn color="green-4" unelevated
            style="margin-top: 8px; margin-bottom: 8px; margin-left: 0px; margin-right: 18px;"
            @click="adjustAtomicClock('Alice', parseInt(refAtomicClockStep))">Alice</q-btn>
          <q-btn color="green-4" unelevated
            style="margin-top: 8px; margin-bottom: 8px; margin-left: 0px; margin-right: 6px;"
            @click="adjustAtomicClock('Bob', parseInt(refAtomicClockStep))">Bob</q-btn>
          <div style="margin-top: 16px; margin-left: 8px; margin-right: 8px; font-weight: bold;"> 1 pps delay for </div>
          <q-input v-model="refAtomicClockStep" class="channel-info-input" square outlined dense mask="#"
            input-class="text-right" style="width: 40px; margin-top: 8px;"></q-input>
          <div style="margin-top: 16px; margin-left: 8px; font-weight: bold;"> * 200 ms</div>
        </q-card> -->
        <!-- <q-card class="row"
          style="font-weight: bold; margin-top: 0px; margin-bottom: 8px; padding-left: 16px; padding-right: 16px; padding-bottom: 0px; margin-right: 12px">
          <div v-if="!inDoppler" style="margin-top: 16px; margin-bottom: 16px">Doppler shift not started.</div>
          <div v-if="inDoppler" class="row" style="margin-bottom: 0px">
            <div style="margin-top: 16px;">Doppler shift:</div>
            <q-linear-progress size="25px" :value="dopplerProgress"
              style="width: 160px; margin-left: 16px; margin-top: 16px">
              <div class="absolute-full flex flex-center">
                <q-badge color="white" text-color="black"
                  :label="parseInt(Date.now() / 1000 - dopplerShiftTimeRange[0]) + ' s / ' + parseInt(dopplerShiftTimeRange[1] - dopplerShiftTimeRange[0]) + ' s'" />
              </div>
            </q-linear-progress>
            <q-btn :loading="dopplerStopping" color="red-4" unelevated
              style="margin-top: 10px; margin-left: 18px; margin-right: 0px; margin-bottom: 10px"
              @click="stopDoppler()">Stop</q-btn>
          </div>
        </q-card> -->
      </q-card-section>
    </q-card-section>
    <q-separator />
    <q-card-section class="bg-card-head" style="height: 48px; padding-left: 16px; padding-top: 0px;">
      <div class="row">
        <q-item-label class="text-h6" style="margin-top: 12px;">Doppler Shift</q-item-label>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section horizontal>
      <q-card-section style="width: 100%;" class="row">
        <q-card class="row items-center justify-between"
          style="margin-top: 0px; margin-bottom: 8px; padding-left: 4px; padding-right: 4px; margin-right: 12px">
          <div style="margin-left: 6px; font-weight: bold">Doppler begin at</div>
          <q-input class="channel-info-input channel-info-input-review" square outlined dense input-class="text-center"
            v-model="dopplerBeginString" @blur="onDopplerBeginEditted(true)"
            @update:model-value="onDopplerBeginEditted(false)" error-message="" no-error-icon
            style="padding-bottom: 0px; font-size: 20px;"
            :readonly="dopplerStatus != 'Not Started' && dopplerStatus != 'Finished' && dopplerStatus != 'Stopped'">
          </q-input>
          <q-linear-progress size="25px" :value="dopplerProgress / dopplerTotalDuration"
            style="width: 200px; margin-left: 10px; margin-right: 16px; margin-top: 10px; margin-bottom: 10px">
            <div class="absolute-full flex flex-center">
              <q-badge color="white" text-color="black" :label="dopplerProgressLabel" />
            </div>
          </q-linear-progress>
          <div v-if="dopplerStatus == 'Not Started' || dopplerStatus == 'Finished' || dopplerStatus == 'Stopped'"
            style="margin-top: 0px; margin-bottom: 0px">
            <q-btn color="green-4" unelevated
              style="margin-top: 10px; margin-left: 0px; margin-right: 8px; margin-bottom: 10px" @click="startDoppler()"
              :disable="!dopplerBeginValid">Start</q-btn>
          </div>
          <div v-if="dopplerStatus != 'Not Started' && dopplerStatus != 'Finished' && dopplerStatus != 'Stopped'"
            class="row" style="margin-bottom: 0px">
            <q-btn color="red-4" unelevated :disabled="dopplerStatus == 'Starting' || dopplerStatus == 'Stopping'"
              style="margin-top: 10px; margin-left: 0px; margin-right: 8px; margin-bottom: 10px"
              @click="stopDoppler()">Stop</q-btn>
          </div>
        </q-card>
      </q-card-section>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import { useRoute } from 'vue-router'
import { SimpleFetcher, parseDateString } from 'src/services/IFExp';
import moment from 'moment';
import { loadConfig } from 'src/services/Config';
const route = useRoute()

let workerMain = null
let workerTDC = null
const parameters = route.query
const tdcService = parameters['tdcservice'] || null
const collection = parameters['collection'] || null
const nameA = parameters['nameA'] || null
const nameB = parameters['nameB'] || null
const nameC = parameters['nameC'] || null
let tdcServer = null

const tdcToggles = ref([
  { name: 'Post Process', key: 'post-process', value: ref(null), set: (v) => setPostProcessStatus(v) },
  { name: 'Raw Data Store', key: 'raw-data-store', value: ref(null), set: (v) => setRawDataStore(v) },
])
const latestTDCDataTime = ref('')
const ch0Offset = ref(NaN)
const fixCH0OffsetButtonDisabled = ref(false)
async function fixCH0Offset() {
  if (isNaN(ch0Offset.value)) return
  fixCH0OffsetButtonDisabled.value = true
  const delayMS = parseInt(c1ppsTime.value * 1000 % 1000);
  const delayNS = parseInt(ch0Offset.value / 1000)   // to ns
  const move = (parseInt((delayNS < 20000) ? (1000000000 - delayNS) : 40000 - delayNS) + 100) % 1000000000 + delayMS * 1000000;
  if (move > 0) await workerTDC['TF_AtomicClock_' + nameC].delay1PPS(move)
  fixCH0OffsetButtonDisabled.value = false
}

const alice1ppsTime = ref(NaN)
const bob1ppsTime = ref(NaN)
const c1ppsTime = ref(NaN)
async function fixAlice1pps() {
  if (!isNaN(alice1ppsTime.value)) {
    const currentValue = alice1ppsTime.value % 10
    alice1ppsTime.value = NaN
    if (currentValue < 20e-3 || currentValue > 9980e-3) return;
    const distance = 10 - currentValue;
    await workerMain['TF_TriggerBoard_' + nameA].delayDividedTrigger(parseInt(distance))
    const distanceInS = parseInt(distance * 1000) % 1000
    const distaneUnit = Math.round(distanceInS / 40);
    if (distaneUnit > 0) await workerMain['TF_AtomicClock_' + nameA].delay1PPS(1000000000 - distaneUnit * 40000000)
  }
}
async function fixBob1pps() {
  if (!isNaN(bob1ppsTime.value)) {
    const currentValue = bob1ppsTime.value % 10
    bob1ppsTime.value = NaN
    if (currentValue < 20e-3 || currentValue > 9980e-3) return;
    const distance = 10 - currentValue;
    await workerMain['TF_TriggerBoard_' + nameB].delayDividedTrigger(parseInt(distance))
    const distanceInS = parseInt(distance * 1000) % 1000
    const distaneUnit = Math.round(distanceInS / 40);
    if (distaneUnit > 0) await workerMain['TF_AtomicClock_' + nameB].delay1PPS(1000000000 - distaneUnit * 40000000)
  }
}

const dopplerBeginString = ref('')
const dopplerBegin = ref('')
const dopplerBeginValid = ref(false)
function onDopplerBeginEditted(finished) {
  const dateString = 'YYYY-MM-DD HH:mm:ss'
  if (dopplerBeginString.value == '' && finished) {
    const now = moment();
    const targetTime = now.add(30 - (now.seconds() % 10), 'seconds');
    dopplerBeginString.value = targetTime.format(dateString)
  }
  dopplerBegin.value = parseDateString(dopplerBeginString.value)
  updateDopplerStatus();
  if (finished && dopplerBeginValid.value) dopplerBeginString.value = dopplerBegin.value >= 0 ? moment(dopplerBegin.value).format(dateString) : '';
}
const updateDopplerStatus = () => {
  if (dopplerBegin.value) {
    dopplerBeginValid.value = !Number.isNaN(dopplerBegin.value) && (dopplerBegin.value % 10000 == 0) && (dopplerBegin.value >= Date.now() + 1000 * 10)
    //     const progress = Date.now() - dopplerBegin.value
    //     if (dopplerStatus.value == 'Not Started' || dopplerStatus.value == 'Starting' || dopplerStatus.value == 'Stopping' || dopplerStatus.value == 'Stopped') dopplerProgress.value = 0;
    //     else if (dopplerStatus.value == 'Finished') dopplerProgress.value = dopplerTotalDuration.value;
    //     else if (dopplerStatus.value == 'Waiting') {
    //       dopplerProgress.value = parseInt(progress / 1000)
  } else {
    //       if (progress < 0) {
    //         dopplerProgress.value = 0
    //       } else if (progress < dopplerTotalDuration.value * 1000) {
    //         dopplerProgress.value = parseInt(progress / 1000)
    //       } else {
    //         dopplerProgress.value = dopplerTotalDuration.value
    //         dopplerStatus.value = 'Finished'
    //       }
    //     }
  }
}
let dopplerStatus = ref('Not Started'); // 'Not Started', 'Starting', 'Waiting', 'In Progress', 'Stopping', 'Stopped', 'Finished'
const dopplerTotalDuration = ref(1);
const dopplerProgress = ref(0);
const dopplerWaiting = ref(0);

let syncDopplerStatusInteval;
const syncDopplerStatus = async () => {
  const meta = await workerMain.DopplerAutomatic.getStatus();
  dopplerStatus.value = meta[0];
  if (meta[0] == 'Waiting') {
    dopplerWaiting.value = meta[1];
    dopplerProgress.value = 0;
    dopplerTotalDuration.value = 1;
  }
  if (meta[0] == 'In Progress') {
    dopplerProgress.value = meta[1];
    dopplerTotalDuration.value = meta[2];
  }
  updateDopplerStatus();
}

async function startDoppler() {
  await workerMain.DopplerAutomatic.beginDopplerAt(dopplerBegin.value);
  //   if (dopplerStatus.value != 'Not Started' && dopplerStatus.value != 'Finished' && dopplerStatus.value != 'Stopped') {
  //     console.warn('Doppler shift already started or in progress.');
  //     return;
  //   }
  //   dopplerStatus.value = 'Starting';
  //   updateDopplerStatus();
  //   await new Promise(resolve => setTimeout(resolve, 1000));
  //   dopplerStatus.value = 'Waiting';
  //   updateDopplerStatus();
  //   await new Promise(resolve => setTimeout(resolve, dopplerBegin.value - Date.now()));
  //   dopplerStatus.value = 'In Progress';
  //   updateDopplerStatus();
}
// const dopplerTotalDuration = ref(700); // in seconds
// const dopplerProgress = ref(0);
const dopplerProgressLabel = computed(() => {
  if (dopplerStatus.value == 'Not Started') return 'Not Started';
  if (dopplerStatus.value == 'Starting') return 'Starting...';
  if (dopplerStatus.value == 'Waiting') return 'Start in ' + Math.round(dopplerWaiting.value) + ' s';
  if (dopplerStatus.value == 'In Progress') {
    return `${Math.round(dopplerProgress.value)} s / ${Math.round(dopplerTotalDuration.value)} s`;
  }
  if (dopplerStatus.value == 'Finished') return 'Finished';
  if (dopplerStatus.value == 'Stopping') return 'Stopping';
  if (dopplerStatus.value == 'Stopped') return 'Stopped';
  return 'NA';
});
// const dopplerShiftTimeRange = ref([0, 0])
// const inDoppler = ref(false)
// const dopplerProgress = ref(0)
// const dopplerStopping = ref(false)
async function stopDoppler() {
  await workerMain.DopplerAutomatic.stopDoppler();
  //   dopplerStatus.value = 'Stopping';
  //   updateDopplerStatus();
  //   await new Promise(resolve => setTimeout(resolve, 2000));
  //   dopplerStatus.value = 'Stopped';
  //   updateDopplerStatus();
  //   // dopplerStopping.value = true
  //   // await tdcServer.startDopplerShift(0)
  //   // await new Promise(resolve => setTimeout(resolve, 3000))
  //   // dopplerStopping.value = false
}

const dcDeviceIDs = ["TF_PowerSupply_Alice_1", "TF_PowerSupply_Alice_2", "TF_PowerSupply_Alice_3", "TF_PowerSupply_Alice_4", "TF_PowerSupply_Bob_1", "TF_PowerSupply_Bob_2", "TF_PowerSupply_Bob_3", "TF_PowerSupply_Bob_4"]
const dcDeviceDefines = {
  "TF_PowerSupply_Alice_1": {
    0: { description: "Alice 风扇电源", protection: 25 },
    1: { description: "Alice AWG_1 电源", protection: 13 },
    2: { description: "Alice PM 放大器供电", protection: 6 }
  },
  "TF_PowerSupply_Alice_2": {
    0: { description: "Alice Bias AM1", protection: 15 },
    1: { description: "Alice Bias AM2", protection: 15 },
    2: { description: "Alice Bias Ground", protection: 6 }
  },
  "TF_PowerSupply_Alice_3": {
    0: { description: "Alice Bias AM3", protection: 15 },
    1: { description: "Alice AWG_2 电源", protection: 13 },
    2: { description: "Alice Tunable ATT", protection: 6 }
  },
  "TF_PowerSupply_Alice_4": {
    0: { description: "", protection: 15 },
    1: { description: "Alice AM 放大器 Vbias", protection: 13 },
    2: { description: "Alice AM 放大器 Vamp", protection: 1.5 }
  },
  "TF_PowerSupply_Bob_1": {
    0: { description: "Bob AWG_1 电源", protection: 13 },
    1: { description: "Bob 风扇电源", protection: 25 },
    2: { description: "Bob 时钟板电源", protection: 6 }
  },
  "TF_PowerSupply_Bob_2": {
    0: { description: "Bob PM 放大器供电", protection: 6 },
    1: { description: "Bob AM 放大器 Vbias", protection: 13 },
    2: { description: "Bob AM 放大器 Vamp", protection: 1.5 }
  },
  "TF_PowerSupply_Bob_3": {
    0: { description: "Bob Bias AM1", protection: 15 },
    1: { description: "Bob Bias AM2", protection: 15 },
    2: { description: "Bob Bias Ground", protection: 6 }
  },
  "TF_PowerSupply_Bob_4": {
    0: { description: "Bob Bias AM3", protection: 15 },
    1: { description: "Bob AWG_2 电源", protection: 13 },
    2: { description: "Bob Tunable ATT", protection: 6 }
  },
}
const dcDeviceInfos = ref([])
for (const id of dcDeviceIDs) {
  for (const ch of Object.keys(dcDeviceDefines[id])) {
    const define = dcDeviceDefines[id][ch]
    dcDeviceInfos.value.push({
      deviceID: id, ch: ch, description: define.description, protection: define.protection,
      valid: false, VSet: '', VSetDisplay: '', VAct: '', IAct: '', ILim: '', output: false,
      switchDevice: async (v) => await workerMain[id].setOutputStatus(parseInt(ch), v), VSetEditing: false, element: null
    })
  }
}
const powerMonitorInfos = ref([
  { name: 'Alice', title: 'Power Meter Alice', powers: ['NaN', 'NaN'] },
  { name: 'Bob', title: 'Power Meter Bob', powers: ['NaN', 'NaN'] },
  { name: 'Senders', title: 'Power Meter Senders', powers: ['NaN', 'NaN'] },
])

function onVSetFocus(info) { info.VSetEditing = true }
function onVSetBlur(info) { doneVSetEditing(info, true, true) }
function onVSetEnter(info) { doneVSetEditing(info, true, false) }
function onVSetEscape(info) {
  doneVSetEditing(info, false, false)
  info.element.blur()
}
async function doneVSetEditing(info, apply, stop) {
  if (stop) info.VSetEditing = false
  const newValue = parseFloat(info.VSetDisplay)
  if (apply) {
    info.VSet = newValue
    await workerMain[info.deviceID].setVoltage(parseInt(info.ch), Math.min(newValue, info.protection))
  } else info.VSetDisplay = info.VSet
}
async function onVSetAdjust(info, event, isAdd) {
  event.preventDefault()
  const position = event.target.selectionStart
  let increment = 0
  if (position == 0) return
  else if (position == 1) increment = 10
  else if (position == 2 || position == 3) increment = 1
  else increment = Math.pow(10, 3 - position)
  const v = Math.min(parseFloat(info.VSetDisplay) + (isAdd ? increment : -increment), info.protection)
  info.VSet = ('0' + v.toFixed(3)).slice(-6)
  info.VSetDisplay = info.VSet
  await workerMain[info.deviceID].setVoltage(parseInt(info.ch), v)
}

async function setPostProcessStatus(status) {
  if (tdcService) await tdcServer.setRawDataStore(status)
}

async function setRawDataStore(status) {
  if (tdcService) await tdcServer.setRawDataStore(status)
}

const tdcFetcher = new SimpleFetcher(async () => {
  if (tdcService) {
    try {
      tdcToggles.value[0].value = await tdcServer.getPostProcessStatus()
    } catch (error) {
      tdcToggles.value[0].value = null
    }
    try {
      tdcToggles.value[1].value = await tdcServer.isRawDataStore()
    } catch (error) {
      tdcToggles.value[1].value = null
    }
    try {
      ch0Offset.value = await tdcServer.getCH0Offset()
    } catch (error) {
      ch0Offset.value = NaN
    }
    // try {
    //   dopplerShiftTimeRange.value = await tdcServer.getDopplerShiftTimeRange()
    //   const now = Date.now() / 1000
    //   if (now < dopplerShiftTimeRange.value[0] || now > dopplerShiftTimeRange.value[1]) {
    //     inDoppler.value = false
    //     dopplerProgress.value = -1
    //   } else {
    //     inDoppler.value = true
    //     dopplerProgress.value = (now - dopplerShiftTimeRange.value[0]) / (dopplerShiftTimeRange.value[1] - dopplerShiftTimeRange.value[0])
    //   }
    // } catch (error) {
    //   dopplerShiftTimeRange.value = [0, 0]
    // }
  }
  if (collection) {
    try {
      const storage = workerTDC.Storage
      const r = await storage.latest(collection, 'FetchTime', 0, { FetchTime: 1 })
      latestTDCDataTime.value = r['FetchTime'].replace('T', ' ').slice(0, - 9)
    } catch (error) { }
  }
  try {
    const triggers = await workerMain['TF_TriggerBoard_' + nameA].getTriggers(alice1ppsTime.value)
    for (const trigger of triggers) {
      if (trigger[0] == "T+") alice1ppsTime.value = trigger[1]
    }
  } catch (error) { }
  try {
    const triggers = await workerMain['TF_TriggerBoard_' + nameB].getTriggers(bob1ppsTime.value)
    for (const trigger of triggers) {
      if (trigger[0] == "T+") bob1ppsTime.value = trigger[1]
    }
  } catch (error) { }
  try {
    const triggers = await workerMain['TF_TriggerBoard_' + nameC].getTriggers(c1ppsTime.value)
    for (const trigger of triggers) {
      c1ppsTime.value = trigger[1]
    }
  } catch (error) { }
}, 1100)
async function doFetchDC(deviceID) {
  try {
    const VSets = await workerMain[deviceID].getVoltageSetpoints()
    const VActs = await workerMain[deviceID].measureVoltages()
    const IActs = await workerMain[deviceID].measureCurrents()
    const ILims = await workerMain[deviceID].getCurrentLimits()
    const outputs = await workerMain[deviceID].getOutputStatuses()
    for (const info of dcDeviceInfos.value) if (info.deviceID == deviceID) {
      info.valid = true
      info.VSet = ('0' + VSets[info.ch].toFixed(3)).slice(-6)
      info.VAct = ('0' + VActs[info.ch].toFixed(3)).slice(-6)
      info.IAct = ('0' + IActs[info.ch].toFixed(3)).slice(-6)
      info.ILim = ('0' + ILims[info.ch].toFixed(3)).slice(-6)
      info.output = outputs[info.ch]
      if (!info.VSetEditing) info.VSetDisplay = info.VSet
    }
  } catch (error) {
    console.log(error);
    for (const info of dcDeviceInfos.value) if (info.deviceID == deviceID) {
      info.valid = false
      info.VSet = ''
      info.VAct = ''
      info.IAct = ''
      info.ILim = ''
      info.output = false
      info.VSetDisplay = ''
    }
  }
}
const dcFetcher = new SimpleFetcher(async () => {
  for (const deviceID of dcDeviceIDs) {
    await doFetchDC(deviceID)
  }
}, 1300)
const editingDCFetcher = new SimpleFetcher(async () => {
  for (const info of dcDeviceInfos.value) {
    if (info.VSetEditing) {
      await doFetchDC(info.deviceID)
      return
    }
  }
}, 100)
const pmFetcher = new SimpleFetcher(async () => {
  const result = []
  try { result.push(await workerMain.TF_PowerMeter_Alice.readPower()) }
  catch (error) {
    result.push([Number.NaN, Number.NaN]);
    // console.log(error);
  }
  try { result.push(await workerMain.TF_PowerMeter_Bob.readPower()) }
  catch (error) {
    result.push([Number.NaN, Number.NaN]);
    // console.log(error);
  }
  try { result.push(await workerMain.TF_PowerMeter_Senders.readPower()) }
  catch (error) {
    result.push([Number.NaN, Number.NaN]);
    // console.log(error);
  }
  for (const part in result) {
    for (const ch in result[part]) {
      powerMonitorInfos.value[part].powers[ch] = Number.isNaN(result[part][ch]) ? 'NaN' : result[part][ch].toFixed(2) + ' dBm'
    }
  }
}, 500)

onMounted(async () => {
  const experimentConfig = await loadConfig()
  workerTDC = experimentConfig.workers.TDC
  workerMain = experimentConfig.workers.Main
  tdcServer = workerTDC[tdcService]
  tdcFetcher.start()
  dcFetcher.start()
  pmFetcher.start()
  editingDCFetcher.start()
  // updateDopplerStatusInteval = setInterval(updateDopplerStatus, 100)
  syncDopplerStatusInteval = setInterval(syncDopplerStatus, 100)
})
onUnmounted(() => {
  tdcFetcher.stop()
  dcFetcher.stop()
  pmFetcher.stop()
  editingDCFetcher.stop()
  // if (updateDopplerStatusInteval) clearInterval(updateDopplerStatusInteval)
  if (syncDopplerStatusInteval) clearInterval(syncDopplerStatusInteval)
})

</script>
<style lang="sass" scoped>
.device-info-main
  :deep(.q-field__control)
    background-color: rgba(0, 0, 0, 0)
    height: 36px
    padding-left: 0px
    padding-right: 0px

.device-info-second
  :deep(.q-field__control)
    background-color: rgba(0, 0, 0, 0)
    height: 24px
    padding-left: 0px
    padding-right: 0px

.histogram-card
  margin: 8px
  :deep(.q-card__section--vert)
    padding: 8px
    padding-bottom: 0px

.add-detailed-info-item
  width: 600px
  margin-top: 8px
  margin-bottom: 0px
  padding-left: 4px
  margin-right: 12px

.card-grid
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(392px, 1fr))
  gap: 10px

.chart-card
  min-width: 400px
  max-width: 400px

.device-display-unit
  width: 200px
  height: 70px
  border: 4px ridge rgba(171, 170, 150, .6)
  background-color: rgba(231, 230, 230, .6)

:deep(.bg-btn-positive)
  background: rgb(27,200,139)
:deep(.bg-btn-negative)
  background: rgb(133,135,150)
:deep(.bg-card-head)
  background: rgb(244,245,248)

.bsp
  padding-left: 0px
  padding-right: 0px

:deep(.q-field__inner)
  padding-left: 0px
  padding-right: 0px

:deep(.q-field__control-container)
  padding-left: 0px
  padding-right: 0px

:deep(.q-field__native)
  padding-top: 0px
  padding-bottom: 0px

.channel-info-input-review
  margin-top: 8px
  margin-left: 10px
  margin-right: 10px
  :deep(.q-field__control)
    width: 230px
  :deep(.q-field__bottom)
    width: 0px
    height: 0px
    visibility: hidden

</style>
