import { registerRootComponent } from 'expo';

// Registered before App so it filters the Expo Go push-usage warning that
// expo-notifications emits on import. See the module for details.
import './src/notifications/suppressExpoGoPushWarning';
import App from './App';

// registerRootComponent calls AppRegistry.registerComponent('main', () => App);
// It also ensures that whether you load the app in Expo Go or in a native build,
// the environment is set up appropriately
registerRootComponent(App);
