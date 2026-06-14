import React, { useState, useEffect, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  Alert,
} from "react-native";
import TrainingViewModel from "../../../viewmodels/TrainingViewModel";
import RoutinesViewModel from "../../../viewmodels/RoutinesViewModel";

export default function RoutineDetails({ route, navigation }) {
  const { exercise } = route.params;
  const [time, setTime] = useState(0);
  const [isRunning, setIsRunning] = useState(false);
  const stopRef = useRef(null);

  useEffect(() => {
    return () => {
      if (stopRef.current) stopRef.current();
    };
  }, []);

  const renderStep = ({ item }) => (
    <View style={styles.stepCard}>
      <Text style={styles.stepName}>{item.name}</Text>
      <Text style={styles.stepDetails}>
        Sets: {item.sets} | Reps: {item.reps}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <Text style={styles.title}>{"\n"}{exercise.name}</Text>
      <Text style={styles.text}>Level: {exercise.level}</Text>
      <Text style={styles.text}>Duration: {exercise.duration}</Text>
      <Text style={styles.timer}>Time: {TrainingViewModel.formatTime(time)}</Text>

      <FlatList
        data={exercise.steps}
        keyExtractor={(item) => item.id}
        renderItem={renderStep}
        contentContainerStyle={styles.stepsList}
      />

      <TouchableOpacity
        style={styles.button}
        onPress={() => {
          if (!isRunning) {
            stopRef.current = RoutinesViewModel.startTimer(setTime);
            setIsRunning(true);
          } else {
            if (stopRef.current) stopRef.current();
            setIsRunning(false);
          }
        }}
      >
        <Text style={styles.buttonText}>{isRunning ? "Pause" : "Start"}</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.completeButton]}
        onPress={async () => {
          if (stopRef.current) stopRef.current();
          setIsRunning(false);
          const res = await RoutinesViewModel.completeTraining(exercise, time);
          if (res.success) {
            Alert.alert("Training Completed", res.message);
            navigation.navigate("Logs");
          } else {
            Alert.alert("Error", res.message);
          }
        }}
      >
        <Text style={styles.buttonText}>Complete Training</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#121212",
    padding: 20,
  },
  title: {
    fontSize: 28,
    color: "#e04dff",
    marginBottom: 10,
    textAlign: "center",
  },
  text: {
    fontSize: 18,
    color: "#fff",
    marginBottom: 10,
    textAlign: "center",
  },
  timer: {
    fontSize: 36,
    color: "#fff",
    marginVertical: 20,
    textAlign: "center",
  },
  stepsList: {
    paddingBottom: 20,
  },
  stepCard: {
    backgroundColor: "#1f1f1f",
    padding: 15,
    borderRadius: 10,
    marginBottom: 10,
  },
  stepName: {
    fontSize: 16,
    color: "#e04dff",
    marginBottom: 5,
  },
  stepDetails: {
    fontSize: 14,
    color: "#fff",
  },
  button: {
    backgroundColor: "#e04dff",
    padding: 15,
    borderRadius: 10,
    marginVertical: 10,
    alignItems: "center",
  },
  completeButton: {
    backgroundColor: "#4CAF50",
  },
  buttonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "bold",
  },
});
