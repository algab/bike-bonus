import React from 'react';
import { View, Text, StyleSheet } from 'react-native';

const Header = () => (
    <View style={styles.header}>
        <Text style={styles.titleHeader}>Histórico</Text>
    </View>
);

const styles = StyleSheet.create({
    header: {
        height: 60,
        backgroundColor: '#4C4CFF',
        justifyContent: 'center'
    },
    titleHeader: {
        color: '#fff',
        fontSize: 20,
        marginLeft: 10
    }
});

export default Header;