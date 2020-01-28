import * as firebase from 'firebase';

const config = {
    apiKey: "AIzaSyBdt4ve0bH535W4n3E6_EMmw4gQM3NWi84",
    authDomain: "bike-firebase-35c3f.firebaseapp.com",
    databaseURL: "https://bike-firebase-35c3f.firebaseio.com",
    projectId: "bike-firebase-35c3f",
    storageBucket: "bike-firebase-35c3f.appspot.com",
}

const connection = firebase.initializeApp(config);

export default connection;
