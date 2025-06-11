import { useState } from 'react'
import * as DocumentPicker from 'expo-document-picker'
import * as FileSystem from 'expo-file-system'
import Logger from '@/src/utils/logger'
import { decodeLegacyData, SecuredDataFile, SerializedDataFile } from '@/src/utils/legacyData'

export function useLegacyImport() {
  const [fileName, setFileName] = useState<string | null>(null)
  const [fileUri, setFileUri] = useState<string | null>(null)
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string>()
  const [isLoading, setIsLoading] = useState(false)
  const [importedData, setImportedData] = useState<SerializedDataFile | null>(null)

  const pickFile = async (): Promise<boolean> => {
    try {
      setError(undefined)
      const res = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      })

      // Check if the result is success type and has assets
      if (res.canceled === false && res.assets && res.assets.length > 0) {
        const asset = res.assets[0]
        setFileName(asset.name)
        setFileUri(asset.uri)
        return true
      }
      return false
    } catch (e) {
      Logger.error('Failed to pick file', e)
      setError('Failed to select file')
      return false
    }
  }

  const handlePasswordChange = (text: string) => {
    setPassword(text)
    setError(undefined) // Clear error when user starts typing
  }

  const handleImport = async () => {
    if (!fileUri) {
      setError('No file selected')
      return
    }

    if (!password.trim()) {
      setError('Password is required')
      return
    }

    try {
      setIsLoading(true)
      setError(undefined)

      const content = await FileSystem.readAsStringAsync(fileUri)
      const secured: SecuredDataFile = JSON.parse(content)
      Logger.trace('Legacy secured data loaded')

      const decoded = decodeLegacyData(secured, password)
      Logger.trace('Legacy data successfully decoded')

      setImportedData(decoded)
      return decoded
    } catch (e) {
      Logger.error('Failed to import legacy data', e)
      const errorMessage = (e as Error).message
      if (errorMessage.includes('decrypt') || errorMessage.includes('password')) {
        setError('Incorrect password. Please try again.')
      } else if (errorMessage.includes('JSON')) {
        setError('Invalid file format. Please select a valid export file.')
      } else {
        setError('Failed to import data. Please check your file and password.')
      }
    } finally {
      setIsLoading(false)
    }
  }

  const reset = () => {
    setFileName(null)
    setFileUri(null)
    setPassword('')
    setError(undefined)
    setIsLoading(false)
    setImportedData(null)
  }

  return {
    pickFile,
    handlePasswordChange,
    handleImport,
    reset,
    fileName,
    password,
    error,
    isLoading,
    hasFile: !!fileUri,
    importedData,
  }
}
