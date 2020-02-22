import React, { Component } from 'react';
import { ActivityIndicator, Dimensions, StyleSheet, View } from 'react-native';
import MapView, { Marker, Polyline } from 'react-native-maps';
import '@firebase/firestore';

import firebase from '../../services/firebase';

import pinStart from '../../../assets/marker.png';
import pinFinish from '../../../assets/finish.png';

export default class Way extends Component {
    state = {
        coords: [],
        region: {}
    };

    async componentDidMount() {
        const { route } = this.props;
        firebase.firestore().collection('runs').doc(route.params.id)
            .collection('coords').orderBy('timestamp').get()
            .then(snapshot => {
                const coords = [];
                snapshot.forEach(doc => {
                    coords.push({ latitude: doc.data().latitude, longitude: doc.data().longitude });
                });
                const region = {
                    latitude: coords[0].latitude,
                    longitude: coords[0].longitude,
                    latitudeDelta: 0,
                    longitudeDelta: 0
                };
                this.setState({ coords, region });
            });
    }

    render() {
        const { coords, region } = this.state;
        if (coords.length === 0) {
            return (
                <View style={styles.container}>
                    <ActivityIndicator size="large" color="#0000ff" />
                </View>
            )
        } else {
            return (
                <View style={styles.container}>
                    <MapView
                        style={styles.mapStyle}
                        region={region}
                        maxZoomLevel={18}
                        loadingEnabled
                    >
                        <Polyline coordinates={coords} strokeWidth={3} strokeColor="#4C4CFF" />
                        <Marker coordinate={region} image={pinStart} />
                        <Marker coordinate={coords[coords.length - 1]} image={pinFinish} />
                    </MapView>
                </View>
            )
        }
    }
};

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center'
    },
    mapStyle: {
        width: Dimensions.get('window').width,
        height: '100%',
    }
});
