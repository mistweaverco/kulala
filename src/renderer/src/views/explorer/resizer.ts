export const NewResizer = (
  container: HTMLElement,
  width: boolean = true,
  height: boolean = true,
  cbWhenDone: (w: number, h: number) => void | undefined,
  cbWhileDragging: (w: number, h: number) => void | undefined
): void => {
  const resizer = container.querySelector('.ui-resizable-handle') as HTMLDivElement

  let isResizing = false
  let startX: number, startY: number, startWidth: number, startHeight: number
  let target: HTMLElement

  resizer.addEventListener('mousedown', (e: MouseEvent) => {
    target = e.target as HTMLElement
    if (target !== resizer) return
    isResizing = true
    startX = e.clientX
    startY = e.clientY
    startWidth = container.offsetWidth
    startHeight = container.offsetHeight
  })

  document.addEventListener('mousemove', (e: MouseEvent) => {
    if (isResizing) {
      const w = startWidth + e.clientX - startX
      const h = startHeight + e.clientY - startY
      if (width && w) container.style.width = w + 'px'
      if (height && h) container.style.height = h + 'px'
      if (cbWhileDragging && w && h) cbWhileDragging(w, h)
    }
  })

  document.addEventListener('mouseup', () => {
    if (!isResizing) return
    isResizing = false
    if (target !== resizer) return
    if (!container.offsetWidth || !container.offsetHeight) return
    if (startWidth !== container.offsetWidth && startHeight !== container.offsetHeight) return
    if (cbWhenDone) cbWhenDone(container.offsetWidth, container.offsetHeight)
  })
}
