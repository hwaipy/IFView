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
    <template v-if="showMdViewer">
      <q-separator />
      <q-card-section class="access-md-section">
        <q-banner v-if="mdError" dense class="bg-warning text-dark q-mb-md">{{ mdError }}</q-banner>
        <div v-else-if="mdLoading" class="text-grey-7 q-py-sm">加载说明文档…</div>
        <div v-else ref="mdBodyEl" class="access-md-body" v-html="mdHtml" @click="onMdBodyClick"></div>
      </q-card-section>
    </template>
  </q-card>

  <q-dialog v-model="codeDialogOpen">
    <q-card class="access-code-dialog-card">
      <q-card-section class="row items-center q-pb-none">
        <div class="text-subtitle1">示例 Python 代码</div>
        <q-space />
        <q-btn flat dense label="复制" color="primary" @click="copyCodeDialog" />
        <q-btn flat round dense icon="close" v-close-popup />
      </q-card-section>
      <q-card-section class="q-pt-sm">
        <pre class="access-code-dialog-pre"><code class="hljs language-python" v-html="codeDialogHtml"></code></pre>
      </q-card-section>
    </q-card>
  </q-dialog>
</template>

<script setup>
import { ref, onMounted, onUnmounted, computed, watch, nextTick } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { renderAccessMarkdown } from 'src/utils/accessMarkdown'
import { interpolateExperimentConfigMarkdown } from 'src/utils/interpolateExperimentConfigMarkdown'
import {
  createMdActionHandlers,
  handleMarkdownActionClick,
} from 'src/utils/accessMarkdownActions'
import {
  SNIPPET_NETWORK_FIELDS,
  getShowCodeSnippetContext,
  buildPlaceholderPythonSnippet,
  patchShowCodeNetworkButtons,
} from 'src/utils/accessNetworkSnippet'
import { enhanceMarkdownFenceCopyButtons } from 'src/utils/accessMarkdownFenceEnhance'
import { loadConfig } from 'src/services/Config'
import hljs from 'highlight.js/lib/core'

const route = useRoute()
const router = useRouter()

const lastMdConfigJson = ref(null)
const codeDialogOpen = ref(false)
const codeDialogText = ref('')
const codeDialogHtml = ref('')

watch([codeDialogText, codeDialogOpen], () => {
  if (!codeDialogOpen.value || !codeDialogText.value) {
    codeDialogHtml.value = ''
    return
  }
  try {
    codeDialogHtml.value = hljs.highlight(codeDialogText.value, { language: 'python' }).value
  } catch {
    try {
      codeDialogHtml.value = hljs.highlightAuto(codeDialogText.value).value
    } catch {
      codeDialogHtml.value = ''
    }
  }
})

const experimentSlug = computed(() => {
  const e = route.query.experiment
  if (e == null || String(e).trim() === '') return ''
  return String(e).trim()
})

function showCodeFromNetwork(args) {
  const field = args.field
  if (!Object.prototype.hasOwnProperty.call(SNIPPET_NETWORK_FIELDS, field)) return
  const ctx = getShowCodeSnippetContext(lastMdConfigJson.value, args)
  if (!ctx) return
  const collection =
    typeof args.collection === 'string' && args.collection.trim() !== ''
      ? args.collection.trim()
      : 'TFQKD_TDC'
  codeDialogText.value = buildPlaceholderPythonSnippet({
    fieldKey: field,
    jsonMeta: ctx.jsonMeta,
    jsonRaw: ctx.jsonRaw,
    collection,
  })
  codeDialogOpen.value = true
}

async function copyCodeDialog() {
  try {
    await navigator.clipboard.writeText(codeDialogText.value)
  } catch {
    /* ignore */
  }
}

/** Markdown 内 `<button data-md-action>` 的白名单；可在此展开合并自定义动作函数。 */
const mdActionHandlers = {
  ...createMdActionHandlers({
    router,
    getExperiment: () => experimentSlug.value,
  }),
  showCode: showCodeFromNetwork,
}

function onMdBodyClick(e) {
  handleMarkdownActionClick(e, mdBodyEl.value, mdActionHandlers)
}

const hasExperimentMd = computed(() => experimentSlug.value !== '')

const mdFetchPath = computed(() =>
  hasExperimentMd.value ? `/configs/${experimentSlug.value}.md` : ''
)

const mdHtml = ref('')
const mdError = ref('')
const mdMissing = ref(false)
const mdLoading = ref(false)

/** 无 experiment、或未找到 md、或加载成功但内容为空时，不展示整块说明区域 */
const showMdViewer = computed(() => {
  if (!hasExperimentMd.value || mdMissing.value) return false
  if (mdLoading.value || mdError.value) return true
  return mdHtml.value.trim().length > 0
})

/** 说明 md 为可选：404/403 视为未提供，其它失败再报错 */
function isMissingMdResponse(status) {
  return status === 404 || status === 403
}

const mdBodyEl = ref(null)

async function loadMarkdown() {
  mdError.value = ''
  mdHtml.value = ''
  mdMissing.value = false
  lastMdConfigJson.value = null
  if (!hasExperimentMd.value) {
    mdLoading.value = false
    return
  }
  mdLoading.value = true
  try {
    const t = Date.now()
    const jsonUrl = `/configs/${experimentSlug.value}.json?t=${t}`
    const [res, resJson] = await Promise.all([
      fetch(mdFetchPath.value + '?t=' + t),
      fetch(jsonUrl),
    ])
    if (!res.ok) {
      if (isMissingMdResponse(res.status)) {
        mdMissing.value = true
        return
      }
      mdError.value = `无法加载说明文档（HTTP ${res.status}）：${mdFetchPath.value}`
      return
    }
    let configJson = null
    if (resJson.ok) {
      try {
        configJson = await resJson.json()
      } catch {
        configJson = null
      }
    }
    const rawMd = await res.text()
    const text = interpolateExperimentConfigMarkdown(rawMd, configJson)
    const html = await renderAccessMarkdown(text)
    lastMdConfigJson.value = configJson
    mdHtml.value = typeof html === 'string' ? html : String(html)
  } catch (e) {
    mdError.value = '加载说明文档失败：' + (e && e.message ? e.message : String(e))
  } finally {
    mdLoading.value = false
  }
}

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
  await loadMarkdown()
})

watch(() => route.query.experiment, () => {
  loadMarkdown()
})

watch(
  [mdHtml, mdLoading, mdMissing, mdError],
  async () => {
    await nextTick()
    if (mdLoading.value || mdError.value || mdMissing.value || !mdHtml.value) return
    patchShowCodeNetworkButtons(mdBodyEl.value, lastMdConfigJson.value)
    enhanceMarkdownFenceCopyButtons(mdBodyEl.value)
  }
)

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

.access-md-section
  padding-top: 12px

.access-md-body
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
  :deep(pre:not(.access-md-fence))
    margin: 0.65em 0
    padding: 10px 12px
    overflow: auto
    border-radius: 6px
    background: rgba(0, 0, 0, 0.06)
    font-size: 0.85rem
    line-height: 1.45
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
  :deep(.access-md-action-btn)
    display: inline-block
    font-size: 13px
    padding: 6px 12px
    margin: 0.35em 0.5em 0.35em 0
    border-radius: 4px
    border: 1px solid rgba(25, 118, 210, 0.45)
    background: rgba(25, 118, 210, 0.08)
    color: rgb(25, 118, 210)
    cursor: pointer
    vertical-align: middle
  :deep(.access-md-action-btn:hover)
    background: rgba(25, 118, 210, 0.16)
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
  :deep(table)
    border-collapse: collapse
    margin: 0.65em 0
    font-size: 0.9rem
  :deep(th), :deep(td)
    border: 1px solid rgba(0, 0, 0, 0.12)
    padding: 6px 10px
  :deep(.katex-display)
    overflow-x: auto
    overflow-y: hidden
    padding: 0.35em 0

.access-code-dialog-card
  min-width: min(560px, 96vw)
  max-width: 96vw

.access-code-dialog-pre
  margin: 0
  padding: 0
  overflow: auto
  max-height: min(70vh, 520px)
  border-radius: 6px
  font-size: 0.8rem
  line-height: 1.45
  background: transparent
  :deep(code.hljs)
    display: block
    padding: 12px
    margin: 0
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace
    font-size: inherit
    white-space: pre
    word-break: normal

</style>
