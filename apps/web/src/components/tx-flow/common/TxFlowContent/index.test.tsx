import { render, screen } from '@/tests/test-utils'
import { TxFlowContent } from '.'
import { initialContext, TxFlowContext, type TxFlowContextType } from '@/components/tx-flow/TxFlowProvider'
import { SlotProvider } from '@/components/tx-flow/slots'

jest.mock('@/features/safe-shield', () => ({
  __esModule: true,
  default: () => <div data-testid="safe-shield-widget" />,
}))

jest.mock('@/components/tx-flow/common/TxStatusWidget', () => ({
  __esModule: true,
  default: () => <div data-testid="tx-status-widget" />,
}))

const renderContent = (context: Partial<TxFlowContextType>) =>
  render(
    <TxFlowContext.Provider value={{ ...initialContext, onPrev: jest.fn(), step: 1, ...context }}>
      <SlotProvider>
        <TxFlowContent>
          <div>First</div>
          <div>Second</div>
        </TxFlowContent>
      </SlotProvider>
    </TxFlowContext.Provider>,
  )

describe('TxFlowContent', () => {
  it('renders a back button past the first step', () => {
    renderContent({ txLayoutProps: { title: 'Review details' } })

    expect(screen.getByTestId('modal-back-btn')).toBeInTheDocument()
  })

  it('hides the back button when the step asks for it', () => {
    renderContent({ txLayoutProps: { title: 'Execute transaction', hideBack: true } })

    expect(screen.queryByTestId('modal-back-btn')).not.toBeInTheDocument()
  })
})
