<template>
  <q-splitter v-model="splitterModel" unit="px" separator-style="background-color: #FFFFFF00" disable>
    <template v-slot:before>
      <q-card class="channel-card" bordered>
        <q-item>
          <q-item-section>
            <q-item-label class="text-h6">Channels</q-item-label>
          </q-item-section>
        </q-item>
        <q-separator />
        <q-card-section horizontal>
          <q-card-section>
            <q-card v-for="channelInfo in channelInfos" :key="channelInfo.i" class="row col channel-item">
              <div class="channel-info-histogram-indicator"
                :style="{ backgroundColor: getPaletteColor(getChannelIndicatorColor(channelInfo)), borderRadius: '0px' }">
              </div>
              <div class="row channel-info-label" style="font-weight: bold" @click="toggleChannelStatus(channelInfo.i)">
                <div class="col self-center">CH{{ ('0' + channelInfo.i).slice(-2,) }}</div>
              </div>
              <q-input v-model="channelInfo.formattedCount" class="channel-info-input channel-info-input-count"
                input-class="text-right" square outlined readonly>
                <q-tooltip :delay="3000" anchor="center right" self="center left" class="text-h2">
                  {{ channelInfo.formattedCount }}
                </q-tooltip>
              </q-input>
              <div class="row channel-info-label">
                <div class="col self-center">@</div>
              </div>
              <q-input v-model="channelInfo.formattedDelay" :key="'delay-input-' + channelInfo.i"
                @focus="onDelayEditorFocus(channelInfo.i)" @blur="onDelayEditorBlur(channelInfo.i)"
                @keyup.enter="onDelayEditorEnter(channelInfo.i)" @keyup.esc="onDelayEditorEscape(channelInfo.i)"
                :ref="(el) => channelInfo.element = el" input-class="text-right"
                class="channel-info-input channel-info-input-delay" square outlined></q-input>
              <div class="row channel-info-label">
                <div class="col self-center">ns</div>
              </div>
            </q-card>
          </q-card-section>
        </q-card-section>
      </q-card>
    </template>
    <template v-slot:after>
      <q-card class="histogram-card" bordered>
        <q-card-section style="height: 48px; padding-left: 16px; padding-top: 0px;">
          <div class="row">
            <q-item-label class="text-h6" style="margin-top: 12px;">Histograms</q-item-label>
            <div class="" style="margin-left: 10px; margin-top: 6px">
              <q-btn-toggle v-model="histogramMode" size="md" toggle-color="green-6" :options="histogramModeOptions" />
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
            <q-input class="channel-info-input channel-info-input-review" v-model="reviewTimeBeginModel.formatted"
              square outlined input-class="text-center" @blur="onReviewTimeBeginEditted(true)"
              @keyup.enter="onReviewTimeBeginEditted(true)"
              @keyup.esc="reviewTimeBeginModel.formatted = ''; onReviewTimeBeginEditted(true);"
              @update:model-value="onReviewTimeBeginEditted(false)" :error="!reviewTimeBeginModel.valid"
              error-message="" no-error-icon></q-input>
            <div class="" style="margin-top: 14px; font-weight: bold;"> to </div>
            <q-input class="channel-info-input channel-info-input-review" v-model="reviewTimeEndModel.formatted" square
              outlined input-class="text-center" @blur="onReviewTimeEndEditted(true)"
              @keyup.enter="onReviewTimeEndEditted(true)"
              @keyup.esc="reviewTimeEndModel.formatted = ''; onReviewTimeEndEditted(true);"
              @update:model-value="onReviewTimeEndEditted(false)" :error="!reviewTimeEndModel.valid" error-message=""
              no-error-icon></q-input>
            <q-btn style="height: 32px; margin-top: 6px; margin-left: 8px" color="green-6"
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
          v-if="reviewUpdateProgress > 0 && reviewUpdateProgress <= 1 && histogramMode == 'review'"
          animation-speed="300" />
        <q-separator />
        <q-card-section horizontal>
          <q-card-section>
            <div class="row">
              <q-card v-for="histogramInfo in histogramInfos" :key="histogramInfo.name"
                class="row histogram-info-item items-center justify-between">
                <div class="q-pa-md row histogram-info-label" style="font-weight: bold;">
                  <div class="col self-center">{{ histogramInfo.label }}</div>
                </div>
                <div class="q-pa-md col histogram-info-label">
                  <q-input class="channel-info-input" v-model="histogramInfo.formattedValue" square outlined
                    @focus="onHistogramConfigEditorFocus(histogramInfo)"
                    @blur="onHistogramConfigEditorBlur(histogramInfo)"
                    @keyup.enter="onHistogramConfigEditorEnter(histogramInfo)"
                    @keyup.esc="onHistogramConfigEditorEscape(histogramInfo)" :ref="(el) => histogramInfo.element = el"
                    input-class="text-right" :readonly="!histogramConfigEditable"></q-input>
                </div>
                <div v-if="histogramInfo.tail" class="q-pa-md row histogram-info-label" style="padding-right: 4px;">
                  <div class="col self-center">{{ histogramInfo.tail }}</div>
                </div>
              </q-card>
            </div>
          </q-card-section>
        </q-card-section>
        <q-separator />
        <q-card-section horizontal>
          <q-card-section style="width: 100%;">
            <div id="viewport"></div>
          </q-card-section>
        </q-card-section>
        <q-separator />
        <q-card-section style="padding-top: 0px; padding-bottom: 8px">
          <div class="row">
            <q-card v-for="detailedInfo in detailedInfos" :key="detailedInfo.key"
              class="row items-center justify-between"
              style="margin-top: 8px; margin-bottom: 0px; padding-left: 4px; padding-right: 4px; margin-right: 12px">
              <div class="q-pa-md row histogram-info-label" style="font-weight: bold; margin-right: 8px;">
                <div class="col self-center"> {{ detailedInfo.name }} </div>
                <q-tooltip> {{ detailedInfo.expression }} </q-tooltip>
              </div>
              <q-input v-model="detailedInfo.result" class="channel-info-input channel-info-input-detail" square
                outlined readonly input-class="text-right">
                <q-tooltip :delay="3000" anchor="top middle" self="bottom middle" class="text-h2">
                  {{ detailedInfo.result }}
                </q-tooltip>
              </q-input>
              <q-btn round v-if="editingDetailedInfos" icon="close" size="sm" color="red"
                style="height: 10px; width: 10px; margin-left: 8px;margin-right: 4px"
                @click="removeDetailedInfoItem(detailedInfo)" />
            </q-card>
            <div v-if="!addingDetailedInfo" style="padding-top: 11px;">
              <q-btn round color="grey-6" icon="add" size="sm" style="height: 10px; width: 10px;"
                @click="addingDetailedInfo = true" />
            </div>
            <q-card v-if="addingDetailedInfo" class="row add-detailed-info-item items-center justify-between">
              <q-btn round color="grey-6" icon="folder_special" size="sm" style="height: 10px; width: 10px;">
                <q-tooltip> Preset Configs. </q-tooltip>
                <q-menu>
                  <q-list style="min-width: 100px">
                    <q-item v-for="addingDetailedInfoPreset in addingDetailedInfoPresets"
                      :key="addingDetailedInfoPreset.name" clickable v-close-popup
                      @click="onSelectPreSettedDetailedInfo(addingDetailedInfoPreset)">
                      <q-item-section>{{ addingDetailedInfoPreset.label }}</q-item-section>
                    </q-item>
                  </q-list>
                </q-menu>
              </q-btn>
              <div class="q-pa-md row histogram-info-label" style="padding-left: 10px;">
                <div class="col self-center">Name:</div>
              </div>
              <div class="q-pa-md histogram-info-label">
                <q-input class="channel-info-input" v-model="addingDetailedInfoPanelName" square outlined
                  style="width: 80px"></q-input>
              </div>
              <div class="q-pa-md row histogram-info-label" style="padding-left: 10px;">
                <div class="col self-center">Express:</div>
              </div>
              <div class="q-pa-md histogram-info-label">
                <q-input class="channel-info-input" v-model="addingDetailedInfoPanelExpression" square outlined
                  style="width: 240px"></q-input>
              </div>
              <div style="padding-left: 12px;">
                <q-btn round color="green-4" icon="check" size="sm" style="height: 10px; width: 10px;"
                  @click="onAddingDetailedInfoConfirm(true)"></q-btn>
              </div>
              <div style="padding-left: 6px; padding-right: 8px">
                <q-btn round color="red-4" icon="clear" size="sm" style="height: 10px; width: 10px;"
                  @click="onAddingDetailedInfoConfirm(false)"></q-btn>
              </div>
            </q-card>
            <div class="col" style="display: flex; justify-content: right; padding-top: 11px;">
              <q-btn round :color="editingDetailedInfos ? 'red-6' : 'grey-6'" icon="edit" size="sm"
                style="height: 10px; width: 10px;" @click="editingDetailedInfos = !editingDetailedInfos" />
            </div>
          </div>
        </q-card-section>
      </q-card>
    </template>
  </q-splitter>
</template>

<script setup>
import { ref, onMounted, onUnmounted, watch } from 'vue';
import { useRoute } from 'vue-router'
import { colors } from 'quasar'
import worker from '../services/IFWorker'
import { Histogram, TDCStorageStreamFetcher, linspace, parseDateString } from '../services/IFExp'
import moment from 'moment';
import Plotly from 'plotly.js-dist'
const { getPaletteColor } = colors
const route = useRoute()
const numberFormat = new Intl.NumberFormat('ja-JP')

const parameters = route.query
const tdcService = parameters['tdcservice'] || null
const collection = parameters['collection'] || null
const analyser = parameters['analyser'] || 'MultiHistogram'
const channelCount = 16
const channelInfos = ref(Array(channelCount).fill(0).map((_, i) => { return { i: i, count: 0, formattedCount: '', delay: 0, formattedDelay: '', editing: false, isTrigger: false, isSignal: false, element: null } }))
const histogramInfos = ref([
  { name: 'trigger', 'label': 'Trigger', tail: '', keyInServer: 'Sync', format: (_) => _, parse: (_) => parseInt(_) },
  { name: 'divide', 'label': 'Divide', tail: '', keyInServer: 'Divide', format: numberFormat.format, parse: (_) => parseInt(_) },
  { name: 'bin_num', 'label': 'BinNum', tail: '', keyInServer: 'BinCount', format: numberFormat.format, parse: (_) => parseInt(_.replace(/,/g, '')) },
  { name: 'from', 'label': 'From', tail: 'ns', keyInServer: 'ViewStart', format: (_) => { return numberFormat.format(_ / 1000) }, parse: (_) => parseInt(parseFloat(_.replace(/,/g, '')) * 1000) },
  { name: 'to', 'label': 'To', tail: 'ns', keyInServer: 'ViewStop', format: (_) => { return numberFormat.format(_ / 1000) }, parse: (_) => parseInt(parseFloat(_.replace(/,/g, '')) * 1000) },
])
histogramInfos.value.forEach((e) => { e['value'] = 0; e['formattedValue'] = ''; e['editing'] = false; e['element'] = null; })
const detailedInfos = ref([])
const detailedInfosInited = ref(false)
const histogramMode = ref('instant')
const histogramModeOptions = [{ label: 'Instant', value: 'instant' }, { label: 'Review', value: 'review' }]
const histogramConfigEditable = ref(true)
const reviewTimeBeginModel = ref({ value: -1, formatted: '', valid: true })
const reviewTimeEndModel = ref({ value: -1, formatted: '', valid: true, isToNow: false })
const reviewUpdateProgress = ref(0)
const reviewDataPreparing = ref(false)
const reviewError = ref({ tooManyRecords: false, XsNotMatched: false })

const addingDetailedInfo = ref(false)
const addingDetailedInfoPresets = ref([
  { name: 'Coincidence 1', label: 'Coincidence 1', expression: 'coincidence(1, 30, 3) // (channel, center, width)' },
  { name: 'Efficiency 0', label: 'Efficiency 0', expression: '(coincidence(1, 30, 3) / counts[1] * 100).toFixed(2) + "%"' },
  { name: 'Efficiency 1', label: 'Efficiency 1', expression: '(coincidence(1, 30, 3) / counts[0] * 100).toFixed(2) + "%"' },
  { name: 'Ratio 4 / 6', label: 'Ratio 4 / 6', expression: 'counts[4] / counts[6]' },
])
const addingDetailedInfoPanelName = ref('')
const addingDetailedInfoPanelExpression = ref('')
function onAddingDetailedInfoConfirm(accept) {
  if (accept) addDetailedInfoItem(addingDetailedInfoPanelName.value, addingDetailedInfoPanelExpression.value)
  addingDetailedInfo.value = false
  addingDetailedInfoPanelName.value = ''
  addingDetailedInfoPanelExpression.value = ''
}
function addDetailedInfoItem(name, expression) {
  detailedInfos.value.push({ key: '' + new Date().getTime() + Math.random(), name: name, expression: expression, result: ref('') })
  saveDetailedInfoConfig()
}
function removeDetailedInfoItem(item) {
  const i = detailedInfos.value.map((_, i) => { return _ == item ? i : -1 }).filter((i) => { return i >= 0 })[0]
  if (i >= 0) {
    detailedInfos.value.splice(i, 1)
    saveDetailedInfoConfig()
  }
}
function saveDetailedInfoConfig() {
  if (detailedInfosInited.value) localStorage.tdcviewer_detailedinfos = JSON.stringify(detailedInfos.value.map((_) => { return { name: _.name, expression: _.expression } }))
}
function loadDetailedInfoConfig() {
  const infos = localStorage.tdcviewer_detailedinfos
  if (infos) for (const info of JSON.parse(infos)) addDetailedInfoItem(info.name, info.expression)
  detailedInfosInited.value = true
}
loadDetailedInfoConfig()
const editingDetailedInfos = ref(false)

const fetchTimeDelta = ref(-1)

const splitterModel = ref(290)

const TDCHistograms = new Array(channelCount)
for (var i = 0; i < TDCHistograms.length; i++) {
  TDCHistograms[i] = new Histogram()
}

function onDelayEditorFocus(ch) { channelInfos.value[ch].editing = true }
function onDelayEditorBlur(ch) { doneDelayEditing(ch, true, true) }
function onDelayEditorEnter(ch) { doneDelayEditing(ch, true, false) }
function onDelayEditorEscape(ch) {
  doneDelayEditing(ch, false, false)
  channelInfos.value[ch].element.blur()
}
function doneDelayEditing(ch, apply, stop) {
  if (stop) channelInfos.value[ch].editing = false
  const delay_ns = parseFloat(channelInfos.value[ch].formattedDelay)
  const delay_ps = Number.isNaN(delay_ns) ? 0 : parseInt(delay_ns * 1000)
  if (delay_ps != channelInfos.value[ch].delay && apply) {
    channelInfos.value[ch].delay = delay_ps
    worker[tdcService].setDelay(ch, channelInfos.value[ch].delay)
  }
  channelInfos.value[ch].formattedDelay = formatDelay(channelInfos.value[ch].delay)
}

function onHistogramConfigEditorFocus(info) { info.editing = true }
function onHistogramConfigEditorBlur(info) { doneHistogramConfigEditing(info, true, true) }
function onHistogramConfigEditorEnter(info) { doneHistogramConfigEditing(info, true, false) }
function onHistogramConfigEditorEscape(info) {
  doneHistogramConfigEditing(info, false, false)
  info.element.blur()
}
function doneHistogramConfigEditing(info, apply, stop) {
  if (stop) info.editing = false
  const value = info.parse(info.formattedValue)
  if (value != info.value && apply) {
    info.value = value
    const config = {}
    config[info.keyInServer] = info.value
    worker[tdcService].configureAnalyser(analyser, config)
  }
  info.formattedValue = info.format(info.value)
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

function onSelectPreSettedDetailedInfo(addingDetailedInfoPreset) {
  addingDetailedInfoPanelName.value = addingDetailedInfoPreset.label
  addingDetailedInfoPanelExpression.value = addingDetailedInfoPreset.expression
}

function toggleChannelStatus(ch) {
  if (tdcConfiger == null) return
  if (channelInfos.value[ch].isTrigger) return
  channelInfos.value[ch].isSignal = !channelInfos.value[ch].isSignal
  const signals = channelInfos.value.filter((info) => { return info.isSignal && !info.isTrigger }).map((info) => { return info.i })
  worker[tdcService].configureAnalyser(analyser, { 'Signals': signals })
}

class TDCConfiger {
  constructor(worker, tdcService) {
    this.worker = worker
    this.tdcService = tdcService
    this.recentDelays = null
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
    this.recentDelays = await worker[tdcService].getDelays()
    for (const i in this.recentDelays) {
      channelInfos.value[i].delay = this.recentDelays[i]
      if (!channelInfos.value[i].editing) channelInfos.value[i].formattedDelay = formatDelay(this.recentDelays[i])
    }
    const mhResult = await worker[tdcService].getAnalyserConfiguration(analyser)
    for (const histogramInfo of histogramInfos.value) {
      histogramInfo.value = mhResult[histogramInfo.keyInServer]
      if (!histogramInfo.editing) histogramInfo.formattedValue = histogramInfo.format(mhResult[histogramInfo.keyInServer])
    }
    const signals = mhResult['Signals']
    for (let i = 0; i < this.recentDelays.length; i++) {
      channelInfos.value[i].isTrigger = (i == mhResult['Sync'])
      channelInfos.value[i].isSignal = (signals.includes(i))
    }
    if (this.running) setTimeout(this.updateConfigs.bind(this), 1100)
  }
}

const tdcConfiger = tdcService != null ? new TDCConfiger(worker, tdcService) : null
const filter = { 'Data.Counter': 1, 'Data.Delays': 1, }
filter['Data.' + analyser] = 1
const fetcher = new TDCStorageStreamFetcher(worker, collection, 500, filter, plot, listener)

onMounted(() => {
  if (tdcConfiger != null) tdcConfiger.start()
  fetcher.start()
})
onUnmounted(() => {
  if (tdcConfiger != null) tdcConfiger.stop()
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
    autosize: true,
  }
  layout['updatemenus'] = [
    {
      buttons: [
        { args: ['yaxis.type', 'linear'], label: 'Linear', method: 'relayout' },
        { args: ['yaxis.type', 'log'], label: 'Log', method: 'relayout' }
      ],
      direction: 'left', pad: { 'r': 10, 't': 10 }, showactive: true, type: 'buttons', x: 0.1, xanchor: 'left', y: 1.1, yanchor: 'top'
    }
  ]

  // get current layout status: linear or log
  const gd = document.getElementById('viewport')
  if (gd && gd.layout && result != null) {
    layout['yaxis']['type'] = (gd.layout['yaxis']['type'])
  }

  const traces = []
  if (result == null) {
    for (var i = 0; i < TDCHistograms.length; i++) {
      TDCHistograms[i].clear()
    }
    traces.push({ x: [0], y: [0], type: 'scatter', name: 'CH0' })
    // $('#HistogramWarning')[0].classList.add('d-none')

    Plotly.react('viewport', traces, layout, {
      displaylogo: false,
      // responsive: true
    })
  } else {
    // Deal counts and delays
    const counts = result['Data']['Counter']
    for (let i = 0; i < 16; i++) {
      channelInfos.value[i].count = counts[i]
      channelInfos.value[i].formattedCount = new Intl.NumberFormat('ja-JP').format(counts[i])
    }
    const delays = result['Data']['Delays']
    const histogramDatas = []

    const data = result['Data'][analyser]
    const configuration = data['Configuration']
    const histograms = data['Histograms']
    const viewFrom = configuration['ViewStart'] / 1000.0;
    const viewTo = configuration['ViewStop'] / 1000.0;
    const divide = configuration['Divide'];
    const length = configuration['BinCount'];
    const syncChannel = configuration['Sync'];
    const signalChannels = configuration['Signals'];

    const xs = linspace(viewFrom, viewFrom + (viewTo - viewFrom) / divide, length)
    let histogramXsMatched = true
    for (var i = 0; i < signalChannels.length; i++) {
      const channelNum = signalChannels[i]
      const histogram = TDCHistograms[channelNum]
      if (append) histogram.append(xs, histograms[i])
      else histogram.update(xs, histograms[i])
      let channelNumStr = signalChannels[i].toString()
      if (channelNumStr.length == 1) channelNumStr = "0" + channelNumStr
      traces.push({
        x: histogram.xs,
        y: histogram.ys,
        type: 'scatter',
        name: 'CH' + channelNumStr
      })
      histogramXsMatched &= histogram.xsMatch
      histogramDatas.push(histogram.ys)
    }
    layout['uirevision'] = 'true'
    listener('HistogramXsMatched', histogramXsMatched)

    Plotly.react('viewport', traces, layout)

    // Deal Detailed Infos
    function coincidence(ch, center, width) {
      let c = 0
      const cBegin = center - 0.5 * width
      const cEnd = center + 0.5 * width
      if (signalChannels.includes(ch)) {
        const ich = signalChannels.indexOf(ch)
        const histogram = histogramDatas[ich]
        for (let i = 0; i < xs.length; i++) {
          if (xs[i] > cBegin && xs[i] < cEnd) {
            c += histogram[i]
          }
        }
        return c
      } else return 0
    }
    for (const detailedInfo of detailedInfos.value) {
      try {
        const func = new Function('counts', 'delays', 'histograms', 'coincidence', '"use strict"; return ' + detailedInfo.expression + '')
        const result = func(counts, delays, histogramDatas, coincidence)
        if (typeof (result) == 'string') detailedInfo.result = result
        else if (typeof (result) == 'number') detailedInfo.result = numberFormat.format(result).toString()
        else detailedInfo.result = 'Error: invalid.'
      } catch (error) {
        console.log(error, error.message);
        detailedInfo.result = 'Error: ' + error.message
      }
    }
  }
  Plotly.redraw('viewport')
}

function getChannelIndicatorColor(channelInfo) {
  if (channelInfo.isTrigger) return 'orange'
  if (channelInfo.isSignal) return 'green'
  return 'grey-5'
}

function formatDelay(delay) {
  return (delay / 1000.0).toFixed(3)
}

</script>
<style lang="sass" scoped>
.channel-card
  margin: 8px
  :deep(.q-card__section--vert)
    padding: 8px
    padding-bottom: 0px

.channel-item
  width: 255px
  margin-bottom: 8px
  overflow: hidden

.channel-info-input
  height: 32px
  margin-top: 2px
  margin-bottom: 2px
  :deep(.q-field__control)
    height: 32px
    padding-left: 6px
    padding-right: 6px

.channel-info-input-count
  :deep(.q-field__control)
    width: 90px

.channel-info-input-delay
  :deep(.q-field__control)
    width: 70px

.channel-info-label
  height: 36px
  margin-left: 4px
  margin-right: 4px

.channel-info-histogram-indicator
  width: 4px

.histogram-card
  margin: 8px
  margin-left: 0px
  :deep(.q-card__section--vert)
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
  :deep(.q-field__control)
    width: 90px

#viewport
  margin-bottom: 8px

.add-detailed-info-item
  width: 600px
  margin-top: 8px
  margin-bottom: 0px
  padding-left: 4px
  margin-right: 12px

.channel-info-input-detail
  :deep(.q-field__control)
    width: 100px

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
</style>
