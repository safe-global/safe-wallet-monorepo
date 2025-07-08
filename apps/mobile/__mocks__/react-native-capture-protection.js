/* eslint-disable */
// Manual mock for react-native-capture-protection
const mockPrevent = jest.fn()
const mockAllow = jest.fn()

const CaptureProtection = {
  prevent: mockPrevent,
  allow: mockAllow,
}

// Export the mock object
module.exports = {
  CaptureProtection,
  // Also export the mock functions so tests can access them
  __mockPrevent: mockPrevent,
  __mockAllow: mockAllow,
}
