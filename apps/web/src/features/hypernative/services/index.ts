// Lightweight barrel: only static ABI data may be re-exported here — heavy
// services must go through useLoadFeature() (see eslint no-restricted-imports).
export { default as HypernativeGuardAbi } from './HypernativeGuard.abi.json'
export { default as HypernativeGuardV2Abi } from './HypernativeGuardV2.abi.json'
