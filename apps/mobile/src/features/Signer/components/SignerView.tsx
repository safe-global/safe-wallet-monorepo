import { ScrollView, View, Text, H2, XStack, YStack } from 'tamagui'
import { Identicon } from '@/src/components/Identicon'
import { type Address } from '@/src/types/address'
import React from 'react'
import Share from 'react-native-share'
import { Container } from '@/src/components/Container'
import { CopyButton } from '@/src/components/CopyButton'
import { SafeFontIcon } from '@/src/components/SafeFontIcon/SafeFontIcon'
import { KeyboardAvoidingView, Pressable, TouchableOpacity } from 'react-native'
import { SafeButton } from '@/src/components/SafeButton'
import { SafeInputWithLabel } from '@/src/components/SafeInput/SafeInputWithLabel'
import { Controller, FieldNamesMarkedBoolean, type Control, type FieldErrors } from 'react-hook-form'
import { type FormValues } from '@/src/features/Signer/types'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { SafeListItem } from '@/src/components/SafeListItem'
import { BadgeWrapper } from '@/src/components/BadgeWrapper'
import { SignerTypeBadge } from '@/src/components/SignerTypeBadge'
import { useWalletConnectStatus } from '@/src/features/WalletConnect/hooks/useWalletConnectStatus'
import { Signer } from '@/src/store/signersSlice'
import { SafeOverview } from '@safe-global/store/gateway/AUTO_GENERATED/safes'
import { shortenAddress } from '@/src/utils/formatters'
import type { PasskeyMetadata } from '@/src/services/passkey/passkey-storage.service'

interface SignerSafe {
  chainId: string
  safeAddress: string
  overview: SafeOverview
}

type Props = {
  signerAddress: string
  signerType?: Signer['type']
  signerSafes: SignerSafe[]
  onPressExplorer: () => void
  onPressEdit: () => void
  onPressViewPrivateKey?: () => void
  onDeleteLedgerConnection?: () => void
  onRemoveSigner: () => void
  passkeyMetadata?: PasskeyMetadata | null
  editMode: boolean
  name: string
  hasPrivateKey: boolean
  isLedgerSigner: boolean
  isWcSigner: boolean
  onReconnectWallet?: () => void
  onRemoveWcSigner?: () => void
  control: Control<FormValues>
  errors: FieldErrors<FormValues>
  dirtyFields: FieldNamesMarkedBoolean<FormValues>
}

function PasskeyCredentialsSection({ metadata }: { metadata: PasskeyMetadata }) {
  const handleShare = async () => {
    const data = JSON.stringify(
      {
        rawId: metadata.rawId,
        x: metadata.coordinates.x,
        y: metadata.coordinates.y,
      },
      null,
      2,
    )
    try {
      await Share.open({ message: data, title: 'Passkey credentials' })
    } catch {
      // User cancelled
    }
  }

  return (
    <View marginTop="$4" borderTopWidth={1} borderColor="$borderLight" paddingTop="$4">
      <Text fontSize="$3" fontWeight={600} color="$colorSecondary" marginBottom="$3">
        Passkey credentials
      </Text>
      <Container rowGap="$2" padding="$3">
        <YStack gap="$1">
          <Text fontSize="$2" color="$colorSecondary">
            Raw ID
          </Text>
          <Text fontSize="$2" selectable numberOfLines={2}>
            {metadata.rawId}
          </Text>
        </YStack>
        <YStack gap="$1">
          <Text fontSize="$2" color="$colorSecondary">
            Public key X
          </Text>
          <Text fontSize="$2" selectable numberOfLines={2}>
            {metadata.coordinates.x}
          </Text>
        </YStack>
        <YStack gap="$1">
          <Text fontSize="$2" color="$colorSecondary">
            Public key Y
          </Text>
          <Text fontSize="$2" selectable numberOfLines={2}>
            {metadata.coordinates.y}
          </Text>
        </YStack>
      </Container>

      <XStack gap="$3" paddingTop="$3">
        <SafeButton size="$sm" secondary onPress={handleShare} flex={1}>
          Share credentials
        </SafeButton>
      </XStack>
    </View>
  )
}

export const SignerView = ({
  control,
  errors,
  dirtyFields,
  signerAddress,
  signerType,
  signerSafes,
  onPressExplorer,
  onPressEdit,
  onPressViewPrivateKey,
  onDeleteLedgerConnection,
  onRemoveSigner,
  passkeyMetadata,
  editMode,
  name,
  hasPrivateKey,
  isLedgerSigner,
  isWcSigner,
  onReconnectWallet,
  onRemoveWcSigner,
}: Props) => {
  const { bottom, top } = useSafeAreaInsets()
  const isWcConnected = useWalletConnectStatus(signerAddress)
  const isPasskeySigner = signerType === 'passkey'

  return (
    <YStack flex={1}>
      <ScrollView flex={1}>
        <View justifyContent="center" alignItems="center" paddingTop={isWcSigner ? '$6' : '$3'}>

          <BadgeWrapper
            badge={<SignerTypeBadge address={signerAddress as Address} testID="signer-detail-badge" />}
            position="top-right"
          >
            <Identicon address={signerAddress as Address} size={56} />
          </BadgeWrapper>
        </View>
        <View justifyContent="center" alignItems="center" marginTop="$4">
          <H2 numberOfLines={1} maxWidth={300} marginTop="$2" textAlign="center">
            {name || 'Unnamed signer'}
          </H2>
        </View>

        <View marginTop="$4">
          <Controller
            control={control}
            name="name"
            render={({ field: { onChange, onBlur, value } }) => {
              return (
                <SafeInputWithLabel
                  label="Name"
                  value={editMode ? value : value || (!dirtyFields.name ? 'Unnamed signer' : '')}
                  onBlur={onBlur}
                  disabled={!editMode}
                  onChangeText={onChange}
                  placeholder="Enter signer name"
                  error={dirtyFields.name && !!errors.name}
                  success={dirtyFields.name && !errors.name}
                  right={
                    <TouchableOpacity onPress={onPressEdit} hitSlop={8} testID="edit-signer-name-button">
                      <SafeFontIcon name={editMode ? 'close' : 'edit'} color="$textSecondaryLight" size={16} />
                    </TouchableOpacity>
                  }
                />
              )
            }}
          />
          {errors.name && <Text color="$error">{errors.name.message}</Text>}
        </View>

        <Container marginTop="$4" rowGap="$1">
          <Text color="$colorSecondary">Address</Text>
          <XStack columnGap="$3">
            <Text flex={1}>{signerAddress}</Text>
            <YStack justifyContent="flex-start">
              <XStack alignItems="center" gap="$1">
                <CopyButton value={signerAddress} color="$colorSecondary" hitSlop={2} />
                <Pressable onPress={onPressExplorer} hitSlop={2}>
                  <SafeFontIcon name="external-link" size={14} color="$colorSecondary" />
                </Pressable>
              </XStack>
            </YStack>
          </XStack>
        </Container>

        {hasPrivateKey && !editMode && (
          <View marginTop="$4" borderTopWidth={1} borderColor="$borderLight" paddingTop="$4">
            <SafeListItem
              label="View private key"
              rightNode={<SafeFontIcon name="chevron-right" />}
              onPress={onPressViewPrivateKey}
              pressStyle={{ opacity: 0.2 }}
            />
          </View>
        )}

        {/* Passkey metadata with verify + share */}
        {isPasskeySigner && passkeyMetadata && !editMode && <PasskeyCredentialsSection metadata={passkeyMetadata} />}

        {/* Your Safes section */}
        {!editMode && (
          <View marginTop="$6">
            <Text fontSize="$3" fontWeight={600} color="$colorSecondary" marginBottom="$3">
              Your Safes
            </Text>
            {signerSafes.length === 0 ? (
              <Text color="$colorSecondary" fontSize="$3">
                This signer is not an owner of any of your accounts
              </Text>
            ) : (
              <YStack gap="$2">
                {signerSafes.map(({ safeAddress, chainId, overview }) => (
                  <Container key={`${chainId}:${safeAddress}`} padding="$3">
                    <XStack alignItems="center" gap="$3">
                      <Identicon address={safeAddress as Address} size={36} />
                      <YStack flex={1}>
                        <Text fontWeight={600} numberOfLines={1}>
                          {overview.address.name || 'Safe'}
                        </Text>
                        <Text color="$colorSecondary" fontSize="$2">
                          {shortenAddress(safeAddress)}
                        </Text>
                      </YStack>
                    </XStack>
                  </Container>
                ))}
              </YStack>
            )}
          </View>
        )}
      </ScrollView>
      <KeyboardAvoidingView behavior="padding" keyboardVerticalOffset={top + bottom}>
        <View paddingTop="$2" paddingBottom={bottom ?? 60}>
          {editMode ? (
            <SafeButton onPress={onPressEdit}>Save</SafeButton>
          ) : isLedgerSigner ? (
            <SafeButton danger={true} onPress={onDeleteLedgerConnection}>
              Delete connection
            </SafeButton>
          ) : isWcSigner ? (
            <YStack gap="$3">
              {onReconnectWallet && !isWcConnected && (
                <SafeButton onPress={onReconnectWallet} testID="reconnect-wallet-button">
                  Reconnect wallet
                </SafeButton>
              )}
              <SafeButton danger={true} onPress={onRemoveWcSigner} testID="remove-wc-signer-button">
                Remove signer
              </SafeButton>
            </YStack>
          ) : (hasPrivateKey || isPasskeySigner) && !editMode ? (
            <SafeButton danger={true} onPress={onRemoveSigner} testID="remove-signer-button">
              Remove signer
            </SafeButton>
          ) : null}
        </View>
      </KeyboardAvoidingView>
    </YStack>
  )
}
