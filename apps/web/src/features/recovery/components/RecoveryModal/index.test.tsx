import { faker } from '@faker-js/faker'
import { renderHook } from '@testing-library/react'
import * as router from 'next/router'

import { render, waitFor } from '@/tests/test-utils'
import { safeInfoBuilder } from '@/tests/builders/safe'
import { connectedWalletBuilder } from '@/tests/builders/wallet'
import * as safeInfo from '@/hooks/useSafeInfo'
import { useDidDismissProposal } from './index'
import type { RecoveryQueueItem } from '@/features/recovery/services/recovery-state'
import store from '@/features/recovery/components/RecoveryContext'

describe('RecoveryModal', () => {
  beforeEach(() => {
    store.setStore({
      state: [],
    } as any)
  })

  describe('component', () => {
    // eslint-disable-next-line @typescript-eslint/consistent-type-imports
    let _RecoveryModal: typeof import('./index').InternalRecoveryModal

    beforeEach(() => {
      localStorage.clear()

      // Clear cache in between tests
      _RecoveryModal = require('./index').InternalRecoveryModal
    })

    it('should not render either modal if there is no queue and the user is an owner', () => {
      const wallet = connectedWalletBuilder().build()
      const queue = [] as Array<RecoveryQueueItem>

      store.setStore({
        state: [[{ queue }]],
      } as any)

      const { container, queryByText } = render(
        <_RecoveryModal wallet={wallet} isOwner isRecoverer={false} queue={queue} />,
      )

      expect(container.innerHTML).toMatchSnapshot()
      expect(queryByText('recovery')).toBeFalsy()
    })

    it('should close the modal when the user navigates away', async () => {
      const mockUseRouter = {
        push: jest.fn(),
        query: {},
        events: {
          on: jest.fn(),
          off: jest.fn(),
        },
      }

      jest.spyOn(router, 'useRouter').mockReturnValue(mockUseRouter as any)

      const wallet = connectedWalletBuilder().build()
      const queue = [
        { validFrom: BigInt(0), transactionHash: faker.string.hexadecimal() } as unknown as RecoveryQueueItem,
      ]

      store.setStore({
        state: [[{ queue }]],
      } as any)

      const { container, queryByText } = render(
        <_RecoveryModal wallet={wallet} isOwner isRecoverer={false} queue={queue} />,
      )

      expect(container).not.toBeEmptyDOMElement()
      expect(queryByText(/Account recovery in progress/)).toBeTruthy()

      // Trigger the route change
      mockUseRouter.events.on.mock.calls[0][1]()

      await waitFor(() => {
        expect(queryByText(/Account recovery in progress/)).toBeFalsy()
      })
    })

    describe('in-progress', () => {
      it('should render the in-progress modal when there is a queue for recoverers', () => {
        const wallet = connectedWalletBuilder().build()
        const queue = [{ validFrom: BigInt(0) } as RecoveryQueueItem]

        store.setStore({
          state: [[{ queue }]],
        } as any)

        const { container, queryByText } = render(
          <_RecoveryModal wallet={wallet} isOwner={false} isRecoverer queue={queue} />,
        )

        expect(container).not.toBeEmptyDOMElement()
        expect(queryByText(/Account recovery in progress/)).toBeTruthy()
      })

      it('should render the in-progress modal when there is a queue for owners', () => {
        const wallet = connectedWalletBuilder().build()
        const queue = [{ validFrom: BigInt(0) } as RecoveryQueueItem]

        store.setStore({
          state: [[{ queue }]],
        } as any)

        const { container, queryByText } = render(
          <_RecoveryModal wallet={wallet} isOwner isRecoverer={false} queue={queue} />,
        )

        expect(container).not.toBeEmptyDOMElement()
        expect(queryByText(/Account recovery in progress/)).toBeTruthy()
      })

      it('should not render the in-progress modal when there is a queue but the user is not an owner or recoverer', () => {
        const wallet = connectedWalletBuilder().build()
        const queue = [{ validFrom: BigInt(0) } as RecoveryQueueItem]

        store.setStore({
          state: [[{ queue }]],
        } as any)

        const { container, queryByText } = render(
          <_RecoveryModal wallet={wallet} isOwner={false} isRecoverer={false} queue={queue} />,
        )

        expect(container).not.toBeEmptyDOMElement()
        expect(queryByText('recovery')).toBeFalsy()
      })

      it('should not render the in-progress modal when there is a queue for recoverers on a non-sidebar route', () => {
        const wallet = connectedWalletBuilder().build()
        const queue = [{ validFrom: BigInt(0) } as RecoveryQueueItem]

        store.setStore({
          state: [[{ queue }]],
        } as any)

        const { container, queryByText } = render(
          <_RecoveryModal wallet={wallet} isOwner={false} isRecoverer queue={queue} isSidebarRoute={false} />,
        )

        expect(container).not.toBeEmptyDOMElement()
        expect(queryByText('recovery')).toBeFalsy()
      })
    })

    describe('proposal', () => {
      it('should render the proposal modal if there is no queue and the user is a recoverer', () => {
        const wallet = connectedWalletBuilder().build()
        const queue = [] as Array<RecoveryQueueItem>

        store.setStore({
          state: [[{ queue }]],
        } as any)

        const { container, queryByText } = render(
          <_RecoveryModal wallet={wallet} isOwner={false} isRecoverer queue={queue} />,
        )

        expect(container).not.toBeEmptyDOMElement()
        expect(queryByText('recovery')).toBeFalsy()
      })

      it('should not render the proposal modal when there is no queue for owners', () => {
        const wallet = connectedWalletBuilder().build()
        const queue = [] as Array<RecoveryQueueItem>

        store.setStore({
          state: [[{ queue }]],
        } as any)

        const { container, queryByText } = render(
          <_RecoveryModal wallet={wallet} isOwner isRecoverer={false} queue={queue} />,
        )

        expect(container.innerHTML).toMatchSnapshot()
        expect(queryByText('Recover this Account')).toBeFalsy()
      })

      it('should not render the proposal modal when there is no queue for recoverers on a non-sidebar route', () => {
        const wallet = connectedWalletBuilder().build()
        const queue = [] as Array<RecoveryQueueItem>

        store.setStore({
          state: [[{ queue }]],
        } as any)

        const { container, queryByText } = render(
          <_RecoveryModal wallet={wallet} isOwner={false} isRecoverer queue={queue} isSidebarRoute={false} />,
        )

        expect(container.innerHTML).toMatchSnapshot()
        expect(queryByText('recovery')).toBeFalsy()
      })

      it('should not render the proposal modal when there is no queue for non-owners', () => {
        const wallet = connectedWalletBuilder().build()
        const queue = [] as Array<RecoveryQueueItem>

        store.setStore({
          state: [[{ queue }]],
        } as any)

        const { container, queryByText } = render(
          <_RecoveryModal wallet={wallet} isOwner={false} isRecoverer={false} queue={queue} />,
        )

        expect(container.innerHTML).toMatchSnapshot()
        expect(queryByText('Recover this Account')).toBeFalsy()
      })
    })
  })

  describe('hooks', () => {
    beforeEach(() => {
      localStorage.clear()

      const safe = safeInfoBuilder().build()
      jest
        .spyOn(safeInfo, 'default')
        .mockReturnValue({ safe, safeAddress: safe.address.value } as ReturnType<typeof safeInfo.default>)
    })

    describe('useDidDismissProposal', () => {
      it('should return false if the proposal was not dismissed before', () => {
        const recovererAddress = faker.finance.ethereumAddress()

        const { result } = renderHook(() => useDidDismissProposal())

        expect(result.current.wasProposalDismissed(recovererAddress)).toBeFalsy()
      })

      it('should return true if the proposal was dismissed before', () => {
        const recovererAddress = faker.finance.ethereumAddress()

        const { result, rerender } = renderHook(() => useDidDismissProposal())

        expect(result.current.wasProposalDismissed(recovererAddress)).toBeFalsy()
        result.current.dismissProposal(recovererAddress)

        rerender()

        expect(result.current.wasProposalDismissed(recovererAddress)).toBeTruthy()
      })

      it('should persist dismissals between sessions', () => {
        const recovererAddress = faker.finance.ethereumAddress()

        const firstRender = renderHook(() => useDidDismissProposal())

        expect(firstRender.result.current.wasProposalDismissed(recovererAddress)).toBeFalsy()
        firstRender.result.current.dismissProposal(recovererAddress)

        firstRender.rerender()

        expect(firstRender.result.current.wasProposalDismissed(recovererAddress)).toBeTruthy()

        firstRender.unmount()

        const secondRender = renderHook(() => useDidDismissProposal())
        expect(secondRender.result.current.wasProposalDismissed(recovererAddress)).toBeTruthy()
      })
    })

    describe('useDidDismissInProgress', () => {
      // eslint-disable-next-line @typescript-eslint/consistent-type-imports
      let _useDidDismissInProgress: typeof import('./index').useDidDismissInProgress

      beforeEach(() => {
        localStorage.clear()

        // Clear cache in between tests
        _useDidDismissInProgress = require('./index').useDidDismissInProgress
      })

      it('should return false if in-progress was not dismissed before', () => {
        const recovererAddress = faker.finance.ethereumAddress()

        const { result } = renderHook(() => _useDidDismissInProgress())

        expect(result.current.wasInProgressDismissed(recovererAddress)).toBeFalsy()
      })

      it('should return true if in-progress was not dismissed before', () => {
        const recovererAddress = faker.finance.ethereumAddress()

        const { result } = renderHook(() => _useDidDismissInProgress())

        expect(result.current.wasInProgressDismissed(recovererAddress)).toBeFalsy()
        result.current.dismissInProgress(recovererAddress)
        expect(result.current.wasInProgressDismissed(recovererAddress)).toBeTruthy()
      })

      it('should not persist dismissals between sessions', () => {
        const recovererAddress = faker.finance.ethereumAddress()

        const firstRender = renderHook(() => _useDidDismissInProgress())

        expect(firstRender.result.current.wasInProgressDismissed(recovererAddress)).toBeFalsy()
        firstRender.result.current.dismissInProgress(recovererAddress)
        expect(firstRender.result.current.wasInProgressDismissed(recovererAddress)).toBeTruthy()

        firstRender.unmount()

        const secondRender = renderHook(() => _useDidDismissInProgress())
        expect(secondRender.result.current.wasInProgressDismissed(recovererAddress)).toBeFalsy()
      })
    })
  })
})
