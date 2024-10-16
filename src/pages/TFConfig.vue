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
          <q-toggle v-model="tdcToggle.value" @update:model-value="(v) => tdcToggle.set(v)" />
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
        <q-item-label class="text-h6" style="margin-top: 12px;">TDCServer</q-item-label>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section horizontal>
      <q-card-section style="width: 100%;" class="">
        <div class="card-grid">
          <q-card v-for="config in MEConfigs" :key="config[1]" class="chart-card" bordered>
            <q-card-section>
              <div :id="config[1]" class="viewport"></div>
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
const route = useRoute()

const parameters = route.query
const tdcService = parameters['tdcservice'] || null
const collection = parameters['collection'] || null

const tdcToggles = ref([
  { name: 'Post Process', key: 'post-process', value: ref(null), set: (v) => configer.setPostProcessStatus(v) },
  { name: 'Raw Data Store', key: 'raw-data-store', value: ref(null), set: (v) => configer.setRawDataStore(v) },
])
const latestTDCDataTime = ref('')

class Configer {
  constructor(worker, tdcService) {
    this.worker = worker
    this.tdcService = tdcService
    this.running = false
  }

  start() {
    this.running = true
    this.updateConfigs()
  }

  stop() {
    this.running = false
  }

  async updateConfigs() {
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
        const r = await this.worker.Storage.latest(collection, 'FetchTime', 0, { FetchTime: 1 })
        latestTDCDataTime.value = r['FetchTime'].replace('T', ' ').slice(0, - 9)
      } catch (error) { }
    }
    if (this.running) setTimeout(this.updateConfigs.bind(this), 1100)
  }

  async setPostProcessStatus(status) {
    if (tdcService) await worker[tdcService].setRawDataStore(status)
  }

  async setRawDataStore(status) {
    if (tdcService) await worker[tdcService].setRawDataStore(status)
  }
}
const configer = new Configer(worker, tdcService)

onMounted(() => {
  configer.start()
})
onUnmounted(() => {
  configer.stop()
})


const MEConfigs = [
  ['All Pulses', 'meAllPulses', ['All Pulses']],
  ['All Signals', 'meAllSignal', ['All Signals']],
  ['All Ref', 'meRef', ['All Ref']],
  ['Vacuum', 'meVacuum', ['Vacuum']],
  ['X', 'meX', ['X']],
  ['Y', 'meY', ['Y']],
  ['Z', 'meZ', ['Z']],
  ['Sync Alice', 'moSyncAlice', ['Sync Alice']],
  ['Sync Bob', 'moSyncBob', ['Sync Bob']],
  ['Sync Alice Monitor', 'moSyncAliceMonitor', ['Sync Alice Monitor']],
  ['Sync Bob Monitor', 'moSyncBobMonitor', ['Sync Bob Monitor']],
]

</script>
<style lang="sass">
.channel-info-input
  height: 32px
  margin-top: 2px
  margin-bottom: 2px
  .q-field__control
    height: 32px
    padding-left: 6px
    padding-right: 6px

.histogram-card
  margin: 8px
  .q-card__section--vert
    padding: 8px
    padding-bottom: 0px

.histogram-info-item
  width: 160px
  margin-bottom: 8px
  padding-left: 4px
  margin-right: 12px

.histogram-info-label
  height: 36px
  margin-left: 4px
  margin-right: 4px
  padding: 0px

.histogram-info-input
  .q-field__control
    width: 90px

.viewport
  margin-bottom: 8px

.add-detailed-info-item
  width: 600px
  margin-top: 8px
  margin-bottom: 0px
  padding-left: 4px
  margin-right: 12px

.channel-info-input-detail
  .q-field__control
    width: 100px

.channel-info-input-review
  margin-top: 8px
  margin-left: 10px
  margin-right: 10px
  .q-field__control
    width: 180px
  .q-field__bottom
    width: 0px
    height: 0px
    visibility: hidden

.card-grid
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr))
  gap: 10px

.chart-card
  min-width: 100px
  max-width: 400px
</style>
