import { PLAN_STATUS_MOCKS, type PlanStatusPreview } from './mocks'
import type { PlanStatus } from './types'

// Dev switch to preview chip states. Flip to any key of PLAN_STATUS_MOCKS. Delete when CGW plan-status is wired.
const DEV_PREVIEW: PlanStatusPreview = 'starterWithin'

export const usePlanStatus = (): PlanStatus => PLAN_STATUS_MOCKS[DEV_PREVIEW]
