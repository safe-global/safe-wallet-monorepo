import StorageManager from '../../lib/storage'

const getExportFileName = () => {
  const today = new Date().toISOString().slice(0, 10)
  return `tx-builder-batches-${today}.json`
}

export const exportBatches = async () => {
  const batchesRecords = await StorageManager.getBatches()
  const data = JSON.stringify({ data: batchesRecords })

  const blob = new Blob([data], { type: 'application/json' })

  if (
    navigator.userAgent.includes('Firefox') ||
    (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome'))
  ) {
    const blobURL = URL.createObjectURL(blob)

    return window.open(blobURL)
  }

  const link = document.createElement('a')

  link.download = getExportFileName()
  link.href = window.URL.createObjectURL(blob)
  link.dataset.downloadurl = ['text/json', link.download, link.href].join(':')
  link.dispatchEvent(new MouseEvent('click'))
}
