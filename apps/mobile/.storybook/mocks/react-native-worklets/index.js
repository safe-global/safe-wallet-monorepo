/* eslint-disable */
// Mock for react-native-worklets in Storybook web environment
// This prevents "Failed to create a worklet" errors

// Mock serializable wrapper - needs to return an object with get/set methods
const createSerializable = (initialValue) => {
  let value = initialValue
  return {
    get: () => value,
    set: (newValue) => {
      value = newValue
    },
    value: value,
  }
}

// Provide comprehensive worklets API that reanimated expects
const workletsMock = {
  initializeRuntime: () => {},
  createWorklet: (fn) => fn,
  createSerializable: createSerializable,
  makeShareableClone: (value) => value,
  makeShareable: (value) => value,
  runOnUI: (fn) => (...args) => fn(...args),
  runOnJS: (fn) => (...args) => fn(...args),
  createContext: () => ({}),
  useSharedValue: (initialValue) => ({ value: initialValue }),
  version: '0.5.0',
  __esModule: true,
}

// Add default export
workletsMock.default = workletsMock

module.exports = workletsMock
