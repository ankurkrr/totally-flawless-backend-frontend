/**
 * @format
 */

if (__DEV__) {
  require('expo-dev-client');
}

import {AppRegistry} from 'react-native';
import App from './App';
import {name as appName} from './app.json';
import { LogBox } from 'react-native';

LogBox.ignoreLogs(['Warning: ...']);
LogBox.ignoreAllLogs(true);

AppRegistry.registerComponent(appName, () => App);
