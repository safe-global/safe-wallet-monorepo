import localforage from 'localforage'
import { BatchFile } from '../typings/models'
import { trackSafeAppEvent } from './analytics'
import { stringifyReplacer } from './checksum'

localforage.config({
  name: 'tx-builder',
  version: 1.0,
  storeName: 'batch_transactions',
  description: 'List of stored transactions in the Transaction Builder',
})

const saveBatch = async (batchFile: BatchFile): Promise<{ id: string; batchFile: BatchFile }> => {
  const id = uuidv4()
  try {
    await localforage.setItem(id, batchFile)

    trackSafeAppEvent('Saved batch', batchFile.transactions.length.toString())
  } catch (error) {
    console.error(error)
  }

  return {
    id,
    batchFile,
  }
}

const removeBatch = async (batchId: string): Promise<void> => {
  try {
    await localforage.removeItem(batchId)

    trackSafeAppEvent('Remove batch')
  } catch (error) {
    console.error(error)
  }
}

const updateBatch = async (batchId: string, batchFile: BatchFile): Promise<void> => {
  try {
    await localforage.setItem(batchId, batchFile)

    trackSafeAppEvent('Update batch')
  } catch (error) {
    console.error(error)
  }
}

const getBatch = async (batchId: string): Promise<BatchFile | null> => {
  try {
    return await localforage.getItem(batchId)
  } catch (error) {
    console.error(error)
  }

  return null
}

const getBatches = async () => {
  const batches: Record<string, BatchFile> = {}
  try {
    await localforage.iterate((batch: BatchFile, key: string) => {
      batches[key] = batch
    })
  } catch (error) {
    console.error(error)
  }
  return batches
}

const downloadObjectAsJson = (batchFile: BatchFile) => {
  const blobURL = URL.createObjectURL(
    new Blob([JSON.stringify(batchFile, stringifyReplacer)], { type: 'application/json' }),
  )

  // If Firefox or Safari open a new window to download the file
  // https://bugzilla.mozilla.org/show_bug.cgi?id=1365502
  if (
    navigator.userAgent.includes('Firefox') ||
    (navigator.userAgent.includes('Safari') && !navigator.userAgent.includes('Chrome'))
  ) {
    return window.open(blobURL)
  }

  const downloadAnchorNode = document.createElement('a')

  downloadAnchorNode.setAttribute('href', blobURL)
  downloadAnchorNode.setAttribute('download', batchFile.meta.name + '.json')
  document.body.appendChild(downloadAnchorNode)
  downloadAnchorNode.click()
  downloadAnchorNode.remove()
}

const downloadBatch = async (batchFile: BatchFile) => {
  downloadObjectAsJson(batchFile)

  trackSafeAppEvent('Download batch')
}

const isSingleBatchFile = (batchFile: unknown): batchFile is BatchFile => {
  return typeof batchFile === 'object' && batchFile !== null && 'meta' in batchFile && 'transactions' in batchFile
}

const importFile = async (file: File): Promise<BatchFile | undefined> => {
  return new Promise((resolve) => {
    const reader = new FileReader()
    reader.readAsText(file)
    reader.onload = async () => {
      const batchFile: BatchFile | { data: Record<string, BatchFile> } = JSON.parse(reader.result as string)

      if (isSingleBatchFile(batchFile)) {
        resolve(batchFile)

        trackSafeAppEvent('Import batch')
        return
      }

      const data = batchFile.data
      await importBatches(data)
      resolve(undefined)
    }
  })
}

const importBatches = async (data: Record<string, BatchFile>) => {
  Object.entries(data).forEach(async ([batchId, batchFile]) => {
    try {
      await localforage.setItem(batchId, batchFile)
    } catch (error) {
      console.error(error)
    }
  })
}

const uuidv4 = () => {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function (c) {
    const r = (Math.random() * 16) | 0,
      v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

const StorageManager = {
  saveBatch,
  removeBatch,
  updateBatch,
  getBatch,
  getBatches,
  downloadBatch,
  importFile,
}

export default StorageManager
