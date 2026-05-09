// Initialize all background notification handlers FIRST - must be self-contained, no app dependencies
import '@/src/services/notifications/backgroundHandlers'

// changed to the below syntax, because on my machine I was failing to build
// the release version
// https://github.com/expo/expo/issues/27299#issuecomment-2138722853

import { registerRootComponent } from 'expo'

// import 'expo-router/entry'
import { ExpoRoot } from 'expo-router'

// Must be exported or Fast Refresh won't update the context
export function App() {
  const ctx = require.context('./src/app')
  return <ExpoRoot context={ctx} />
}

registerRootComponent(App)
