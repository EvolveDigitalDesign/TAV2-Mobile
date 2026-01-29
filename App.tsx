/**
 * TAV2 Mobile App
 * Main entry point for the application
 */

import React from 'react';
import {SafeAreaProvider} from 'react-native-safe-area-context';
import {AuthProvider} from './src/context/AuthContext';
import {NetworkProvider} from './src/context/NetworkContext';
import {OfflineProvider} from './src/context/OfflineContext';
import AppNavigator from './src/navigation/AppNavigator';

function App(): React.JSX.Element {
  return (
    <SafeAreaProvider>
      <NetworkProvider>
        <AuthProvider>
          <OfflineProvider>
            <AppNavigator />
          </OfflineProvider>
        </AuthProvider>
      </NetworkProvider>
    </SafeAreaProvider>
  );
}

export default App;
