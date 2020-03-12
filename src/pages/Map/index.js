import React, { Component } from 'react';
import { Alert, AppState, AsyncStorage, StyleSheet, TouchableOpacity, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons, FontAwesome } from '@expo/vector-icons';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import * as TaskManager from 'expo-task-manager';
import uuid from 'uuid/v4';
import haversine from 'haversine'
import '@firebase/firestore';

import Loader from '../../components/Loader';

import firebase from '../../services/firebase';
import currentPosition from '../../utils/position';

import pinMarker from '../../../assets/marker.png';

const TASK = 'location-task';
const TASK_STORAGE = 'background-location';

export default class Map extends Component {
    state = {
        idRun: '',
        appState: AppState.currentState,
        loading: false,
        loadingButtons: false,
        pressStart: false,
        pressPause: true,
        pressStop: false,
        coords: [],
        watch: null,
        updateMap: true,
        updateMapTimeout: null,
        region: {
            latitude: 0,
            longitude: 0,
            latitudeDelta: 0,
            longitudeDelta: 0
        }
    };

    async componentDidMount() {
        const { status } = await Permissions.askAsync(Permissions.LOCATION);
        if (status !== 'granted') {
            Alert.alert('Aviso', 'Você não deu permissão para acessar o GPS');
        } else {
            const { coords } = await Location.getCurrentPositionAsync({
                enableHighAccuracy: true,
                accuracy: Location.Accuracy.Highest
            });
            AppState.addEventListener('change', this.handleAppStateChange);
            const { latitudeDelta, longitudeDelta } = currentPosition(coords.latitude, coords.accuracy);
            this.setState({
                loadingButtons: true,
                region: {
                    latitude: coords.latitude,
                    longitude: coords.longitude,
                    latitudeDelta: latitudeDelta,
                    longitudeDelta: longitudeDelta
                }
            });
        }
    };

    async componentWillUnmount() {
        AppState.removeEventListener('change', this.handleAppStateChange);
        await AsyncStorage.removeItem(TASK_STORAGE);
    };

    beginRun = async () => {
        await AsyncStorage.setItem(TASK_STORAGE, JSON.stringify([]));
        const { region, idRun } = this.state;
        this.setState({ loading: true });
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
            const timeout = setTimeout(() => {
                this.setState({ updateMap: false });
                Alert.alert('Atenção', 'Iremos parar de atualizar em tempo real.');
            }, 30000);
            this.setState({ updateMapTimeout: timeout });
        }
        this.setState({ pressStart: true, pressPause: false, pressStop: true, loading: false });
        this.watchPosition();
    };

    pauseRun = async () => {
        this.setState({ loading: true });
        const { idRun, watch, updateMapTimeout } = this.state;
        watch.remove();
        clearTimeout(updateMapTimeout);
        await Location.stopLocationUpdatesAsync(TASK);
        await AsyncStorage.setItem(TASK_STORAGE, JSON.stringify([]));
        firebase.firestore().collection('runs').doc(idRun).collection('coords').orderBy('timestamp').get()
            .then(snapshot => {
                const coords = [];
                snapshot.forEach(doc => {
                    coords.push({ latitude: doc.data().latitude, longitude: doc.data().longitude });
                });
                const lastCoord = coords[coords.length - 1];
                this.setState({
                    coords,
                    watch: null,
                    pressStart: false,
                    pressPause: true,
                    loading: false,
                    updateMapTimeout: null,
                    region: {
                        latitude: lastCoord.latitude,
                        longitude: lastCoord.longitude,
                        latitudeDelta: 0,
                        longitudeDelta: 0
                    }
                });
            });
    };

    stopRun = async () => {
        this.setState({ loading: true });
        const { idRun, watch, updateMapTimeout } = this.state;
        if (watch !== null) {
            watch.remove();
        }
        if (updateMapTimeout !== null) {
            clearTimeout(updateMapTimeout);
        }
        if (await Location.hasStartedLocationUpdatesAsync(TASK)) {
            await Location.stopLocationUpdatesAsync(TASK);
        }
        await AsyncStorage.setItem(TASK_STORAGE, JSON.stringify([]));
        await firebase.firestore().collection('runs').doc(idRun).update({ end: new Date().getTime() });
        firebase.firestore().collection('runs').doc(idRun).collection('coords').orderBy('timestamp').get()
            .then(async snapshot => {
                const coords = [];
                snapshot.forEach(doc => {
                    coords.push({ latitude: doc.data().latitude, longitude: doc.data().longitude });
                });
                const lastCoord = coords[coords.length - 1];
                const km = haversine(coords[0], lastCoord, { unit: 'km' }).toFixed(2);
                await firebase.firestore().collection('runs').doc(idRun).update({ distance: km });
                this.setState({
                    coords: [],
                    watch: null,
                    updateMap: true,
                    pressStart: false,
                    pressPause: true,
                    pressStop: false,
                    loading: false,
                    updateMapTimeout: null,
                    idRun: '',
                    region: {
                        latitude: lastCoord.latitude,
                        longitude: lastCoord.longitude,
                        latitudeDelta: 0,
                        longitudeDelta: 0
                    }
                });
            });
    };

    watchPosition = async () => {
        const position = await Location.watchPositionAsync({
            accuracy: Location.Accuracy.Highest,
            timeInterval: 500,
            distanceInterval: 10,
        }, async (location) => this.savePosition(location));
        await Location.startLocationUpdatesAsync(TASK, {
            accuracy: Location.Accuracy.Highest,
            timeInterval: 100,
            distanceInterval: 0
        });
        this.setState({ watch: position });
    };

    savePosition = async (location) => {
        const { idRun, updateMap } = this.state;
        const { coords } = location;
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
            timestamp: location.timestamp
        });
    };

    handleAppStateChange = async (nextAppState) => {
        const { appState, idRun } = this.state;
        if (appState.match(/inactive|background/) && nextAppState === 'active') {
            this.setState({ loading: true });
            const data = JSON.parse(await AsyncStorage.getItem(TASK_STORAGE));
            if (data) {
                for (let i = 0; i < data.length; i++) {
                    firebase.firestore().collection('runs').doc(idRun).collection('coords').add(data[i]);
                }
                await AsyncStorage.setItem(TASK_STORAGE, JSON.stringify([]));
            }
        }
        this.setState({ appState: nextAppState, loading: false });
    };

    render() {
        const { region, coords, loading, loadingButtons } = this.state;
        return (
            <View style={styles.container}>
                <Loader loading={loading} />
                <MapView
                    style={styles.mapStyle}
                    region={region}
                    maxZoomLevel={17}
                    loadingEnabled
                >
                    <Polyline coordinates={coords} strokeWidth={3} strokeColor="#4C4CFF" />
                    <Marker coordinate={region} image={pinMarker} />
                </MapView>
                {
                    loadingButtons && (
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
                    )
                }
            </View>
        )
    }
};

TaskManager.defineTask(TASK, async ({ data }) => {
    const { locations } = data;
    let coords = JSON.parse(await AsyncStorage.getItem(TASK_STORAGE));
    for (let i = 0; i < locations[i].length; i++) {
        coords.push({
            latitude: locations[i].coords.latitude,
            longitude: locations[i].coords.longitude,
            timestamp: locations[i].timestamp,
        });
    }
    await AsyncStorage.setItem(TASK_STORAGE, JSON.stringify(coords));
});

const styles = StyleSheet.create({
    container: {
        flex: 1,
        alignItems: 'center',
        position: 'relative'
    },
    mapStyle: {
        width: '100%',
        height: '100%',
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
        bottom: 50,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: 50,
        marginRight: 20
    },
});
