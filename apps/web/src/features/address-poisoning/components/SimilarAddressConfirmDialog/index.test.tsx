import { render, screen, fireEvent } from '@testing-library/react'
import SimilarAddressConfirmDialog from './index'
import { Severity } from '@safe-global/utils/features/safe-shield/types'
import type { SimilarityMatch } from '@safe-global/utils/utils/addressSimilarity.types'

const ANCHOR = 'a1b2c3d4e5f60718293a4b5c6d7e8f9012345678'
const CANDIDATE = '0xa1b2ffffffffffffffffffffffffffffffff5678' // shares 4+4 with ANCHOR
const match: SimilarityMatch = { anchor: ANCHOR, prefixLen: 4, suffixLen: 4, severity: Severity.CRITICAL }

const setup = (overrides: Partial<Parameters<typeof SimilarAddressConfirmDialog>[0]> = {}) => {
  const onConfirm = jest.fn()
  const onCancel = jest.fn()
  render(
    <SimilarAddressConfirmDialog
      open
      candidate={CANDIDATE}
      match={match}
      anchorName="Alice"
      onConfirm={onConfirm}
      onCancel={onCancel}
      {...overrides}
    />,
  )
  return { onConfirm, onCancel }
}

describe('SimilarAddressConfirmDialog', () => {
  it('shows both addresses at full length with the differing characters highlighted', () => {
    setup()
    // both full 40-char hex bodies are rendered somewhere in the dialog
    expect(screen.getByTestId('similar-address-confirm-dialog')).toHaveTextContent(ANCHOR)
    expect(screen.getByTestId('similar-address-confirm-dialog')).toHaveTextContent(CANDIDATE.slice(2))
    // the middle differs, so there are highlighted diff characters
    expect(screen.getAllByTestId('diff-char').length).toBeGreaterThan(0)
  })

  it('keeps Proceed disabled until the user acknowledges', () => {
    const { onConfirm } = setup()
    const proceed = screen.getByTestId('confirm-proceed')
    expect(proceed).toBeDisabled()
    fireEvent.click(screen.getByTestId('ack-checkbox'))
    expect(proceed).toBeEnabled()
    fireEvent.click(proceed)
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('calls onCancel from the cancel action', () => {
    const { onCancel } = setup()
    fireEvent.click(screen.getByTestId('confirm-cancel'))
    expect(onCancel).toHaveBeenCalledTimes(1)
  })
})
