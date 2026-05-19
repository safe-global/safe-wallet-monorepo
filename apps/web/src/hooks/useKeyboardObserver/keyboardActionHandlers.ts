import type { AppDispatch } from '@/store'
import { toggleGlobalSearch } from '@/features/global-search/store'
import { KeyboardAction } from './keyboardListeners'

type ActionHandler = (dispatch: AppDispatch) => void

export const actionHandlers: Record<KeyboardAction, ActionHandler> = {
  [KeyboardAction.GLOBAL_SEARCH]: (dispatch) => dispatch(toggleGlobalSearch()),
}
