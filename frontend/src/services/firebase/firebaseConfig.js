
import { Platform } from "react-native";
import { initializeApp, getApps, getApp } from "firebase/app";
import {
  initializeAuth,
  getAuth,
  getReactNativePersistence
} from "firebase/auth";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

const firebaseConfig = {
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "AIzaSyDT77Q8IXwDpCpDGsbsveX3ljLxDdFGH1k",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "asha-997cd.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "asha-997cd",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "asha-997cd.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "301164131725",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || "1:301164131725:web:7d85475e0354457d1539c4"
};

const firebaseApp = getApps().length
  ? getApp()
  : initializeApp(firebaseConfig);

let auth;

try {
  if (Platform.OS !== "web" && typeof getReactNativePersistence === "function") {
    auth = initializeAuth(firebaseApp, {
      persistence: getReactNativePersistence(AsyncStorage)
    });
  } else {
    auth = getAuth(firebaseApp);
  }
} catch {
  auth = getAuth(firebaseApp);
}

const firestore = getFirestore(firebaseApp);
const storage = getStorage(firebaseApp);

console.log("Firebase connected to:", firebaseApp.options.projectId);

export { firebaseApp, auth, firestore, storage };
export default firebaseApp;