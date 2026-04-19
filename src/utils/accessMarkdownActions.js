/**
 * Markdown 内嵌按钮（需在渲染后的 DOM 上委托 click）：
 *
 * ```html
 * <button type="button" class="access-md-action-btn"
 *   data-md-action="动作名"
 *   data-md-args='{"key":"value"}'>
 *   文案
 * </button>
 * ```
 *
 * `data-md-args` 须为 JSON 对象（不能是数组）。仅允许 `type="button"` 的 `<button>` 触发，避免误点。
 *
 * 内置动作（白名单，可按需在 createMdActionHandlers 中扩展）：
 *
 * - **navigate** — 应用内跳转。`{ "path": "tdcviewer", "query": { ... } }`，`path` 为单段路由名（不含 `/`）。
 * - **navigateCurrentExperiment** — 同上，但会自动合并当前路由的 `experiment` 到 `query`（若当前无 experiment 则忽略）。
 * - **copyText** — 复制字符串。`{ "text": "..." }`，长度上限 50_000。
 * - **openExternal** — 新窗口打开链接。`{ "url": "https://..." }`，仅允许 `http:` / `https:`。
 */

const ALLOWED_APP_SEGMENTS = new Set([
  'dashboard',
  'tdcviewer',
  'tdcencoding',
  'tdcencoding20',
  'process',
  'config',
  'tfmonitor',
  'tfaccess',
])

function firstPathSegment(path) {
  return String(path || '')
    .trim()
    .replace(/^\//, '')
    .split(/[/?#]/)[0]
}

function isAllowedPath(path) {
  const seg = firstPathSegment(path)
  return ALLOWED_APP_SEGMENTS.has(seg)
}

/**
 * @param {{ router: import('vue-router').Router, getExperiment?: () => string }} ctx
 */
export function createMdActionHandlers(ctx) {
  const { router, getExperiment } = ctx

  return {
    navigate(args) {
      const seg = firstPathSegment(args.path)
      if (!isAllowedPath(seg)) return
      const query =
        args.query != null && typeof args.query === 'object' && !Array.isArray(args.query)
          ? { ...args.query }
          : {}
      return router.push({ path: `/${seg}`, query })
    },

    navigateCurrentExperiment(args) {
      const exp = typeof getExperiment === 'function' ? getExperiment() : ''
      if (!exp) return
      const seg = firstPathSegment(args.path)
      if (!isAllowedPath(seg)) return
      const extra =
        args.query != null && typeof args.query === 'object' && !Array.isArray(args.query)
          ? args.query
          : {}
      return router.push({ path: `/${seg}`, query: { ...extra, experiment: exp } })
    },

    async copyText(args) {
      if (args.text == null) return
      const s = String(args.text)
      if (s.length > 50_000) return
      await navigator.clipboard.writeText(s)
    },

    openExternal(args) {
      if (typeof args.url !== 'string') return
      try {
        const u = new URL(args.url, window.location.origin)
        if (u.protocol !== 'http:' && u.protocol !== 'https:') return
        window.open(u.href, '_blank', 'noopener,noreferrer')
      } catch {
        /* ignore */
      }
    },
  }
}

/**
 * @param {MouseEvent} event
 * @param {HTMLElement | null} root
 * @param {Record<string, (args: object, event: MouseEvent) => unknown>} handlers
 * @returns {boolean} 是否已处理（已处理则应 preventDefault）
 */
export function handleMarkdownActionClick(event, root, handlers) {
  if (!root || !(event.target instanceof Node) || !root.contains(event.target)) return false
  const el = event.target instanceof Element ? event.target.closest('[data-md-action]') : null
  if (!el || !root.contains(el)) return false
  if (el.closest('a')) return false
  if (el.tagName.toLowerCase() !== 'button') return false
  const btnType = el.getAttribute('type')
  if (btnType != null && btnType !== '' && btnType !== 'button') return false

  const action = el.getAttribute('data-md-action')
  if (!action || !/^[a-z][a-zA-Z0-9_-]*$/.test(action)) return false

  const raw = el.getAttribute('data-md-args') || '{}'
  let args = {}
  try {
    const parsed = JSON.parse(raw)
    if (parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed)) {
      args = parsed
    }
  } catch {
    return false
  }

  const fn = handlers[action]
  if (typeof fn !== 'function') return false

  event.preventDefault()
  event.stopPropagation()
  void Promise.resolve(fn(args, event)).catch(() => {})
  return true
}
