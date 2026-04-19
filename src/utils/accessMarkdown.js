import 'highlight.js/styles/github.css'
import 'katex/dist/katex.min.css'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import { marked, Renderer } from 'marked'
import markedKatex from 'marked-katex-extension'

hljs.registerLanguage('bash', bash)
hljs.registerLanguage('javascript', javascript)
hljs.registerLanguage('json', json)
hljs.registerLanguage('python', python)
hljs.registerLanguage('typescript', typescript)
hljs.registerLanguage('xml', xml)
hljs.registerLanguage('yaml', yaml)

const LANG_ALIASES = {
  py: 'python',
  sh: 'bash',
  shell: 'bash',
  zsh: 'bash',
  yml: 'yaml',
  js: 'javascript',
  ts: 'typescript',
  html: 'xml',
  htm: 'xml',
  svg: 'xml',
}

/**
 * 围栏 info 行支持：` ```python `、` ```py title="标题" `、` ```js title='x' `、` ```ts title=foo `
 * title 须写在语言之后；未加引号的 title 不能含空格。
 */
function parseFenceInfo(langRaw) {
  const s = String(langRaw ?? '').trim()
  if (!s) return { langKey: '', title: '' }

  let title = ''
  let rest = s
  const m = s.match(/\btitle\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s"']+))/i)
  if (m) {
    title = (m[1] ?? m[2] ?? m[3] ?? '').trim()
    rest = (s.slice(0, m.index) + s.slice(m.index + m[0].length)).trim()
  }
  const langKey = (rest.split(/\s+/)[0] || '').toLowerCase()
  return { langKey, title }
}

function resolveHljsLanguage(raw) {
  if (raw == null || typeof raw !== 'string') return ''
  const key = raw.trim().toLowerCase()
  if (!key) return ''
  const mapped = LANG_ALIASES[key] || key
  return hljs.getLanguage(mapped) ? mapped : ''
}

function escapeHtml(text) {
  return String(text)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
}

function renderFencedCode(text, langRaw) {
  const { langKey, title } = parseFenceInfo(langRaw)
  const lang = resolveHljsLanguage(langKey)
  let preHtml
  if (lang) {
    try {
      const { value } = hljs.highlight(text, { language: lang })
      preHtml = `<pre class="access-md-fence"><code class="hljs language-${lang}">${value}</code></pre>\n`
    } catch {
      preHtml = null
    }
  }
  if (!preHtml) {
    try {
      const { value } = hljs.highlightAuto(text)
      preHtml = `<pre class="access-md-fence"><code class="hljs">${value}</code></pre>\n`
    } catch {
      preHtml = `<pre class="access-md-fence"><code>${escapeHtml(text)}</code></pre>\n`
    }
  }
  if (title) {
    return `<div class="access-md-fence-block"><div class="access-md-fence-header"><div class="access-md-fence-title">${escapeHtml(title)}</div></div>${preHtml}</div>\n`
  }
  return preHtml
}

// nonStandard: 允许 $…$ 后紧跟中文标点（否则解析会跨过中间的 $，KaTeX 报错）
marked.use(markedKatex({ throwOnError: false, nonStandard: true }))
const defaultLink = Renderer.prototype.link

marked.use({
  renderer: {
    code({ text, lang }) {
      return renderFencedCode(text, lang)
    },
    /** 外链在新标签页打开，避免离开当前 IFView 页面 */
    link(token) {
      const inner = defaultLink.call(this, token)
      if (
        typeof inner === 'string' &&
        inner.startsWith('<a ') &&
        /^https?:\/\//i.test(token.href || '')
      ) {
        return inner.replace(/^<a /, '<a target="_blank" rel="noopener noreferrer" ')
      }
      return inner
    },
  },
})

export async function renderAccessMarkdown(src) {
  const out = await Promise.resolve(marked(src))
  return typeof out === 'string' ? out : String(out)
}
