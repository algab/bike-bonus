import React, { Component } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AppLoading } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import { StackActions, NavigationActions } from 'react-navigation';
import * as Font from 'expo-font';

export default class Home extends Component {
    state = {
        isReady: false
    };

    async componentDidMount() {
        await Font.loadAsync({
            Roboto: require('../../../node_modules/native-base/Fonts/Roboto.ttf'),
            Roboto_medium: require('../../../node_modules/native-base/Fonts/Roboto_medium.ttf'),
            ...Ionicons.font,
        });
        this.setState({ isReady: true });
        const resetAction = StackActions.reset({
            index: 0,
            actions: [NavigationActions.navigate({ routeName: 'Tabs' })],
        });
        this.props.navigation.dispatch(resetAction);
    }

    render() {
        if (!this.state.isReady) {
            return <AppLoading />;
        }
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        )
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center'
    }
});