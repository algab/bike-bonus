import React, { useState, useEffect } from 'react';
import { Alert, StyleSheet, View, Dimensions, TouchableOpacity, Plataform } from 'react-native';
import MapView, { Marker, Polyline, AnimatedRegion } from 'react-native-maps';
import * as Location from 'expo-location';
import * as Permissions from 'expo-permissions';
import { Ionicons } from '@expo/vector-icons';

import '@firebase/firestore';

import firebase from '../../services/firebase';
import currentPosition from '../../utils/position';

export default function Map() {
    const [press, setPress] = useState(false);
    const [coords, setCoords] = useState([]);
    const [watch, setWatch] = useState();
    const [run, setRun] = useState('');
    const [region, setRegion] = useState({
        latitude: 0,
        longitude: 0,
        latitudeDelta: 0,
        longitudeDelta: 0
    });

    useEffect(() => {
        getPosition();
    }, []);

    const getPosition = async () => {
        let { status } = await Permissions.askAsync(Permissions.LOCATION);
        if (status !== 'granted') {
            Alert.alert('Aviso', 'Você não deu permissão para acessar o GPS');
        } else {
            const { coords } = await Location.getCurrentPositionAsync({
                enableHighAccuracy: true,
                accuracy: Location.Accuracy.Highest
            });
            const { latitudeDelta, longitudeDelta } = currentPosition(coords.latitude, coords.accuracy);
            setRegion({
                latitude: coords.latitude,
                longitude: coords.longitude,
                latitudeDelta: latitudeDelta,
                longitudeDelta: longitudeDelta
            });
        }
    };

    const watchPosition = async () => {
        if (press) {
            setPress(false);
            setCoords([]);
            watch.remove();
            stopRun();
        } else {
            setPress(true);
            beginRun();
            const position = await Location.watchPositionAsync({
                accuracy: Location.Accuracy.Highest,
                timeInterval: 8000,
                distanceInterval: 0,
            }, async ({ coords }) => {
                savePosition(coords);
            });
            setWatch(position);
        }
    };

    const beginRun = async () => {
        const id = String(new Date().getTime());
        setRun(id);
        setCoords(prevCoords => prevCoords.concat({
            latitude: region.latitude,
            longitude: region.longitude
        }));
        await firebase.firestore().collection('run').doc(id).set({
            date: new Date().getTime(),
            begin: new Date().getTime(),
            end: null
        });
        await firebase.firestore().collection('run').doc(id).collection('coords').add({
            latitude: region.latitude,
            longitude: region.longitude,
            timestamp: new Date().getTime()
        });
    };

    const stopRun = async () => {
        await firebase.firestore().collection('run').doc(run).update({
            end: new Date().getTime()
        });
    };

    const savePosition = async (coords) => {
        const id = run;
        const { latitudeDelta, longitudeDelta } = currentPosition(coords.latitude, coords.accuracy);
        setRegion({
            latitude: coords.latitude,
            longitude: coords.longitude,
            latitudeDelta: latitudeDelta,
            longitudeDelta: longitudeDelta
        })
        setCoords(prevCoords => prevCoords.concat({
            latitude: coords.latitude,
            longitude: coords.longitude
        }));    
        await firebase.firestore().collection('run').doc(id).collection('coords').add({
            latitude: coords.latitude,
            longitude: coords.longitude,
            timestamp: new Date().getTime()
        });
    };

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
                onPress={watchPosition}
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

