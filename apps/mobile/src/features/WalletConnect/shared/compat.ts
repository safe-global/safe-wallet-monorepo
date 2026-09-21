// Side-effect import that polyfills Node-style globals needed by the
// WalletConnect SDK family on React Native. Must be imported exactly once,
// first in src/platform/polyfills.ts, and never from anywhere else.
import '@walletconnect/react-native-compat'
