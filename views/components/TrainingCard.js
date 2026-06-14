import React from "react";
import { View, Text, StyleSheet, TouchableOpacity, Alert } from "react-native";

export default function TrainingCard({ training = {}, onDelete }) {
  const confirmDelete = () => {
    Alert.alert(
      "Delete Log",
      "Are you sure you want to delete this training log?",
      [
        { text: "Cancel", style: "cancel" },
        { text: "Delete", style: "destructive", onPress: onDelete },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.infoSection}>
        <Text style={styles.name}>{training.title || "Sin título"}</Text>
        <Text style={styles.details}>
          📅 {new Date(training.date).toLocaleDateString()}
        </Text>
        <Text style={styles.details}>⏱ Duration: {training.duration}</Text>
        <Text style={styles.details}>🔥 Level: {training.routineLevel}</Text>
        <Text style={styles.details}>🏀 Category: {training.routineCategory}</Text>
      </View>

      <TouchableOpacity style={styles.deleteButton} onPress={confirmDelete}>
        <Text style={styles.deleteButtonText}>Delete</Text>
      </TouchableOpacity>
    </View>
  );
}


const styles = StyleSheet.create({
  card: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    backgroundColor: "#1e1e1e",
    padding: 15,
    borderRadius: 10,
    marginBottom: 15,
  },
  infoSection: {
    flex: 1,
  },
  name: {
    fontSize: 18,
    color: "#e04dff",
    fontWeight: "bold",
  },
  details: {
    fontSize: 14,
    color: "#b0b0b0",
  },
  deleteButton: {
    backgroundColor: "#ff6347",
    paddingVertical: 8,
    paddingHorizontal: 15,
    borderRadius: 6,
    marginLeft: 10,
  },
  deleteButtonText: {
    fontSize: 14,
    color: "#ffffff",
    fontWeight: "500",
  },
});