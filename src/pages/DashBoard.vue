<template>
  <q-page class="flex q-pa-md">
    <div class="full-page-element">
      <q-table class="dashboard-table full-page-table" title="IFWorkers" :rows="data" :columns="columns" row-key="name"
        :rows-per-page-options="[0]">
        <template v-slot:header="props">
          <q-tr :props="props">
            <q-th v-for="col in props.cols" :key="col.name" :props="props" class="">
              {{ col.label }}
              <q-tooltip anchor="top middle" self="center middle">
                {{ col.name }}
              </q-tooltip>
            </q-th>
          </q-tr>
        </template>
      </q-table>
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
  fetching.value = true
  doMetaFetch()
})
onUnmounted(() => {
  fetching.value = false
})

const doMetaFetch = async () => {
  let previousData = {}
  for (const i in data.value) previousData[formatAddress(data.value[i]['Address'])] = data.value[i]
  previousDataTime = dataTime
  data.value = await worker.listServiceMeta()
  dataTime = new Date().getTime()
  const timeDelta = dataTime - previousDataTime
  for (const i in data.value) {
    const dataItem = data.value[i]
    const previousDataItem = previousData[formatAddress(dataItem['Address'])]
    if (previousDataItem) {
      dataItem.Statistics['Received Bytes per Second'] = (dataItem.Statistics['Received Bytes'] - previousDataItem.Statistics['Received Bytes']) / timeDelta * 1000
      dataItem.Statistics['Received Message per Second'] = (dataItem.Statistics['Received Message'] - previousDataItem.Statistics['Received Message']) / timeDelta * 1000
      dataItem.Statistics['Sent Bytes per Second'] = (dataItem.Statistics['Sent Bytes'] - previousDataItem.Statistics['Sent Bytes']) / timeDelta * 1000
      dataItem.Statistics['Sent Message per Second'] = (dataItem.Statistics['Sent Message'] - previousDataItem.Statistics['Sent Message']) / timeDelta * 1000
    }
  }
}

const loop = async () => {
  while (true) {
    if (fetching.value) await doMetaFetch()
    await new Promise(r => setTimeout(r, 2000));
  }
}
loop()

const columns = [
  { name: 'Service Name', label: 'Service', align: 'left', field: 'ServiceName', format: val => `${val}`, sortable: true },
  { name: 'Address', align: 'center', label: 'ID', field: 'Address', format: val => formatAddress(val), sortable: true },
  // { name: 'Interfaces', align: 'left', label: 'Interfaces', field: 'Address', format: val => formatAddress(val), sortable: true },
  { name: 'On Time', align: 'center', label: 'OnTime', field: 'OnTime', format: val => formatOnTime(val), sortable: true },
  { name: 'Received Bytes', align: 'center', label: 'R/B', field: row => row.Statistics['Received Bytes'], format: val => formatDataSize(val, 'B'), sortable: true },
  { name: 'Received Messages', align: 'center', label: 'R/M', field: row => row.Statistics['Received Message'], format: val => formatDataSize(val, 'S'), sortable: true },
  { name: 'Sent Bytes', align: 'center', label: 'S/B', field: row => row.Statistics['Sent Bytes'], format: val => formatDataSize(val, 'B'), sortable: true },
  { name: 'Sent Messages', align: 'center', label: 'S/M', field: row => row.Statistics['Sent Message'], format: val => formatDataSize(val, 'S'), sortable: true },
  { name: 'Received Bytes /s', align: 'center', label: 'R/Bps', field: row => row.Statistics['Received Bytes per Second'], format: val => formatDataSize(val, 'Bps', true), sortable: true },
  { name: 'Received Messages /s', align: 'center', label: 'R/Sps', field: row => row.Statistics['Received Message per Second'], format: val => formatDataSize(val, 'Bps', true), sortable: true },
  { name: 'Sent Bytes /s', align: 'center', label: 'S/Bps', field: row => row.Statistics['Sent Bytes per Second'], format: val => formatDataSize(val, 'Bps', true), sortable: true },
  { name: 'Sent Messages /s', align: 'center', label: 'S/Sps', field: row => row.Statistics['Sent Message per Second'], format: val => formatDataSize(val, 'Bps', true), sortable: true },
]

const formatAddress = (address) => {
  let formattedAddress = ''
  for (var i = 0; i < address.length; i++) {
    var part = address[i].toString(16)
    if (part.length === 2) formattedAddress += part
    else formattedAddress += '0' + part
    if (i < address.length - 1) formattedAddress += '-'
  }
  return formattedAddress.toUpperCase()
}

function formatOnTime(onTime) {
  if (onTime / 86400 >= 2) return '' + Math.floor(onTime / 86400) + ' days'
  if (onTime / 86400 >= 1) return '' + Math.floor(onTime / 86400) + ' day'
  if (onTime / 3600 >= 2) return '' + Math.floor(onTime / 3600) + ' hours'
  if (onTime / 3600 >= 1) return '' + Math.floor(onTime / 3600) + ' hour'
  if (onTime / 60 >= 2) return '' + Math.floor(onTime / 60) + ' minutes'
  if (onTime / 60 >= 1) return '' + Math.floor(onTime / 60) + ' minute'
  if (onTime >= 2) return '' + Math.floor(onTime) + ' seconds'
  return '' + Math.floor(onTime) + ' second'
}

function formatDataSize(v, unit, roundLow = false) {
  if (v == undefined) return ''
  if (v >= 1e12) return '' + ((v / 1e12).toPrecision(3)) + ' T' + unit
  if (v >= 1e9) return '' + ((v / 1e9).toPrecision(3)) + ' G' + unit
  if (v >= 1e6) return '' + ((v / 1e6).toPrecision(3)) + ' M' + unit
  if (v >= 1e3) return '' + ((v / 1e3).toPrecision(3)) + ' K' + unit
  return '' + (roundLow ? parseInt(v) : v.toPrecision(3)) + ' ' + unit
}

// function formatInterfaces(interfaces) {
//   let result = ''
//   for (var i = 0; i < interfaces.length; i++) {
//     if (i > 0) result += ', '
//     result += '<a href="/protocol/interface/' + interfaces[i] + '">' +
//       interfaces[i] + '</a>'
//   }
//   return result
// }

</script>
<style lang="sass">
.dashboard-table
  /* height or max-height is important */

  .q-table__top,
  .q-table__bottom,
  thead tr:first-child th
    /* bg color is important for th; just specify one */
    background-color: white

  thead tr th
    position: sticky
    z-index: 1
  thead tr:first-child th
    top: 0

  /* this is when the loading indicator appears */
  &.q-table--loading thead tr:last-child th
    /* height of all previous header rows */
    top: 48px

  /* prevent scrolling behind sticky top row on focus */
  tbody
    /* height of all previous header rows */
    scroll-margin-top: 48px

.full-page-element
  position: absolute
  top: 20px
  bottom: 20px
  left: 20px
  right: 20px

.full-page-table
  position: absolute
  top: 0px
  bottom: 0px
  left: 0px
  right: 0px
</style>
