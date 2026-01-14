/* eslint-disable */
// Mock react-refresh for Storybook to prevent production bundle errors
// Provides no-op implementations of all required functions

const noop = () => {};

module.exports = {
  injectIntoGlobalHook: noop,
  createSignatureFunctionForTransform: noop,
  isLikelyComponentType: () => false,
  getFamilyByType: () => null,
  getFamilyByID: () => null,
  findAffectedHostInstances: noop,
  collectCustomHooksForSignature: noop,
  hasUnrecoverableErrors: () => false,
  setSignature: noop,
  performReactRefresh: noop,
  register: noop,
  __esModule: true,
  default: {
    injectIntoGlobalHook: noop,
    createSignatureFunctionForTransform: noop,
    isLikelyComponentType: () => false,
    getFamilyByType: () => null,
    getFamilyByID: () => null,
    findAffectedHostInstances: noop,
    collectCustomHooksForSignature: noop,
    hasUnrecoverableErrors: () => false,
    setSignature: noop,
    performReactRefresh: noop,
    register: noop,
  },
};
