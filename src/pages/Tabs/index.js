import React from 'react';
import { createAppContainer } from 'react-navigation';
import { createBottomTabNavigator } from 'react-navigation-tabs';
import { Ionicons, MaterialIcons } from '@expo/vector-icons';

import Map from '../Map';
import History from '../History';

const Tabs = createAppContainer(
    createBottomTabNavigator(
        {
            Map: {
                screen: Map,
                navigationOptions: {
                    tabBarLabel: 'Home',
                    tabBarIcon: ({ focused }) => (
                        <Ionicons name="md-map" size={25} color={focused ? '#4C4CFF' : '#A9A9A9'} />
                    )
                },
            },
            History: {
                screen: History,
                navigationOptions: {
                    tabBarLabel: 'Histórico',
                    tabBarIcon: ({ focused }) => (
                        <MaterialIcons name="history" size={25} color={focused ? '#4C4CFF' : '#A9A9A9'} />
                    )
                },
            },
        },
        {
            tabBarOptions: {
                activeTintColor: '#4C4CFF',
            },
        },
    ),
);

export default Tabs;
