<template>
  <div class="tdc-encoding20-page">
  <q-card class="histogram-card" bordered>
    <q-card-section class="bg-card-head" style="height: 48px; padding-left: 16px; padding-top: 0px;">
      <div class="row">
        <q-item-label class="text-h6" style="margin-top: 12px;">Encoding Histograms 2.0</q-item-label>
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
    <q-card-section class="report-two-col-section" style="padding-top: 0px; padding-bottom: 8px">
      <div class="row q-col-gutter-md">
        <div class="col-12 col-md-6">
          <div class="report-col-head text-subtitle1 q-mb-sm">Alice <span class="text-caption text-grey-7">(Encoding)</span></div>
          <q-card v-for="reportInfo in reportInfosAlice" :key="'a-' + reportInfo.key" class="row report-metric-row">
            <div class="q-pa-md row histogram-info-label" style="font-weight: bold; margin-right: 8px; flex: 1; min-width: 0">
              <div class="col self-center text-right text-no-wrap ellipsis"> {{ reportInfo.title + ': ' }} </div>
            </div>
            <q-input v-model="reportInfo.value" class="channel-info-input" square outlined readonly input-class="text-right"
              style="width: 120px; flex-shrink: 0">
              <q-tooltip :delay="3000" anchor="center right" self="center left" class="text-h2">
                {{ reportInfo.value }}
              </q-tooltip>
            </q-input>
          </q-card>
        </div>
        <div class="col-12 col-md-6">
          <div class="report-col-head text-subtitle1 q-mb-sm">Bob <span class="text-caption text-grey-7">(Encoding2)</span></div>
          <q-card v-for="reportInfo in reportInfosBob" :key="'b-' + reportInfo.key" class="row report-metric-row">
            <div class="q-pa-md row histogram-info-label" style="font-weight: bold; margin-right: 8px; flex: 1; min-width: 0">
              <div class="col self-center text-right text-no-wrap ellipsis"> {{ reportInfo.title + ': ' }} </div>
            </div>
            <q-input v-model="reportInfo.value" class="channel-info-input" square outlined readonly input-class="text-right"
              style="width: 120px; flex-shrink: 0">
              <q-tooltip :delay="3000" anchor="center right" self="center left" class="text-h2">
                {{ reportInfo.value }}
              </q-tooltip>
            </q-input>
          </q-card>
        </div>
      </div>
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
import { ref, onMounted, onUnmounted, watch, nextTick } from 'vue';
import { useRoute } from 'vue-router'
import { Histogram, TDCStorageStreamFetcher, linspace, parseDateString } from '../services/IFExp'
import moment from 'moment';
import Plotly from 'plotly.js-dist-min'
import { loadConfig } from 'src/services/Config';
import { renderAccessMarkdown } from 'src/utils/accessMarkdown';
import { enhanceMarkdownFenceCopyButtons } from 'src/utils/accessMarkdownFenceEnhance';
const route = useRoute()
const numberFormat = new Intl.NumberFormat('ja-JP')
let workerTDC = null

const parameters = route.query
const collection = parameters['collection'] || null
const reportRowDefs = [
  { key: 'SPER', title: 'Signal Pulse Extinction Ratio' },
  { key: 'VI', title: 'Vacuum / Z' },
  { key: 'XI', title: 'X / Z' },
  { key: 'YI', title: 'Y / Z' },
  { key: 'SRIP', title: 'Signal / Ref (In Pulse)' },
]
const reportInfosAlice = ref(reportRowDefs.map((r) => ({ ...r, value: '' })))
const reportInfosBob = ref(reportRowDefs.map((r) => ({ ...r, value: '' })))
const histogramMode = ref('instant')
const histogramModeOptions = [{ label: 'Instant', value: 'instant' }, { label: 'Review', value: 'review' }]
const histogramConfigEditable = ref(true)
const reviewTimeBeginModel = ref({ value: -1, formatted: '', valid: true })
const reviewTimeEndModel = ref({ value: -1, formatted: '', valid: true, isToNow: false })
const reviewUpdateProgress = ref(0)
const reviewDataPreparing = ref(false)
const reviewError = ref({ tooManyRecords: false, XsNotMatched: false })

const fetchTimeDelta = ref(-1)

const HELP_EXPANDED_STORAGE_KEY = 'tdcencoding20_help_expanded'

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
  const path = '/configs/TDCEncoding2.md'
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
  'Data.TFQKDEncoding2': 1,
  'Data.TFQKDSyncAlice': 1,
  'Data.TFQKDSyncBob': 1,
}
const MEConfigs = [
  ['All Pulses', 'meAllPulses', ['All Pulses']],
  ['All Signals', 'meAllSignal', ['All Signals']],
  ['All Ref', 'meRef', ['All Ref']],
  ['Vacuum', 'meVacuum', ['Vacuum']],
  ['X', 'meX', ['X']],
  ['Y', 'meY', ['Y']],
  ['Z', 'meZ', ['Z']],
  ['sync', 'moSyncAliceBob', ['Sync Alice', 'Sync Bob']],
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
  if (markPointsInfoInited.value) localStorage.tdcencoding20_markpointsinfos = JSON.stringify(mpMods.map(l => { return l.map(i => i.value) }))
}
function loadMarkPointsInfo() {
  const infos = localStorage.tdcencoding20_markpointsinfos
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
const MEHistograms2 = new Array(MEConfigs.length).fill(0).map(() => { return new Histogram() })

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

function maxYInTraces(traceList) {
  let m = 0
  for (const t of traceList) {
    if (Array.isArray(t.y) && t.y.length) m = Math.max(m, ...t.y)
  }
  return m
}

/** Plot title: capitalize first letter of each whitespace-separated word. */
function chartTitleDisplay(raw) {
  if (raw == null || raw === '') return ''
  return String(raw)
    .split(/\s+/)
    .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
    .join(' ')
}

/** Legend label: Configuration.SignalChannel as CHxx, else CH01 / CH02 from stream index. */
function formatEncodingChannelLabel(encodingData, streamIndex) {
  const ch = encodingData?.Configuration?.SignalChannel
  if (ch !== undefined && ch !== null) {
    const n = Number(ch)
    if (!Number.isNaN(n)) return 'CH' + String(Math.trunc(n)).padStart(2, '0')
  }
  return 'CH' + String(streamIndex).padStart(2, '0')
}

/** Title legend: Alice (CHxx)  Bob (CHxx); colors match traces. */
function formatEncodingTitleLegendHtml(meData, meData2) {
  if (!meData) return ''
  const chAlice = formatEncodingChannelLabel(meData, 1)
  if (meData2) {
    const chBob = formatEncodingChannelLabel(meData2, 2)
    return `<span style="color:#2874A6">Alice (${chAlice})</span>  <span style="color:#C0392B">Bob (${chBob})</span>`
  }
  return `<span style="color:#2874A6">Alice (${chAlice})</span>`
}

/** Combined Sync Alice + Sync Bob: channel from each block's Configuration.SignalChannel. */
function formatSyncAliceBobLegendHtml(syncAliceData, syncBobData) {
  const chA = formatEncodingChannelLabel(syncAliceData, 1)
  const chB = formatEncodingChannelLabel(syncBobData, 2)
  return `<span style="color:#2874A6">Alice (${chA})</span>  <span style="color:#C0392B">Bob (${chB})</span>`
}

function getChartLegendHtml(chartIndex, result, meData, meData2) {
  if (!result) return ''
  const id = MEConfigs[chartIndex][1]
  if (id === 'moSyncAliceBob') {
    return formatSyncAliceBobLegendHtml(
      result['Data']['TFQKDSyncAlice'],
      result['Data']['TFQKDSyncBob'],
    )
  }
  if (id.startsWith('me')) {
    return formatEncodingTitleLegendHtml(meData, meData2)
  }
  if (id.startsWith('mo')) {
    const name = MEConfigs[chartIndex][2][0]
    const moData = result['Data']['TFQKD' + name.replaceAll(' ', '')]
    const ch = formatEncodingChannelLabel(moData, 1)
    const label = MEConfigs[chartIndex][0].replace(/^Sync /i, '')
    return `<span style="color:#2874A6">${label} (${ch})</span>`
  }
  return ''
}

/** Paper x for subplot chart title (center-anchored); default 0.5 shifted left by 20%. */
const SUBPLOT_TITLE_X = 0.3

function plot(result, append) {
  const layout = {
    xaxis: { title: 'Time (ns)' },
    yaxis: { title: 'Count' },
    margin: { l: 50, r: 30, b: 50, t: 32, pad: 4 },
    // width: 300,
    height: 250,
    showlegend: false,
    autosize: true,
  }
  const chartTraces = []
  let meData = null
  let meData2 = null
  if (result == null) {
    for (const histogram of MEHistograms) histogram.clear()
    for (const histogram of MEHistograms2) histogram.clear()
    for (let i = 0; i < MEConfigs.length; i++) {
      chartTraces.push([{ x: [0], y: [0], type: 'scatter', name: '', showlegend: false }])
    }
  } else {
    const configuration = result['Data']['TFQKDEncoding']['Configuration']
    const xs = linspace(0, configuration['Period'] / 1000.0, configuration['BinCount'])
    let histogramXsMatched = true
    if (!append) {
      MEHistograms.forEach(h => h.clear())
      MEHistograms2.forEach(h => h.clear())
    }
    meData = result['Data']['TFQKDEncoding']
    meData2 = result['Data']?.['TFQKDEncoding2']
    for (const i in MEConfigs) {
      const hisIs = MEConfigs[i][2]
      const rowId = MEConfigs[i][1]
      if (rowId === 'moSyncAliceBob') {
        for (var j = 0; j < hisIs.length; j++) {
          const syncName = hisIs[j]
          var moDataAb = result['Data']['TFQKD' + syncName.replaceAll(' ', '')]
          var moXsAb = linspace(0, moDataAb['Configuration']['Period'] / 1000.0, moDataAb['Configuration']['BinCount'])
          var hisAb = moDataAb['Histogram[' + syncName + ']']
          if (j === 0) MEHistograms[i].append(moXsAb, hisAb)
          else MEHistograms2[i].append(moXsAb, hisAb)
        }
      } else if (rowId.startsWith('me')) {
        for (var j = 0; j < hisIs.length; j++) {
          var his = meData['Histogram[' + hisIs[j] + ']']
          MEHistograms[i].append(xs, his)
          if (meData2) {
            var his2 = meData2['Histogram[' + hisIs[j] + ']']
            MEHistograms2[i].append(xs, his2)
          }
        }
      } else {
        var moData = result['Data']['TFQKD' + MEConfigs[i][2][0].replaceAll(' ', '')]
        var moXs = linspace(0, moData['Configuration']['Period'] / 1000.0, moData['Configuration']['BinCount'])
        var his = moData['Histogram[' + MEConfigs[i][2][0] + ']']
        MEHistograms[i].append(moXs, his)
      }
      const lineTraces = []
      if (rowId.startsWith('me')) {
        lineTraces.push({
          x: MEHistograms[i].xs,
          y: MEHistograms[i].ys,
          type: 'scatter',
          mode: 'lines',
          line: { color: '#2874A6' },
          showlegend: false,
        })
        if (meData2) {
          lineTraces.push({
            x: MEHistograms2[i].xs,
            y: MEHistograms2[i].ys,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#C0392B' },
            showlegend: false,
          })
        }
      } else if (rowId === 'moSyncAliceBob') {
        lineTraces.push(
          {
            x: MEHistograms[i].xs,
            y: MEHistograms[i].ys,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#2874A6' },
            showlegend: false,
          },
          {
            x: MEHistograms2[i].xs,
            y: MEHistograms2[i].ys,
            type: 'scatter',
            mode: 'lines',
            line: { color: '#C0392B' },
            showlegend: false,
          },
        )
      } else {
        lineTraces.push({
          x: MEHistograms[i].xs,
          y: MEHistograms[i].ys,
          type: 'scatter',
          mode: 'lines',
          line: { color: '#2874A6' },
          showlegend: false,
        })
      }
      chartTraces.push(lineTraces)
    }
    for (var i = 0; i < MEHistograms.length; i++) {
      histogramXsMatched &= MEHistograms[i].xsMatch
      const rid = MEConfigs[i][1]
      if (rid === 'moSyncAliceBob') {
        histogramXsMatched &= MEHistograms2[i].xsMatch
      } else if (rid.startsWith('me') && meData2) {
        histogramXsMatched &= MEHistograms2[i].xsMatch
      }
    }
    listener('HistogramXsMatched', histogramXsMatched)

    // deal with reports
    updateReports(result)
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
      showlegend: false,
    })
  }

  for (let i = 0; i < MEConfigs.length; i++) {
    const baseTitle = chartTitleDisplay(MEConfigs[i][0])
    const titleLegendHtml = getChartLegendHtml(i, result, meData, meData2)
    if (titleLegendHtml) {
      layout.title = { text: '' }
      layout.annotations = [
        {
          showarrow: false,
          cliponaxis: false,
          xref: 'paper',
          yref: 'paper',
          x: SUBPLOT_TITLE_X,
          y: 1.05,
          xanchor: 'center',
          yanchor: 'bottom',
          text: baseTitle,
          font: { size: 14, color: '#2c3e50', weight: 'bold' },
        },
        {
          showarrow: false,
          cliponaxis: false,
          xref: 'paper',
          yref: 'paper',
          x: 1,
          y: 1.05,
          xanchor: 'right',
          yanchor: 'bottom',
          text: titleLegendHtml,
          font: { size: 12 },
        },
      ]
    } else {
      layout.title = {
        text: baseTitle,
        x: SUBPLOT_TITLE_X,
        xanchor: 'center',
        font: { size: 14, color: '#2c3e50', weight: 'bold' },
      }
      layout.annotations = []
    }
    layout['showlegend'] = false
    const yMax = maxYInTraces(chartTraces[i])
    layout['yaxis']['range'] = [0, yMax * 1.05]
    const div = MEConfigs[i][1]
    const data = fillTrace.concat(chartTraces[i])
    Plotly.react(div, data, layout, {
      displaylogo: false,
      responsive: true
    })
    Plotly.redraw(div)
  }
}

function fillReportColumn(reportRef, regionValues) {
  const signalPulseExtinctionRatio = (regionValues['All Signals'][0] / regionValues['All Signals'][1])
  const vacuumsCountRate = regionValues['Vacuum'][0] / regionValues['Vacuum'][2]
  const ZCountRate = regionValues['Z'][0] / regionValues['Z'][2]
  const XCountRate = regionValues['X'][0] / regionValues['X'][2]
  const YCountRate = regionValues['Y'][0] / regionValues['Y'][2]
  const signalRefRatioInPulse = (regionValues['All Signals'][0] / regionValues['All Signals'][2] / regionValues['All Ref'][0] * regionValues['All Ref'][2])

  reportRef.value[0].value = (10 * Math.log10(signalPulseExtinctionRatio)).toFixed(3) + ' dB'
  reportRef.value[1].value = (10 * Math.log10(vacuumsCountRate / (ZCountRate))).toFixed(2) + ' dB'
  reportRef.value[2].value = (XCountRate / ZCountRate).toFixed(3)
  reportRef.value[3].value = (YCountRate / ZCountRate).toFixed(3)
  reportRef.value[4].value = (10 * Math.log10(signalRefRatioInPulse)).toFixed(3) + ' dB'
}

function updateReports(result) {
  const regionAlice = calculateRegionValues(result, MEHistograms, 'TFQKDEncoding')
  fillReportColumn(reportInfosAlice, regionAlice)
  const enc2 = result['Data']?.['TFQKDEncoding2']
  if (enc2) {
    const regionBob = calculateRegionValues(result, MEHistograms2, 'TFQKDEncoding2')
    fillReportColumn(reportInfosBob, regionBob)
  } else {
    for (const row of reportInfosBob.value) row.value = ''
  }
}

function calculateRegionValues(result, histograms, encodingKey) {
  const regionValues = {}
  const enc = result['Data']?.[encodingKey]
  const regionWidths = markPoints.map(markPoint => markPoint[1] - markPoint[0])
  MEConfigs.map((config, i) => {
    const regionValue = markPoints.map(markPoint => histograms[i].xs.map((x, j) => [x, histograms[i].ys[j]]).filter(z => z[0] >= markPoint[0] && z[0] < markPoint[1]).map(z => z[1]).reduce((a, b) => a + b, 0))
    const correspondingPulseCount = enc
      ? config[2].map(r => {
        const v = enc['PulseCount[' + r + ']']
        return v != null && !Number.isNaN(v) ? v : 0
      }).reduce((a, b) => a + b, 0)
      : 0
    return regionValue.map((v, i) => v / regionWidths[i]).concat([correspondingPulseCount])
  }).map((v, i) => regionValues[MEConfigs[i][0]] = v)
  return regionValues
}

</script>
<style lang="sass" scoped>
.tdc-encoding20-page
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

.report-col-head
  font-weight: 600

.report-metric-row
  margin-top: 8px
  margin-bottom: 0px
  padding-left: 4px
  padding-right: 4px
  align-items: center
  width: 100%
  max-width: 480px

:deep(.bg-btn-positive)
  background: rgb(27,200,139)
:deep(.bg-btn-negative)
  background: rgb(133,135,150)
:deep(.bg-card-head)
  background: rgb(244,245,248)

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
