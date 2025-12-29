module.exports = {
  preset: 'react-native',
  moduleNameMapper: {
    '\\.(jpg|jpeg|png|gif|eot|otf|webp|svg|ttf|woff|woff2)$': '<rootDir>/__mocks__/fileMock.js',
  },
  transformIgnorePatterns: [
    'node_modules/(?!(react-native|@react-native|@react-navigation|@rneui|@stripe|@react-native-firebase|react-native-ratings|react-native-vector-icons)/)'
  ],
  setupFiles: ['<rootDir>/jest/setup.js'],
};