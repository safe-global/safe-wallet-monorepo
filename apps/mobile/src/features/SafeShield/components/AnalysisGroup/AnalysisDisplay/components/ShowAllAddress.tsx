import React, { useState, useCallback } from 'react'
import { Text, View, Stack } from 'tamagui'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { TouchableOpacity } from 'react-native'
import { useAppSelector } from '@/src/store/hooks'
import { useDefinedActiveSafe } from '@/src/store/hooks/activeSafe'
import { RootState } from '@/src/store'
import { selectChainById } from '@/src/store/chains'
import { getExplorerLink } from '@safe-global/utils/utils/gateway'
import { AddressListItem } from './AddressListItem'
import { AnalysisPaper } from '../../../AnalysisPaper'
import { useAnalysisAddress } from '@/src/features/SafeShield/hooks/useAnalysisAddress'

interface ShowAllAddressProps {
  addresses: string[]
}

export function ShowAllAddress({ addresses }: ShowAllAddressProps) {
  const [expanded, setExpanded] = useState(false)

  const activeSafe = useDefinedActiveSafe()
  const activeChain = useAppSelector((state: RootState) => selectChainById(state, activeSafe.chainId))

  const { handleOpenExplorer, handleCopyToClipboard, copiedIndex } = useAnalysisAddress()

  const toggle = useCallback(() => {
    setExpanded(!expanded)
  }, [expanded])

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
            const explorerLink =
              activeChain?.blockExplorerUriTemplate && getExplorerLink(item, activeChain.blockExplorerUriTemplate)

            return (
              <AnalysisPaper key={`${item}-${index}`} spaced={Boolean(explorerLink)}>
                <AddressListItem
                  address={item}
                  index={index}
                  copiedIndex={copiedIndex}
                  onCopy={handleCopyToClipboard}
                  onOpenExplorer={handleOpenExplorer}
                  explorerLink={explorerLink}
                />
              </AnalysisPaper>
            )
          })}
        </Stack>
      )}
    </View>
  )
}
