<template>
  <div :style="{ color: dotColor }">
    ⬤
    <q-tooltip anchor="center right" self="center left">
      {{ delay }} ms
    </q-tooltip>
  </div>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed } from 'vue';
import worker from '../services/IFWorker'
import EventEmitter from 'eventemitter3';
import { colors } from 'quasar'
const { getPaletteColor, hexToRgb, rgbToHex } = colors

const delay = ref(-1)
const colorMap = [
  [-1, hexToRgb(getPaletteColor('grey-8'))],
  [0, hexToRgb(getPaletteColor('teal'))],
  [20, hexToRgb(getPaletteColor('teal'))],
  [100, hexToRgb(getPaletteColor('orange'))],
  [200, hexToRgb(getPaletteColor('deep-orange'))],
  [500, hexToRgb(getPaletteColor('red'))],
]

const getMixedColor = (color1, value1, color2, value2, value) => {
  if (value <= value1) return color1
  if (value >= value2) return color2
  const getMixedInt = (int1, int2) => {
    return parseInt((value - value1) * (int2 - int1) / (value2 - value1) + int1)
  }
  return {
    r: getMixedInt(color1.r, color2.r),
    g: getMixedInt(color1.g, color2.g),
    b: getMixedInt(color1.b, color2.b),
  }
}

const getPingColor = (delay) => {
  for (let i = 0; i < colorMap.length; i++) {
    if (i == 0) continue
    if (delay > colorMap[i][0]) continue
    return getMixedColor(colorMap[i - 1][1], colorMap[i - 1][0], colorMap[i][1], colorMap[i][0], delay)
  }
  return colorMap[colorMap.length - 1][1]
}

const dotColor = computed(() => {
  return rgbToHex(getPingColor(delay.value))
})

class Ping {
  constructor() {
    this.ping = -1
    this.events = new EventEmitter()
    this.pingLoop()
  }

  on(func) {
    this.events.on('ping', func)
  }

  off(func) {
    this.events.off('ping', func)
  }

  async pingLoop() {
    async function doPing() {
      try {
        let t1 = new Date().getTime();
        let protocol = await worker.protocol();
        if (protocol === "IF1") {
          let deltaT = new Date().getTime() - t1
          return deltaT
        } else {
          return -1
        }
      } catch (error) {
        return -1
      }
    }
    while (true) {
      await new Promise(r => setTimeout(r, 3000));
      this.ping = await doPing(this)
      this.events.emit('ping', this.ping)
    }
  }
}

const ping = new Ping()

const pinged = (v) => {
  delay.value = v
}

onMounted(() => {
  ping.on(pinged)
})

onUnmounted(() => {
  ping.off(pinged)
})
</script>
