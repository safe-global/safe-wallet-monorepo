import { CommonActions } from '@react-navigation/native'
import { router } from 'expo-router'

interface NavigationWithState {
  getState(): { routes: Array<{ name: string }> } | undefined
  dispatch(action: ReturnType<typeof CommonActions.reset>): void
}

/**
 * Navigate back to the confirm-transaction screen, cleaning up stale
 * send-flow screens when present. If the navigation stack contains
 * the (send) group, we reset to [(tabs), confirm-transaction] so
 * that "back" goes to the dashboard instead of the completed send form.
 */
export function dismissToConfirmTransaction(
  navigation: NavigationWithState,
  txId: string,
) {
  const state = navigation.getState()
  const hasSendFlow = state?.routes.some((r) => r.name === '(send)') ?? false

  if (hasSendFlow) {
    navigation.dispatch(
      CommonActions.reset({
        index: 1,
        routes: [{ name: '(tabs)' }, { name: 'confirm-transaction', params: { txId } }],
      }),
    )
  } else {
    router.dismissTo({
      pathname: '/confirm-transaction',
      params: { txId },
    })
  }
}
