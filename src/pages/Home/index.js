import React, { Component } from 'react';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { CommonActions } from '@react-navigation/native';

export default class Home extends Component {
    async componentDidMount() {
        this.props.navigation.dispatch(CommonActions.reset({
            index: 0,
            routes: [{ name: 'Tabs' }]
        }));
    }

    render() {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color="#0000ff" />
            </View>
        )
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center'
    }
});