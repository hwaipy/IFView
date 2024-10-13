<template>
  <q-input v-bind="attrs" :class="customClass" :style="customStyle" :label="customLabel"> </q-input>
</template>

<script setup>
import { useAttrs, onMounted } from 'vue'
import { QInput } from 'quasar'

// <!-- @focus="onFocus(channelInfo.i)" @blur="onDelayEditorBlur(channelInfo.i)"
//     @keyup.enter="onDelayEditorEnter(channelInfo.i)" @keyup.esc="onDelayEditorEscape(channelInfo.i)"
//     :ref="setChannelDelayInputs" -->

const props = defineProps({
  customClass: {
    type: String,
    default: ''
  },
  customStyle: {
    type: Object,
    default: () => ({})
  },
  customLabel: {}
})
const attrs = useAttrs()

onMounted(() => {
  console.log(attrs);
})

function onDelayEditorFocus(ch) { channelInfos.value[ch].editing = true }
function onDelayEditorBlur(ch) { doneDelayEditing(ch, true, true) }
function onDelayEditorEnter(ch) { doneDelayEditing(ch, true, false) }
function onDelayEditorEscape(ch) {
  doneDelayEditing(ch, false, false)
  channelDelayInputs[ch].blur()
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
</script>

<style scoped></style>
