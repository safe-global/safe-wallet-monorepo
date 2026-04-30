import React, { useMemo } from 'react'
import { TouchableOpacity } from 'react-native'
import { styled, Text, View, getTokenValue } from 'tamagui'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Badge } from '@/src/components/Badge'
import { SafeFontIcon } from '@/src/components/SafeFontIcon'
import { Loader } from '@/src/components/Loader'
import type { Chain } from '@safe-global/store/gateway/AUTO_GENERATED/chains'
import type { ScanPhase, LastScanResult } from './hooks/useScanForNewNetworks'

const FooterContainer = styled(View, {
  borderTopWidth: 1,
  borderTopColor: '$borderLight',
  paddingVertical: '$4',
  paddingHorizontal: '$5',
  backgroundColor: '$backgroundSheet',
})

const FooterRow = styled(View, {
  columnGap: '$5',
  alignItems: 'center',
  flexDirection: 'row',
})

interface NetworksSheetFooterProps {
  phase: ScanPhase
  lastResult: LastScanResult | null
  errorMessage: string | null
  isPressable: boolean
  onScan: () => void
  /**
   * System chains, used to render readable network names in the result text.
   * Optional — if not provided we fall back to chain ids.
   */
  chains?: Chain[]
}

const formatNewChainsText = (newChainIds: string[], chains?: Chain[]): string => {
  if (newChainIds.length === 0) {
    return 'No new networks found'
  }

  const names = newChainIds.slice(0, 3).map((id) => chains?.find((c) => c.chainId === id)?.chainName ?? id)
  const suffix = newChainIds.length > 3 ? `, +${newChainIds.length - 3} more` : ''
  const noun = newChainIds.length === 1 ? 'network' : 'networks'
  return `Found ${newChainIds.length} new ${noun}: ${names.join(', ')}${suffix}`
}

export function NetworksSheetFooter({
  phase,
  lastResult,
  errorMessage,
  isPressable,
  onScan,
  chains,
}: NetworksSheetFooterProps) {
  const { bottom } = useSafeAreaInsets()

  const { iconNode, label, resultText } = useMemo(() => {
    if (phase === 'scanning') {
      return {
        iconNode: <Loader size={20} thickness={1} />,
        label: 'Scanning…',
        resultText: null as string | null,
      }
    }

    if (phase === 'error') {
      return {
        iconNode: <SafeFontIcon size={24} name="alert-triangle" color="$error" />,
        label: 'Scan failed — tap to retry',
        resultText: errorMessage,
      }
    }

    return {
      iconNode: <SafeFontIcon size={24} name="update" />,
      label: 'Scan for new networks',
      resultText: lastResult ? formatNewChainsText(lastResult.newChainIds, chains) : null,
    }
  }, [phase, errorMessage, lastResult, chains])

  return (
    <FooterContainer marginBottom={-bottom} paddingBottom={bottom + getTokenValue('$4')}>
      <TouchableOpacity onPress={onScan} disabled={!isPressable} testID="scan-for-new-networks">
        <FooterRow opacity={isPressable ? 1 : 0.5}>
          <Badge themeName="badge_skeleton" circleSize="$10" content={iconNode} />
          <View flexShrink={1}>
            <Text fontSize="$4" fontWeight={400}>
              {label}
            </Text>
            {resultText ? (
              <Text fontSize="$2" color="$colorSecondary" marginTop="$1" testID="scan-result-text">
                {resultText}
              </Text>
            ) : null}
          </View>
        </FooterRow>
      </TouchableOpacity>
    </FooterContainer>
  )
}
