const firebase = require('firebase');


const firebaseConfig = {
  apiKey: "AIzaSyDkwzfmfWuRqHHwAZjCLsgoihvoGMeKEqE",
  authDomain: "hotspotalk.firebaseapp.com",
  projectId: "hotspotalk",
  storageBucket: "hotspotalk.appspot.com",
  messagingSenderId: "805558542239",
  appId: "1:805558542239:web:8b37d0469a4a1d667ca7aa",
  measurementId: "G-NB11TQXKCC"
};

firebase.initializeApp(firebaseConfig);

const fdatabase = firebase.database();

module.exports = fdatabase;