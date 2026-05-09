import { renderHook, waitFor } from '@/tests/test-utils'
import { useHnAssessmentSeverity } from '../useHnAssessmentSeverity'
import type { ThreatAnalysisResults } from '@safe-global/utils/features/safe-shield/types'
import type { AsyncResult } from '@safe-global/utils/hooks/useAsync'
import { Severity, StatusGroup, ThreatStatus } from '@safe-global/utils/features/safe-shield/types'

const buildThreatAnalysisResults = (severity: Severity): ThreatAnalysisResults => ({
  [StatusGroup.THREAT]: [
    {
      severity,
      type: ThreatStatus.MALICIOUS,
      title: `${severity} threat detected`,
      description: 'Test threat',
    },
  ],
})

const buildAssessmentResult = (severity: Severity): AsyncResult<ThreatAnalysisResults> => [
  buildThreatAnalysisResults(severity),
  undefined,
  false,
]

describe('useHnAssessmentSeverity', () => {
  it('should return severity OK when assessment has OK severity', async () => {
    const assessment = buildAssessmentResult(Severity.OK)

    const { result } = renderHook(() => useHnAssessmentSeverity(assessment))

    await waitFor(() => {
      expect(result.current).toBe(Severity.OK)
    })
  })

  it('should return severity INFO when assessment has INFO severity', async () => {
    const assessment = buildAssessmentResult(Severity.INFO)

    const { result } = renderHook(() => useHnAssessmentSeverity(assessment))

    await waitFor(() => {
      expect(result.current).toBe(Severity.INFO)
    })
  })

  it('should return severity WARN when assessment has WARN severity', async () => {
    const assessment = buildAssessmentResult(Severity.WARN)

    const { result } = renderHook(() => useHnAssessmentSeverity(assessment))

    await waitFor(() => {
      expect(result.current).toBe(Severity.WARN)
    })
  })

  it('should return severity CRITICAL when assessment has CRITICAL severity', async () => {
    const assessment = buildAssessmentResult(Severity.CRITICAL)

    const { result } = renderHook(() => useHnAssessmentSeverity(assessment))

    await waitFor(() => {
      expect(result.current).toBe(Severity.CRITICAL)
    })
  })

  it('should return severity ERROR when assessment has an error', async () => {
    const error = new Error('Network error')
    const assessment: AsyncResult<ThreatAnalysisResults> = [undefined, error, false]

    const { result } = renderHook(() => useHnAssessmentSeverity(assessment))

    await waitFor(() => {
      expect(result.current).toBe(Severity.ERROR)
    })
  })

  it('should return undefined when assessment is undefined', async () => {
    const { result } = renderHook(() => useHnAssessmentSeverity(undefined))

    await waitFor(() => {
      expect(result.current).toBeUndefined()
    })
  })

  it('should return undefined when assessment data is undefined and no error', async () => {
    const assessment: AsyncResult<ThreatAnalysisResults> = [undefined, undefined, false]

    const { result } = renderHook(() => useHnAssessmentSeverity(assessment))

    await waitFor(() => {
      expect(result.current).toBeUndefined()
    })
  })

  it('should return severity from primary result when multiple threats exist', async () => {
    const assessment: AsyncResult<ThreatAnalysisResults> = [
      {
        [StatusGroup.THREAT]: [
          {
            severity: Severity.WARN,
            type: ThreatStatus.MALICIOUS,
            title: 'First threat',
            description: 'First threat description',
          },
          {
            severity: Severity.CRITICAL,
            type: ThreatStatus.MALICIOUS,
            title: 'Second threat',
            description: 'Second threat description',
          },
        ],
      },
      undefined,
      false,
    ]

    const { result } = renderHook(() => useHnAssessmentSeverity(assessment))

    await waitFor(() => {
      // getPrimaryAnalysisResult should return the highest severity (CRITICAL)
      expect(result.current).toBe(Severity.CRITICAL)
    })
  })

  it('should update severity when assessment changes', async () => {
    const firstAssessment = buildAssessmentResult(Severity.OK)
    const secondAssessment = buildAssessmentResult(Severity.CRITICAL)

    const { result, rerender } = renderHook((props) => useHnAssessmentSeverity(props.assessment), {
      initialProps: { assessment: firstAssessment },
    })

    await waitFor(() => {
      expect(result.current).toBe(Severity.OK)
    })

    rerender({ assessment: secondAssessment })

    await waitFor(() => {
      expect(result.current).toBe(Severity.CRITICAL)
    })
  })

  it('should update severity to ERROR when error occurs after initial data', async () => {
    const successAssessment = buildAssessmentResult(Severity.OK)
    const errorAssessment: AsyncResult<ThreatAnalysisResults> = [
      buildThreatAnalysisResults(Severity.OK),
      new Error('Network error'),
      false,
    ]

    const { result, rerender } = renderHook((props) => useHnAssessmentSeverity(props.assessment), {
      initialProps: { assessment: successAssessment },
    })

    await waitFor(() => {
      expect(result.current).toBe(Severity.OK)
    })

    rerender({ assessment: errorAssessment })

    await waitFor(() => {
      expect(result.current).toBe(Severity.ERROR)
    })
  })

  it('should handle assessment with CUSTOM_CHECKS', async () => {
    const assessment: AsyncResult<ThreatAnalysisResults> = [
      {
        CUSTOM_CHECKS: [
          {
            severity: Severity.WARN,
            type: ThreatStatus.MALICIOUS,
            title: 'Custom check',
            description: 'Custom check description',
          },
        ],
      },
      undefined,
      false,
    ]

    const { result } = renderHook(() => useHnAssessmentSeverity(assessment))

    await waitFor(() => {
      expect(result.current).toBe(Severity.WARN)
    })
  })

  it('should prioritize highest severity when both THREAT and CUSTOM_CHECKS exist', async () => {
    const assessment: AsyncResult<ThreatAnalysisResults> = [
      {
        [StatusGroup.THREAT]: [
          {
            severity: Severity.WARN,
            type: ThreatStatus.MALICIOUS,
            title: 'Threat',
            description: 'Threat description',
          },
        ],
        CUSTOM_CHECKS: [
          {
            severity: Severity.CRITICAL,
            type: ThreatStatus.MALICIOUS,
            title: 'Custom check',
            description: 'Custom check description',
          },
        ],
      },
      undefined,
      false,
    ]

    const { result } = renderHook(() => useHnAssessmentSeverity(assessment))

    await waitFor(() => {
      // getPrimaryAnalysisResult should return the highest severity (CRITICAL)
      expect(result.current).toBe(Severity.CRITICAL)
    })
  })
})
