<template>
  <q-card class="histogram-card" bordered>
    <q-card-section class="bg-card-head" style="height: 48px; padding-left: 16px; padding-top: 0px;">
      <div class="row">
        <q-item-label class="text-h6" style="margin-top: 12px;">Encoding Histograms</q-item-label>
        <div class="" style="margin-left: 10px; margin-top: 6px">
          <q-btn-toggle v-model="histogramMode" size="md" toggle-color="btn-positive" color="btn-negative" unelevated
            :options="histogramModeOptions" />
        </div>
        <div class="col text-red" v-if="fetchTimeDelta > 3000"
          style="display: flex; justify-content: right; margin-top: 12px;">
          <q-icon color="red" size="xs" :name="'warning'" style="padding-right: 8px;" />
          The most recent data was fetched {{ numberFormat.format(parseInt(fetchTimeDelta / 1000)) }} s ago.
        </div>
      </div>
    </q-card-section>
    <q-separator v-if="histogramMode == 'review'" />
    <q-card-section v-if="histogramMode == 'review'" style="height: 48px; padding-left: 16px; padding-top: 0px;">
      <div class="row">
        <div class="" style="margin-top: 14px; font-weight: bold;"> Review from
        </div>
        <q-input class="channel-info-input channel-info-input-review" v-model="reviewTimeBeginModel.formatted" square
          outlined input-class="text-center" @blur="onReviewTimeBeginEditted(true)"
          @keyup.enter="onReviewTimeBeginEditted(true)"
          @keyup.esc="reviewTimeBeginModel.formatted = ''; onReviewTimeBeginEditted(true);"
          @update:model-value="onReviewTimeBeginEditted(false)" :error="!reviewTimeBeginModel.valid" error-message=""
          no-error-icon></q-input>
        <div class="" style="margin-top: 14px; font-weight: bold;"> to </div>
        <q-input class="channel-info-input channel-info-input-review" v-model="reviewTimeEndModel.formatted" square
          outlined input-class="text-center" @blur="onReviewTimeEndEditted(true)"
          @keyup.enter="onReviewTimeEndEditted(true)"
          @keyup.esc="reviewTimeEndModel.formatted = ''; onReviewTimeEndEditted(true);"
          @update:model-value="onReviewTimeEndEditted(false)" :error="!reviewTimeEndModel.valid" error-message=""
          no-error-icon></q-input>
        <q-btn style="height: 32px; margin-top: 6px; margin-left: 8px" color="btn-positive" unelevated
          :disabled="!reviewTimeBeginModel.valid || !reviewTimeEndModel.valid || reviewDataPreparing"
          @click="onUpdateReview">Update</q-btn>
        <div class="col text-red" v-if="reviewError['tooManyRecords'] || reviewError['XsNotMatched']"
          style="display: flex; justify-content: right; margin-top: 12px;">
          <q-icon color="red" size="xs" :name="'warning'" style="padding-right: 8px;" />
          {{ (reviewError['tooManyRecords'] ? 'Too Many Records. ' : '') +
            (reviewError['XsNotMatched'] ? 'Histogram Config Not Matched.' : '') }}
        </div>
      </div>
    </q-card-section>
    <q-linear-progress :value="reviewUpdateProgress" class="q-mt-md" style="margin-top: 0px;"
      v-if="reviewUpdateProgress > 0 && reviewUpdateProgress <= 1 && histogramMode == 'review'" animation-speed="300" />
    <q-separator />
    <q-card-section horizontal>
      <q-card-section style="width: 100%; padding-bottom: 8px;" class="">
        <div class="card-grid">
          <q-card v-for="config in MEConfigs" :key="config[1]" class="chart-card" bordered>
            <q-card-section>
              <div :id="config[1]" class="viewport"></div>
            </q-card-section>
          </q-card>
        </div>
      </q-card-section>
    </q-card-section>
    <q-separator />
    <q-card-section style="padding-top: 0px; padding-bottom: 8px">
      <div class="column">
        <q-card v-for="reportInfo in reportInfos" :key="reportInfo.key" class="col row"
          style="margin-top: 8px; margin-bottom: 0px; padding-left: 4px; padding-right: 4px; margin-right: 12px; width: 340px">
          <div class="q-pa-md row histogram-info-label" style="font-weight: bold; margin-right: 8px; width: 200px">
            <div class="col self-center text-right"> {{ reportInfo.title + ': ' }} </div>
          </div>
          <q-input v-model="reportInfo.value" class="channel-info-input" square outlined readonly
            input-class="text-right" style="width: 120px">
            <q-tooltip :delay="3000" anchor="center right" self="center left" class="text-h2">
              {{ reportInfo.value }}
            </q-tooltip>
          </q-input>
        </q-card>
      </div>
    </q-card-section>
  </q-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router'
import worker from '../services/IFWorker'
import { Histogram, TDCStorageStreamFetcher, linspace, parseDateString } from '../services/IFExp'
import moment from 'moment';
import Plotly from 'plotly.js-dist-min'
const route = useRoute()
const numberFormat = new Intl.NumberFormat('ja-JP')

const parameters = route.query
const collection = parameters['collection'] || null
const reportInfos = ref([
  { key: 'SPER', title: 'Signal Pulse Extinction Ratio', value: '' },
  { key: 'VI', title: 'Vacuum / Z', value: '' },
  { key: 'XI', title: 'X / Z', value: '' },
  { key: 'YI', title: 'Y / Z', value: '' },
  { key: 'SRIP', title: 'Signal / Ref (In Pulse)', value: '' },
])
const histogramMode = ref('instant')
const histogramModeOptions = [{ label: 'Instant', value: 'instant' }, { label: 'Review', value: 'review' }]
const histogramConfigEditable = ref(true)
const reviewTimeBeginModel = ref({ value: -1, formatted: '', valid: true })
const reviewTimeEndModel = ref({ value: -1, formatted: '', valid: true, isToNow: false })
const reviewUpdateProgress = ref(0)
const reviewDataPreparing = ref(false)
const reviewError = ref({ tooManyRecords: false, XsNotMatched: false })

const fetchTimeDelta = ref(-1)

watch(histogramMode, (newVelue) => {
  fetcher.changeMode(newVelue == 'review' ? "Stop" : "Instant")
  histogramConfigEditable.value = true
})
function onReviewTimeBeginEditted(finished) {
  const dateString = 'YYYY-MM-DD HH:mm:ss'
  if (reviewTimeBeginModel.value.formatted == '' && finished) reviewTimeBeginModel.value.formatted = moment().format(dateString)
  reviewTimeBeginModel.value.value = parseDateString(reviewTimeBeginModel.value.formatted)
  reviewTimeBeginModel.value.valid = !Number.isNaN(reviewTimeBeginModel.value.value)
  if (finished && reviewTimeBeginModel.value.valid) reviewTimeBeginModel.value.formatted = reviewTimeBeginModel.value.value >= 0 ? moment(reviewTimeBeginModel.value.value).format(dateString) : '';
}
function onReviewTimeEndEditted(finished) {
  const dateString = 'YYYY-MM-DD HH:mm:ss'
  if (reviewTimeEndModel.value.formatted == '' && finished) reviewTimeEndModel.value.formatted = 'now'
  reviewTimeEndModel.value.isToNow = reviewTimeEndModel.value.formatted.toLowerCase() == 'now'
  reviewTimeEndModel.value.value = parseDateString(reviewTimeEndModel.value.formatted)
  reviewTimeEndModel.value.valid = reviewTimeEndModel.value.isToNow ? true : !Number.isNaN(reviewTimeEndModel.value.value)
  if (finished && reviewTimeEndModel.value.valid) reviewTimeEndModel.value.formatted = (reviewTimeEndModel.value.isToNow ? 'NOW' : (reviewTimeEndModel.value.value >= 0 ? moment(reviewTimeEndModel.value.value).format(dateString) : ''));
}
function onUpdateReview() {
  reviewDataPreparing.value = true
  const beginTime = new Date(reviewTimeBeginModel.value.value)
  const endTime = reviewTimeEndModel.value.isToNow ? new Date() : new Date(reviewTimeEndModel.value.value)
  const isToNow = reviewTimeEndModel.value.isToNow
  const valid = reviewTimeBeginModel.value.valid && reviewTimeEndModel.value.valid
  histogramConfigEditable.value = isToNow
  if (valid) fetcher.updateIntegralData(beginTime, endTime, isToNow)
  reviewDataPreparing.value = false
}

const filter = {
  'Data.Counter': 1,
  'Data.TFQKDEncoding': 1,
  'Data.TFQKDSyncAlice': 1,
  'Data.TFQKDSyncBob': 1,
  'Data.TFQKDSyncAliceMonitor': 1,
  'Data.TFQKDSyncBobMonitor': 1,
}
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
const markPoints = [[4.5, 5.5, '#F1E4C6'], [7, 9.0, '#D3E4EB']]

const fillTrace = []
for (const markPoint of markPoints) {
  fillTrace.push({
    x: [markPoint[0], markPoint[0], markPoint[1], markPoint[1]],
    y: [-1e10, 1e10, 1e10, -1e10],
    fill: 'toself',
    type: 'scatter',
    mode: 'none',
    hoverinfo: 'none',
    fillcolor: markPoint[2],
  })
}

const MEHistograms = new Array(MEConfigs.length).fill(0).map(() => { return new Histogram() })

const fetcher = new TDCStorageStreamFetcher(worker, collection, 500, filter, plot, listener)

onMounted(() => {
  fetcher.start()
})
onUnmounted(() => {
  fetcher.stop()
})

function listener(event, arg) {
  if (event == 'FetchTimeDelta') fetchTimeDelta.value = arg
  else if (event == 'FetchingProgress') reviewUpdateProgress.value = arg
  else if (event == 'HistogramXsMatched') reviewError.value['XsNotMatched'] = !arg
  else if (event == 'TooManyRecords') reviewError.value['tooManyRecords'] = arg
  else if (event == 'FetchingNumber') { }
  else console.log(event + ', ' + arg);
}

function plot(result, append) {
  const plotStart = new Date().getTime()
  const layout = {
    xaxis: { title: 'Time (ns)' },
    yaxis: { title: 'Count' },
    margin: { l: 50, r: 30, b: 50, t: 30, pad: 4 },
    // width: 300,
    height: 250,
    showlegend: false,
    autosize: true,
  }
  const traces = []
  if (result == null) {
    for (const histogram of MEHistograms) {
      histogram.clear()
      traces.push({ x: [0], y: [0], type: 'scatter', name: '' })
    }
  } else {
    const configuration = result['Data']['TFQKDEncoding']['Configuration']
    const xs = linspace(0, configuration['Period'] / 1000.0, configuration['BinCount'])
    let histogramXsMatched = true
    if (!append) MEHistograms.map(h => h.clear())
    const meData = result['Data']['TFQKDEncoding']
    for (const i in MEConfigs) {
      const hisIs = MEConfigs[i][2]
      if (MEConfigs[i][1].startsWith('me')) {
        for (var j = 0; j < hisIs.length; j++) {
          var his = meData['Histogram[' + hisIs[j] + ']']
          MEHistograms[i].append(xs, his)
        }
      } else {
        var moData = result['Data']['TFQKD' + MEConfigs[i][2][0].replaceAll(' ', '')]
        var moXs = linspace(0, moData['Configuration']['Period'] / 1000.0, moData['Configuration']['BinCount'])
        var his = moData['Histogram[' + MEConfigs[i][2][0] + ']']
        MEHistograms[i].append(moXs, his)
      }
      traces.push({
        x: MEHistograms[i].xs,
        y: MEHistograms[i].ys,
        type: 'scatter',
        name: 'Trace',
        line: { color: '#2874A6' }
      })
    }
    for (var i = 0; i < MEHistograms.length; i++) {
      histogramXsMatched &= MEHistograms[i].xsMatch
    }
    listener('HistogramXsMatched', histogramXsMatched)

    // deal with reports
    updateReports(result, MEHistograms)
  }
  for (let i = 0; i < MEConfigs.length; i++) {
    layout['title'] = MEConfigs[i][0]
    layout['yaxis']['range'] = [0, Math.max(...traces[i]['y']) * 1.05]
    const div = MEConfigs[i][1]
    const data = fillTrace.concat([traces[i]])
    Plotly.react(div, data, layout, {
      displaylogo: false,
      responsive: true
    })
    Plotly.redraw(div)
  }
  var plotStop = new Date().getTime()
  // console.log('plot done in ' + (plotStop - plotStart) + ' ms')
}

async function updateReports(result, histograms) {
  const regionValues = calculateRegionValues(result, MEHistograms)
  const signalPulseExtinctionRatio = (regionValues['All Signals'][0] / regionValues['All Signals'][1])
  const vacuumsCountRate = regionValues['Vacuum'][0] / regionValues['Vacuum'][2]
  const ZCountRate = regionValues['Z'][0] / regionValues['Z'][2]
  const XCountRate = regionValues['X'][0] / regionValues['X'][2]
  const YCountRate = regionValues['Y'][0] / regionValues['Y'][2]
  const signalRefRatioInPulse = (regionValues['All Signals'][0] / regionValues['All Signals'][2] / regionValues['All Ref'][0] * regionValues['All Ref'][2])

  reportInfos.value[0].value = (10 * Math.log10(signalPulseExtinctionRatio)).toFixed(3) + ' dB'
  reportInfos.value[1].value = (10 * Math.log10(vacuumsCountRate / (ZCountRate))).toFixed(2) + ' dB'
  reportInfos.value[2].value = (XCountRate / ZCountRate).toFixed(3)
  reportInfos.value[3].value = (YCountRate / ZCountRate).toFixed(3)
  reportInfos.value[4].value = (10 * Math.log10(signalRefRatioInPulse)).toFixed(3) + ' dB'
}

function calculateRegionValues(result, histograms) {
  const regionValues = {}
  const regionWidths = markPoints.map(markPoint => markPoint[1] - markPoint[0])
  MEConfigs.map((config, i) => {
    const regionValue = markPoints.map(markPoint => histograms[i].xs.map((x, j) => [x, histograms[i].ys[j]]).filter(z => z[0] >= markPoint[0] && z[0] < markPoint[1]).map(z => z[1]).reduce((a, b) => a + b, 0))
    const correspondingPulseCount = config[2].map(r => result['Data']['TFQKDEncoding']['PulseCount[' + r + ']']).reduce((a, b) => a + b, 0)
    return regionValue.map((v, i) => v / regionWidths[i]).concat([correspondingPulseCount])
  }).map((v, i) => regionValues[MEConfigs[i][0]] = v)
  return regionValues
}

</script>
<style lang="sass" scoped>
.channel-info-input
  height: 32px
  margin-top: 2px
  margin-bottom: 2px
  :deep(.q-field__control)
    height: 32px
    padding-left: 6px
    padding-right: 6px

.histogram-card
  margin: 8px
  :deep(.q-card__section--vert)
    padding: 8px
    padding-bottom: 0px

.histogram-info-label
  height: 36px
  margin-left: 4px
  margin-right: 4px
  padding: 0px

.viewport
  margin-bottom: 8px

.channel-info-input-review
  margin-top: 8px
  margin-left: 10px
  margin-right: 10px
  :deep(.q-field__control)
    width: 180px
  :deep(.q-field__bottom)
    width: 0px
    height: 0px
    visibility: hidden

.card-grid
  display: grid
  grid-template-columns: repeat(auto-fill, minmax(500px, 1fr))
  gap: 10px

:deep(.bg-btn-positive)
  background: rgb(27,200,139)
:deep(.bg-btn-negative)
  background: rgb(133,135,150)
:deep(.bg-card-head)
  background: rgb(244,245,248)
</style>
