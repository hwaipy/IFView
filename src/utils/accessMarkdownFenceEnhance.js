/** 为 accessMarkdown 渲染出的 <pre><code> 块添加「复制」按钮（与 TFAccess / TDCViewer 共用） */

export function fenceCodeText(pre) {
  const code = pre.querySelector(':scope > code')
  return code != null ? code.innerText : pre.innerText
}

export async function copyFenceCode(pre, btn) {
  const label = btn.textContent
  try {
    await navigator.clipboard.writeText(fenceCodeText(pre))
    btn.textContent = '已复制'
    window.setTimeout(() => {
      btn.textContent = label
    }, 1800)
  } catch {
    btn.textContent = '复制失败'
    window.setTimeout(() => {
      btn.textContent = label
    }, 2000)
  }
}

/**
 * @param {HTMLElement | null} root
 */
export function enhanceMarkdownFenceCopyButtons(root) {
  if (!root) return
  root.querySelectorAll('pre').forEach((pre) => {
    if (pre.closest('.access-md-pre-wrap')) return
    if (!pre.querySelector(':scope > code')) return
    const parent = pre.parentElement
    const fenceHeader =
      parent?.classList.contains('access-md-fence-block') &&
      parent.querySelector(':scope > .access-md-fence-header')

    const wrap = document.createElement('div')
    wrap.className = 'access-md-pre-wrap'
    const btn = document.createElement('button')
    btn.type = 'button'
    btn.className = 'access-md-copy-btn'
    btn.textContent = '复制'
    btn.setAttribute('aria-label', '复制代码')

    if (fenceHeader) {
      parent.insertBefore(wrap, pre)
      wrap.appendChild(pre)
      fenceHeader.appendChild(btn)
    } else {
      pre.parentNode.insertBefore(wrap, pre)
      wrap.appendChild(btn)
      wrap.appendChild(pre)
    }

    btn.addEventListener('click', (e) => {
      e.preventDefault()
      void copyFenceCode(pre, btn)
    })
  })
}
