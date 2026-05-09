import { AnyAction } from '@reduxjs/toolkit'
import { MiddlewareAPI, Dispatch } from 'redux'
import { Strategy } from '@/src/store/utils/strategy/Strategy'

export class StrategyManager<TState, TStore extends MiddlewareAPI<Dispatch, TState> = MiddlewareAPI<Dispatch, TState>> {
  private strategies: Map<string, Strategy<TState, TStore>>

  constructor() {
    this.strategies = new Map()
  }

  protected registerStrategy(actionType: string, strategy: Strategy<TState, TStore>): void {
    this.strategies.set(actionType, strategy)
  }

  public executeStrategy(store: TStore, action: AnyAction, prevState: TState): void {
    const strategy = this.strategies.get(action.type)
    if (strategy) {
      strategy.execute(store, action, prevState)
    }
  }
}
