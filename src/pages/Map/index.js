import React, { Component } from 'react';
import { Alert, StyleSheet, View, Dimensions, TouchableOpacity } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import { Ionicons } from '@expo/vector-icons';
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
            press: false,
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

    watchPosition = async () => {
        const { press, watch } = this.state;
        if (press) {
            watch.remove();
            this.setState({ press: false, coords: [], watch: null });
            this.stopRun();
        } else {
            this.setState({ press: true });
            await this.beginRun();
            setTimeout(() => {
                this.setState({ updateMap: false });
                Alert.alert('Atenção', 'Iremos parar de atualizar em tempo real.');
            }, 30000);
            const position = await Location.watchPositionAsync({
                accuracy: Location.Accuracy.Highest,
                timeInterval: 2000,
                distanceInterval: 0,
            }, async ({ coords }) => {
                this.savePosition(coords);
            });
            this.setState({ watch: position });
        }
    };

    beginRun = async () => {
        const { region } = this.state;
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
    };

    stopRun = async () => {
        const { idRun } = this.state;
        await firebase.firestore().collection('runs').doc(idRun).update({
            end: new Date().getTime()
        });
        this.setState({ updateMap: true });
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
        const { region, coords, press } = this.state;
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
                <TouchableOpacity
                    style={[styles.buttonFloat, { backgroundColor: !press ? '#4C4CFF' : '#B20000' }]}
                    onPress={this.watchPosition}
                >
                    {
                        !press ?
                            (
                                <Ionicons name="md-play" size={25} color="#FFF" />
                            ) :
                            (
                                <Ionicons name="md-stopwatch" size={25} color="#FFF" />
                            )
                    }
                </TouchableOpacity>
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
    buttonFloat: {
        position: 'absolute',
        width: 50,
        height: 50,
        alignItems: 'center',
        justifyContent: 'center',
        bottom: 20,
        borderRadius: 50,
    }
});
