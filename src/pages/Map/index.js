import React, { Component } from 'react';
import { Alert, StyleSheet, View, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import uuid from 'uuid/v4';

import '@firebase/firestore';

import firebase from '../../services/firebase';
import currentPosition from '../../utils/position';

export default class Map extends Component {
    constructor(props) {
        super(props);
        this.state = {
            idRun: '',
            pressStart: false,
            pressPause: true,
            pressStop: false,
            coords: [],
            watch: null,
            updateMap: true,
            region: {
                latitude: 0,
                longitude: 0,
                latitudeDelta: 0,
                longitudeDelta: 0
            }
        }
    }

    async componentDidMount() {
        let { status } = await Permissions.askAsync(Permissions.LOCATION);
        if (status !== 'granted') {
            Alert.alert('Aviso', 'Você não deu permissão para acessar o GPS');
        } else {
            const { coords } = await Location.getCurrentPositionAsync({
                enableHighAccuracy: true,
                accuracy: Location.Accuracy.Highest
            });
            const { latitudeDelta, longitudeDelta } = currentPosition(coords.latitude, coords.accuracy);
            this.setState({
                region: {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    latitudeDelta: latitudeDelta,
                    longitudeDelta: longitudeDelta
                }
            });
        }
    };

    beginRun = async () => {
        const { region, idRun } = this.state;
        this.setState({ pressStart: true, pressPause: false, pressStop: true });
        if (idRun === '') {
            const id = uuid();
            this.setState({
                idRun: id,
                coords: [{
                    latitude: region.latitude,
                    longitude: region.longitude
                }]
            });
            await firebase.firestore().collection('runs').doc(id).set({
                begin: new Date().getTime(),
                end: null
            });
            await firebase.firestore().collection('runs').doc(id).collection('coords').add({
                latitude: region.latitude,
                longitude: region.longitude,
                timestamp: new Date().getTime()
            });
            setTimeout(() => {
                this.setState({ updateMap: false });
                Alert.alert('Atenção', 'Iremos parar de atualizar em tempo real.');
            }, 30000);
        }
        this.watchPosition();
    };

    pauseRun = async () => {
        this.setState({ pressStart: false, pressPause: true });
        const { watch, idRun } = this.state;
        watch.remove();
        firebase.firestore().collection('runs').doc(idRun).collection('coords').orderBy('timestamp').get()
            .then(snapshot => {
                const coords = [];
                snapshot.forEach(doc => {
                    coords.push({ latitude: doc.data().latitude, longitude: doc.data().longitude });
                });
                const lastCoord = coords[coords.length - 1];
                const { latitudeDelta, longitudeDelta } = currentPosition(lastCoord.latitude, 0);
                this.setState({
                    watch: null, coords, region: {
                        latitude: lastCoord.latitude,
                        longitude: lastCoord.longitude,
                        latitudeDelta: latitudeDelta,
                        longitudeDelta: longitudeDelta
                    }
                });
            });
    };

    stopRun = async () => {
        this.setState({ pressStart: false, pressPause: true, pressStop: false });
        const { idRun, watch } = this.state;
        if (watch !== null) {
            watch.remove();
        }
        await firebase.firestore().collection('runs').doc(idRun).update({ end: new Date().getTime() });
        this.setState({ updateMap: true, idRun: '', coords: [], watch: null });
    };

    watchPosition = async () => {
        const position = await Location.watchPositionAsync({
            accuracy: Location.Accuracy.Highest,
            timeInterval: 2000,
            distanceInterval: 0,
        }, async ({ coords }) => {
            this.savePosition(coords);
        });
        this.setState({ watch: position });
    };

    savePosition = async (coords) => {
        const { idRun, updateMap } = this.state;
        if (updateMap) {
            const { latitudeDelta, longitudeDelta } = currentPosition(coords.latitude, coords.accuracy);
            this.setState(prevState => {
                return {
                    ...prevState,
                    region: {
                        latitude: coords.latitude,
                        longitude: coords.longitude,
                        latitudeDelta: latitudeDelta,
                        longitudeDelta: longitudeDelta
                    },
                    coords: prevState.coords.concat({
                        latitude: coords.latitude,
                        longitude: coords.longitude
                    }),
                };
            });
        }
        firebase.firestore().collection('runs').doc(idRun).collection('coords').add({
            latitude: coords.latitude,
            longitude: coords.longitude,
            timestamp: new Date().getTime()
        });
    };

    render() {
        const { region, coords } = this.state;
        return (
            <View style={styles.container}>
                <MapView
                    style={styles.mapStyle}
                    region={region}
                    maxZoomLevel={16}
                    loadingEnabled
                >
                    <Polyline coordinates={coords} strokeWidth={3} strokeColor="#4C4CFF" />
                    <Marker coordinate={region} />
                </MapView>
                <View style={styles.viewButtons}>
                    {
                        !this.state.pressStart && (
                            <TouchableOpacity
                                style={[styles.buttonFloat, { backgroundColor: '#4C4CFF' }]}
                                onPress={this.beginRun}
                            >
                                <Ionicons name="md-play" size={22} color="#FFF" />
                            </TouchableOpacity>
                        )
                    }
                    {
                        !this.state.pressPause && (
                            <TouchableOpacity
                                style={[styles.buttonFloat, { backgroundColor: '#00B200' }]}
                                onPress={this.pauseRun}
                            >
                                <FontAwesome name="pause" size={20} color="#FFF" />
                            </TouchableOpacity>
                        )
                    }
                    {
                        this.state.pressStop && (
                            <TouchableOpacity
                                style={[styles.buttonFloat, { backgroundColor: '#E50000' }]}
                                onPress={this.stopRun}
                            >
                                <FontAwesome name="stop" size={20} color="#FFF" />
                            </TouchableOpacity>
                        )
                    }
                </View>
            </View>
        )
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        position: 'relative'
    },
    mapStyle: {
        width: Dimensions.get('window').width,
        height: Dimensions.get('window').height - 70,
    },
    viewButtons: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        flexDirection: 'row'
    },
    buttonFloat: {
        width: 50,
        height: 50,
        bottom: 40,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 50,
        marginRight: 20
    },
});
