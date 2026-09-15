import type { HandleResponseHook } from '@safe-global/store/gateway/cgwClient'
import type { RootState } from '@/store/index'
import { isElevationRequiredError } from '../utils/elevation'
import { saveStepUpTrip, toReplayableRequest } from '../utils/stepUpReplay'
import { selectStepUpPhase, stepUpLeaving } from './stepUpSlice'

/**
 * Sits on the gateway client rather than in the places that call a gated
 * endpoint, so a newly gated route starts the step-up without a frontend change.
 * The request is held open on purpose: the browser is leaving for the challenge,
 * and a caller that never hears back has nothing to show.
 */
export const stepUpResponseHook: HandleResponseHook = (_response, _url, { api, args, error }) => {
  if (!isElevationRequiredError(error)) return

  // The replayed request being rejected again means the user never verified.
  // It has to settle, or the replay would start another trip, without end.
  if (selectStepUpPhase(api.getState() as RootState) === 'returning') return

  saveStepUpTrip(toReplayableRequest(api.endpoint, args))
  api.dispatch(stepUpLeaving())

  return new Promise<void>(() => {})
}
