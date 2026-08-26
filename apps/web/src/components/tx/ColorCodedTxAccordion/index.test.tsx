import { render } from '@/tests/test-utils'
import { transactionDetailsBuilder } from '@/tests/builders/transactionDetails'
import type { TransactionDetails } from '@safe-global/store/gateway/AUTO_GENERATED/transactions'
import ColorCodedTxAccordion from '.'

type TxInfo = TransactionDetails['txInfo']

const transferTxInfo = () => transactionDetailsBuilder().build().txInfo

const settingsChangeTxInfo = (): TxInfo => ({
  type: 'SettingsChange',
  dataDecoded: { method: 'changeThreshold', parameters: null },
  settingsInfo: { type: 'CHANGE_THRESHOLD', threshold: 2 },
})

const customTxInfo = (): TxInfo => ({
  type: 'Custom',
  to: { value: '0x0000000000000000000000000000000000000001', name: null, logoUri: null },
  dataSize: '68',
  isCancellation: false,
})

const accordionVars = (txInfo: TxInfo) => {
  const { container } = render(
    <ColorCodedTxAccordion txInfo={txInfo}>
      <div>details</div>
    </ColorCodedTxAccordion>,
  )
  const card = container.firstElementChild as HTMLElement
  return {
    border: card.style.getPropertyValue('--accordion-border-active').trim(),
    fill: card.style.getPropertyValue('--accordion-fill-active').trim(),
  }
}

describe('ColorCodedTxAccordion', () => {
  // #8040 set every level's border to its own fill token, which painted the outline in the fill
  // colour and read as no border at all. The values below are the pre-migration ones.
  it.each([
    ['transfer', transferTxInfo, 'var(--color-success-light)', 'var(--color-background-light)'],
    ['settings change', settingsChangeTxInfo, 'var(--warning-accent)', 'var(--warning-subtle)'],
    ['custom', customTxInfo, 'var(--color-info-dark)', 'var(--color-info-background)'],
  ])('gives %s a border token distinct from its fill', (_name, txInfo, expectedBorder, expectedFill) => {
    const { border, fill } = accordionVars(txInfo())

    expect(border).toBe(expectedBorder)
    expect(fill).toBe(expectedFill)
    expect(border).not.toBe(fill)
  })
})
