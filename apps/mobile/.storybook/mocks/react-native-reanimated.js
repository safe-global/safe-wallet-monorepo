/* eslint-disable */
// Standalone mock for react-native-reanimated in Storybook
// Based on the official mock but self-contained

const NOOP = () => {};
const NOOP_FACTORY = () => NOOP;
const ID = (t) => t;
const IMMEDIATE_CALLBACK_INVOCATION = (callback) => callback();

// Mock hooks
const hook = {
  useAnimatedProps: IMMEDIATE_CALLBACK_INVOCATION,
  useEvent: () => NOOP,
  useSharedValue: (init) => {
    const value = { value: init };
    return new Proxy(value, {
      get(target, prop) {
        if (prop === 'value') return target.value;
        if (prop === 'get') return () => target.value;
        if (prop === 'set') {
          return (newValue) => {
            if (typeof newValue === 'function') {
              target.value = newValue(target.value);
            } else {
              target.value = newValue;
            }
          };
        }
      },
      set(target, prop, newValue) {
        if (prop === 'value') {
          target.value = newValue;
          return true;
        }
        return false;
      },
    });
  },
  useAnimatedStyle: IMMEDIATE_CALLBACK_INVOCATION,
  useAnimatedReaction: NOOP,
  useAnimatedRef: () => ({ current: null }),
  useAnimatedScrollHandler: NOOP_FACTORY,
  useDerivedValue: (processor) => {
    const result = processor();
    return { value: result, get: () => result };
  },
  useAnimatedSensor: () => ({
    sensor: { value: { x: 0, y: 0, z: 0 } },
    unregister: NOOP,
    isAvailable: false,
    config: { interval: 0 },
  }),
  useAnimatedKeyboard: () => ({ height: 0, state: 0 }),
  useScrollViewOffset: () => ({ value: 0 }),
  useScrollOffset: () => ({ value: 0 }),
};

// Mock animation functions
const animation = {
  cancelAnimation: NOOP,
  withDecay: (_config, callback) => {
    callback?.(true);
    return 0;
  },
  withDelay: (_delayMs, nextAnimation) => nextAnimation,
  withRepeat: ID,
  withSequence: () => 0,
  withSpring: (toValue, _config, callback) => {
    callback?.(true);
    return toValue;
  },
  withTiming: (toValue, _config, callback) => {
    callback?.(true);
    return toValue;
  },
};

// Mock utilities
const utilities = {
  runOnUI: (fn) => (...args) => fn(...args),
  runOnJS: (fn) => (...args) => fn(...args),
  interpolate: (value) => value,
  interpolateColor: (value) => value,
  Easing: {
    linear: ID,
    ease: ID,
    quad: ID,
    cubic: ID,
  },
  Extrapolate: {
    EXTEND: 'extend',
    CLAMP: 'clamp',
    IDENTITY: 'identity',
  },
};

// Animated components (passthrough to regular React Native components)
const { Animated, View, Text, ScrollView, Image } = require('react-native');

const AnimatedView = View;
const AnimatedText = Text;
const AnimatedScrollView = ScrollView;
const AnimatedImage = Image;

// Create animated component wrapper
const createAnimatedComponent = (Component) => Component;

// Export everything
module.exports = {
  ...hook,
  ...animation,
  ...utilities,
  createAnimatedComponent,
  default: {
    View: AnimatedView,
    Text: AnimatedText,
    ScrollView: AnimatedScrollView,
    Image: AnimatedImage,
    createAnimatedComponent,
    ...hook,
    ...animation,
    ...utilities,
  },
  // Animated components
  View: AnimatedView,
  Text: AnimatedText,
  ScrollView: AnimatedScrollView,
  Image: AnimatedImage,
  __esModule: true,
};
