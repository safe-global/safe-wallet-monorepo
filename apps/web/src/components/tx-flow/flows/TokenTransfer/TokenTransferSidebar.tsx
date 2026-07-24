import { useContext, useEffect, useState, type ReactNode } from 'react'
import { Box, Stack } from '@mui/material'
import { SlotName, withSlot } from '../../slots'
import { SafeTxContext } from '../../SafeTxProvider'
import TokenTransferHashes from './TokenTransferHashes'
import TokenTransferNote from './TokenTransferNote'
import { TxAiInsight } from '@/features/tx-ai-insights'

// Matches the SafeShield analysis-card reveal (AnalysisGroupCard): opacity + max-height over 0.6s.
const TRANSITION_MS = 600
const STAGGER_MS = 150

/**
 * Reveals/hides a sidebar box using the exact same animation as the SafeShield widget cards:
 * an opacity + max-height transition flipped on after a staggered delay. Kept mounted during exit
 * so disappearing animates the same way appearing does.
 */
const RevealBox = ({ index, in: inProp, children }: { index: number; in: boolean; children: ReactNode }) => {
  const delay = index * STAGGER_MS
  const [rendered, setRendered] = useState(inProp)
  const [isVisible, setIsVisible] = useState(false)

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>

    if (inProp) {
      setRendered(true)
      timer = setTimeout(() => setIsVisible(true), delay)
    } else {
      setIsVisible(false)
      timer = setTimeout(() => setRendered(false), TRANSITION_MS + delay)
    }

    return () => clearTimeout(timer)
  }, [inProp, delay])

  if (!rendered) return null

  return (
    <Box
      sx={{
        overflow: 'hidden',
        opacity: isVisible ? 1 : 0,
        maxHeight: isVisible ? 1000 : 0,
        transition: `opacity 0.6s ease-in-out, max-height 0.6s ease-in-out`,
        transitionDelay: `${delay}ms`,
      }}
    >
      {children}
    </Box>
  )
}

/**
 * Right-sidebar content for the one-screen Token Transfer, rendered under the SafeShield widget.
 * Boxes reveal top-to-bottom (hashes → AI insight → note) with the SafeShield card animation, and
 * disappear the same way when the transaction is cleared.
 */
const TokenTransferSidebar = () => {
  const { safeTx } = useContext(SafeTxContext)
  const hasTx = !!safeTx

  return (
    <Stack spacing={2}>
      <RevealBox in={hasTx} index={0}>
        <TokenTransferHashes />
      </RevealBox>
      <RevealBox in={hasTx} index={1}>
        <TxAiInsight />
      </RevealBox>
      <RevealBox in index={hasTx ? 2 : 0}>
        <TokenTransferNote />
      </RevealBox>
    </Stack>
  )
}

export const TokenTransferSidebarSlot = withSlot({
  Component: TokenTransferSidebar,
  slotName: SlotName.Sidebar,
  id: 'token-transfer-sidebar',
})

export default TokenTransferSidebar
