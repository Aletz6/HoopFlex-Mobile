import React, { useState } from "react";
import { View, Text, FlatList, StyleSheet } from "react-native";
import { useFocusEffect } from "@react-navigation/native";
import TrainingCard from "../../components/TrainingCard";
import TrainingViewModel from "../../../viewmodels/TrainingViewModel";

export default function HomePage() {
  const [trainingLogs, setTrainingLogs] = useState([]);

  const loadLogs = async () => {
    const data = await TrainingViewModel.loadLogsForCurrentUser();
    setTrainingLogs(data);
  };

  const borrarLog = async (idLog) => {
    const res = await TrainingViewModel.deleteLog(idLog);
    if (res.success) loadLogs();
    else console.error("Error deleting log:", res.message);
  };

  useFocusEffect(
    React.useCallback(() => {
      loadLogs();
    }, [])
  );

  return (
  <View style={styles.container}>
    <Text style={styles.title}> {'\n'} Training Logs ✔</Text>
    <FlatList
      data={trainingLogs}
      keyExtractor={(item, index) =>
        item.id || item._id?.$oid || item._id || index.toString()
      }
      renderItem={({ item }) => {
        const logId = item.id || item._id?.$oid || item._id;
        return (
          <TrainingCard
            training={item}
            onDelete={() => {
              if (logId) {
                borrarLog(logId);
              } else {
                console.warn("ID de log inválido");
              }
            }}
          />
        );
      }}
      ListEmptyComponent={<Text style={styles.empty}>No logs yet.</Text>}
    />
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
    fontSize: 24,
    color: "#ffffff",
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
  empty: {
    color: "#aaa",
    fontSize: 16,
    textAlign: "center",
    marginTop: 30,
  },
});
