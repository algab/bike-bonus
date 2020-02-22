import React, { Component } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { AppLoading } from 'expo';
import { Ionicons } from '@expo/vector-icons';
import * as Font from 'expo-font';
import { CommonActions } from '@react-navigation/native';

export default class Home extends Component {
    state = {
        isReady: false
    };

    async componentDidMount() {
        /*await Font.loadAsync({
            Roboto: require('native-base/Fonts/Roboto.ttf'),
            Roboto_medium: require('native-base/Fonts/Roboto_medium.ttf'),
            ...Ionicons.font,
        });*/
        this.setState({ isReady: true });
        setTimeout(() => {
            this.props.navigation.dispatch(CommonActions.reset({
                index: 0,
                routes: [{ name: 'Tabs' }]
            }));
        }, 200);
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