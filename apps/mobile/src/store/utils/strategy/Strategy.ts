import { AnyAction } from '@reduxjs/toolkit'
import { MiddlewareAPI, Dispatch } from 'redux'

export interface Strategy<TState, TStore extends MiddlewareAPI<Dispatch, TState> = MiddlewareAPI<Dispatch, TState>> {
  execute(store: TStore, action: AnyAction, prevState: TState): void
}
