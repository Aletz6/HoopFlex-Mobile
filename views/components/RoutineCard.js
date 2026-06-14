import React from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";

export default function RoutineCard({ routine, onPress, onDelete, allowDelete }) {
  const { exercise } = routine;

  return (
    <TouchableOpacity onPress={onPress} style={styles.card}>
      <Text style={styles.name}>{exercise.name}</Text>
      <Text style={styles.details}>Level: {exercise.level}</Text>
      <Text style={styles.details}>Duration: {exercise.duration}</Text>

      {allowDelete && (
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteButtonText}>Delete</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: "#1f1f1f",
    padding: 15,
    borderRadius: 10,
    marginRight: 12,
    width: 180,
  },
  name: {
    fontSize: 16,
    color: "#e04dff",
    fontWeight: "bold",
    marginBottom: 5,
  },
  details: {
    fontSize: 14,
    color: "#fff",
    marginBottom: 4,
  },
  deleteButton: {
    backgroundColor: "#ff4444",
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 6,
    marginTop: 8,
    alignSelf: "flex-start",
  },
  deleteButtonText: {
    color: "#fff",
    fontSize: 13,
    fontWeight: "bold",
  },
});
