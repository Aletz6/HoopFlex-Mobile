import React, { useState } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import RoutinesViewModel from "../../../viewmodels/RoutinesViewModel";
import RoutineCard from "../../components/RoutineCard";

export default function RoutinesScreen() {
  const navigation = useNavigation();
  const [routines, setRoutines] = useState({
    Dribble: [],
    Shooting: [],
    Agility: [],
    Custom: [],
  });

  const getRoutineId = (routine) =>
    routine?.id || routine?.localId || routine?._id?.$oid || routine?._id;

  const loadRoutines = () => {
    RoutinesViewModel.loadGroupedRoutines().then((grouped) => setRoutines(grouped));
  };

  const borrarRutina = (id) => {
    Alert.alert("Delete Routine", "Are you sure you want to delete it?", [
      { text: "Cancel", style: "cancel" },
      {
        text: "Delete",
        style: "destructive",
        onPress: async () => {
          await RoutinesViewModel.deleteRoutine(id);
          loadRoutines();
        },
      },
    ]);
  };

  const renderCategory = (title, data) => {
    if (!data || data.length === 0) return null;

    return (
      <View style={{ marginBottom: 25 }}>
        <Text style={styles.category}>{title}</Text>
        <FlatList
          horizontal
          data={data}
          keyExtractor={(item, index) => getRoutineId(item) || index.toString()}
          renderItem={({ item }) => (
            <RoutineCard
              routine={item}
              onPress={() =>
                navigation.navigate("RoutineDetails", {
                  exercise: {
                    ...item.exercise,
                    category: item.category
                  }
                })
              }
              onDelete={() => borrarRutina(getRoutineId(item))}
              allowDelete={item.category === "Custom"}
            />
          )}
          showsHorizontalScrollIndicator={false}
        />
      </View>
    );
  };

  useFocusEffect(
    React.useCallback(() => {
      loadRoutines();
    }, [])
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{"\n"}🏋️ Routines</Text>

      <TouchableOpacity
        style={styles.addButton}
        onPress={() => navigation.navigate("NewRoutineScreen")}
      >
        <Text style={styles.addButtonText}>+ Create Routine</Text>
      </TouchableOpacity>

      {renderCategory("Dribble", routines.Dribble)}
      {renderCategory("Shooting", routines.Shooting)}
      {renderCategory("Agility", routines.Agility)}
      {renderCategory("Custom", routines.Custom)}
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 20 },
  title: {
    fontSize: 24,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
  category: {
    fontSize: 20,
    color: "#e04dff",
    fontWeight: "bold",
    marginBottom: 10,
  },
  addButton: {
    backgroundColor: "#e04dff",
    padding: 12,
    borderRadius: 10,
    marginBottom: 20,
    alignItems: "center",
  },
  addButtonText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
});
