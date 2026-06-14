import React, { useState, useEffect } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createStackNavigator } from "@react-navigation/stack";
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebaseConfig";
import BottomTabNavigator from "./navigation/BottomTabNavigator";
import LoginScreen from "./views/screens/Auth/LoginScreen";
import SignUpScreen from "./views/screens/Auth/SignUpScreen";
import SyncService from "./services/SyncService";

const Stack = createStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (authenticatedUser) => {
      setUser(authenticatedUser);
      setLoading(false);

      if (authenticatedUser) {
        SyncService.start();
      } else {
        SyncService.stop();
      }
    });

    return () => {
      unsubscribe();
      SyncService.stop();
    };
  }, []);

  if (loading) return null; // 🔹 Evita que la app renderice antes de confirmar el estado del usuario.

  return (
    <NavigationContainer>
      {user ? (
        <BottomTabNavigator /> // 🔹 Renderiza el TabNavigator si el usuario está autenticado
      ) : (
        <Stack.Navigator screenOptions={{ headerShown: false }}>
          <Stack.Screen name="LoginScreen" component={LoginScreen} />
          <Stack.Screen name="SignUpScreen" component={SignUpScreen} />
        </Stack.Navigator>
      )}
    </NavigationContainer>
  );
}
