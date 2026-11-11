import { act, waitFor } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { delay, HttpResponse } from 'msw'
import type { SafeTransaction } from '@safe-global/types-kit'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import type { HypernativeAssessmentResponseDto } from '@safe-global/store/hypernative/hypernativeApi.dto'
import { Severity, StatusGroup, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import { ErrorType, getErrorInfo } from '@safe-global/utils/features/safe-shield/utils/errors'
import { useThreatAnalysisHypernative } from '../useThreatAnalysisHypernative'
import {
  answerHypernative,
  makeHypernativeStore,
  renderWithHypernativeApi,
  setupHypernativeServer,
} from './hypernativeApiHarness'

const TRANSACTION_ASSESSMENT_PATH = '/safe/transaction/assessment'
const MESSAGE_ASSESSMENT_PATH = '/safe/eip712/assessment'
const DEBOUNCE_MS = 300

describe('useThreatAnalysisHypernative', () => {
  setupHypernativeServer()

  const safeAddress = faker.finance.ethereumAddress() as `0x${string}`
  const chainId = '1'
  const walletAddress = faker.finance.ethereumAddress()
  const safeVersion = '1.4.1'
  const authToken = `Bearer ${faker.string.alphanumeric(32)}`

  const createSafeTransaction = (overrides: Partial<SafeTransaction['data']> = {}): SafeTransaction => ({
    data: {
      to: faker.finance.ethereumAddress(),
      value: '1000000000000000000',
      data: '0x',
      operation: 0,
      safeTxGas: '0',
      baseGas: '0',
      gasPrice: '0',
      gasToken: '0x0000000000000000000000000000000000000000',
      refundReceiver: '0x0000000000000000000000000000000000000000',
      nonce: 1,
      ...overrides,
    },
    signatures: new Map(),
    addSignature: jest.fn(),
    encodedSignatures: jest.fn(),
    getSignature: jest.fn(),
  })

  const withData = (safeTx: SafeTransaction, data: Partial<SafeTransaction['data']>): SafeTransaction => ({
    ...safeTx,
    data: { ...safeTx.data, ...data },
  })

  const createTypedData = (): TypedData => ({
    domain: { chainId: 1, verifyingContract: safeAddress },
    primaryType: 'SafeTx',
    types: {
      SafeTx: [
        { name: 'to', type: 'address' },
        { name: 'value', type: 'uint256' },
      ],
    },
    message: { to: faker.finance.ethereumAddress(), value: '100' },
  })

  const createAssessment = (
    threatAnalysis: HypernativeAssessmentResponseDto['data']['assessmentData']['findings']['THREAT_ANALYSIS'] = {
      status: 'No risks found',
      severity: 'accept',
      risks: [],
    },
  ): HypernativeAssessmentResponseDto => ({
    data: {
      safeTxHash: faker.string.hexadecimal({ length: 64, casing: 'lower' }) as `0x${string}`,
      status: 'OK',
      assessmentData: {
        assessmentId: faker.string.uuid(),
        assessmentTimestamp: new Date().toISOString(),
        recommendation: threatAnalysis.severity,
        interpretation: 'Transfer 1 ETH to recipient',
        findings: {
          THREAT_ANALYSIS: threatAnalysis,
          CUSTOM_CHECKS: { status: 'Passed', severity: 'accept', risks: [] },
        },
      },
    },
  })

  const answerWithAssessment = (assessment = createAssessment()) =>
    answerHypernative(TRANSACTION_ASSESSMENT_PATH, () => HttpResponse.json(assessment))

  type HookProps = Parameters<typeof useThreatAnalysisHypernative>[0]

  const renderTransactionHook = (initialProps: Partial<HookProps> = {}, store = makeHypernativeStore()) => {
    const defaults: HookProps = {
      safeAddress,
      chainId,
      data: createSafeTransaction(),
      walletAddress,
      safeVersion,
      authToken,
    }
    return renderWithHypernativeApi(
      (props: Partial<HookProps>) => useThreatAnalysisHypernative({ ...defaults, ...props }),
      { initialProps, store },
    )
  }

  const passTime = (ms: number) => act(() => jest.advanceTimersByTimeAsync(ms))

  describe('requests', () => {
    it('sends the transaction with its EIP-712 safeTxHash for the Safe, chain and Safe version', async () => {
      const requests = answerWithAssessment()
      const zeroAddress = '0x0000000000000000000000000000000000000000'
      const safeTx = createSafeTransaction({
        to: '0x2222222222222222222222222222222222222222',
        value: '1000000000000000000',
        data: '0x',
        operation: 0,
        safeTxGas: '0',
        baseGas: '0',
        gasPrice: '0',
        gasToken: zeroAddress,
        refundReceiver: zeroAddress,
        nonce: 1,
      })

      renderTransactionHook({
        safeAddress: '0x1111111111111111111111111111111111111111',
        chainId: '1',
        safeVersion: '1.4.1',
        data: safeTx,
        origin: 'https://app.example.com',
      })

      await waitFor(() => expect(requests).toHaveLength(1))
      expect(requests[0].authorization).toBe(authToken)
      expect(requests[0].body).toEqual({
        safeAddress: '0x1111111111111111111111111111111111111111',
        safeTxHash: '0xb2c2e06269f16a730d83543d3d0ac8e9ba7224fa5de422f086351c0d833fa62c',
        transaction: {
          chain: '1',
          input: '0x',
          operation: '0',
          toAddress: '0x2222222222222222222222222222222222222222',
          fromAddress: walletAddress,
          safeTxGas: '0',
          value: '1000000000000000000',
          baseGas: '0',
          gasPrice: '0',
          gasToken: zeroAddress,
          refundReceiver: zeroAddress,
          nonce: '1',
        },
        url: 'https://app.example.com',
      })
    })

    it('assesses the transaction again with a new auth token', async () => {
      const requests = answerWithAssessment()
      const newAuthToken = `Bearer ${faker.string.alphanumeric(32)}`
      const { rerender } = renderTransactionHook({ authToken })
      await waitFor(() => expect(requests).toHaveLength(1))

      rerender({ authToken: newAuthToken })

      await waitFor(() => expect(requests).toHaveLength(2))
      expect(requests[1].authorization).toBe(newAuthToken)
    })

    it('sends the url from a JSON origin', async () => {
      const requests = answerWithAssessment()

      renderTransactionHook({ origin: JSON.stringify({ url: 'https://parsed.example.com' }) })

      await waitFor(() => expect(requests).toHaveLength(1))
      expect(requests[0].body).toEqual(expect.objectContaining({ url: 'https://parsed.example.com' }))
    })

    it('sends an origin that is not JSON as it is', async () => {
      const requests = answerWithAssessment()

      renderTransactionHook({ origin: 'https://plain.example.com' })

      await waitFor(() => expect(requests).toHaveLength(1))
      expect(requests[0].body).toEqual(expect.objectContaining({ url: 'https://plain.example.com' }))
    })

    it.each([
      ['without data', { data: undefined }],
      ['for typed data without a message hash', { data: createTypedData() }],
      ['without a wallet address', { walletAddress: '' }],
    ])('sends no transaction assessment %s', async (_label, props) => {
      const requests = answerWithAssessment()

      const { result } = renderTransactionHook(props)

      await waitFor(() => expect(result.current).toEqual([undefined, undefined, false]))
      expect(requests).toHaveLength(0)
    })

    it('assesses typed data with a message hash as a message', async () => {
      const transactionRequests = answerWithAssessment()
      const messageRequests = answerHypernative(MESSAGE_ASSESSMENT_PATH, () => HttpResponse.json(createAssessment()))
      const messageHash = faker.string.hexadecimal({ length: 64, casing: 'lower' }) as `0x${string}`

      renderTransactionHook({ data: createTypedData(), messageHash })

      await waitFor(() => expect(messageRequests).toHaveLength(1))
      expect(messageRequests[0].body).toEqual(expect.objectContaining({ messageHash }))
      expect(transactionRequests).toHaveLength(0)
    })
  })

  describe('transaction edits', () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => jest.useRealTimers())

    it('assesses the edited transaction once the edits settle', async () => {
      const requests = answerWithAssessment()
      const safeTx = createSafeTransaction()
      const { rerender } = renderTransactionHook({ data: safeTx })
      await waitFor(() => expect(requests).toHaveLength(1))

      for (const nonce of [2, 3, 4]) {
        rerender({ data: withData(safeTx, { nonce }) })
        await passTime(DEBOUNCE_MS - 100)
      }
      expect(requests).toHaveLength(1)

      await passTime(DEBOUNCE_MS)
      await waitFor(() => expect(requests).toHaveLength(2))
      expect(requests[1].body).toEqual(
        expect.objectContaining({ transaction: expect.objectContaining({ nonce: '4' }) }),
      )
    })

    it('does not assess the same transaction again when only its object is recreated', async () => {
      const requests = answerWithAssessment()
      const safeTx = createSafeTransaction()
      const { result, rerender } = renderTransactionHook({ data: safeTx })
      await waitFor(() => expect(result.current[0]).toBeDefined())

      rerender({ data: withData(safeTx, {}) })
      await passTime(DEBOUNCE_MS)

      expect(requests).toHaveLength(1)
      expect(result.current[0]).toBeDefined()
    })

    it('shows the assessment of the latest edit when the previous one answers late', async () => {
      let answerFirstRequest = () => {}
      const firstRequestAnswered = new Promise<void>((resolve) => (answerFirstRequest = resolve))
      const deniedTransaction = createAssessment({
        status: 'Risks found',
        severity: 'deny',
        risks: [{ title: 'Transfer to malicious', details: 'Phishing.', severity: 'deny', safeCheckId: 'x' }],
      })
      let requestCount = 0
      answerHypernative(TRANSACTION_ASSESSMENT_PATH, async () => {
        requestCount += 1
        if (requestCount === 1) {
          await firstRequestAnswered
          return HttpResponse.json(deniedTransaction)
        }
        return HttpResponse.json(createAssessment())
      })
      const safeTx = createSafeTransaction()
      const { result, rerender } = renderTransactionHook({ data: safeTx })

      rerender({ data: withData(safeTx, { nonce: 2 }) })
      await passTime(DEBOUNCE_MS)
      await waitFor(() => expect(result.current[0]?.[StatusGroup.THREAT]?.[0].severity).toBe(Severity.OK))
      answerFirstRequest()
      await passTime(1)

      expect(result.current[0]?.[StatusGroup.THREAT]?.[0].severity).toBe(Severity.OK)
    })
  })

  describe('review lifetime', () => {
    beforeEach(() => jest.useFakeTimers())
    afterEach(() => jest.useRealTimers())

    it('assesses the transaction again when its review opens again', async () => {
      const requests = answerWithAssessment()
      const store = makeHypernativeStore()
      const safeTx = createSafeTransaction()
      const firstReview = renderTransactionHook({ data: safeTx }, store)
      await waitFor(() => expect(firstReview.result.current[0]).toBeDefined())

      firstReview.unmount()
      await passTime(1)
      renderTransactionHook({ data: safeTx }, store)

      await waitFor(() => expect(requests).toHaveLength(2))
    })

    it('cancels the request when the review closes before the answer', async () => {
      let isCancelled = false
      answerHypernative(TRANSACTION_ASSESSMENT_PATH, async ({ signal }) => {
        signal.addEventListener('abort', () => (isCancelled = true))
        await delay('infinite')
        return HttpResponse.json(createAssessment())
      })
      const { result, unmount } = renderTransactionHook()
      await waitFor(() => expect(result.current[2]).toBe(true))

      unmount()
      await passTime(1)

      expect(isCancelled).toBe(true)
    })
  })

  describe('result', () => {
    it('reports no threat for an accepted transaction', async () => {
      answerWithAssessment()

      const { result } = renderTransactionHook()

      await waitFor(() => {
        const [data, error, loading] = result.current
        expect(data?.[StatusGroup.THREAT]?.[0]).toEqual(
          expect.objectContaining({ severity: Severity.OK, type: ThreatStatus.NO_THREAT }),
        )
        expect(error).toBeUndefined()
        expect(loading).toBe(false)
      })
    })

    it('reports a critical threat for a denied transaction', async () => {
      answerWithAssessment(
        createAssessment({
          status: 'Risks found',
          severity: 'deny',
          risks: [
            {
              title: 'Transfer to malicious',
              details: 'Transfer to known phishing address.',
              severity: 'deny',
              safeCheckId: faker.string.alphanumeric(10),
            },
          ],
        }),
      )

      const { result } = renderTransactionHook()

      await waitFor(() =>
        expect(result.current[0]?.[StatusGroup.THREAT]?.[0]).toEqual(
          expect.objectContaining({
            severity: Severity.CRITICAL,
            type: ThreatStatus.HYPERNATIVE_GUARD,
            title: 'Malicious threat detected',
            description: 'Transfer to malicious. The full threat report is available in your Hypernative account.',
          }),
        ),
      )
    })

    it('reports the error the API gives for a refused transaction', async () => {
      answerHypernative(TRANSACTION_ASSESSMENT_PATH, () =>
        HttpResponse.json(
          { success: false, data: null, error: 'Failed to analyze threat', errorCode: 1027 },
          { status: 422 },
        ),
      )

      const { result } = renderTransactionHook()

      await waitFor(() => {
        const [data, error, loading] = result.current
        expect(data).toEqual({ [StatusGroup.COMMON]: [getErrorInfo(ErrorType.THREAT)] })
        expect(error?.message).toBe('Failed to analyze threat')
        expect(loading).toBe(false)
      })
    })

    it('is loading while the assessment is in flight', async () => {
      answerHypernative(TRANSACTION_ASSESSMENT_PATH, async () => {
        await delay('infinite')
        return HttpResponse.json(createAssessment())
      })

      const { result } = renderTransactionHook()

      await waitFor(() => expect(result.current[2]).toBe(true))
    })

    it('requires an auth token', () => {
      const requests = answerWithAssessment()

      const { result } = renderTransactionHook({ authToken: undefined })

      expect(result.current[1]?.message).toBe('authToken is required')
      expect(requests).toHaveLength(0)
    })
  })

  describe('skip', () => {
    it('sends nothing and returns nothing, even without an auth token', async () => {
      const requests = answerWithAssessment()

      const { result } = renderTransactionHook({ skip: true, authToken: undefined })

      await waitFor(() => expect(result.current).toEqual([undefined, undefined, false]))
      expect(requests).toHaveLength(0)
    })

    it('stops returning the assessment once skipped', async () => {
      answerWithAssessment()
      const { result, rerender } = renderTransactionHook({ skip: false })
      await waitFor(() => expect(result.current[0]).toBeDefined())

      rerender({ skip: true })

      expect(result.current).toEqual([undefined, undefined, false])
    })

    it('assesses the transaction once no longer skipped', async () => {
      const requests = answerWithAssessment()
      const { result, rerender } = renderTransactionHook({ skip: true })
      await waitFor(() => expect(result.current).toEqual([undefined, undefined, false]))
      expect(requests).toHaveLength(0)

      rerender({ skip: false })

      await waitFor(() => expect(requests).toHaveLength(1))
    })

    it('reports no error once skipped after the API rejected the token', async () => {
      answerHypernative(TRANSACTION_ASSESSMENT_PATH, () =>
        HttpResponse.json({ success: false, data: null, error: 'Please reconnect', errorCode: 1038 }, { status: 401 }),
      )
      const { result, rerender } = renderTransactionHook({ skip: false })
      await waitFor(() => expect(result.current[1]).toBeDefined())

      rerender({ authToken: undefined, skip: true })

      expect(result.current).toEqual([undefined, undefined, false])
    })
  })
})
