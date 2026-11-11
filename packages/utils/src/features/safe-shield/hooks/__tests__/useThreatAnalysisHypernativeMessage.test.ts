import { waitFor } from '@testing-library/react'
import { faker } from '@faker-js/faker'
import { delay, HttpResponse } from 'msw'
import { useThreatAnalysisHypernativeMessage } from '../useThreatAnalysisHypernativeMessage'
import type { TypedData } from '@safe-global/store/gateway/AUTO_GENERATED/messages'
import { Severity, StatusGroup, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'
import type {
  HypernativeMessageAssessmentResponseDto,
  HypernativeMessageAssessmentErrorDto,
} from '@safe-global/store/hypernative/hypernativeApi.dto'
import { ErrorType, getErrorInfo } from '@safe-global/utils/features/safe-shield/utils/errors'
import { answerHypernative, renderWithHypernativeApi, setupHypernativeServer } from './hypernativeApiHarness'

const MESSAGE_ASSESSMENT_PATH = '/safe/eip712/assessment'

describe('useThreatAnalysisHypernativeMessage', () => {
  setupHypernativeServer()

  const safeAddress = faker.finance.ethereumAddress() as `0x${string}`
  const chainId = '1'
  const messageHash = faker.string.hexadecimal({ length: 64, casing: 'lower' }) as `0x${string}`
  const authToken = `Bearer ${faker.string.alphanumeric(32)}`

  const createTypedData = (): TypedData => ({
    domain: {
      chainId: 1,
      verifyingContract: safeAddress,
    },
    primaryType: 'Permit',
    types: {
      EIP712Domain: [
        { name: 'chainId', type: 'uint256' },
        { name: 'verifyingContract', type: 'address' },
      ],
      Permit: [
        { name: 'owner', type: 'address' },
        { name: 'spender', type: 'address' },
        { name: 'value', type: 'uint256' },
        { name: 'nonce', type: 'uint256' },
        { name: 'deadline', type: 'uint256' },
      ],
    },
    message: {
      owner: faker.finance.ethereumAddress(),
      spender: faker.finance.ethereumAddress(),
      value: '1000000',
      nonce: 0,
      deadline: 9999999999,
    },
  })

  const createAssessment = (
    threatAnalysis: HypernativeMessageAssessmentResponseDto['data']['assessmentData']['findings']['THREAT_ANALYSIS'] = {
      status: 'No risks found',
      severity: 'accept',
      risks: [],
    },
  ): HypernativeMessageAssessmentResponseDto => ({
    data: {
      safeTxHash: messageHash,
      status: 'OK',
      assessmentData: {
        assessmentId: faker.string.uuid(),
        assessmentTimestamp: new Date().toISOString(),
        recommendation: threatAnalysis.severity,
        interpretation: 'Permit signature to approve token transfer',
        findings: {
          THREAT_ANALYSIS: threatAnalysis,
          CUSTOM_CHECKS: { status: 'Passed', severity: 'accept', risks: [] },
        },
      },
    },
  })

  const answerWithAssessment = (assessment = createAssessment()) =>
    answerHypernative(MESSAGE_ASSESSMENT_PATH, () => HttpResponse.json(assessment))

  type HookProps = Parameters<typeof useThreatAnalysisHypernativeMessage>[0]

  const renderMessageHook = (props: Partial<HookProps> = {}) => {
    const hookProps: HookProps = {
      safeAddress,
      chainId,
      messageHash,
      typedData: createTypedData(),
      authToken,
      ...props,
    }
    return renderWithHypernativeApi(() => useThreatAnalysisHypernativeMessage(hookProps))
  }

  describe('requests', () => {
    it('sends the message for assessment with the auth token', async () => {
      const requests = answerWithAssessment()
      const typedData = createTypedData()

      renderMessageHook({ typedData, origin: 'https://app.example.com' })

      await waitFor(() => expect(requests).toHaveLength(1))
      expect(requests[0].authorization).toBe(authToken)
      expect(requests[0].body).toEqual(
        expect.objectContaining({
          safeAddress,
          messageHash,
          url: 'https://app.example.com',
          message: expect.objectContaining({
            primaryType: 'Permit',
            domain: typedData.domain,
            message: typedData.message,
          }),
        }),
      )
    })

    it('includes the proposer when one is given', async () => {
      const requests = answerWithAssessment()
      const proposer = faker.finance.ethereumAddress() as `0x${string}`

      renderMessageHook({ proposer })

      await waitFor(() => expect(requests).toHaveLength(1))
      expect(requests[0].body).toEqual(expect.objectContaining({ proposer }))
    })

    it('sends the url from a JSON origin', async () => {
      const requests = answerWithAssessment()

      renderMessageHook({ origin: JSON.stringify({ url: 'https://parsed.example.com' }) })

      await waitFor(() => expect(requests).toHaveLength(1))
      expect(requests[0].body).toEqual(expect.objectContaining({ url: 'https://parsed.example.com' }))
    })

    it('sends the chain of the typed data domain over the chainId prop', async () => {
      const requests = answerWithAssessment()

      renderMessageHook({ chainId: '137' })

      await waitFor(() => expect(requests).toHaveLength(1))
      expect(requests[0].body).toEqual(expect.objectContaining({ chain: '1' }))
    })

    it('sends the chainId prop when the typed data domain has no chain', async () => {
      const requests = answerWithAssessment()

      renderMessageHook({
        chainId: '137',
        typedData: { ...createTypedData(), domain: { verifyingContract: safeAddress } },
      })

      await waitFor(() => expect(requests).toHaveLength(1))
      expect(requests[0].body).toEqual(expect.objectContaining({ chain: '137' }))
    })

    it('sends nothing without typed data', async () => {
      const requests = answerWithAssessment()

      const { result } = renderMessageHook({ typedData: undefined })

      await waitFor(() => expect(result.current).toEqual([undefined, undefined, false]))
      expect(requests).toHaveLength(0)
    })

    it('assesses a message once when its typed data object is recreated', async () => {
      const requests = answerWithAssessment()
      const typedData = createTypedData()
      const { result, rerender } = renderWithHypernativeApi(
        ({ data }) =>
          useThreatAnalysisHypernativeMessage({ safeAddress, chainId, messageHash, typedData: data, authToken }),
        { initialProps: { data: typedData } },
      )
      await waitFor(() => expect(result.current[0]).toBeDefined())

      rerender({ data: { ...typedData } })

      expect(result.current[2]).toBe(false)
      expect(requests).toHaveLength(1)
    })

    it('assesses the same message again after the auth token changes', async () => {
      const requests = answerWithAssessment()
      const newAuthToken = `Bearer ${faker.string.alphanumeric(32)}`
      const typedData = createTypedData()
      const { rerender } = renderWithHypernativeApi(
        ({ token }) =>
          useThreatAnalysisHypernativeMessage({ safeAddress, chainId, messageHash, typedData, authToken: token }),
        { initialProps: { token: authToken as string | undefined } },
      )
      await waitFor(() => expect(requests).toHaveLength(1))

      rerender({ token: undefined })
      rerender({ token: newAuthToken })

      await waitFor(() => expect(requests).toHaveLength(2))
      expect(requests[1].authorization).toBe(newAuthToken)
    })
  })

  describe('result', () => {
    it('reports no threat for an accepted message', async () => {
      answerWithAssessment()

      const { result } = renderMessageHook()

      await waitFor(() => {
        const [data, error, loading] = result.current
        expect(data?.[StatusGroup.THREAT]?.[0]).toEqual(
          expect.objectContaining({ severity: Severity.OK, type: ThreatStatus.NO_THREAT }),
        )
        expect(error).toBeUndefined()
        expect(loading).toBe(false)
      })
    })

    it('reports a critical threat for a denied message', async () => {
      answerWithAssessment(
        createAssessment({
          status: 'Risks found',
          severity: 'deny',
          risks: [
            {
              title: 'Malicious permit',
              details: 'Permit signature to known malicious spender.',
              severity: 'deny',
              safeCheckId: faker.string.alphanumeric(10),
            },
          ],
        }),
      )

      const { result } = renderMessageHook()

      await waitFor(() =>
        expect(result.current[0]?.[StatusGroup.THREAT]?.[0]).toEqual(
          expect.objectContaining({ severity: Severity.CRITICAL, type: ThreatStatus.HYPERNATIVE_GUARD }),
        ),
      )
    })

    it('reports the reason the API gives for refusing the message', async () => {
      const refusal: HypernativeMessageAssessmentErrorDto = {
        status: 'FAILED',
        error: {
          reason: 'MESSAGE_HASH_MISMATCH',
          message: 'The provided messageHash does not match the computed hash',
        },
      }
      answerHypernative(MESSAGE_ASSESSMENT_PATH, () => HttpResponse.json(refusal, { status: 400 }))

      const { result } = renderMessageHook()

      await waitFor(() => {
        const [data, error] = result.current
        expect(data).toEqual({ [StatusGroup.COMMON]: [getErrorInfo(ErrorType.THREAT)] })
        expect(error?.message).toBe('MESSAGE_HASH_MISMATCH: The provided messageHash does not match the computed hash')
      })
    })

    it('reports a generic error when the API answers with something unexpected', async () => {
      answerHypernative(MESSAGE_ASSESSMENT_PATH, () => new HttpResponse('<html>Bad gateway</html>', { status: 400 }))

      const { result } = renderMessageHook()

      await waitFor(() => {
        const [data, error] = result.current
        expect(data).toEqual({ [StatusGroup.COMMON]: [getErrorInfo(ErrorType.THREAT)] })
        expect(error?.message).toBe('Failed to fetch Hypernative message threat analysis')
      })
    })

    it('is loading while the assessment is in flight', async () => {
      answerHypernative(MESSAGE_ASSESSMENT_PATH, async () => {
        await delay('infinite')
        return HttpResponse.json(createAssessment())
      })

      const { result } = renderMessageHook()

      await waitFor(() => expect(result.current[2]).toBe(true))
    })

    it('requires an auth token', () => {
      const requests = answerWithAssessment()

      const { result } = renderMessageHook({ authToken: undefined })

      expect(result.current[1]?.message).toBe('authToken is required')
      expect(requests).toHaveLength(0)
    })
  })

  describe('skip', () => {
    it('sends nothing and returns nothing, even without an auth token', async () => {
      const requests = answerWithAssessment()

      const { result } = renderMessageHook({ skip: true, authToken: undefined })

      await waitFor(() => expect(result.current).toEqual([undefined, undefined, false]))
      expect(requests).toHaveLength(0)
    })

    it('reports no error once skipped after the API rejected the token', async () => {
      answerHypernative(MESSAGE_ASSESSMENT_PATH, () =>
        HttpResponse.json({ success: false, data: null, error: 'Please reconnect', errorCode: 1038 }, { status: 401 }),
      )
      const typedData = createTypedData()
      const { result, rerender } = renderWithHypernativeApi(
        ({ token, skip }) =>
          useThreatAnalysisHypernativeMessage({ safeAddress, chainId, messageHash, typedData, authToken: token, skip }),
        { initialProps: { token: authToken as string | undefined, skip: false } },
      )
      await waitFor(() => expect(result.current[1]).toBeDefined())

      rerender({ token: undefined, skip: true })

      expect(result.current).toEqual([undefined, undefined, false])
    })
  })
})
