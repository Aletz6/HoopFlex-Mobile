import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from "react-native";
import AuthViewModel from "../../../viewmodels/AuthViewModel";

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleRegister = async () => {
    try {
      const result = await AuthViewModel.register(email, password);
      if (result.success) {
        Alert.alert("Success", "Account created successfully!");
        navigation.navigate("LoginScreen");
      } else {
        Alert.alert("Registration Failed", result.message);
      }
    } catch (error) {
      Alert.alert("Registration Failed", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create an Account</Text>
      <Text style={styles.subtitle}>Sign up to get started</Text>

      <TextInput
        style={styles.input}
        placeholder="Email"
        placeholderTextColor="#aaa"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />
      <TextInput
        style={styles.input}
        placeholder="Password"
        placeholderTextColor="#aaa"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.loginButton} onPress={handleRegister}>
        <Text style={styles.buttonText}>Sign Up</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
        <Text style={styles.switchText}>Already have an account? <Text style={styles.highlightText}>Login</Text></Text>
      </TouchableOpacity>
    </View>
  );
}
const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#121212",
    padding: 20,
  },
  title: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 5,
  },
  subtitle: {
    fontSize: 16,
    color: "#aaa",
    marginBottom: 20,
  },
  input: {
    width: "90%",
    backgroundColor: "#1f1f1f",
    color: "#fff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: "#e04dff",
  },
  loginButton: {
    backgroundColor: "#e04dff",
    padding: 12,
    borderRadius: 10,
    width: "90%",
    alignItems: "center",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
  switchText: {
    marginTop: 15,
    color: "#aaa",
    fontSize: 14,
  },
  highlightText: {
    color: "#e04dff",
    fontWeight: "bold",
  },
});
