import { MiddlewareAPI, Dispatch } from 'redux'
import { RootState } from '@/src/store'
import { addSafe, removeSafe } from '@/src/store/safesSlice'
import { addDelegate } from '@/src/store/delegatesSlice'
import { toggleAppNotifications } from '@/src/store/notificationsSlice'
import { StrategyManager } from '@/src/store/utils/strategy/StrategyManager'
import {
  AddSafeStrategy,
  RemoveSafeStrategy,
  AddDelegateStrategy,
  ToggleAppNotificationsStrategy,
} from '@/src/store/middleware/notifications/strategies'

export class NotificationStrategyManager extends StrategyManager<RootState, MiddlewareAPI<Dispatch, RootState>> {
  constructor() {
    super()
    this.registerDefaultStrategies()
  }

  private registerDefaultStrategies(): void {
    this.registerStrategy(addSafe.type, new AddSafeStrategy())
    this.registerStrategy(removeSafe.type, new RemoveSafeStrategy())
    this.registerStrategy(addDelegate.type, new AddDelegateStrategy())
    this.registerStrategy(toggleAppNotifications.type, new ToggleAppNotificationsStrategy())
  }
}
