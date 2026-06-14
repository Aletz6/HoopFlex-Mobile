import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ScrollView,
} from "react-native";
import ProfileViewModel from "../../../viewmodels/ProfileViewModel";
import AuthViewModel from "../../../viewmodels/AuthViewModel";
import { BarChart } from "react-native-chart-kit";
import { Dimensions } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import { useCallback } from "react";


const screenWidth = Dimensions.get("window").width;

export default function Profile() {
  const [profile, setProfile] = useState({
    nombre: "",
    edad: "",
    peso: "",
    talla: "",
    fotoUrl: "",
  });
  const [logs, setLogs] = useState([]);
  const [imageChanged, setImageChanged] = useState(false);
  const [groupedData, setGroupedData] = useState({ labels: [], datasets: [{ data: [] }] });
  const [totalSeconds, setTotalSeconds] = useState(0);

  useEffect(() => {
    ProfileViewModel.loadForCurrentUser().then(({ profile, logs, workoutsData, totalSeconds }) => {
      if (profile) setProfile(profile);
      setLogs(logs || []);
      setGroupedData(workoutsData || { labels: [], datasets: [{ data: [] }] });
      setTotalSeconds(totalSeconds || 0);
    });
  }, []);

    useFocusEffect(
    useCallback(() => {
      ProfileViewModel.loadForCurrentUser().then(({ profile, logs, workoutsData, totalSeconds }) => {
        if (profile) setProfile(profile);
        setLogs(logs || []);
        setGroupedData(workoutsData || { labels: [], datasets: [{ data: [] }] });
        setTotalSeconds(totalSeconds || 0);
      });
    }, [])
  );


  // Data loading handled by ProfileViewModel

  const seleccionarFoto = async () => {
    const uri = await ProfileViewModel.pickImage();
    if (uri) {
      setProfile({ ...profile, fotoUrl: uri });
      setImageChanged(true);
    }
  };


  const guardarCambios = async () => {
    const result = await ProfileViewModel.saveProfile(profile);
    if (result.success) {
      Alert.alert("Perfil actualizado");
      setImageChanged(false);
    } else {
      Alert.alert("Error al guardar perfil", result.message || "");
    }
  };


  const entrenamientosPorDia = () => ProfileViewModel.workoutsPerDay(logs);
  const tiempoTotal = () => ProfileViewModel.totalTime(logs);
  const formatMMSS = (s) => ProfileViewModel.formatMMSS(s);


  return (
    <ScrollView style={styles.container}>
      <Text>{'\n'}</Text>
      <TouchableOpacity onPress={seleccionarFoto}>
        <Image
          source={
            profile.fotoUrl
              ? { uri: profile.fotoUrl }
              : require("../../../assets/avatar.png")
          }
          style={styles.avatar}
        />
      </TouchableOpacity>

      <TextInput
        style={styles.input}
        placeholder="Name"
        placeholderTextColor="#aaa"
        value={profile.nombre}
        onChangeText={(text) => setProfile({ ...profile, nombre: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Age"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
        value={String(profile.edad)}
        onChangeText={(text) => setProfile({ ...profile, edad: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Weight (kg)"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
        value={String(profile.peso)}
        onChangeText={(text) => setProfile({ ...profile, peso: text })}
      />
      <TextInput
        style={styles.input}
        placeholder="Height (cm)"
        placeholderTextColor="#aaa"
        keyboardType="numeric"
        value={String(profile.talla)}
        onChangeText={(text) => setProfile({ ...profile, talla: text })}
      />

      <TouchableOpacity style={styles.saveButton} onPress={guardarCambios}>
        <Text style={styles.saveButtonText}>Save Profile</Text>
      </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutButton}
          onPress={async () => {
            const res = await AuthViewModel.logout();
            if (!res.success) {
              console.error("Error al cerrar sesión:", res.message);
              Alert.alert("Error al cerrar sesión");
            }
          }}
        >
          <Text style={styles.logoutButtonText}>Logout</Text>
        </TouchableOpacity>


      <Text style={styles.statsTitle}>Workouts Done This Week</Text>
      <BarChart
        data={groupedData.labels.length ? groupedData : entrenamientosPorDia()}
        width={screenWidth - 40}
        height={220}
        chartConfig={chartConfig}
        style={styles.chart}
        fromZero
      />
      <Text style={styles.statsText}>
        ⏱ Total Time: {formatMMSS(totalSeconds || tiempoTotal())} min
      </Text>

    </ScrollView>
  );
}

const chartConfig = {
  backgroundGradientFrom: "#1f1f1f",
  backgroundGradientTo: "#1f1f1f",
  color: (opacity = 1) => `rgba(224, 77, 255, ${opacity})`,
  labelColor: () => "#fff",
  barPercentage: 0.6,
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
  },
  avatar: {
    width: 120,
    height: 120,
    borderRadius: 60,
    alignSelf: "center",
    marginBottom: 20,
    borderWidth: 2,
    borderColor: "#e04dff",
  },
  input: {
    backgroundColor: "#1f1f1f",
    color: "#fff",
    padding: 12,
    borderRadius: 8,
    marginBottom: 15,
  },
  saveButton: {
    backgroundColor: "#e04dff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  saveButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },
  statsTitle: {
    color: "#e04dff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 10,
    textAlign: "center",
  },
  statsText: {
    color: "#fff",
    fontSize: 16,
    marginTop: 10,
    textAlign: "center",
  },
  chart: {
    borderRadius: 10,
    marginBottom: 20,
  },

  logoutButton: {
    backgroundColor: "#ff4d4d",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 20,
  },
  logoutButtonText: {
    color: "#fff",
    fontWeight: "bold",
  },

});
