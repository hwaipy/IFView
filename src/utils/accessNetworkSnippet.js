/** 与 Access 说明里「按网络环境生成代码」相关的工具（TFAccess 等页面使用） */

import { stripTrailingAccessEndpointNotes } from 'src/utils/stripAccessEndpointNotes'

export const SNIPPET_NETWORK_FIELDS = {
  AccessLab: '2502 局域网',
  AccessCampus: '研究院局域网',
  AccessField: '公网',
}

/**
 * showCode 的 data-md-args.pair：
 * - live：ServiceName 为「Meta Data」与「Raw Data」
 * - archived：「Archived Data (Meta)」与「Archived Data (Raw)」
 */
export const ACCESS_SNIPPET_PAIRS = {
  live: { meta: 'Meta Data', raw: 'Raw Data' },
  archived: {
    meta: 'Archived Data (Meta)',
    raw: 'Archived Data (Raw)',
  },
}

const DEFAULT_SNIPPET_PAIR = 'live'

export function resolveSnippetPairId(raw) {
  if (raw == null || String(raw).trim() === '') return DEFAULT_SNIPPET_PAIR
  const id = String(raw).trim()
  return Object.prototype.hasOwnProperty.call(ACCESS_SNIPPET_PAIRS, id)
    ? id
    : DEFAULT_SNIPPET_PAIR
}

/** 与表格一致：无内容或 "-" 视为不可用 */
export function accessEndpointHasContent(value) {
  if (value == null) return false
  const s = String(value).trim()
  return s !== '' && s !== '-'
}

export function findMetaAndRawAccessRows(accessList, pairId = DEFAULT_SNIPPET_PAIR) {
  const id = resolveSnippetPairId(pairId)
  const names = ACCESS_SNIPPET_PAIRS[id]
  if (!Array.isArray(accessList)) return { jsonMeta: null, jsonRaw: null, pairId: id }
  const jsonMeta = accessList.find((r) => r && r.ServiceName === names.meta) || null
  const jsonRaw = accessList.find((r) => r && r.ServiceName === names.raw) || null
  return { jsonMeta, jsonRaw, pairId: id }
}

export function canShowNetworkSnippet(jsonMeta, jsonRaw, fieldKey) {
  if (!jsonMeta || !jsonRaw) return false
  if (!Object.prototype.hasOwnProperty.call(SNIPPET_NETWORK_FIELDS, fieldKey)) return false
  return (
    accessEndpointHasContent(jsonMeta[fieldKey]) &&
    accessEndpointHasContent(jsonRaw[fieldKey])
  )
}

/**
 * 解析 showCode 用的 Meta/Raw 行：优先使用 md 按钮里硬编码的 metaHost / rawHost（host:port），否则从 config.Access 按 pair 查找。
 * @param {object | null} configJson
 * @param {{ field?: string, pair?: string, metaHost?: string, rawHost?: string }} args
 * @returns {{ jsonMeta: object, jsonRaw: object } | null}
 */
export function getShowCodeSnippetContext(configJson, args) {
  const field = args.field
  if (!Object.prototype.hasOwnProperty.call(SNIPPET_NETWORK_FIELDS, field)) return null

  const metaHost = typeof args.metaHost === 'string' ? args.metaHost.trim() : ''
  const rawHost = typeof args.rawHost === 'string' ? args.rawHost.trim() : ''
  if (metaHost !== '' && rawHost !== '') {
    const jsonMeta = { [field]: metaHost }
    const jsonRaw = { [field]: rawHost }
    if (canShowNetworkSnippet(jsonMeta, jsonRaw, field)) return { jsonMeta, jsonRaw }
    return null
  }

  const pair = resolveSnippetPairId(args.pair)
  const { jsonMeta, jsonRaw } = findMetaAndRawAccessRows(configJson?.Access, pair)
  if (!canShowNetworkSnippet(jsonMeta, jsonRaw, field)) return null
  return { jsonMeta, jsonRaw }
}

/** Meta 行：IFWorker 用 tcp://host:port，JSON 可能已带 tcp:// */
function hostPortForIfWorker(value) {
  let s = String(value).trim()
  if (s.startsWith('tcp://')) s = s.slice(6)
  return s
}

/** Raw 行：urlopen 里是 http://BBBBB/...，BBBBB 仅 host:port */
function hostPortForRawHttp(value) {
  let s = String(value).trim()
  const lower = s.toLowerCase()
  if (lower.startsWith('http://')) s = s.slice(7)
  else if (lower.startsWith('https://')) s = s.slice(8)
  return s.split('/')[0]
}

export function buildPlaceholderPythonSnippet({ fieldKey, jsonMeta, jsonRaw, collection }) {
  const metaEp = stripTrailingAccessEndpointNotes(String(jsonMeta[fieldKey]).trim())
  const rawEp = stripTrailingAccessEndpointNotes(String(jsonRaw[fieldKey]).trim())
  const aaaaa = hostPortForIfWorker(metaEp)
  const bbbbb = hostPortForRawHttp(rawEp)
  const coll = JSON.stringify(collection)

  return [
    'from interactionfreepy import IFWorker',
    'from urllib.request import urlopen',
    'from pytimetag import DataBlock',
    '',
    `worker = IFWorker('tcp://${aaaaa}')`,
    `metas = worker.Storage.range(${coll}, BEGIN_TIME, END_TIME, by='FetchTime', filter={'FetchTime': 1})`,
    '',
    'for meta in metas:',
    "    fetchTime = meta['FetchTime']",
    `    meta = worker.Storage.get(${coll}, meta['_id'], filter={'_id': 1, 'Data': 1})`,
    '    res = urlopen(f\'http://' +
      bbbbb +
      '/{fetchTime.split("T")[0]}/{fetchTime.split("T")[1][:2]}/{fetchTime[:23].replace("T", "%20").replace(":", "-")}.datablock\')',
    '    data = res.read()',
    '    res.close()',
    '    dataBlock = DataBlock.deserialize(data)',
  ].join('\n')
}

/**
 * 按 JSON 隐藏不可用的 showCode 按钮（data-md-action="showCode" 且 data-md-args 含 field）
 * @param {HTMLElement | null} root
 * @param {object | null} configJson
 */
export function patchShowCodeNetworkButtons(root, configJson) {
  if (!root) return
  root.querySelectorAll('button[data-md-action="showCode"]').forEach((btn) => {
    let args = {}
    try {
      args = JSON.parse(btn.getAttribute('data-md-args') || '{}')
    } catch {
      btn.style.display = 'none'
      return
    }
    const ctx = getShowCodeSnippetContext(configJson, args)
    if (!ctx) {
      btn.style.display = 'none'
      return
    }
    btn.style.display = ''
  })
}
