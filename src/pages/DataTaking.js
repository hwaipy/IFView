$(document).ready(async function () {
  initDeviceStatusPanel()
  initDataStatusPanel()
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

  collection = 'TFQKD_TDCandADCSync'
  //if (parameters['collection']) collection = parameters['collection']
  // collection = 'MDI_DataReviewer_10k100M'
  worker = await IFWorker(endpoint)

  fetcher = new TDCStorageStreamFetcher(worker, collection, 3000, { 'FetchTime': 1, 'Data.SyncedTDCandADC.RelationshipFigure': 1, 'InvalidMark': 1 }, plot, listener)
  fetcher.changeMode("Stop")
  fetcher.start()

  startDeviceStatusUpdateLoop(800)
  startDataStatusUpdateLoop(800)
  //startCPRUpdateLoop(400)
})

worker = null
collection = null

function startDeviceStatusUpdateLoop(inteval) {
  async function DSULoop(device, functionname, id) {
    while (true) {
      try {
        var status = await worker[device][functionname]()
        $('#' + id).prop("checked", status)
      } catch (err) {
        $('#' + id).prop("checked", false)
      }
      await sleep(inteval)
    }
  }
  setTimeout(DSULoop, 0, 'TFTDCServer', 'getPostProcessStatus', 'ICSI_TDCPP')
  setTimeout(DSULoop, 0, 'TFTDCServer', 'isRawDataStore', 'ICSI_TDCLS')
  setTimeout(DSULoop, 0, 'TFQKD_ChannelMonitor', 'isStoring', 'ICSI_ADCS')
}

function startDataStatusUpdateLoop(inteval) {
  async function RecentDataLoop(collection, id) {
    while (true) {
      try {
        var latestData = await worker.Storage.latest(collection, 'FetchTime', null, { 'FetchTime': 1 })
        var date = latestData['FetchTime'].split('.')[0].split('+')[0].replaceAll('T', ' ')
        $('#' + id).html(date)
      } catch (err) {
        $('#' + id).html('')
        console.log(err)
      }
      await sleep(inteval)
    }
  }
  setTimeout(RecentDataLoop, 0, 'TFQKD_TDC', 'DPTC_RDTDC')
  setTimeout(RecentDataLoop, 0, 'TFQKD_ChannelMonitor', 'DPTC_RDADC')
}

async function onDeviceStatusCheck(id) {
  var status = $('#' + id).prop("checked")
  var remoteID = id.split('_')[1]
  if (remoteID == 'TDCPP') {
    worker.TFTDCServer.setPostProcessStatus(status)
  } else if (remoteID == 'TDCLS') {
    worker.TFTDCServer.setRawDataStore(status)
  } else if (remoteID == 'ADCS') {
    worker.TFQKD_ChannelMonitor.setStoring(status)
  }
}

function plot(result, append) {
  plotCountChannelRelations(result, append)
}

function plotCountChannelRelations(result, append) {
  if (result == null) {
    $('#CountChannelRelationPanel').find('.CCRPortPane').remove()
  } else {
    console.log(result)
    invalid = (result['Data']['SyncedTDCandADC'] == undefined) || (result['InvalidMark'])
    console.log(result['InvalidMark'])
    var fetchTime = result['FetchTime'].split('.')[0].replaceAll('T', ' ')
    var dataID = result['_id']
    if (invalid) {

    } else {
      temp = $('#CCRPortPaneTemp')
      newItem = temp.clone(true)
      newItem.removeClass('d-none')
      newItem.find('.CCRHeader').html(fetchTime)
      newItem.find('.CCRPort').attr('id', 'CCRPort_' + dataID)
      newItem.find('.CCRCB').attr('id', 'CCRCB_' + dataID)
      newItem.removeAttr('id')
      newItem.attr('id', 'CCRPortPane_' + dataID)
      $('#CountChannelRelationPanel').append(newItem)
      var devID = 'CCRPort_' + dataID
      figData = result['Data']['SyncedTDCandADC']['RelationshipFigure']
      var imgData = "data:image/png;base64," + figData
      $('#' + devID)[0].src = imgData
      $('#' + devID).removeClass('NI')
      $('#CCRCB_' + dataID).removeClass('d-none')
    }
  }
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
}

function initDeviceStatusPanel() {
  temp = $('#DeviceStatusPaneTemp')

  function addDeviceStatusPane(title, id) {
    newItem = temp.clone(true)
    newItem.removeClass('d-none')
    newItem.find('.DPTT').html(title)
    newItem.find('.ICSI').attr('id', 'ICSI_' + id)
    newItem.find('.ICSL').attr('for', 'ICSI_' + id)
    $('#DeviceStatusPanel').append(newItem)
  }
  addDeviceStatusPane('TDCService PostProcess', 'TDCPP')
  addDeviceStatusPane('TDCService LocalStore', 'TDCLS')
  addDeviceStatusPane('ADCMonitor Store', 'ADCS')
  temp.remove()
}

function initDataStatusPanel() {
  temp = $('#DataStatusPaneTemp')

  function addDataStatusPane(title, id) {
    newItem = temp.clone(true)
    newItem.removeClass('d-none')
    newItem.find('.DPTT').html(title)
    newItem.find('.DPTC').attr('id', 'DPTC_' + id)
    $('#DataStatusPanel').append(newItem)
  }
  addDataStatusPane('Recent TDC Data:', 'RDTDC')
  addDataStatusPane('Recent ADC Data:', 'RDADC')
  addDataStatusPane('Recent Filtering Data:', 'RDF')
  temp.remove()
}

async function onButtonCloseCCR(id) {
  dataID = id.split('_')[1]
  $('#CCRPortPane_' + dataID).addClass('d-none')
  await worker.Storage.update(collection, dataID, { 'InvalidMark': 1 })
}
