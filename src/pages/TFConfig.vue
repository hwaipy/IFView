<template>
  <q-card class="histogram-card" bordered>
    <q-card-section style="height: 48px; padding-left: 16px; padding-top: 0px;">
      <div class="row">
        <q-item-label class="text-h6" style="margin-top: 12px;">TDCServer</q-item-label>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section horizontal>
      <q-card-section style="width: 100%;" class="row">
        <q-card v-for="tdcToggle in tdcToggles" :key="tdcToggle.key" class="row items-center justify-between"
          style="margin-top: 0px; margin-bottom: 8px; padding-left: 4px; padding-right: 4px; margin-right: 12px">
          <q-toggle v-model="tdcToggle.value" @update:model-value="(v) => tdcToggle.set(v)" size="xs" />
          <div class="q-pa-md row histogram-info-label" style="font-weight: bold; margin-right: 8px;">
            <div class="col self-center"> {{ tdcToggle.name }} </div>
          </div>
        </q-card>
        <q-card class="row items-center justify-between"
          style="margin-top: 0px; margin-bottom: 8px; padding-left: 4px; padding-right: 4px; margin-right: 12px">
          <div class="q-pa-md row histogram-info-label" style="font-weight: bold; margin-right: 8px;">
            <div class="col self-center"> Latest data: {{ latestTDCDataTime }} </div>
          </div>
        </q-card>
      </q-card-section>
    </q-card-section>
    <q-separator />
    <q-card-section style="height: 48px; padding-left: 16px; padding-top: 0px;">
      <div class="row">
        <q-item-label class="text-h6" style="margin-top: 12px;">DC Control</q-item-label>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section horizontal>
      <q-card-section style="width: 100%; margin-bottom: 8px" class="">
        <div class="card-grid">
          <q-card v-for="info in dcDeviceInfos" :key="info.deviceID + '-' + info.ch"
            :class="['chart-card', info.valid ? '' : 'disabled']" bordered>
            <q-card-section class="row" style="height: 40px; padding: 0px;">
              <q-toggle v-model="info.output" @update:model-value="(v) => { info.switchDevice(v) }" size="xs" />
              <q-item-label class="text-body2 text-weight-bold" style="margin-top: 13px; margin-left: 4px;">
                {{ info.description }}
              </q-item-label>
              <div class="col text-caption"
                style="display: flex; justify-content: right; margin-top: 13px; margin-right: 8px;">
                {{ info.deviceID + '-' + info.ch }}
              </div>
            </q-card-section>
            <q-separator />
            <q-card-section class="row" style="padding-bottom: 8px; padding-right: 0px;">
              <div class="col row">
                <div class="device-display-unit column" style="margin-right: 8px">
                  <div class="col row">
                    <div class="" style="margin-left: 6px; margin-right: 4px; margin-top: 18px; font-size: 14px">Vset
                    </div>
                    <q-input v-model="info.VSetDisplay" class="device-info-main" input-class="text-right" square
                      borderless style="width: 114px; font-size: 36px; margin-top: 4px;" mask="##.###"
                      @focus="onVSetFocus(info)" @blur="onVSetBlur(info)" @keyup.enter="onVSetEnter(info)"
                      @keyup.esc="onVSetEscape(info)" :ref="(el) => info.element = el"
                      @keydown.arrow-up="(e) => onVSetAdjust(info, e, true)"
                      @keydown.arrow-down="(e) => onVSetAdjust(info, e, false)"></q-input>
                    <div class="" style="margin-left: 4px; margin-right: 0px; margin-top: 13px; font-size: 18px">V</div>
                  </div>
                  <div class="col row">
                    <div class="" style="margin-left: 6px; margin-right: 4px; margin-top: 10px; font-size: 14px">Vact
                    </div>
                    <q-input v-model="info.VAct" class="device-info-second" input-class="text-right" square borderless
                      readonly style="width: 114px; font-size: 20px; margin-top: 8px;"></q-input>
                    <div class="" style="margin-left: 4px; margin-right: 0px; margin-top: 6px; font-size: 18px">V</div>
                  </div>
                </div>
              </div>
              <div class="col row">
                <div class="device-display-unit column" style="margin-right: 8px">
                  <div class="col row">
                    <div class="" style="margin-left: 6px; margin-right: 4px; margin-top: 18px; font-size: 14px">Iact
                    </div>
                    <q-input v-model="info.IAct" class="device-info-main" input-class="text-right" square borderless
                      readonly style="width: 114px; font-size: 36px; margin-top: 4px;"></q-input>
                    <div class="" style="margin-left: 4px; margin-right: 0px; margin-top: 13px; font-size: 18px">A</div>
                  </div>
                  <div class="col row">
                    <div class="" style="margin-left: 6px; margin-right: 4px; margin-top: 10px; font-size: 14px">Ilim
                    </div>
                    <q-input v-model="info.ILim" class="device-info-second" input-class="text-right" square borderless
                      readonly style="width: 114px; font-size: 20px; margin-top: 8px;"></q-input>
                    <div class="" style="margin-left: 4px; margin-right: 0px; margin-top: 6px; font-size: 18px">A</div>
                  </div>
                </div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>
    </q-card-section>
    <q-separator />
    <q-card-section style="height: 48px; padding-left: 16px; padding-top: 0px;">
      <div class="row">
        <q-item-label class="text-h6" style="margin-top: 12px;">Power & Polarization</q-item-label>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section horizontal>
      <q-card-section style="width: 100%; margin-bottom: 8px" class="">
        <div class="card-grid">
          <q-card v-for="info in powerMonitorInfos" :key="info.name" bordered class="chart-card">
            <q-card-section class="row" style="height: 40px; padding: 0px;">
              <q-item-label class="text-body2 text-weight-bold" style="margin-top: 13px; margin-left: 14px;">
                {{ info.title }}
              </q-item-label>
            </q-card-section>
            <q-separator />
            <q-card-section class="row" style="padding-bottom: 8px;">
              <div class="col row">
                <div style="font-size: 30px; width: 175px; text-align: center; margin-right: 20px;">
                  {{ info.powers[0]
                  }}</div>
                <div style="font-size: 30px; width: 175px; text-align: center;">{{ info.powers[1]
                  }}</div>
              </div>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router'
import worker from '../services/IFWorker'
import { SimpleFetcher } from 'src/services/IFExp';
const route = useRoute()

const parameters = route.query
const tdcService = parameters['tdcservice'] || null
const collection = parameters['collection'] || null

const tdcToggles = ref([
  { name: 'Post Process', key: 'post-process', value: ref(null), set: (v) => setPostProcessStatus(v) },
  { name: 'Raw Data Store', key: 'raw-data-store', value: ref(null), set: (v) => setRawDataStore(v) },
])
const latestTDCDataTime = ref('')

const dcDeviceIDs = ["TF_PowerSupply_Alice_1", "TF_PowerSupply_Alice_2", "TF_PowerSupply_Alice_3", "TF_PowerSupply_Alice_4", "TF_PowerSupply_Bob_1", "TF_PowerSupply_Bob_2", "TF_PowerSupply_Bob_3", "TF_PowerSupply_Bob_4"]
const dcDeviceDefines = {
  "TF_PowerSupply_Alice_1": {
    0: { description: "Alice 风扇电源", protection: 25 },
    1: { description: "Alice AWG_1 电源", protection: 13 },
    2: { description: "Alice 时钟板电源", protection: 6 }
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
    0: { description: "Alice PM 放大器供电", protection: 6 },
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
      switchDevice: async (v) => await worker[id].setOutputStatus(parseInt(ch), v), VSetEditing: false, element: null
    })
  }
}
const powerMonitorInfos = ref([
  { name: 'Alice', title: 'Power Meter Alice', powers: ['NaN', 'NaN'] },
  { name: 'Bob', title: 'Power Meter Alice', powers: ['NaN', 'NaN'] },
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
    await worker[info.deviceID].setVoltage(parseInt(info.ch), Math.min(newValue, info.protection))
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
  await worker[info.deviceID].setVoltage(parseInt(info.ch), v)
}

async function setPostProcessStatus(status) {
  if (tdcService) await worker[tdcService].setRawDataStore(status)
}

async function setRawDataStore(status) {
  if (tdcService) await worker[tdcService].setRawDataStore(status)
}

const tdcFetcher = new SimpleFetcher(async () => {
  if (tdcService) {
    try {
      tdcToggles.value[0].value = await worker[tdcService].getPostProcessStatus()
    } catch (error) {
      tdcToggles.value[0].value = null
    }
    try {
      tdcToggles.value[1].value = await worker[tdcService].isRawDataStore()
    } catch (error) {
      tdcToggles.value[1].value = null
    }
  }
  if (collection) {
    try {
      const r = await worker.Storage.latest(collection, 'FetchTime', 0, { FetchTime: 1 })
      latestTDCDataTime.value = r['FetchTime'].replace('T', ' ').slice(0, - 9)
    } catch (error) { }
  }
}, 1100)
async function doFetchDC(deviceID) {
  try {
    const VSets = await worker[deviceID].getVoltageSetpoints()
    const VActs = await worker[deviceID].measureVoltages()
    const IActs = await worker[deviceID].measureCurrents()
    const ILims = await worker[deviceID].getCurrentLimits()
    const outputs = await worker[deviceID].getOutputStatuses()
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
  try { result.push(await worker.TF_PowerMeter_Alice.readPower()) }
  catch (error) { result.push([Number.NaN, Number.NaN]); console.log(error); }
  try { result.push(await worker.TF_PowerMeter_Bob.readPower()) }
  catch (error) { result.push([Number.NaN, Number.NaN]); console.log(error); }
  try { result.push(await worker.TF_PowerMeter_Senders.readPower()) }
  catch (error) { result.push([Number.NaN, Number.NaN]); console.log(error); }
  for (const part in result) {
    for (const ch in result[part]) {
      powerMonitorInfos.value[part].powers[ch] = Number.isNaN(result[part][ch]) ? 'NaN' : result[part][ch].toFixed(2) + ' dB'
    }
  }
}, 500)

onMounted(() => {
  tdcFetcher.start()
  dcFetcher.start()
  pmFetcher.start()
  editingDCFetcher.start()
})
onUnmounted(() => {
  tdcFetcher.stop()
  dcFetcher.stop()
  pmFetcher.stop()
  editingDCFetcher.stop()
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
  min-width: 392px
  max-width: 392px

.device-display-unit
  width: 196px
  height: 70px
  border: 4px ridge rgba(171, 170, 150, .6)
  background-color: rgba(231, 230, 230, .6)

</style>
