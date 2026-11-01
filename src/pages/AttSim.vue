<template>
  <q-page padding>
    <h1 class="text-h4">AttSim</h1>
    <q-banner v-if="route.query.experiment === 'attsim-lan'" class="bg-blue-1 text-primary q-mb-md" rounded>
      2502 局域网模式 · 服务连接：ws://192.168.25.5:1063/ws/
    </q-banner>
    <div class="text-caption text-grey-7 q-mb-md">
      <span v-if="fetchTime">Storage 更新时间：{{ fetchTime }}</span>
      <span v-else>正在等待 Storage 数据…</span>
    </div>
    <div class="row q-col-gutter-md">
      <div v-for="item in delays" :key="item.key" class="col-12 col-sm-6">
        <q-card bordered>
          <q-card-section>
            <div class="text-subtitle1">{{ item.label }} Delay</div>
            <div class="row items-baseline justify-between no-wrap q-mt-sm">
              <div class="text-h5">{{ item.value }}<span v-if="item.value !== '无数据'"> ns</span></div>
              <div class="text-caption text-grey-7 text-right q-ml-md">
                {{ item.average }} ± {{ item.stdDev }} ns
              </div>
            </div>
          </q-card-section>
          <q-separator />
          <q-card-section><div :id="item.chartId" class="delay-chart"></div></q-card-section>
        </q-card>
      </div>
      <div class="col-12">
        <q-card bordered>
          <q-card-section>
            <div class="text-subtitle1">QBER</div>
            <div v-if="qberStats" class="q-mt-sm">
              <q-markup-table flat dense separator="horizontal">
                <tbody>
                  <tr>
                    <th class="text-left">E_Z</th>
                    <td>({{ qberStats.ez[0].toFixed(5) }}, {{ qberStats.ez[1].toFixed(2) }}, {{ qberStats.ez[2].toFixed(2) }})</td>
                  </tr>
                  <tr>
                    <th class="text-left">Z counts</th>
                    <td>{{ qberStats.zCount }}</td>
                  </tr>
                  <tr v-for="item in qberStats.errors" :key="item.key">
                    <th class="text-left">{{ item.label }}</th>
                    <td>{{ item.percent }}% <span class="text-grey-7">({{ item.count }} counts)</span></td>
                  </tr>
                  <tr>
                    <th class="text-left">Phase threshold</th>
                    <td>{{ qberStats.thresholdRad }} rad</td>
                  </tr>
                </tbody>
              </q-markup-table>
              <div class="text-subtitle2 q-mt-md">Processed QBER</div>
              <q-markup-table flat dense separator="horizontal">
                <tbody>
                  <tr>
                    <th class="text-left">QBER_Z</th>
                    <td>{{ qberStats.qberZ.toFixed(3) }}% <span class="text-grey-7">(60s avg {{ qberStats.qberZAverage.toFixed(3) }}%)</span></td>
                  </tr>
                  <tr>
                    <th class="text-left">QBER_X</th>
                    <td>{{ qberStats.qberX.toFixed(3) }}% <span class="text-grey-7">(60s avg {{ qberStats.qberXAverage.toFixed(3) }}%)</span></td>
                  </tr>
                </tbody>
              </q-markup-table>
            </div>
            <div v-else class="text-body2 q-mt-sm">{{ qberStatus }}</div>
            <div class="row q-col-gutter-md q-mt-sm">
              <div class="col-12 col-sm-6"><div id="qber-z-chart" class="delay-chart"></div></div>
              <div class="col-12 col-sm-6"><div id="qber-x-chart" class="delay-chart"></div></div>
            </div>
            <details v-if="qberRaw" class="q-mt-sm">
              <summary>原始 QBER 数据</summary>
              <pre class="qber-text">{{ qberRaw }}</pre>
            </details>
          </q-card-section>
        </q-card>
      </div>
      <div class="col-12">
        <q-card bordered>
          <q-card-section>
            <div class="text-h6">Charlie 端 Signal 光估算</div>
            <div class="text-caption text-grey-7 q-mt-xs">
              按 Alice、Bob 独立选择强度与 basis 计算；未列出的 basis 概率视为 O/真空态（μ=0），两端使用相同信道效率。效率以 dB 输入（负值表示损耗），按 10^(dB/10) 转为线性效率，0 dB 表示 100% 传输。
              表格列出包含 O 的 16 种有序 basis 配对。N 默认对应 1 秒、100 MHz 的脉冲对数，可按实际统计区间修改。
            </div>
            <div class="row q-col-gutter-sm q-mt-sm">
              <div v-for="parameter in qkdParameters" :key="parameter.key" class="col-6 col-sm-3 col-md-2">
                <q-input
                  v-model.number="qkdParams[parameter.key]"
                  :label="parameter.label"
                  type="number"
                  :min="parameter.key === 'etaDb' ? undefined : 0"
                  :max="parameter.max"
                  :step="parameter.step"
                  dense
                  outlined
                />
              </div>
              <div class="col-12 col-sm-6 col-md-4">
                <q-input
                  v-model.number="qkdParams.pulsePairs"
                  label="脉冲对数 N"
                  type="number"
                  min="1"
                  step="1000000"
                  dense
                  outlined
                />
              </div>
            </div>
            <q-banner v-if="!estimate.valid" class="bg-red-1 text-negative q-mt-sm" rounded>
              {{ estimate.errorMessage }}
            </q-banner>
            <template v-else>
              <div class="row q-col-gutter-md q-mt-sm">
                <div class="col-12 col-sm-6">
                  <div class="text-caption text-grey-7">Charlie 端预期 Signal 光子总数</div>
                  <div class="text-h5">{{ formatCount(estimate.totalPhotons) }} photons</div>
                </div>
                <div class="col-12 col-sm-6">
                  <div class="text-caption text-grey-7">Signal basis 配对数（不含 O）</div>
                  <div class="text-h5">{{ formatCount(estimate.signalPairCount) }}</div>
                </div>
              </div>
              <q-markup-table flat dense separator="horizontal" class="q-mt-sm">
                <thead>
                  <tr>
                    <th class="text-left">Basis 配对 (Alice, Bob)</th>
                    <th class="text-right">配对概率</th>
                    <th class="text-right">预期配对数</th>
                    <th class="text-right">预期光子数</th>
                  </tr>
                </thead>
                <tbody>
                  <tr v-for="pair in estimate.pairs" :key="pair.key">
                    <td>{{ pair.label }}</td>
                    <td class="text-right">{{ pair.probability.toFixed(6) }}</td>
                    <td class="text-right">{{ formatCount(pair.count) }}</td>
                    <td class="text-right">{{ formatCount(pair.photons) }}</td>
                  </tr>
                </tbody>
              </q-markup-table>
            </template>
          </q-card-section>
        </q-card>
      </div>
    </div>
    <q-banner v-if="error" class="bg-red-1 text-negative q-mt-md" rounded>
      读取 Storage 失败：{{ error }}
    </q-banner>
    <q-card bordered class="q-mt-md">
      <q-card-section>
        <q-banner v-if="helpMdError" dense class="bg-warning text-dark">{{ helpMdError }}</q-banner>
        <div v-else-if="helpMdLoading" class="text-grey-7">加载说明文档…</div>
        <div v-else class="attsim-md-body" v-html="helpMdHtml"></div>
      </q-card-section>
    </q-card>
  </q-page>
</template>

<script setup>
import { computed, onMounted, onUnmounted, reactive, ref } from 'vue';
import { useRoute } from 'vue-router';
import { loadConfig } from 'src/services/Config';
import { TDCStorageStreamFetcher } from 'src/services/IFExp';
import { renderAccessMarkdown } from 'src/utils/accessMarkdown';
import Plotly from 'plotly.js-dist-min';

defineOptions({
  name: 'AttSimPage'
});

const route = useRoute();
const helpMdHtml = ref('');
const helpMdLoading = ref(true);
const helpMdError = ref('');

async function loadHelpMarkdown() {
  try {
    const response = await fetch('/configs/attsim.md?t=' + Date.now());
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    helpMdHtml.value = await renderAccessMarkdown(await response.text());
  } catch (e) {
    helpMdError.value = '加载说明文档失败：' + (e?.message || String(e));
  } finally {
    helpMdLoading.value = false;
  }
}

const collection = route.query.collection || 'TFQKD_TDC';
const fetchTime = ref('');
const error = ref('');
const qberStats = ref(null);
const qberStatus = ref('等待 QBER 数据…');
const qberRaw = ref('');
const qkdParameters = [
  { key: 'muX', label: 'μₓ', step: '0.001' },
  { key: 'muY', label: 'μᵧ', step: '0.001' },
  { key: 'muZ', label: 'μ_z', step: '0.001' },
  { key: 'rhoX', label: 'ρₓ', step: '0.001' },
  { key: 'rhoY', label: 'ρᵧ', step: '0.001' },
  { key: 'rhoZ', label: 'ρ_z', step: '0.001' },
  { key: 'etaDb', label: '信道效率 (dB)', step: '0.1' },
];
const qkdParams = reactive({
  muX: 0.030,
  muY: 0.483,
  muZ: 0.494,
  rhoX: 0.063,
  rhoY: 0.209,
  rhoZ: 0.053,
  etaDb: 0,
  pulsePairs: 100000000,
});
const estimate = computed(() => {
  const muX = Number(qkdParams.muX);
  const muY = Number(qkdParams.muY);
  const muZ = Number(qkdParams.muZ);
  const rhoX = Number(qkdParams.rhoX);
  const rhoY = Number(qkdParams.rhoY);
  const rhoZ = Number(qkdParams.rhoZ);
  const etaDb = Number(qkdParams.etaDb);
  const eta = 10 ** (etaDb / 10);
  const pulsePairs = Number(qkdParams.pulsePairs);
  const rhoSum = rhoX + rhoY + rhoZ;
  const basis = [
    { name: 'O', probability: 1 - rhoSum, mu: 0 },
    { name: 'X', probability: rhoX, mu: muX },
    { name: 'Y', probability: rhoY, mu: muY },
    { name: 'Z', probability: rhoZ, mu: muZ },
  ];
  const valid = rhoSum <= 1 && rhoSum >= 0 && Number.isFinite(etaDb) && etaDb <= 0 && Number.isFinite(eta) &&
    Number.isFinite(pulsePairs) && pulsePairs > 0 &&
    basis.every(item => Number.isFinite(item.probability) && item.probability >= 0 && Number.isFinite(item.mu) && item.mu >= 0);
  const pairs = basis.flatMap(alice => basis.map(bob => {
    const probability = alice.probability * bob.probability;
    const count = pulsePairs * probability;
    return {
      key: `${alice.name}-${bob.name}`,
      label: `${alice.name} – ${bob.name}`,
      probability,
      count,
      photons: count * (alice.mu + bob.mu) * eta,
    };
  }));
  return {
    valid,
    errorMessage: rhoSum > 1 || rhoSum < 0
      ? `basis 概率总和不能大于 1，当前总和为 ${rhoSum.toFixed(3)}。`
      : !Number.isFinite(etaDb) || etaDb > 0
        ? '信道效率 dB 需为小于或等于 0 的有限数值。'
        : !Number.isFinite(pulsePairs) || pulsePairs <= 0
          ? '脉冲对数 N 需为正的有限数值。'
          : '参数必须为有效的非负数值。',
    rhoSum,
    pairs,
    signalPairCount: pulsePairs * rhoSum * rhoSum,
    totalPhotons: pulsePairs * 2 * (rhoX * muX + rhoY * muY + rhoZ * muZ) * eta,
  };
});
const delays = ref([
  { key: 'TFQKDSyncAlice', label: 'Alice', chartId: 'alice-delay-chart', value: '无数据', average: '—', stdDev: '—' },
  { key: 'TFQKDSyncBob', label: 'Bob', chartId: 'bob-delay-chart', value: '无数据', average: '—', stdDev: '—' },
]);

let workerTDC = null;
let delayFetcher = null;
const chartPoints = { alice: [], bob: [] };
const qberPoints = { z: [], x: [] };
const filter = {
  'Data.TFQKDSyncAlice.Delay': 1,
  'Data.TFQKDSyncBob.Delay': 1,
  'Data.QKDQBER': 1,
};

function formatDelay(value) {
  if (value === undefined || value === null) return '无数据';
  const delayInPs = Number(value);
  if (!Number.isFinite(delayInPs)) return String(value);
  return (delayInPs / 1000).toFixed(3);
}

function formatCount(value) {
  if (!Number.isFinite(value)) return '—';
  return new Intl.NumberFormat('zh-CN', { maximumFractionDigits: 3 }).format(value);
}

function formatQBER(result) {
  const basis = result?.RandomNumberBasisStatistics;
  const counts = result?.CountsZ;
  const phaseErrorX = result?.PhaseErrorX;
  const phaseErrorY = result?.PhaseErrorY;
  const phaseErrorZ1 = result?.PhaseErrorZ1;
  const phaseThreshold = result?.PhaseThreshold;
  if (!Array.isArray(basis) || !Array.isArray(counts) || counts.length < 4 ||
      !Array.isArray(phaseErrorX) || !Array.isArray(phaseErrorY) ||
      !Array.isArray(phaseErrorZ1) || phaseErrorX.length < 2 ||
      phaseErrorY.length < 2 || phaseErrorZ1.length < 2 ||
      !Number.isFinite(Number(phaseThreshold))) {
    return null;
  }

  const divide = (numerator, denominator) => Number(numerator) / Number(denominator);
  const fixed = (value, digits) => Number.isFinite(value) ? value.toFixed(digits) : String(value);
  const sum = values => values.reduce((total, value) => total + Number(value), 0);
  const eZ00 = divide(counts[0], basis[0]?.[0]);
  const eZ01 = divide(counts[1], basis[0]?.[3]);
  const eZ10 = divide(counts[2], basis[3]?.[0]);
  const eZ11 = divide(counts[3], basis[3]?.[3]);
  const errorPercent = errors => divide(errors[1], sum(errors)) * 100;
  const errorRatio = errors => divide(errors[1], sum(errors));
  const thresholdRad = Number(phaseThreshold) / 64 * Math.PI / 2;

  return {
    ez: [divide(eZ00, eZ11), divide(eZ01, eZ11), divide(eZ10, eZ11)],
    zCount: sum(counts),
    errors: [
      { key: 'x', label: 'E_X', percent: fixed(errorPercent(phaseErrorX), 2), count: sum(phaseErrorX) },
      { key: 'y', label: 'E_Y', percent: fixed(errorPercent(phaseErrorY), 2), count: sum(phaseErrorY) },
      { key: 'z1', label: 'E_Z1', percent: fixed(errorPercent(phaseErrorZ1), 2), count: sum(phaseErrorZ1) },
    ],
    qberZ: divide(divide(eZ00, eZ11), divide(eZ01, eZ11) + divide(eZ10, eZ11)) * 2 * 100,
    qberX: errorRatio(phaseErrorY) * 100,
    thresholdRad: fixed(thresholdRad, 3),
  };
}

function getAverage(points) {
  return points.length ? points.reduce((sum, point) => sum + point.value, 0) / points.length : 0;
}

function renderQBERTrend(chartId, points, name) {
  Plotly.react(chartId, [{
    x: points.map(point => point.time),
    y: points.map(point => point.value),
    type: 'scatter',
    mode: 'lines',
    name,
  }], {
    ...chartLayout(),
    yaxis: { title: `${name} (%)` },
  });
}

function plot(result) {
  if (!result) {
    for (const [name, label, chartId] of [
      ['alice', 'Alice', 'alice-delay-chart'],
      ['bob', 'Bob', 'bob-delay-chart'],
    ]) {
      chartPoints[name] = [];
      Plotly.react(chartId, [{ x: [], y: [], type: 'scatter', mode: 'lines', name: `${label} Delay` }], chartLayout());
    }
    qberPoints.z = [];
    qberPoints.x = [];
    renderQBERTrend('qber-z-chart', qberPoints.z, 'QBER_Z');
    renderQBERTrend('qber-x-chart', qberPoints.x, 'QBER_X');
    return;
  }

  const timestamp = new Date(result.FetchTime);
  if (Number.isNaN(timestamp.getTime())) return;
  fetchTime.value = timestamp.toLocaleString();
  const qber = result.Data?.QKDQBER;
  qberStats.value = null;
  qberRaw.value = '';
  if (qber === undefined) {
    qberStatus.value = '最新 Storage 记录中没有 QKDQBER 字段';
  } else if (qber === null) {
    qberStatus.value = '最新 Storage 记录中的 QKDQBER 为空';
  } else if (typeof qber === 'string') {
    qberStatus.value = qber;
  } else {
    const parsedQBER = formatQBER(qber);
    if (parsedQBER) {
      const cutoff = timestamp.getTime() - 60_000;
      qberPoints.z.push({ time: timestamp, value: parsedQBER.qberZ });
      qberPoints.x.push({ time: timestamp, value: parsedQBER.qberX });
      qberPoints.z = qberPoints.z.filter(point => point.time.getTime() >= cutoff);
      qberPoints.x = qberPoints.x.filter(point => point.time.getTime() >= cutoff);
      qberStats.value = {
        ...parsedQBER,
        qberZAverage: getAverage(qberPoints.z),
        qberXAverage: getAverage(qberPoints.x),
      };
      qberStatus.value = '';
      qberRaw.value = '';
      renderQBERTrend('qber-z-chart', qberPoints.z, 'QBER_Z');
      renderQBERTrend('qber-x-chart', qberPoints.x, 'QBER_X');
    } else {
      qberStatus.value = 'QBER 数据结构不完整';
      qberRaw.value = JSON.stringify(qber, null, 2);
    }
  }
  for (const [key, name, label, chartId] of [
    ['TFQKDSyncAlice', 'alice', 'Alice', 'alice-delay-chart'],
    ['TFQKDSyncBob', 'bob', 'Bob', 'bob-delay-chart'],
  ]) {
    const rawDelay = result.Data?.[key]?.Delay;
    const delay = Number(rawDelay);
    if (rawDelay === undefined || rawDelay === null || !Number.isFinite(delay)) continue;
    const points = chartPoints[name];
    points.push({ time: timestamp, delay: delay / 1000 });
    const cutoff = timestamp.getTime() - 60_000;
    chartPoints[name] = points.filter(point => point.time.getTime() >= cutoff);
    const values = chartPoints[name].map(point => point.delay);
    const average = values.reduce((sum, value) => sum + value, 0) / values.length;
    const variance = values.reduce((sum, value) => sum + (value - average) ** 2, 0) / values.length;
    const delayDisplay = delays.value.find(item => item.key === key);
    delayDisplay.value = formatDelay(rawDelay);
    delayDisplay.average = average.toFixed(3);
    delayDisplay.stdDev = Math.sqrt(variance).toFixed(3);
    Plotly.react(chartId, [{
      x: chartPoints[name].map(point => point.time),
      y: chartPoints[name].map(point => point.delay),
      type: 'scatter',
      mode: 'lines',
      name: `${label} Delay`,
    }], chartLayout());
  }
  error.value = '';
}

function chartLayout() {
  return {
    xaxis: { title: 'Time', type: 'date', range: [Date.now() - 60_000, Date.now()] },
    yaxis: { title: 'Delay (ns)' },
    margin: { l: 55, r: 16, b: 48, t: 12, pad: 2 },
    autosize: true,
    uirevision: true,
  };
}

onMounted(async () => {
  loadHelpMarkdown();
  try {
    const experimentConfig = await loadConfig();
    workerTDC = experimentConfig?.workers?.TDC;
    if (!workerTDC) throw new Error('未配置 TDC Worker');
    await Promise.all([
      Plotly.newPlot('alice-delay-chart', [{ x: [], y: [], type: 'scatter', mode: 'lines', name: 'Alice Delay' }], chartLayout()),
      Plotly.newPlot('bob-delay-chart', [{ x: [], y: [], type: 'scatter', mode: 'lines', name: 'Bob Delay' }], chartLayout()),
      Plotly.newPlot('qber-z-chart', [{ x: [], y: [], type: 'scatter', mode: 'lines', name: 'QBER_Z' }], chartLayout()),
      Plotly.newPlot('qber-x-chart', [{ x: [], y: [], type: 'scatter', mode: 'lines', name: 'QBER_X' }], chartLayout()),
    ]);
    delayFetcher = new TDCStorageStreamFetcher(workerTDC, collection, 200, filter, plot, () => {});
    delayFetcher.start();
  } catch (e) {
    error.value = e?.message || String(e);
  }
});

onUnmounted(() => {
  if (delayFetcher) delayFetcher.stop();
  for (const chartId of ['alice-delay-chart', 'bob-delay-chart', 'qber-z-chart', 'qber-x-chart']) Plotly.purge(chartId);
});
</script>

<style scoped>
.attsim-md-body :deep(h1),
.attsim-md-body :deep(h2),
.attsim-md-body :deep(h3) {
  margin: 0.75em 0 0.35em;
  font-weight: 600;
  line-height: 1.25;
}

.attsim-md-body :deep(h1) {
  font-size: 1.35rem;
}

.attsim-md-body :deep(h2) {
  font-size: 1.15rem;
}

.attsim-md-body :deep(h3) {
  font-size: 1.05rem;
}

.attsim-md-body :deep(p) {
  margin: 0.5em 0;
}

.delay-chart {
  width: 100%;
  min-height: 260px;
}

.qber-text {
  margin: 8px 0 0;
  white-space: pre-wrap;
  overflow-wrap: anywhere;
  font-family: inherit;
}
</style>
