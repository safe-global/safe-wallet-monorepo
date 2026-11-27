import { act, render } from '@/tests/test-utils'
import { faker } from '@faker-js/faker'
import { type GnosisPayTxItem } from '../types'
import { GnosisPayQueueItemSummary } from './index'

jest.mock('../hooks/useIsGnosisPayOwner', () => ({ useIsGnosisPayOwner: jest.fn(() => [true, undefined, false]) }))
jest.mock('@/hooks/useIsWrongChain', () => () => false)
jest.mock('../GnosisPayTxDetails', () => ({ GnosisPayTxDetails: () => <div>Transaction details</div> }))

const COOLDOWN_MS = 180_000
const EXPIRATION_MS = 1_800_000

const buildItem = (overrides: Partial<GnosisPayTxItem> = {}): GnosisPayTxItem => ({
  isNext: true,
  queueNonce: faker.number.int({ max: 100 }),
  txData: { to: faker.finance.ethereumAddress(), value: '0', data: '0x' },
  executableAt: Date.now() + COOLDOWN_MS,
  expiresAt: Date.now() + COOLDOWN_MS + EXPIRATION_MS,
  ...overrides,
})

const advance = (ms: number) => act(() => jest.advanceTimersByTime(ms))

describe('GnosisPayQueueItemSummary', () => {
  beforeEach(() => {
    jest.useFakeTimers()
  })

  afterEach(() => {
    jest.useRealTimers()
  })

  it('counts down to executableAt while the cooldown runs', () => {
    const { getByTestId, getByText } = render(<GnosisPayQueueItemSummary item={buildItem()} />)

    expect(getByTestId('execute-btn')).toBeDisabled()
    expect(getByTestId('execute-btn')).toHaveTextContent('Execute in 180s')
    expect(getByText('Cooldown')).toBeInTheDocument()

    advance(60_000)

    expect(getByTestId('execute-btn')).toHaveTextContent('Execute in 120s')
  })

  it('keeps counting to executableAt when re-rendered mid-cooldown', () => {
    const item = buildItem()
    const { getByTestId, rerender } = render(<GnosisPayQueueItemSummary item={item} />)

    advance(60_000)
    rerender(<GnosisPayQueueItemSummary item={{ ...item }} />)
    advance(59_000)

    expect(getByTestId('execute-btn')).toBeDisabled()
    expect(getByTestId('execute-btn')).toHaveTextContent('Execute in 61s')
  })

  it('enables Execute and shows Ready once the cooldown has passed', () => {
    const { getByTestId, getByText } = render(<GnosisPayQueueItemSummary item={buildItem()} />)

    advance(COOLDOWN_MS)

    expect(getByTestId('execute-btn')).toBeEnabled()
    expect(getByTestId('execute-btn')).toHaveTextContent(/^Execute$/)
    expect(getByText('Ready')).toBeInTheDocument()
  })

  it('keeps Execute available until the expiration window after the cooldown has passed', () => {
    const { getByTestId } = render(<GnosisPayQueueItemSummary item={buildItem()} />)

    advance(COOLDOWN_MS + EXPIRATION_MS - 1_000)

    expect(getByTestId('execute-btn')).toBeEnabled()
  })

  it('offers Skip instead of Execute once the transaction has expired', () => {
    const { getByRole, getByText, queryByTestId } = render(<GnosisPayQueueItemSummary item={buildItem()} />)

    advance(COOLDOWN_MS + EXPIRATION_MS)

    expect(getByText('Expired')).toBeInTheDocument()
    expect(getByRole('button', { name: 'Skip' })).toBeEnabled()
    expect(queryByTestId('execute-btn')).not.toBeInTheDocument()
  })

  it('never offers Skip when the Delay modifier has no expiration', () => {
    const { getByTestId, queryByRole } = render(<GnosisPayQueueItemSummary item={buildItem({ expiresAt: null })} />)

    advance(COOLDOWN_MS + EXPIRATION_MS * 10)

    expect(getByTestId('execute-btn')).toBeEnabled()
    expect(queryByRole('button', { name: 'Skip' })).not.toBeInTheDocument()
  })
})

it('blocks a ready transaction behind the queue head', () => {
  const { getByTestId } = render(<GnosisPayQueueItemSummary item={buildItem({ isNext: false, executableAt: 0 })} />)
  expect(getByTestId('execute-btn')).toBeDisabled()
})
