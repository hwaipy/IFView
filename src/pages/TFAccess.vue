<template>
  <q-card class="histogram-card" bordered>
    <div class="full-page-element">
      <q-table class="dashboard-table full-page-table" title="Address List for Access" :rows="data" :columns="columns"
        row-key="name" :rows-per-page-options="[0]">
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
  </q-card>
</template>

<script setup>
import { ref, onMounted, onUnmounted } from 'vue';
import { loadConfig } from 'src/services/Config';

const columns = [
  { name: 'Name', label: 'Name', align: 'center', field: 'ServiceName', format: val => `${val}`, sortable: true },
  { name: 'AccessLab', align: 'center', label: '实验室内', field: 'AccessLab', format: val => `${val}`, sortable: true },
  { name: 'AccessCampus', align: 'center', label: '研究院内', field: 'AccessCampus', format: val => `${val}`, sortable: true },
  { name: 'AccessField', align: 'center', label: '外网', field: 'AccessField', format: val => `${val}`, sortable: true },
]
const data = ref([
  // { 'ServiceName': 'IF Broker', 'AccessLab': '192.168.25.5:1061', 'AccessCampus': '-', 'AccessField': 'code.qpqi.group:1161' },
  // { 'ServiceName': 'Raw Data (datablock)', 'AccessLab': '192.168.25.5:1000', 'AccessCampus': '-', 'AccessField': '-' },
  // { 'ServiceName': '[VNC] Alice', 'AccessLab': '192.168.25.36(:5900)', 'AccessCampus': '-', 'AccessField': 'vnc.qpqi.group:50036' },
  // { 'ServiceName': '[VNC] Bob', 'AccessLab': '192.168.25.37(:5900)', 'AccessCampus': '-', 'AccessField': 'vnc.qpqi.group:50037' },
  // { 'ServiceName': '[VNC] Calvin', 'AccessLab': '192.168.25.38(:5900)', 'AccessCampus': '-', 'AccessField': 'vnc.qpqi.group:50038' },
  // { 'ServiceName': '[VNC] Alice Sender', 'AccessLab': '192.168.25.40(:5900)', 'AccessCampus': '-', 'AccessField': 'vnc.qpqi.group:50040' },
  // { 'ServiceName': '[VNC] Bob Sender', 'AccessLab': '192.168.25.41(:5900)', 'AccessCampus': '-', 'AccessField': 'vnc.qpqi.group:50041' },
  // { 'ServiceName': '[VNC] Calvin Server', 'AccessLab': '192.168.25.5(:5900)', 'AccessCampus': '-', 'AccessField': 'vnc.qpqi.group:50138' },
])

onMounted(async () => {
  const experimentConfig = await loadConfig()
  data.value = experimentConfig.access
})
onUnmounted(() => {
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
