<template>
  <div class="tdc-encoding-page">
  <q-card class="histogram-card" bordered>
    <q-card-section class="bg-card-head encoding-histogram-head" style="padding-left: 16px; padding-top: 0px; padding-bottom: 8px;">
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
      <div class="encoding-deprecation-hint q-mt-sm">
        This page is about to be deprecated, please use page
        <router-link :to="encoding2Location">Encoding 2.0</router-link>
        instead.
      </div>
    </q-card-section>
    <q-separator v-if="histogramMode == 'review'" />
    <q-card-section v-if="histogramMode == 'review'" style="height: 48px; padding-left: 16px; padding-top: 0px;">
      <div class="row">
        <div class="" style="margin-top: 14px; font-weight: bold; margin-right: 6px"> Review from </div>
        <q-input class="channel-info-input channel-info-input-review" v-model="reviewTimeBeginModel.formatted" square
          outlined input-class="text-center" @blur="onReviewTimeBeginEditted(true)"
          @keyup.enter="onReviewTimeBeginEditted(true)"
          @keyup.esc="reviewTimeBeginModel.formatted = ''; onReviewTimeBeginEditted(true);"
          @update:model-value="onReviewTimeBeginEditted(false)" :error="!reviewTimeBeginModel.valid" error-message=""
          no-error-icon></q-input>
        <div class="" style="margin-top: 14px; font-weight: bold; margin-left: 6px; margin-right: 6px;"> to </div>
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
      <q-card-section>
        <!-- <div class="row">
          <q-card v-for="histogramInfo in histogramInfos" :key="histogramInfo.name"
            class="row histogram-info-item items-center justify-between"
            style="padding-left: 6px; padding-right: 0px; margin-right: 12px">
            <div class="q-pa-md row histogram-info-label" style="font-weight: bold;">
              <div class="self-center">{{ histogramInfo.label }}</div>
            </div>
            <div class="q-pa-md col histogram-info-label">
              <q-input class="channel-info-input" v-model="histogramInfo.formattedValue" square outlined
                @focus="onHistogramConfigEditorFocus(histogramInfo)" @blur="onHistogramConfigEditorBlur(histogramInfo)"
                @keyup.enter="onHistogramConfigEditorEnter(histogramInfo)"
                @keyup.esc="onHistogramConfigEditorEscape(histogramInfo)" :ref="(el) => histogramInfo.element = el"
                input-class="text-right" :readonly="!histogramConfigEditable"></q-input>
            </div>
            <div v-if="histogramInfo.tail" class="q-pa-md row histogram-info-label" style="padding-right: 4px;">
              <div class="self-center">{{ histogramInfo.tail }}</div>
            </div>
          </q-card>
        </div> -->
        <div class="row">
          <div class="" style="margin-top: 14px; font-weight: bold; margin-right: 6px"> Pulse </div>
          <div class="" style="margin-top: 14px; margin-right: 6px"> from </div>
          <q-input v-model="mp00" input-class="text-center" class="marker-info-input" square outlined
            @blur="onMarkPointEditorBlur(0, 0)" @keyup.enter="onMarkPpointEditorEnter(0, 0)"
            @keyup.esc="onMarkPointEditorEscape(0, 0)"></q-input>
          <div class="" style="margin-top: 14px; margin-left: 6px; margin-right: 6px;"> ns to </div>
          <q-input v-model="mp01" input-class="text-center" class="marker-info-input" square outlined
            @blur="onMarkPointEditorBlur(0, 1)" @keyup.enter="onMarkPpointEditorEnter(0, 1)"
            @keyup.esc="onMarkPointEditorEscape(0, 1)"></q-input>
          <div class="" style="margin-top: 14px; margin-left: 6px; margin-right: 6px;"> ns, </div>
          <div class="" style="margin-top: 14px; font-weight: bold; margin-right: 6px"> Vacuum </div>
          <div class="" style="margin-top: 14px; margin-right: 6px"> from </div>
          <q-input v-model="mp10" input-class="text-center" class="marker-info-input" square outlined
            @blur="onMarkPointEditorBlur(1, 0)" @keyup.enter="onMarkPpointEditorEnter(1, 0)"
            @keyup.esc="onMarkPointEditorEscape(1, 0)"></q-input>
          <div class="" style="margin-top: 14px; margin-left: 6px; margin-right: 6px;"> ns to </div>
          <q-input v-model="mp11" input-class="text-center" class="marker-info-input" square outlined
            @blur="onMarkPointEditorBlur(1, 1)" @keyup.enter="onMarkPpointEditorEnter(1, 1)"
            @keyup.esc="onMarkPointEditorEscape(1, 1)"></q-input>
          <div class="" style="margin-top: 14px; margin-left: 6px; margin-right: 6px;"> ns. </div>
        </div>
      </q-card-section>
    </q-card-section>
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
      <q-card v-for="reportInfo in reportInfos" :key="reportInfo.key" class="row"
        style="margin-top: 8px; margin-bottom: 0px; padding-left: 4px; padding-right: 4px; margin-right: 12px; width: 410px">
        <div class="q-pa-md row histogram-info-label" style="font-weight: bold; margin-right: 8px; width: 270px">
          <div class="col self-center text-right"> {{ reportInfo.title + ': ' }} </div>
        </div>
        <q-input v-model="reportInfo.value" class="channel-info-input" square outlined readonly input-class="text-right"
          style="width: 120px">
          <q-tooltip :delay="3000" anchor="center right" self="center left" class="text-h2">
            {{ reportInfo.value }}
          </q-tooltip>
        </q-input>
      </q-card>
    </q-card-section>
  </q-card>
  <q-card class="tdc-viewer-help-card" bordered>
    <q-card-section class="bg-card-head tdc-viewer-help-head row items-center no-wrap"
      style="padding-left: 16px; padding-right: 8px; min-height: 48px">
      <q-item-label class="text-h6">Help</q-item-label>
      <q-space />
      <q-btn flat dense round :icon="helpExpanded ? 'expand_less' : 'expand_more'" color="grey-8"
        @click="toggleHelpExpanded" aria-label="Toggle help panel">
        <q-tooltip anchor="center left" self="center right">{{ helpExpanded ? 'Collapse' : 'Expand' }}</q-tooltip>
      </q-btn>
    </q-card-section>
    <q-slide-transition>
      <div v-show="helpExpanded">
        <q-separator />
        <q-card-section class="tdc-viewer-help-section">
          <q-banner v-if="helpMdError" dense class="bg-warning text-dark">{{ helpMdError }}</q-banner>
          <div v-else-if="helpMdLoading" class="text-grey-7 q-py-sm">Loading…</div>
          <div v-else ref="helpMdBodyEl" class="tdc-viewer-md-body" v-html="helpMdHtml"></div>
        </q-card-section>
      </div>
    </q-slide-transition>
  </q-card>
  </div>
</template>

<script setup>
import { ref, computed, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router'
import { Histogram, TDCStorageStreamFetcher, linspace, parseDateString } from '../services/IFExp'
import moment from 'moment';
import Plotly from 'plotly.js-dist-min'
import { loadConfig } from 'src/services/Config';
import { renderAccessMarkdown } from 'src/utils/accessMarkdown';
import { enhanceMarkdownFenceCopyButtons } from 'src/utils/accessMarkdownFenceEnhance';
const route = useRoute()
const encoding2Location = computed(() => ({
  path: '/tdcencoding20',
  query: { ...route.query },
}))
const numberFormat = new Intl.NumberFormat('ja-JP')
let workerTDC = null

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

const HELP_EXPANDED_STORAGE_KEY = 'tdcencoding_help_expanded'

function loadHelpExpandedPreference() {
  try {
    const raw = localStorage.getItem(HELP_EXPANDED_STORAGE_KEY)
    if (raw === null) return true
    return raw === '1' || raw === 'true'
  } catch {
    return true
  }
}

const helpExpanded = ref(loadHelpExpandedPreference())

function toggleHelpExpanded() {
  helpExpanded.value = !helpExpanded.value
  try {
    localStorage.setItem(HELP_EXPANDED_STORAGE_KEY, helpExpanded.value ? '1' : '0')
  } catch {
    /* ignore */
  }
}

const helpMdHtml = ref('')
const helpMdError = ref('')
const helpMdLoading = ref(false)
const helpMdBodyEl = ref(null)

watch([helpMdHtml, helpMdLoading, helpMdError], async () => {
  await nextTick()
  if (helpMdLoading.value || helpMdError.value || !helpMdHtml.value.trim()) return
  enhanceMarkdownFenceCopyButtons(helpMdBodyEl.value)
})

async function loadHelpMarkdown() {
  helpMdError.value = ''
  helpMdHtml.value = ''
  helpMdLoading.value = true
  const path = '/configs/TDCEncoding.md'
  try {
    const res = await fetch(path + '?t=' + Date.now())
    if (!res.ok) {
      helpMdError.value = `Could not load help (HTTP ${res.status}): ${path}`
      return
    }
    const raw = await res.text()
    const html = await renderAccessMarkdown(raw)
    helpMdHtml.value = typeof html === 'string' ? html : String(html)
  } catch (e) {
    helpMdError.value = 'Failed to load help: ' + (e && e.message ? e.message : String(e))
  } finally {
    helpMdLoading.value = false
  }
}

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
const mp00 = ref(4.5)
const mp01 = ref(5.5)
const mp10 = ref(7.0)
const mp11 = ref(9.0)
const mpMods = [[mp00, mp01], [mp10, mp11]]
const markPoints = [[mp00.value, mp01.value, '#F1E4C6'], [mp10.value, mp11.value, '#D3E4EB']]
function onMarkPointEditorBlur(p0, p1) { onMarkPointChanged(p0, p1) }
function onMarkPpointEditorEnter(p0, p1) { onMarkPointChanged(p0, p1) }
function onMarkPointEditorEscape(p0, p1) { mpMods[p0][p1].value = markPoints[p0][p1] }
function onMarkPointChanged(p0, p1) {
  const value = mpMods[p0][p1].value
  const n = parseFloat(value)
  if (isNaN(n)) {
    mpMods[p0][p1].value = p0 * 2 + p1
    n = p0 * 2 + p1
  }
  markPoints[p0][p1] = n
  saveMarkPointsInfo()
}
const markPointsInfoInited = ref(false)
function saveMarkPointsInfo() {
  if (markPointsInfoInited.value) localStorage.tdcencoding_markpointsinfos = JSON.stringify(mpMods.map(l => { return l.map(i => i.value) }))
}
function loadMarkPointsInfo() {
  const infos = localStorage.tdcencoding_markpointsinfos
  if (infos) {
    const parsedInfos = JSON.parse(infos)
    for (let i = 0; i < mpMods.length; i++) {
      for (let j = 0; j < mpMods[i].length; j++) {
        mpMods[i][j].value = parsedInfos[i][j]
        markPoints[i][j] = parsedInfos[i][j]
      }
    }
  }
  markPointsInfoInited.value = true
}
loadMarkPointsInfo()

const MEHistograms = new Array(MEConfigs.length).fill(0).map(() => { return new Histogram() })

let fetcher = null

onMounted(async () => {
  void loadHelpMarkdown()
  const experimentConfig = await loadConfig()
  workerTDC = experimentConfig.workers.TDC
  fetcher = new TDCStorageStreamFetcher(workerTDC, collection, 500, filter, plot, listener)
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
.tdc-encoding-page
  display: flex
  flex-direction: column
  min-height: 0

.tdc-viewer-help-card
  margin: 8px
  margin-top: 28px
  :deep(.q-card__section--vert)
    padding: 8px
    padding-bottom: 8px

.tdc-viewer-help-section
  padding-top: 12px

.tdc-viewer-md-body
  width: 100%
  box-sizing: border-box
  :deep(h1), :deep(h2), :deep(h3)
    margin: 0.75em 0 0.35em
    font-weight: 600
    line-height: 1.25
  :deep(h1)
    font-size: 1.35rem
  :deep(h2)
    font-size: 1.15rem
  :deep(h3)
    font-size: 1.05rem
  :deep(p)
    margin: 0.5em 0
  :deep(ul), :deep(ol)
    margin: 0.35em 0
    padding-left: 1.35em
  :deep(.access-md-fence-block)
    margin: 0.65em 0
    border-radius: 6px
    overflow: hidden
    background: rgba(0, 0, 0, 0.06)
  :deep(.access-md-fence-header)
    display: flex
    align-items: center
    justify-content: space-between
    gap: 8px
    padding: 6px 12px
    border-bottom: 1px solid rgba(0, 0, 0, 0.08)
    font-family: ui-sans-serif, system-ui, sans-serif
  :deep(.access-md-fence-title)
    flex: 1
    min-width: 0
    font-size: 12px
    line-height: 1.35
    font-weight: 600
    color: rgba(0, 0, 0, 0.55)
  :deep(.access-md-fence-header .access-md-copy-btn)
    position: static
    flex-shrink: 0
  :deep(.access-md-fence-block .access-md-pre-wrap)
    margin: 0
    border-radius: 0
    background: transparent
  :deep(.access-md-fence-block pre.access-md-fence)
    margin: 0
  :deep(.access-md-fence-block .access-md-pre-wrap pre)
    padding: 10px 12px
  :deep(pre.access-md-fence)
    margin: 0.65em 0
    padding: 0
    overflow: visible
    background: transparent
    font-size: 0.85rem
    line-height: 1.45
  :deep(pre.access-md-fence code.hljs)
    display: block
    padding: 10px 12px
    overflow-x: auto
    border-radius: 6px
  :deep(.access-md-pre-wrap)
    position: relative
    margin: 0.65em 0
    border-radius: 6px
    background: rgba(0, 0, 0, 0.06)
  :deep(.access-md-pre-wrap pre)
    margin: 0
    padding: 38px 12px 10px 12px
    overflow: auto
    border-radius: 0
    background: transparent
    font-size: 0.85rem
    line-height: 1.45
  :deep(.access-md-copy-btn)
    position: absolute
    top: 8px
    right: 8px
    z-index: 1
    font-size: 11px
    line-height: 1.2
    padding: 4px 10px
    border-radius: 4px
    border: 1px solid rgba(0, 0, 0, 0.12)
    background: rgba(255, 255, 255, 0.9)
    color: rgba(0, 0, 0, 0.75)
    cursor: pointer
  :deep(.access-md-copy-btn:hover)
    background: #fff
    border-color: rgba(0, 0, 0, 0.22)
  :deep(code)
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
    font-size: 0.9em
  :deep(.katex)
    font-size: 1em
  :deep(.katex-display > .katex)
    font-size: 1.21em
  :deep(p code), :deep(li code)
    padding: 0.1em 0.35em
    border-radius: 4px
    background: rgba(0, 0, 0, 0.06)
    color: var(--pink, #e83e8c)
  :deep(.katex .mathtt),
  :deep(.katex .texttt)
    padding: 0.1em 0.35em
    border-radius: 4px
    background: rgba(0, 0, 0, 0.06)
    color: var(--pink, #e83e8c)
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
    font-size: 0.9em
  :deep(pre code)
    padding: 0
  :deep(blockquote)
    margin: 0.65em 0
    padding: 0.35em 0 0.35em 0.85em
    border-left: 3px solid rgba(0, 0, 0, 0.2)
    color: rgba(0, 0, 0, 0.65)
  :deep(.katex-display)
    overflow-x: auto
    overflow-y: hidden
    padding: 0.35em 0

.channel-info-input
  height: 32px
  margin-top: 2px
  margin-bottom: 2px
  font-size: 1.25rem
  :deep(.q-field__control)
    height: 32px
    padding-left: 6px
    padding-right: 6px
  :deep(.q-field__native)
    padding-top: 0px
    padding-bottom: 0px

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
    width: 220px
  :deep(.q-field__bottom)
    width: 0px
    height: 0px
    visibility: hidden

.marker-info-input
  height: 32px
  margin-top: 8px
  margin-left: 10px
  margin-right: 10px
  margin-bottom: 2px
  font-size: 1.25rem
  :deep(.q-field__control)
    height: 32px
    padding-left: 6px
    padding-right: 6px
    width: 45px
  :deep(.q-field__native)
    padding-top: 0px
    padding-bottom: 0px
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

.encoding-deprecation-hint
  padding-left: 2px
  font-size: 1rem
  line-height: 1.45
  font-weight: 600
  color: #e65100
  :deep(a)
    color: #1565c0
    font-weight: 700
    text-decoration: underline
    text-underline-offset: 2px

:deep(.row)
  margin-left: 0px
  margin-right: 0px
  padding-left: 0px
  padding-right: 0px

:deep(.q-field__inner)
  padding-left: 0px
  padding-right: 0px

:deep(.q-splitter__panel)
  padding-left: 0px
  padding-right: 0px
</style>
