import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  StyleSheet,
  Alert,
} from "react-native";
import Slider from "@react-native-community/slider";
import { Picker } from "@react-native-picker/picker";
import ExercisesViewModel from "../../../viewmodels/RoutinesViewModel";

export default function NewRoutineScreen({ navigation }) {
  const [name, setName] = useState("");
  const [level, setLevel] = useState("Beginner");
  const [duration, setDuration] = useState(15);
  const [message, setMessage] = useState("");
  const [stepName, setStepName] = useState("");
  const [sets, setSets] = useState("");
  const [reps, setReps] = useState("");
  
  const [steps, setSteps] = useState([]);

  const addStep = () => {
    const res = ExercisesViewModel.createStep(stepName, sets, reps, steps);
    if (!res.success) {
      Alert.alert("Incomplete", res.message);
      return;
    }
    setSteps(res.steps);
    setStepName("");
    setSets("");
    setReps("");
  };

  const removeStep = (index) => {
    const newSteps = ExercisesViewModel.removeStepAt(steps, index);
    setSteps(newSteps);
  };

  const saveRoutine = async () => {
    if (!name || !level || !duration || steps.length === 0) {
      Alert.alert("Incomplete", "Please fill in all step fields.");
      return;
    }

    const res = await ExercisesViewModel.createRoutine({ name, level, duration, message, steps });
    if (res.success) {
      Alert.alert("Success", "Routine saved successfully.");
      navigation.goBack();
    } else {
      Alert.alert("Error", res.message || "Failed to save routine.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Create New Routine 📝</Text>

      <TextInput
        placeholder="Routine Name"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={name}
        onChangeText={setName}
      />

      <Text style={styles.label}>Difficulty Level:</Text>
      <Picker
        selectedValue={level}
        style={styles.picker}
        dropdownIconColor="#fff"
        onValueChange={(itemValue) => setLevel(itemValue)}
      >
        <Picker.Item label="Beginner" value="Beginner" />
        <Picker.Item label="Intermediate" value="Intermediate" />
        <Picker.Item label="Advanced" value="Advanced" />
      </Picker>

      <Text style={styles.label}>Duration: {duration} min</Text>
      <Slider
        style={styles.slider}
        minimumValue={5}
        maximumValue={90}
        step={5}
        minimumTrackTintColor="#e04dff"
        maximumTrackTintColor="#888"
        thumbTintColor="#e04dff"
        value={duration}
        onValueChange={setDuration}
      />

      <Text style={styles.label}>Motivational Message (optional):</Text>
      <TextInput
        placeholder="Let's crush it!"
        placeholderTextColor="#aaa"
        style={styles.input}
        value={message}
        onChangeText={setMessage}
      />

      <View style={styles.stepContainer}>
        <TextInput
          placeholder="Step Name"
          placeholderTextColor="#aaa"
          style={[styles.input, { flex: 1 }]}
          value={stepName}
          onChangeText={setStepName}
        />
        <TextInput
          placeholder="Sets"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          style={[styles.input, { width: 60 }]}
          value={sets}
          onChangeText={setSets}
        />
        <TextInput
          placeholder="Reps"
          placeholderTextColor="#aaa"
          keyboardType="numeric"
          style={[styles.input, { width: 60 }]}
          value={reps}
          onChangeText={setReps}
        />
        <TouchableOpacity onPress={addStep} style={styles.addButton}>
          <Text style={styles.buttonText}>＋</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={steps}
        keyExtractor={(item) => item.id}
        renderItem={({ item, index }) => (
          <View style={styles.stepCard}>
            <Text style={styles.stepText}>
              {item.name} - {item.sets}x{item.reps}
            </Text>
            <TouchableOpacity onPress={() => removeStep(index)}>
              <Text style={styles.removeText}>🗑</Text>
            </TouchableOpacity>
          </View>
        )}
      />

      <TouchableOpacity style={styles.saveButton} onPress={saveRoutine}>
        <Text style={styles.saveText}>Save Routine</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#121212", padding: 20 },
  title: { fontSize: 26, color: "#e04dff", fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: {
    backgroundColor: "#1f1f1f",
    color: "#fff",
    padding: 10,
    borderRadius: 8,
    marginBottom: 12,
    borderColor: "#333",
    borderWidth: 1,
  },
  label: { color: "#fff", fontSize: 16, marginBottom: 5 },
  picker: {
    backgroundColor: "#1f1f1f",
    color: "#fff",
    borderRadius: 8,
    marginBottom: 15,
  },
  slider: { width: "100%", height: 40, marginBottom: 20 },
  stepContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  addButton: {
    backgroundColor: "#e04dff",
    padding: 10,
    borderRadius: 8,
    marginLeft: 8,
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
  stepCard: {
    backgroundColor: "#1f1f1f",
    flexDirection: "row",
    justifyContent: "space-between",
    padding: 12,
    borderRadius: 8,
    marginBottom: 8,
  },
  stepText: { color: "#fff", fontSize: 15 },
  removeText: { color: "#ff4444", fontSize: 18 },
  saveButton: {
    backgroundColor: "#4CAF50",
    padding: 15,
    borderRadius: 10,
    marginTop: 20,
    alignItems: "center",
  },
  saveText: { color: "#fff", fontSize: 16, fontWeight: "bold" },
});
