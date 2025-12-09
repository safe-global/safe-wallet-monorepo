import React, { useState, useCallback } from 'react'
import { Text, View, Stack } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { TouchableOpacity, Linking } from 'react-native'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'
import { useCopyAndDispatchToast } from '@/src/hooks/useCopyAndDispatchToast'
import { AddressListItem } from './AddressListItem'

interface ShowAllAddressProps {
  addresses: string[]
}

export function ShowAllAddress({ addresses }: ShowAllAddressProps) {
  const [expanded, setExpanded] = useState(false)
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null)
  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))
  const copyAndDispatchToast = useCopyAndDispatchToast('Copied to clipboard')

  const toggle = useCallback(() => {
    setExpanded(!expanded)
  }, [expanded])

  const handleCopyToClipboard = useCallback(
    (address: string, index: number) => {
      copyAndDispatchToast(address)
      setCopiedIndex(index)
      setTimeout(() => setCopiedIndex(null), 1000)
    },
    [copyAndDispatchToast],
  )

  const handleOpenExplorer = useCallback(
    (address: string) => {
      if (activeChain?.blockExplorerUriTemplate) {
        const link = getExplorerLink(address, activeChain.blockExplorerUriTemplate)
        Linking.openURL(link.href)
      }
    },
    [activeChain],
  )

  return (
    <View marginTop={-6}>
      <TouchableOpacity onPress={toggle}>
        <View
          flexDirection="row"
          alignItems="center"
          width="fit-content"
          overflow="hidden"
          marginBottom={expanded ? '$1' : 0}
        >
          <Text fontSize="$3" color="$colorLight" letterSpacing={1}>
            {expanded ? 'Hide all' : 'Show all'}
          </Text>
          <View
            style={{
              transform: [{ rotate: expanded ? '180deg' : '0deg' }],
            }}
          >
            <SafeFontIcon name="chevron-down" size={16} color="$colorLight" />
          </View>
        </View>
      </TouchableOpacity>

      {expanded && (
        <Stack gap="$3" marginTop="$1">
          {addresses.map((item, index) => {
            const explorerLink = activeChain?.blockExplorerUriTemplate
              ? getExplorerLink(item, activeChain.blockExplorerUriTemplate)
              : undefined

            return (
              <AddressListItem
                key={`${item}-${index}`}
                address={item}
                index={index}
                copiedIndex={copiedIndex}
                onCopy={handleCopyToClipboard}
                onOpenExplorer={handleOpenExplorer}
                explorerLink={explorerLink}
              />
            )
          })}
        </Stack>
      )}
    </View>
  )
}
