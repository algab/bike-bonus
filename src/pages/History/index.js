import React, { Component } from 'react';
import { ScrollView, View, Text, StyleSheet } from 'react-native';
import SkeletonContent from "react-native-skeleton-content";
import { ListItem, Header } from 'react-native-elements';
import { format } from 'date-fns';
import '@firebase/firestore';

import firebase from '../../services/firebase';

export default class History extends Component {
    state = {
        runs: []
    };

    async componentDidMount() {
        firebase.firestore().collection('runs').orderBy('begin').get()
            .then(snapshot => {
                const runs = [];
                snapshot.forEach(doc => {
                    if (doc.data().end !== null) {
                        runs.push({ ...doc.data(), id: doc.id });
                    }
                });
                this.setState({ runs });
            });
    }

    listRuns = () => {
        const { runs } = this.state;
        const { navigation } = this.props;
        if (runs.length === 0) {
            return this.skeleton();
        } else {
            return runs.map(data => (
                <ListItem
                    key={data.id}
                    leftAvatar={{
                        size: 55,
                        source: require('../../../assets/map.png'),
                        overlayContainerStyle: { backgroundColor: 'transparent' },
                    }}
                    title={format(data.begin, 'dd/MM/yyyy')}
                    subtitle={
                        <View>
                            <Text style={styles.textOption}>
                                Hora da Partida: {format(data.begin, 'HH:mm')}
                            </Text>
                            <Text style={styles.textOption}>
                                Hora da Chegada: {format(data.end, 'HH:mm')}
                            </Text>
                            <Text style={styles.textOption}>
                                Distância: {data.distance} KM
                            </Text>
                        </View>
                    }
                    onPress={() => navigation.navigate('Way', { id: data.id })}
                />
            ))
        }
    };

    skeleton = () => {        
        return Array.from({ length: 10 }).map((_, i) => (
            <View key={i} style={{ flexDirection: 'row', alignItems: 'center', marginTop: 10 }}>
                <SkeletonContent
                    containerStyle={{ marginLeft: 10 }}
                    animationDirection="horizontalLeft"
                    layout={[{ width: 70, height: 70, borderRadius: 50 }]}
                    isLoading={true}
                />
                <SkeletonContent
                    containerStyle={{ marginLeft: 5 }}
                    animationDirection="horizontalLeft"
                    layout={[
                        { width: 150, height: 15, marginBottom: 5 },
                        { width: 100, height: 10, marginBottom: 5 },
                        { width: 100, height: 10, marginBottom: 5 },
                        { width: 100, height: 10, marginBottom: 5 }
                    ]}
                    isLoading={true}
                />
            </View>
        ))
    };

    render() {
        return (
            <>
                <Header
                    placement="left"
                    leftComponent={{ text: 'Histórico', style: styles.titleHeader }}
                    backgroundColor="#4C4CFF"
                />
                <ScrollView style={styles.containerScroll}>
                    {this.listRuns()}
                </ScrollView>
            </>
        )
    }
};

const styles = StyleSheet.create({
    containerScroll: {
        flex: 1,
        backgroundColor: '#fff'
    },
    titleHeader: {
        color: '#fff',
        fontSize: 20,
        fontWeight: '600'
    },
    textOption: {
        color: 'gray',
        fontSize: 12
    }
});