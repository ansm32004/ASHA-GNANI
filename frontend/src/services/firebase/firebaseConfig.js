
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
  apiKey: process.env.EXPO_PUBLIC_FIREBASE_API_KEY || "",
  authDomain: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN || "asha-997cd.firebaseapp.com",
  projectId: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID || "asha-997cd",
  storageBucket: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET || "asha-997cd.firebasestorage.app",
  messagingSenderId: process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID || "",
  appId: process.env.EXPO_PUBLIC_FIREBASE_APP_ID || ""
};

let firebaseApp = null;
let auth = null;
let firestore = null;
let storage = null;

try {
  if (firebaseConfig.apiKey) {
    firebaseApp = getApps().length ? getApp() : initializeApp(firebaseConfig);

    try {
      if (Platform.OS !== "web" && typeof getReactNativePersistence === "function") {
        auth = initializeAuth(firebaseApp, {
          persistence: getReactNativePersistence(AsyncStorage)
        });
      } else {
        auth = getAuth(firebaseApp);
      }
    } catch (authErr) {
      console.warn("[Firebase] Auth initialization fallback:", authErr?.message || authErr);
      try {
        auth = getAuth(firebaseApp);
      } catch {
        auth = null;
      }
    }

    try {
      firestore = getFirestore(firebaseApp);
    } catch (fsErr) {
      console.warn("[Firebase] Firestore initialization fallback:", fsErr?.message || fsErr);
    }

    try {
      storage = getStorage(firebaseApp);
    } catch (stErr) {
      console.warn("[Firebase] Storage initialization fallback:", stErr?.message || stErr);
    }

    if (firebaseApp?.options?.projectId) {
      console.log("Firebase connected to:", firebaseApp.options.projectId);
    }
  } else {
    console.warn("[Firebase] EXPO_PUBLIC_FIREBASE_API_KEY is not defined; Firebase running in offline/detached mode.");
  }
} catch (err) {
  console.warn("[Firebase] Initialization failed safely:", err?.message || err);
}

export { firebaseApp, auth, firestore, storage };
export default firebaseApp;