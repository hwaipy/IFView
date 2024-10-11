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
              <div class="row channel-info-label" style="font-weight: bold">
                <div class="col self-center">CH{{ ('0' + channelInfo.i).slice(-2,) }}</div>
              </div>
              <q-input v-model="channelInfo.formattedCount" class="channel-info-input channel-info-input-count"
                input-class="text-right" square outlined readonly></q-input>
              <div class="row channel-info-label">
                <div class="col self-center">@</div>
              </div>
              <q-input v-model="channelInfo.formattedDelay" :key="'delay-input-' + channelInfo.i"
                @blur="onDelayInputBlur(channelInfo.i)" @keyup.enter="onDelayInputEnter(channelInfo.i)"
                input-class="text-right" class="channel-info-input channel-info-input-delay" square outlined></q-input>
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
        <q-item>
          <q-item-section>
            <q-item-label class="text-h6">Histograms</q-item-label>
          </q-item-section>
        </q-item>
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
                  <q-input class="channel-info-input" square outlined input-class="text-right"></q-input>
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
          <q-card-section>
            <div id="viewport"></div>
          </q-card-section>
        </q-card-section>
      </q-card>
    </template>
  </q-splitter>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { useRoute } from 'vue-router'
import { colors } from 'quasar'
import worker from '../services/IFWorker'
import { Histogram, TDCStorageStreamFetcher, linspace } from '../services/IFExp'
import Plotly from 'plotly.js-dist'
const { getPaletteColor } = colors
const route = useRoute()

// TODO  From 不是 0时，plot 图里的横坐标似乎不对
// TODO  处理 delay 等参数的更新检查

const parameters = route.query
const tdcService = parameters['tdcservice'] || null
const collection = parameters['collection'] || null
const analyser = parameters['analyser'] || 'MultiHistogram'
const channelCount = 16
const channelInfos = ref(Array(channelCount).fill(0).map((_, i) => { return { i: i, count: 0, formattedCount: '', delay: 0, formattedDelay: '', isTrigger: false, isSignal: false } }))
const histogramInfos = ref([
  { name: 'trigger', 'label': 'Trigger', tail: '' },
  { name: 'divide', 'label': 'Divide', tail: '' },
  { name: 'bin_num', 'label': 'BinNum', tail: '' },
  { name: 'from', 'label': 'From', tail: 'ns' },
  { name: 'to', 'label': 'To', tail: 'ns' },
])

const splitterModel = ref('290')

const TDCHistograms = new Array(channelCount)
for (var i = 0; i < TDCHistograms.length; i++) {
  TDCHistograms[i] = new Histogram()
}

function onDelayInputBlur(ch) { doneDelayEditing(ch) }
function onDelayInputEnter(ch) { doneDelayEditing(ch) }
function doneDelayEditing(ch) {
  const delay_ns = parseFloat(channelInfos.value[ch].formattedDelay)
  const delay_ps = Number.isNaN(delay_ns) ? 0 : parseInt(delay_ns * 1000)
  channelInfos.value[ch].delay = delay_ps
  channelInfos.value[ch].formattedDelay = formatDelay(delay_ps)
  worker[tdcService].setDelay(ch, delay_ps)
}

class TDCConfiger {
  constructor(worker, tdcService) {
    this.worker = worker
    this.tdcService = tdcService
    this.recentDelays = null
  }

  start() {
    this.updateDelays()
  }

  stop() { }

  async updateDelays() {
    this.recentDelays = await worker[tdcService].getDelays()
    for (const i in this.recentDelays) {
      channelInfos.value[i].delay = this.recentDelays[i]
      channelInfos.value[i].formattedDelay = formatDelay(this.recentDelays[i])
    }

    //   var mhResult = await worker[tdcService].getAnalyserConfiguration(analyser)
    //   if (this.editingField != 'Sync') $('#DPTI_Sync').val(mhResult['Sync'])
    //   if (this.editingField != 'ViewStart') $('#DPTI_ViewStart').val(mhResult[
    //     'ViewStart'] / 1000.0)
    //   if (this.editingField != 'ViewStop') $('#DPTI_ViewStop').val(mhResult[
    //     'ViewStop'] / 1000.0)
    //   if (this.editingField != 'BinCount') $('#DPTI_BinCount').val(mhResult[
    //     'BinCount'])
    //   if (this.editingField != 'Divide') $('#DPTI_Divide').val(mhResult[
    //     'Divide'])
    //   var signals = mhResult['Signals']
    //   for (var i = 0; i < this.recentDelays.length; i++) {
    //     $('#ChannelPane_' + i).removeClass("border-left-warning")
    //     $('#ChannelPane_' + i).removeClass("border-left-success")
    //     $('#ChannelPane_' + i).removeClass("border-left-danger")
    //     if (i == mhResult['Sync']) {
    //       $('#ChannelPane_' + i).addClass("border-left-danger")
    //     } else if (signals.includes(i)) {
    //       $('#ChannelPane_' + i).addClass("border-left-success")
    //     } else {
    //       $('#ChannelPane_' + i).addClass("border-left-warning")
    //     }
    //   }
    //   setTimeout(this.updateDelays.bind(this), 1100)
  }

  // edited(id) {
  //   this.editingField = null
  //   var editedField = id.split('_')[1]
  //   var editedValue = $('#' + id).val()
  //   if (!isNaN(parseInt(editedField))) {

  //   } else {
  //     // edited a MultiHistogram config
  //     var config = {}
  //     var valid = true
  //     if (editedField == 'Sync') {
  //       config['Sync'] = parseInt(editedValue)
  //       valid = !isNaN(config['Sync'])
  //     }
  //     if (editedField == 'ViewStart' || editedField == 'ViewStop') {
  //       config[editedField] = parseFloat(editedValue) * 1000.0
  //       valid = !isNaN(config[editedField])
  //     }
  //     if (editedField == 'BinCount' || editedField == 'Divide') {
  //       config[editedField] = parseInt(editedValue)
  //       valid = !isNaN(config[editedField])
  //     }
  //     if (valid) worker[tdcService].configureAnalyser(analyser, config)
  //   }
  // }
}

const tdcConfiger = tdcService != null ? new TDCConfiger(worker, tdcService) : null
const filter = { 'Data.Counter': 1, 'Data.Delays': 1, }
filter['Data.' + analyser] = 1
const fetcher = new TDCStorageStreamFetcher(worker, collection, 500, filter, plot, listener)

onMounted(() => {
  // fetching.value = true
  // doMetaFetch()
  if (tdcConfiger != null) {
    tdcConfiger.start()
  }
  // initControlPanel(channelCount)
  fetcher.start()
})
onUnmounted(() => {
  // fetching.value = false
  if (tdcConfiger != null) {
    tdcConfiger.stop()
  }
  fetcher.stop()
})

function listener(event, arg) {
  // console.log('listen on fetch update: ', event, arg);

  // if (event == 'FetchTimeDelta') {
  //   fetchTimeDelta = arg
  //   if (fetchTimeDelta > 3000) {
  //     $('#HistogramWarning')[0].classList.remove('d-none')
  //     $('#HistogramWarningContent').html("The most recent data was fetched " +
  //       parseInt(fetchTimeDelta / 1000) + " s ago.")
  //   } else {
  //     $('#HistogramWarning')[0].classList.add('d-none')
  //   }
  // } else if (event == 'FetchingProgress') {
  //   progress = parseInt(arg * 100)
  //   $('#FetchingProgress').attr('style',
  //     'background-image: linear-gradient(to right, #BDE6FF ' + (progress) +
  //     '%, #F8F9FC ' + (progress) + '%)')
  // } else if (event == 'FetchingNumber') {
  //   if (arg == null) {
  //     $('#FetchNumberContent').html('')
  //     $('#FetchNumber')[0].classList.add('d-none')
  //   } else {
  //     integralFetchedDataCount = arg[0]
  //     integralTotalDataCount = arg[1]
  //     integralTime = arg[2]
  //     content = integralTotalDataCount + ' items (in ' + integralTime + ' s)'
  //     if (integralFetchedDataCount < integralTotalDataCount) content =
  //       integralFetchedDataCount + ' / ' + content
  //     $('#FetchNumber')[0].classList.remove('d-none')
  //     $('#FetchNumberContent').html(content)
  //   }
  // } else if (event == 'HistogramXsMatched') {
  //   if (!arg) {
  //     $('#HistogramError')[0].classList.remove('d-none')
  //     $('#HistogramErrorContent').html("Histogram Config Not Matched.")
  //   } else {
  //     $('#HistogramError')[0].classList.add('d-none')
  //   }
  // } else if (event == 'TooManyRecords') {
  //   if (arg) {
  //     $('#TooManyRecordsError')[0].classList.remove('d-none')
  //     $('#TooManyRecordsErrorContent').html("Too Many Records.")
  //   } else {
  //     $('#TooManyRecordsError')[0].classList.add('d-none')
  //   }
  // } else {
  //   console.log(event + ', ' + arg);
  // }
}

function plot(result, append) {
  console.log('plot sth.');

  const layout = {
    xaxis: { title: 'Time (ns)' },
    yaxis: { title: 'Count' },
    margin: { l: 50, r: 30, b: 50, t: 30, pad: 4 },
    // autosize: true,
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

  // // get current layout status: linear or log
  // var gd = document.getElementById('viewport')
  // var oldLayout = gd.layout
  // if (oldLayout && result != null) {
  //   currentY = (gd.layout['yaxis']['type'])
  //   layout['yaxis']['type'] = currentY
  // }

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
    // Deal counts
    const counts = result['Data']['Counter']
    for (let i = 0; i < 16; i++) {
      channelInfos.value[i].count = counts[i]
      channelInfos.value[i].formattedCount = new Intl.NumberFormat('ja-JP').format(counts[i])
    }
    //   $('#DePTI_Ratio48').val((counts[4]/counts[8]).toFixed(3))
    //   $('#DePTI_Ratio59').val((counts[5]/counts[9]).toFixed(3))

    // // Deal delays
    // if (tdcConfiger == null) {
    //   const delays = result['Data']['Delays']
    //   for (const i in delays) {
    //     channelInfos.value[i].delay = delays[i]
    //     channelInfos.value[i].formattedDelay = formatDelay(delays[i])
    //   }
    // }

    const data = result['Data'][analyser]
    const configuration = data['Configuration']
    const histograms = data['Histograms']
    const viewFrom = configuration['ViewStart'] / 1000.0;
    const viewTo = configuration['ViewStop'] / 1000.0;
    const divide = configuration['Divide'];
    const length = configuration['BinCount'];
    const syncChannel = configuration['Sync'];
    const signalChannels = configuration['Signals'];

    // Deal histogram configs
    //   if ($('#HistoPane_Sync').find('.DPTI').attr('disabled')) {
    //     $('#HistoPane_Sync').find('.DPTI').val(syncChannel)
    //     $('#HistoPane_Divide').find('.DPTI').val(divide)
    //     $('#HistoPane_BinCount').find('.DPTI').val(length)
    //     $('#HistoPane_ViewStart').find('.DPTI').val(viewFrom)
    //     $('#HistoPane_ViewStop').find('.DPTI').val(viewTo)
    //   }

    const xs = linspace(viewFrom, viewTo / divide, length)
    let histogramXsMatched = true
    let coincidences = 0
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
      for (var ii = 0; ii < histogram.xs.length; ii++) {
        if (histogram.xs[ii] > -0.5 && histogram.xs[ii] < 0.5) {
          coincidences += histogram.ys[ii]
        }
      }
    }
    layout['uirevision'] = 'true'
    listener('HistogramXsMatched', histogramXsMatched)

    //   $('#DePTI_Coins').val(coincidences)
    //   count1 = counts[syncChannel]
    //   count2 = counts[signalChannels[0]]
    //   // var syncChannel = configuration['Sync'];
    //   // var signalChannels = configuration['Signals'];
    //   // var counts = result['Data']['Counter']
    //   $('#DePTI_EffA').val(('' + (coincidences / count2 * 100)).substring(0, 5) + '%')
    //   $('#DePTI_EffB').val(('' + (coincidences / count1 * 100)).substring(0, 5) + '%')
    //   $('#DePTI_Gen').val(('' + (count1 * count2 / coincidences / 1e6)).substring(0, 5) + ' MHz')
    Plotly.react('viewport', traces, layout)
  }
  Plotly.redraw('viewport')
}
/***

function initControlPanel(channelNum) {
  temp = $('#DelayPaneTemp')
  for (var i = 0; i < channelNum; i++) {
    newItem = temp.clone(true)
    newItem.removeClass('d-none')
    newItem.addClass('border-left-warning')
    newItem.attr('id', 'ChannelPane_' + i)
    $('#ChannelPane').append(newItem)
    newItem.find('.DPTT').html('CH' + (i < 10 ? '0' : '') + i)
    newItem.find('.DPTT').attr('id', 'DPTT_' + i)
    newItem.find('.DPTI').attr('id', 'DPTI_' + i)
    if (tdcConfiger == null) {
      newItem.find('.DPTI').attr('disabled', 'true')
    }
  }
  temp.remove()

  temp = $('#HistoPaneTemp')

  function addHistoPane(title, hasTail, id) {
    newItem = temp.clone(true)
    newItem.removeClass('d-none')
    newItem.addClass('border-left-info')
    newItem.attr('id', 'HistoPane_' + id)
    newItem.find('.DPTT').html(title)
    if (!hasTail) {
      newItem.find('.DPTTi').addClass('d-none')
    }
    newItem.find('.DPTI').attr('id', 'DPTI_' + id)
    if (tdcConfiger == null) {
      newItem.find('.DPTI').attr('disabled', 'true')
    }
    $('#ViewPanel').append(newItem)
  }
  addHistoPane('Trigger', false, 'Sync')
  addHistoPane('Divide', false, 'Divide')
  addHistoPane('BinNum', false, 'BinCount')
  addHistoPane('From', true, 'ViewStart')
  addHistoPane('To', true, 'ViewStop')
  temp.remove()

  temp = $('#DetailPaneTemp')

  function addDetailPane(title, hasTail, id) {
    newItem = temp.clone(true)
    newItem.removeClass('d-none')
    newItem.addClass('border-left-info')
    newItem.attr('id', 'DetailPane_' + id)
    newItem.find('.DPTT').html(title)
    if (!hasTail) {
      newItem.find('.DPTTi').addClass('d-none')
    }
    newItem.find('.DPTI').attr('id', 'DePTI_' + id)
    newItem.find('.DPTI').attr('disabled', 'true')
    $('#DetailPanel').append(newItem)
  }
  addDetailPane('Count 4/8', false, 'Ratio48')
  addDetailPane('Count 5/9', false, 'Ratio59')
  addDetailPane('符合(±0.5ns)', false, 'Coins')
  addDetailPane('Eff A', false, 'EffA')
  addDetailPane('Eff B', false, 'EffB')
  addDetailPane('产率', false, 'Gen')
  temp.remove()
}

function onTDCConfigInputFocus(id, isBlur) {
  if (isBlur) tdcConfiger.edited(id)
  else tdcConfiger.editing(id)
}

function toggleChannelStatus(id) {
  if (tdcConfiger == null) return
  id = id.split('_')[1]
  if ($('#ChannelPane_' + id).hasClass('border-left-danger')) return
  isOpen = $('#ChannelPane_' + id).hasClass('border-left-success')
  $('#ChannelPane_' + id).removeClass('border-left-success')
  $('#ChannelPane_' + id).removeClass('border-left-warning')
  $('#ChannelPane_' + id).addClass('border-left-' + (isOpen ? 'warning' :
    'success'))

  signals = []
  for (var i = 0; i < channelCount; i++) {
    if ($('#ChannelPane_' + i).hasClass('border-left-success')) {
      signals.push(i)
    }
  }
  worker[tdcService].configureAnalyser(analyser, {
    'Signals': signals
  })
}

function updateIntegralData() {
  var beginTime = onBlurIntegralRange('input-integral-from')
  var endTime = onBlurIntegralRange('input-integral-to')
  invalid = $("#input-integral-from")[0].classList.contains('is-invalid') ||
    $("#input-integral-to")[0].classList.contains('is-invalid')
  var isToNow = $("#input-integral-to")[0].value
  var isToNow = isToNow.length == 0 || isToNow.toLowerCase() == 'now'
  if (!invalid) fetcher.updateIntegralData(beginTime, endTime, isToNow)
  setHistogramConfigEditable(isToNow)
}

function onSelectionIntegral(isIntegral) {
  $("#selection-instant").attr("class", isIntegral ? "btn btn-secondary" :
    "btn btn-success")
  $("#selection-integral").attr("class", isIntegral ? "btn btn-success" :
    "btn btn-secondary")
  $("#IntegralConfig").collapse(isIntegral ? "show" : "hide")
  fetcher.changeMode(isIntegral ? "Stop" : "Instant")
  setHistogramConfigEditable(true)
}

function setHistogramConfigEditable(editable) {
  if (tdcConfiger == null) return
  if (editable) {
    $('#HistoPane').find('.DPTI').removeAttr('disabled')
  } else {
    $('#HistoPane').find('.DPTI').attr('disabled', 'true')
  }
}

function onBlurIntegralRange(id) {
  element = $("#" + id)[0]
  text = element.value
  isNow = false
  if (text.length == 0 || text.toLowerCase() == "now") {
    parsedDate = new Date()
    isNow = (id == 'input-integral-to')
  } else parsedDate = parseSimpleDate(text)
  classList = element.classList
  if (parsedDate) {
    classList.remove('is-invalid')
    if (!isNow) element.value = dateToString(parsedDate)
  } else {
    classList.add('is-invalid')
  }
  return parsedDate
}


*/

function getChannelIndicatorColor(channelInfo) {
  if (channelInfo.isTrigger) return 'orange'
  if (channelInfo.isSignal) return 'green'
  return 'grey-5'
}

function formatDelay(delay) {
  return (delay / 1000.0).toFixed(3)
}

</script>
<style lang="sass">
.channel-card
  margin: 8px
  .q-card__section--vert
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
  .q-field__control
    height: 32px
    padding-left: 6px
    padding-right: 6px

.channel-info-input-count
  .q-field__control
    width: 90px

.channel-info-input-delay
  .q-field__control
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
</style>
