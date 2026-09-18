import { useRef, useState } from 'react'
import { Alert, Platform } from 'react-native'
import { H2, Text, View } from 'tamagui'
import { SafeButton } from '@/src/components/SafeButton'
import { useAppSelector } from '@/src/store/hooks'
import { selectSigners } from '@/src/store/signersSlice'
import { deletePrivateWrappingKey } from '../deletePrivateWrappingKey'

export const WrappingKeyExperiment = () => {
  const signers = useAppSelector(selectSigners)
  const busy = useRef(false)
  const [deleting, setDeleting] = useState(false)
  const [result, setResult] = useState('')

  if (Platform.OS !== 'ios') {
    return null
  }

  const privateKeySigners = Object.values(signers).filter((signer) => signer.type === 'private-key')

  const confirmDeletion = (address: string) => {
    if (busy.current) {
      return
    }
    Alert.alert(
      'Delete private wrapping key?',
      `Signer: ${address}\n\nThis makes its stored private key unusable on this phone. Use a test signer whose private key you have saved. The public wrapping key, encrypted signer record, and signer listing will remain.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete private wrapping key',
          style: 'destructive',
          onPress: async () => {
            if (busy.current) {
              return
            }
            busy.current = true
            setDeleting(true)
            setResult('')
            try {
              const { publicKeyCount } = await deletePrivateWrappingKey(address)
              setResult(
                `${address}: Private wrapping key is absent. ${publicKeyCount} public key entry/entries preserved. The encrypted signer record was not modified. Re-import the same signer without removing it first.`,
              )
            } catch (error) {
              const message = error instanceof Error ? error.message : 'Unknown native error'
              setResult(`Deletion experiment did not complete: ${message}`)
            } finally {
              busy.current = false
              setDeleting(false)
            }
          },
        },
      ],
    )
  }

  return (
    <View marginTop="$4" gap="$2">
      <H2>Signer restore experiment</H2>
      <Text>
        Requires a test signer imported by an older build that stored a public wrapping key. Delete its private wrapping
        key, then try importing the same signer again.
      </Text>
      {privateKeySigners.length === 0 && <Text>Import a test private-key signer using the older build first.</Text>}
      {privateKeySigners.map((signer) => (
        <View key={signer.value} gap="$2">
          <Text>{signer.name || signer.value}</Text>
          {signer.name && <Text>{signer.value}</Text>}
          <SafeButton
            danger
            disabled={deleting}
            testID={`delete-wrapping-key-${signer.value}`}
            onPress={() => confirmDeletion(signer.value)}
          >
            Delete private wrapping key
          </SafeButton>
        </View>
      ))}
      {result && <Text testID="wrapping-key-result">{result}</Text>}
    </View>
  )
}
