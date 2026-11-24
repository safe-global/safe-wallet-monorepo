import { logError, Errors } from '@/services/exceptions'

export const isClipboardSupported = (): boolean => {
  // 'clipboard-read' and `readText` are not supported by Firefox
  // @see https://developer.mozilla.org/en-US/docs/Web/API/Clipboard/readText#browser_compatibility
  return navigator.userAgent.includes('Firefox')
}

export const isClipboardGranted = async (): Promise<boolean> => {
  if (isClipboardSupported()) {
    return false
  }

  let isGranted = false

  try {
    // @ts-expect-error navigator permissions types don't include clipboard
    const permission = await navigator.permissions.query({ name: 'clipboard-read' })
    isGranted = permission.state === 'granted'
  } catch (e) {
    logError(Errors._707, e)
  }

  return isGranted
}

export const getClipboard = async (): Promise<string> => {
  if (isClipboardSupported()) {
    return ''
  }

  let clipboard = ''

  try {
    clipboard = await navigator.clipboard.readText()
  } catch (e) {
    logError(Errors._708, e)
  }

  return clipboard
}
