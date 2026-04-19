import 'highlight.js/styles/github.css'
import hljs from 'highlight.js/lib/core'
import bash from 'highlight.js/lib/languages/bash'
import javascript from 'highlight.js/lib/languages/javascript'
import json from 'highlight.js/lib/languages/json'
import python from 'highlight.js/lib/languages/python'
import typescript from 'highlight.js/lib/languages/typescript'
import xml from 'highlight.js/lib/languages/xml'
import yaml from 'highlight.js/lib/languages/yaml'
import { marked } from 'marked'

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
  const lang = resolveHljsLanguage(langRaw || '')
  if (lang) {
    try {
      const { value } = hljs.highlight(text, { language: lang })
      return `<pre class="access-md-fence"><code class="hljs language-${lang}">${value}</code></pre>\n`
    } catch {
      /* fall through */
    }
  }
  try {
    const { value } = hljs.highlightAuto(text)
    return `<pre class="access-md-fence"><code class="hljs">${value}</code></pre>\n`
  } catch {
    return `<pre class="access-md-fence"><code>${escapeHtml(text)}</code></pre>\n`
  }
}

marked.use({
  renderer: {
    code({ text, lang }) {
      return renderFencedCode(text, lang)
    },
  },
})

export async function renderAccessMarkdown(src) {
  const out = await Promise.resolve(marked(src))
  return typeof out === 'string' ? out : String(out)
}
