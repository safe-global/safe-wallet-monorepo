import { AnalysisResult, CommonSharedStatus, Severity } from '../types'

export enum ErrorType {
  RECIPIENT = 'recipient',
  CONTRACT = 'contract',
  THREAT = 'threat',
}

export const ERROR_INFO_MAPPER = {
  [ErrorType.RECIPIENT]: {
    title: 'Recipient analysis failed',
    description: 'The analysis failed. Please try again later.',
    type: CommonSharedStatus.FAILED,
    severity: Severity.WARN,
  },
  [ErrorType.CONTRACT]: {
    title: 'Contract analysis failed',
    description: 'The analysis failed. Please try again later.',
    type: CommonSharedStatus.FAILED,
    severity: Severity.WARN,
  },
  [ErrorType.THREAT]: {
    title: 'Threat analysis failed',
    description: 'Threat analysis failed. Review before processing.',
    severity: Severity.WARN,
    type: CommonSharedStatus.FAILED,
  },
}

export const getErrorInfo = (type: ErrorType): AnalysisResult<CommonSharedStatus> => {
  return ERROR_INFO_MAPPER[type]
}
