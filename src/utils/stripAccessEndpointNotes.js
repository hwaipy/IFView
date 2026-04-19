/** Access JSON 里地址列末尾的备注，如 `192.168.0.5:1061 (from 7 km)`；不碰 `host(:port)`（括号前无空格）。 */

export const ACCESS_ENDPOINT_CONFIG_PATH = /^Access\.\d+\.(AccessLab|AccessCampus|AccessField)$/

export function stripTrailingAccessEndpointNotes(s) {
  let out = String(s)
  for (;;) {
    const m = out.match(/^(.*) \([^)]+\)$/)
    if (!m) break
    out = m[1]
  }
  return out
}
