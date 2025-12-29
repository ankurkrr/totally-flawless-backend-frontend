const { NativeModules } = require('react-native');

// Mock RNGestureHandler native module methods expected by react-native-gesture-handler
NativeModules.RNGestureHandlerModule = NativeModules.RNGestureHandlerModule || {
  attachGestureHandler: () => {},
  createGestureHandler: () => {},
  dropGestureHandler: () => {},
  updateGestureHandler: () => {},
};

// Basic mocks for libraries that require native modules
jest.mock('react-native-gesture-handler', () => {
  const View = require('react-native').View;
  return {
    GestureHandlerRootView: View,
    RawButton: View,
    BaseButton: View,
    State: {},
    Swipeable: View,
    DrawerLayout: View,
    gestureHandlerRootHOC: (Comp) => Comp,
    Directions: {},
  };
});

jest.mock('react-native-reanimated', () => {
  const React = require('react');
  const { View, Text, Image } = require('react-native');
  return {
    __esModule: true,
    default: {
      Value: function (v) { return { value: v || 0 }; },
      add: () => {},
      multiply: () => {},
      interpolate: () => {},
      timing: () => ({ start: () => {} }),
      spring: () => ({ start: () => {} }),
    },
    Animated: {
      View,
      Text,
      Image,
    },
    Easing: { in: (v) => v, out: (v) => v },
  };
});

jest.mock('react-native-safe-area-context', () => {
  return {
    SafeAreaProvider: ({ children }) => children,
    SafeAreaView: ({ children }) => children,
    useSafeAreaInsets: () => ({ top: 0, left: 0, right: 0, bottom: 0 }),
  };
});
