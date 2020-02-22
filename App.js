import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';

import Home from './src/pages/Home';
import Tabs from './src/pages/Tabs';
import Way from './src/pages/Way';

console.disableYellowBox = true;

const Stack = createStackNavigator();

const App = () => (
  <NavigationContainer>
    <Stack.Navigator initialRouteName="Home">
      <Stack.Screen name="Home" component={Home} options={{ headerShown: false }} />
      <Stack.Screen name="Tabs" component={Tabs} options={{ headerShown: false }} />
      <Stack.Screen name="Way" component={Way} options={{ headerShown: false }} />
    </Stack.Navigator>
  </NavigationContainer>
);

export default App;
