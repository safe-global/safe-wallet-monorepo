import { Action } from '@reduxjs/toolkit'
import { MiddlewareAPI, Dispatch } from 'redux'

export interface ActionWithPayload extends Action<string> {
  payload?: unknown
}

export interface Strategy<TState, TStore extends MiddlewareAPI<Dispatch, TState> = MiddlewareAPI<Dispatch, TState>> {
  execute(store: TStore, action: ActionWithPayload, prevState: TState): void
}
