/**
 * App Navigator
 * Main navigation structure for the app
 * Compatible with React Navigation best practices
 */

import React from 'react';
import {View, StyleSheet} from 'react-native';
import {NavigationContainer} from '@react-navigation/native';
import {createNativeStackNavigator} from '@react-navigation/native-stack';
import {createBottomTabNavigator} from '@react-navigation/bottom-tabs';
import {useSafeAreaInsets} from 'react-native-safe-area-context';
import {useAuth} from '../context/AuthContext';

// Import screens
import SignInScreen from '../screens/auth/SignInScreen';
import DashboardScreen from '../screens/dashboard/DashboardScreen';
import ProfileScreen from '../screens/profile/ProfileScreen';

// Import offline components
import {NetworkStatusBar} from '../components/offline';

// Navigation types
export type RootStackParamList = {
  Auth: undefined;
  Main: undefined;
};

export type AuthStackParamList = {
  SignIn: undefined;
  SignUp?: undefined;
};

export type MainTabParamList = {
  Dashboard: undefined;
  Projects: undefined;
  DailyRecords: undefined;
  Profile: undefined;
};

const Stack = createNativeStackNavigator<RootStackParamList>();
const AuthStack = createNativeStackNavigator<AuthStackParamList>();
const Tab = createBottomTabNavigator<MainTabParamList>();

// Auth Stack Navigator
function AuthNavigator() {
  return (
    <AuthStack.Navigator
      screenOptions={{
        headerShown: false,
      }}>
      <AuthStack.Screen name="SignIn" component={SignInScreen} />
    </AuthStack.Navigator>
  );
}

// Main Tab Navigator
function MainNavigator() {
  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: '#3b82f6',
        tabBarInactiveTintColor: '#6b7280',
      }}>
      <Tab.Screen
        name="Dashboard"
        component={DashboardScreen}
        options={{
          title: 'Dashboard',
        }}
      />
      <Tab.Screen
        name="Profile"
        component={ProfileScreen}
        options={{
          title: 'Profile',
        }}
      />
      {/* Additional tabs will be added in Phase 6 */}
    </Tab.Navigator>
  );
}

// Root Navigator
export default function AppNavigator() {
  const {authState} = useAuth();
  const isAuthenticated = authState.authenticated === true;
  const insets = useSafeAreaInsets();

  return (
    <NavigationContainer>
      <View style={styles.container}>
        <Stack.Navigator screenOptions={{headerShown: false}}>
          {isAuthenticated ? (
            <Stack.Screen name="Main" component={MainNavigator} />
          ) : (
            <Stack.Screen name="Auth" component={AuthNavigator} />
          )}
        </Stack.Navigator>
        
        {/* Network Status Bar - shows when offline */}
        {isAuthenticated && (
          <View style={[styles.networkBarContainer, {top: insets.top}]}>
            <NetworkStatusBar showWhenOnline={false} />
          </View>
        )}
      </View>
    </NavigationContainer>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  networkBarContainer: {
    position: 'absolute',
    left: 0,
    right: 0,
    zIndex: 1000,
  },
});
