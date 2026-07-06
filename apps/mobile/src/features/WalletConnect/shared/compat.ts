// Side-effect import that polyfills Node-style globals needed by the
// WalletConnect SDK family on React Native. Must be imported exactly once,
// as the first import of the app entry (index.js), and never from anywhere else.
import '@walletconnect/react-native-compat'
