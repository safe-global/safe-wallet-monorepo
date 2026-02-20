const copyTextToClipboard = (text: string): void => {
  const listener = (e: ClipboardEvent): void => {
    e.preventDefault()
    if (e.clipboardData) {
      e.clipboardData.setData('text/plain', text)
    }
  }

  const range = document.createRange()

  const documentSelection = document.getSelection()
  if (!documentSelection) {
    return
  }

  range.selectNodeContents(document.body)
  documentSelection.addRange(range)
  document.addEventListener('copy', listener)
  document.execCommand('copy')
  document.removeEventListener('copy', listener)
  documentSelection.removeAllRanges()
}

export default copyTextToClipboard
