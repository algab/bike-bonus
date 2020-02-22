import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import Map from '../Map';
import History from '../History';

const Tab = createBottomTabNavigator();

const Tabs = () => (
    <Tab.Navigator tabBarOptions={{ activeTintColor: '#4C4CFF' }}>
        <Tab.Screen
            name="Map"
            component={Map}
            options={{
                title: 'Mapa',
                tabBarIcon: ({ focused }) => (
                    <Ionicons name="md-map" size={25} color={focused ? '#4C4CFF' : '#A9A9A9'} />
                )
            }}
        />
        <Tab.Screen
            name="History"
            component={History}
            options={{
                title: 'Histórico',
                tabBarIcon: ({ focused }) => (
                    <MaterialIcons name="history" size={25} color={focused ? '#4C4CFF' : '#A9A9A9'} />
                )
            }}
        />
    </Tab.Navigator>
);

export default Tabs;
