export const enum SecuritySeverity {
  NONE,
  LOW,
  MEDIUM,
  HIGH,
  CRITICAL,
}

export type SecurityResponse<Res> =
  | {
      severity: SecuritySeverity
      payload: Res
    }
  | {
      severity: SecuritySeverity.NONE
      payload?: never
    }

export interface SecurityModule<Req, Res> {
  scanTransaction(request: Req): Promise<SecurityResponse<Res>> | SecurityResponse<Res>
}
