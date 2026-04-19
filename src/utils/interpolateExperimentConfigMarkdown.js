/**
 * 在 Access 等页面的 Markdown 中插入来自同名实验 JSON 的值。
 *
 * 占位符：`{{config:点分路径}}`，路径区分大小写，与 `public/configs/<experiment>.json` 一致。
 * 示例：`{{config:Access.0.AccessLab}}`、`{{config:IFWorkers.Main}}`
 *
 * 数组下标用数字段：`Applications.0.applications.1.href`
 *
 * 未找到路径时保留原占位符；值为对象/数组时替换为 `JSON.stringify` 结果。
 *
 * `Access.<n>.(AccessLab|AccessCampus|AccessField)` 的字符串值在写入 md 前会去掉末尾「空格 + 圆括号」备注（如 ` (from 7 km)`），与 `stripAccessEndpointNotes` 中逻辑一致（含 TFAccess 生成的 Python 示例）。
 */

import {
  ACCESS_ENDPOINT_CONFIG_PATH,
  stripTrailingAccessEndpointNotes,
} from 'src/utils/stripAccessEndpointNotes'

const CONFIG_PLACEHOLDER = /\{\{config:([^}]+)\}\}/g

export function getByPath(obj, path) {
  if (obj == null || path == null) return undefined
  const parts = String(path)
    .trim()
    .split('.')
    .filter(Boolean)
  let cur = obj
  for (const p of parts) {
    if (cur == null) return undefined
    const key = /^\d+$/.test(p) ? Number(p) : p
    cur = cur[key]
  }
  return cur
}

export function interpolateExperimentConfigMarkdown(text, configJson) {
  if (text == null || text === '') return text
  if (configJson == null || typeof configJson !== 'object') return text
  return String(text).replace(CONFIG_PLACEHOLDER, (full, pathExpr) => {
    const path = String(pathExpr).trim()
    const v = getByPath(configJson, path)
    if (v === undefined) return full
    if (v === null) return ''
    if (typeof v === 'object') return JSON.stringify(v)
    if (typeof v === 'string' && ACCESS_ENDPOINT_CONFIG_PATH.test(path)) {
      return stripTrailingAccessEndpointNotes(v)
    }
    return String(v)
  })
}
