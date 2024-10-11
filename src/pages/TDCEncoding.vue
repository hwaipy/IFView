<template>
  <q-page class="flex q-pa-md">
    <div class="full-page-element">
      Encoding
    </div>
  </q-page>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import worker from '../services/IFWorker'

const fetching = ref(false)
const data = ref([])
var dataTime = 0
var previousDataTime = 0

onMounted(() => {
  // fetching.value = true
  // doMetaFetch()
})
onUnmounted(() => {
  // fetching.value = false
})


/***
$(document).ready(async function() {
  var endpoint = 'ws://' + window.location.host + '/ws'
  var parameterString = window.location.search
  var parameters = {}
  if (parameterString.length > 0) {
    parameterStrings = parameterString.split('?')[1].split('&')
    for (var i = 0; i < parameterStrings.length; i++) {
      paras = parameterStrings[i].split('=')
      if (paras.length == 2) parameters[paras[0]] = paras[1]
    }
  }
  collection = parameters['collection'] || 'TFQKD_TDC'
  initResultPanel()

  worker = await IFWorker(endpoint)

  filter = {
    'Data.Counter': 1,
    'Data.TFQKDEncoding': 1,
    'Data.TFQKDSyncAlice': 1,
    'Data.TFQKDSyncBob': 1,
    'Data.TFQKDSyncAliceMonitor': 1,
    'Data.TFQKDSyncBobMonitor': 1,
    // 'Data.CoincidenceHistogram': 1,
//    'Data.TFQKDEncoding.Configuration': 1,
//    'Data.TFQKDEncoding.Configuration.SignalChannel': 1,
//    'Data.TFQKDEncoding.Configuration.TimeAliceChannel': 1,
//    'Data.TFQKDEncoding.Configuration.TimeBobChannel': 1,
//    'Data.TFQKDEncoding.Configuration.TriggerChannel': 1,
//    'Data.TFQKDEncoding.Configuration.Period': 1,
//    'Data.TFQKDEncoding.Configuration.BinCount': 1,
//    'Data.TFQKDEncoding.Pulse Count of RandomNumber [0]': 1,
//    'Data.TFQKDEncoding.Pulse Count of RandomNumber [1]': 1,
//    'Data.TFQKDEncoding.Pulse Count of RandomNumber [2]': 1,
//    'Data.TFQKDEncoding.Pulse Count of RandomNumber [3]': 1,
//    'Data.TFQKDEncoding.Pulse Count of RandomNumber [4]': 1,
//    'Data.TFQKDEncoding.Pulse Count of RandomNumber [5]': 1,
//    'Data.TFQKDEncoding.Pulse Count of RandomNumber [6]': 1,
//    'Data.TFQKDEncoding.Pulse Count of RandomNumber [7]': 1,
//    'Data.TFQKDEncoding.Histogram with RandomNumber [0]': 1,
//    'Data.TFQKDEncoding.Histogram with RandomNumber [1]': 1,
//    'Data.TFQKDEncoding.Histogram with RandomNumber [2]': 1,
//    'Data.TFQKDEncoding.Histogram with RandomNumber [3]': 1,
//    'Data.TFQKDEncoding.Histogram with RandomNumber [4]': 1,
//    'Data.TFQKDEncoding.Histogram with RandomNumber [5]': 1,
//    'Data.TFQKDEncoding.Histogram with RandomNumber [6]': 1,
//    'Data.TFQKDEncoding.Histogram with RandomNumber [7]': 1,
  }
//  for (var i = 0; i < Object.keys(MEHistogramKeys).length; i++) {
//    filter['Data.TFQKDEncoding.' + MEHistogramKeys[Object.keys(
//      MEHistogramKeys)[i]]] = 1
//  }
  fetcher = new TDCStorageStreamFetcher(worker, collection, 500, filter, plot, listener)
  fetcher.start()
})

console.log()

worker = null
MEConfigs = [
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

// MEHistogramKeys = {}
// for(var i = 0; i < 128; i++) {
//     MEHistogramKeys[i] = 'Histogram[' + i + ']'
// }
////  10: 'Histogram Alice Time',
////  11: 'Histogram Bob Time',

markPoints = [
  [4.5, 5.5, '#F1E4C6'],
  [7, 9.0, '#D3E4EB']
]
fillTrace = []
for (var i = 0; i < markPoints.length; i++) {
  markPoint = markPoints[i]
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

MEHistograms = new Array(MEConfigs.length)
for (var i = 0; i < MEHistograms.length; i++) {
  MEHistograms[i] = new Histogram()
}
for (var i = 0; i < MEConfigs.length; i++) {
  newItem = $('.MEViewPane').clone(true)
  newItem.removeClass('d-none')
  newItem.removeClass('MEViewPane')
  newItem.attr('id', 'MEViewPane_' + MEConfigs[i][1])
  $('.MEViewRow').append(newItem)
  newItem.find('.MEViewPort').attr('id', MEConfigs[i][1])
}
$('.MEViewPane').remove()

function plot(result, append) {
  var plotStart = new Date().getTime()
  var layout = {
    xaxis: {
      title: 'Time (ns)'
    },
    yaxis: {
      title: 'Count'
    },
    margin: {
      l: 50,
      r: 30,
      b: 50,
      t: 30,
      pad: 4
    },
    // width: 300,
    height: 250,
    showlegend: false,
  }
  var traces = []
  if (result == null) {
    for (var i = 0; i < MEHistograms.length; i++) {
      MEHistograms[i].clear()
      traces.push({
        x: [0],
        y: [0],
        type: 'scatter',
        name: ''
      })
    }
    $('#HistogramWarning')[0].classList.add('d-none')
  } else {
    console.log(result)
    var configuration = result['Data']['TFQKDEncoding']['Configuration']
    var xs = linspace(0, configuration['Period'] / 1000.0, configuration['BinCount'])
    var histogramXsMatched = true
    if (!append) MEHistograms.map(h => h.clear())
    var meData = result['Data']['TFQKDEncoding']
    for (var i = 0; i < MEConfigs.length; i++) {
      var hisIs = MEConfigs[i][2]
      if(MEConfigs[i][1].startsWith('me')) {
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
        line: {
          color: '#2874A6',
        }
      })
    }
    for (var i = 0; i < MEHistograms.length; i++) {
      histogramXsMatched &= MEHistograms[i].xsMatch
    }
    listener('HistogramXsMatched', histogramXsMatched)

    // deal with reports
    updateReports(result, MEHistograms)
  }
  for (var i = 0; i < MEConfigs.length; i++) {
    layout['title'] = MEConfigs[i][0]
    layout['yaxis']['range'] = [0, Math.max(...traces[i]['y']) * 1.05]
    div = MEConfigs[i][1]
    data = fillTrace.concat([traces[i]])
    Plotly.react(div, data, layout, {
      displaylogo: false,
      // responsive: true
    })
//    Plotly.redraw(div)
  }
  var plotStop = new Date().getTime()
  console.log('plot done in ' + (plotStop - plotStart) + ' ms')
}

function updateIntegralData() {
  var beginTime = onBlurIntegralRange('input-integral-from')
  var endTime = onBlurIntegralRange('input-integral-to')
  invalid = $("#input-integral-from")[0].classList.contains('is-invalid') ||
    $("#input-integral-to")[0].classList.contains('is-invalid')
  var isToNow = $("#input-integral-to")[0].value
  var isToNow = isToNow.length == 0 || isToNow.toLowerCase() == 'now'
  if (!invalid) fetcher.updateIntegralData(beginTime, endTime, isToNow)
}

function onSelectionIntegral(isIntegral) {
  $("#selection-instant").attr("class", isIntegral ? "btn btn-secondary" :
    "btn btn-success")
  $("#selection-integral").attr("class", isIntegral ? "btn btn-success" :
    "btn btn-secondary")
  $("#IntegralConfig").collapse(isIntegral ? "show" : "hide")
  fetcher.changeMode(isIntegral ? "Stop" : "Instant")
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

function listener(event, arg) {
  if (event == 'FetchTimeDelta') {
    fetchTimeDelta = arg
    if (fetchTimeDelta > 3000) {
      $('#HistogramWarning')[0].classList.remove('d-none')
      $('#HistogramWarningContent').html("The most recent data was fetched " +
        parseInt(fetchTimeDelta / 1000) + " s ago.")
    } else {
      $('#HistogramWarning')[0].classList.add('d-none')
    }
  } else if (event == 'FetchingProgress') {
    progress = parseInt(arg * 100)
    $('#FetchingProgress').attr('style',
      'background-image: linear-gradient(to right, #BDE6FF ' + (progress) +
      '%, #F8F9FC ' + (progress) + '%)')
  } else if (event == 'FetchingNumber') {
    if (arg == null) {
      $('#FetchNumberContent').html('')
      $('#FetchNumber')[0].classList.add('d-none')
    } else {
      integralFetchedDataCount = arg[0]
      integralTotalDataCount = arg[1]
      integralTime = arg[2]
      content = integralTotalDataCount + ' items (in ' + integralTime + ' s)'
      if (integralFetchedDataCount < integralTotalDataCount) content =
        integralFetchedDataCount + ' / ' + content
      $('#FetchNumber')[0].classList.remove('d-none')
      $('#FetchNumberContent').html(content)
    }
  } else if (event == 'HistogramXsMatched') {
    if (!arg) {
      $('#HistogramError')[0].classList.remove('d-none')
      $('#HistogramErrorContent').html("Histogram Config Not Matched.")
    } else {
      $('#HistogramError')[0].classList.add('d-none')
    }
  } else if (event == 'TooManyRecords') {
    if (arg) {
      $('#TooManyRecordsError')[0].classList.remove('d-none')
      $('#TooManyRecordsErrorContent').html("Too Many Records.")
    } else {
      $('#TooManyRecordsError')[0].classList.add('d-none')
    }
  } else {
    console.log(event + ', ' + arg);
  }
}

function initResultPanel() {
  temp = $('#ResultPaneTemp')

  function addResultPane(div, title, id) {
    newItem = temp.clone(true)
    newItem.removeClass('d-none')
    newItem.addClass('border-left-info')
    newItem.find('.DPTT').html(title)
    newItem.find('.DPTC').attr('id', id)
    $('#' + div).append(newItem)
  }
  addResultPane('ResultPanel_Intensity', 'Signal Pulse Extinction Ratio: ', 'SPER')
  addResultPane('ResultPanel_Intensity', 'Vacuum / Z: ', 'VI')
  addResultPane('ResultPanel_Intensity', 'X / Z: ', 'XI')
  addResultPane('ResultPanel_Intensity', 'Y / Z: ', 'YI')
  addResultPane('ResultPanel_Intensity', 'Signal / Ref (In Pulse): ', 'SRIP')
//  addResultPane('ResultPanel_Rise', 'Z 0 Rise: ', 'Z0R')
//  addResultPane('ResultPanel_Rise', 'Z 1 Rise: ', 'Z1R')
//  addResultPane('ResultPanel_Rise', 'Alice Rise: ', 'AR')
//  addResultPane('ResultPanel_Rise', 'Bob Rise: ', 'BR')
  temp.remove()
}

function calculateRegionValues(result, histograms) {
  regionValues = {}
  regionWidths = markPoints.map(markPoint => markPoint[1] - markPoint[0])
  MEConfigs.map((config, i) => {
    regionValue = markPoints.map(markPoint => {
      start = markPoint[0]
      stop = markPoint[1]
      return histograms[i].xs.zip(histograms[i].ys).filter(z => z[0] >= start && z[0] < stop).map(z => z[1]).sum()
    })
    correspondingPulseCount = config[2].map(r => result['Data']['TFQKDEncoding']['PulseCount[' + r + ']']).sum()
    return regionValue.map((v, i) => v / regionWidths[i]).concat([correspondingPulseCount])
  }).map((v, i) => regionValues[MEConfigs[i][0]] = v)
  return regionValues
}

async function updateReports(result, histograms) {
//    var risesPromise = ['Z 0', 'Z 1', 'Alice Delay', 'Bob Delay'].map(key => {
    var risesPromise = ['Z 0', 'Z 1'].map(key => {
    var his = MEHistograms[MEConfigs.map(c => c[0]).indexOf(key)]
//    return worker.Algorithm_Fitting.riseTimeFit(his.xs, his.ys)
    return 0
  })

  var regionValues = calculateRegionValues(result, MEHistograms)
  var signalPulseExtinctionRatio = (regionValues['All Signals'][0] / regionValues['All Signals'][1])
  var vacuumsCountRate = regionValues['Vacuum'][0] / regionValues['Vacuum'][2]
  var ZCountRate = regionValues['Z'][0]/ regionValues['Z'][2]
  var XCountRate = regionValues['X'][0]/ regionValues['X'][2]
  var YCountRate = regionValues['Y'][0]/ regionValues['Y'][2]
  var signalRefRatioInPulse = (regionValues['All Signals'][0] / regionValues['All Signals'][2] / regionValues['All Ref'][0] * regionValues['All Ref'][2])

  $('#SPER').html((10 * Math.log10(signalPulseExtinctionRatio)).toFixed(3) + ' dB')
  $('#VI').html((10 * Math.log10(vacuumsCountRate / (ZCountRate))).toFixed(2) + ' dB')
  $('#XI').html((XCountRate / ZCountRate).toFixed(3))
  $('#YI').html((YCountRate / ZCountRate).toFixed(3))
  $('#SRIP').html((10 * Math.log10(signalRefRatioInPulse)).toFixed(3) + ' dB')

  var r = await Promise.all(risesPromise)
//  var doit = ['Z0', 'Z1', 'A', 'B'].map((key, i) => {
//    $('#' + key + 'R').html(r[i].toFixed(3) + ' ns')
//  })
}

*/

</script>
