<template>
  <q-card class="histogram-card" bordered>
    <q-card-section class="bg-card-head" style="height: 48px; padding-left: 16px; padding-top: 0px;">
      <div class="row">
        <q-item-label class="text-h6" style="margin-top: 12px;">TDCServer Execution Time</q-item-label>
      </div>
    </q-card-section>
    <q-separator />
    <q-card-section horizontal>
      <q-card-section style="width: 100%;">
        <div id="viewport"></div>
      </q-card-section>
    </q-card-section>
    <q-separator />
  </q-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router'
import worker from '../services/IFWorker'
import { SimpleFetcher } from 'src/services/IFExp';
import Plotly from 'plotly.js-dist-min'
const route = useRoute()

const parameters = route.query
const collection = parameters['collection'] || null

const tdcFetcher = new SimpleFetcher(async () => {
  if (collection) {
    try {
      // const r = await worker.Storage.latest(collection, 'FetchTime', 0, { FetchTime: 1 })
      // latestTDCDataTime.value = r['FetchTime'].replace('T', ' ').slice(0, - 9)
      const data = await worker.Storage.latest(collection, 'FetchTime', null, { 'Data.ExecutionTimes': 1 }, 60)
      const executionTimes = data.map(d => d.Data.ExecutionTimes)
      if (data.length > 0) {
        const keys = Object.keys(executionTimes[0])
        const traces = []
        keys.forEach(key => {
          traces.push({
            x: data.map(i => i.FetchTime),
            y: executionTimes.map(i => i[key]),
            type: 'scatter',
            name: key
          })
        })
        Plotly.react('viewport', traces, {
          xaxis: { title: 'Time' }, yaxis: { title: 'Exe Time (s)' },
          margin: { l: 50, r: 30, b: 50, t: 30, pad: 4 },
          autosize: true, uirevision: true
        })
        Plotly.redraw('viewport')
      }
    } catch (error) {
      console.log(error);
    }
  }
}, 5000)

onMounted(() => {
  tdcFetcher.start()
})
onUnmounted(() => {
  tdcFetcher.stop()
})

</script>
<style lang="sass" scoped>
.histogram-card
  margin: 8px
  :deep(.q-card__section--vert)
    padding: 8px
    padding-bottom: 0px

#viewport
  margin-bottom: 8px

:deep(.bg-btn-positive)
  background: rgb(27,200,139)
:deep(.bg-btn-negative)
  background: rgb(133,135,150)
:deep(.bg-card-head)
  background: rgb(244,245,248)

</style>
