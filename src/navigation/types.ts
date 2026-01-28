/**
 * Navigation Types
 * Type definitions for React Navigation
 */

import {RootStackParamList, AuthStackParamList, MainTabParamList} from './AppNavigator';

declare global {
  namespace ReactNavigation {
    interface RootParamList extends RootStackParamList {}
  }
}

export type {RootStackParamList, AuthStackParamList, MainTabParamList};
