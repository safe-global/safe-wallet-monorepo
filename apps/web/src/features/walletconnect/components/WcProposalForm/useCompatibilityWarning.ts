import { useMemo } from 'react'
import type { AlertColor } from '@mui/material'
import type { WalletKitTypes } from '@reown/walletkit'
import useChains from '@/hooks/useChains'
import useSafeInfo from '@/hooks/useSafeInfo'
import { capitalize } from '@safe-global/utils/utils/formatters'
import { getPeerName, isBlockedBridge, isWarnedBridge } from '@/features/walletconnect/services/utils'
import { BRAND_NAME } from '@/config/constants'

const NAME_FALLBACK = 'this dApp'
const NAME_PLACEHOLDER = '%%name%%'
const CHAIN_PLACEHOLDER = '%%chain%%'

const Warnings: Record<string, { severity: AlertColor; message: string }> = {
  BLOCKED_BRIDGE: {
    severity: 'error',
    message: `${NAME_PLACEHOLDER} is a bridge that is incompatible with ${BRAND_NAME} — the bridged funds will be lost. Consider using a different bridge.`,
  },
  WARNED_BRIDGE: {
    severity: 'warning',
    message: `While bridging via ${NAME_PLACEHOLDER}, please make sure that the desination address you send funds to matches the Safe address you have on the respective chain. Otherwise, the funds will be lost.`,
  },
  UNSUPPORTED_CHAIN: {
    severity: 'error',
    message: `${NAME_PLACEHOLDER} does not support this Safe Account's network (${CHAIN_PLACEHOLDER}). Please switch to a Safe Account on one of the supported networks below.`,
  },
  WRONG_CHAIN: {
    severity: 'info',
    message: `Please make sure that the dApp is connected to ${CHAIN_PLACEHOLDER}.`,
  },
}

export const _getWarning = (origin: string, name: string, isUnsupportedChain: boolean) => {
  if (isUnsupportedChain) {
    return Warnings.UNSUPPORTED_CHAIN
  }

  if (isBlockedBridge(origin)) {
    return Warnings.BLOCKED_BRIDGE
  }

  if (isWarnedBridge(origin, name)) {
    return Warnings.WARNED_BRIDGE
  }

  return Warnings.WRONG_CHAIN
}

export const useCompatibilityWarning = (
  proposal: WalletKitTypes.SessionProposal,
  isUnsupportedChain: boolean,
): (typeof Warnings)[string] => {
  const { configs } = useChains()
  const { safe } = useSafeInfo()

  return useMemo(() => {
    const name = getPeerName(proposal.params.proposer) || NAME_FALLBACK
    const { origin } = proposal.verifyContext.verified
    let { message, severity } = _getWarning(origin, name, isUnsupportedChain)

    if (message.includes(NAME_PLACEHOLDER)) {
      message = message.replaceAll(NAME_PLACEHOLDER, name)
      if (message.startsWith(NAME_FALLBACK)) {
        message = capitalize(message)
      }
    }

    if (message.includes(CHAIN_PLACEHOLDER)) {
      const chainName = configs.find((chain) => chain.chainId === safe.chainId)?.chainName ?? 'this network'
      message = message.replaceAll(CHAIN_PLACEHOLDER, chainName)
    }

    return {
      message,
      severity,
    }
  }, [configs, isUnsupportedChain, proposal.params, proposal.verifyContext.verified, safe.chainId])
}
