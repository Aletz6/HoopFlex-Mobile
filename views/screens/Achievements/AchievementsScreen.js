import React, { useEffect, useState } from "react";
import { useFocusEffect } from '@react-navigation/native';
import { useCallback } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Modal } from "react-native";
import AchievementsViewModel from "../../../viewmodels/AchievementsViewModel";
import { Ionicons } from "@expo/vector-icons";


export default function AchievementsScreen() {
  const [achievements, setAchievements] = useState([]);
  const [selected, setSelected] = useState(null);
  const [modalVisible, setModalVisible] = useState(false);
  const [daysStreak, setDaysStreak] = useState(0);
  const [ranks, setRanks] = useState({});
  const [grouped, setGrouped] = useState({});

useFocusEffect(
  useCallback(() => {
    AchievementsViewModel.loadForCurrentUser().then(({ grouped, days, ranks, achievements }) => {
      setGrouped(grouped || {});
      setDaysStreak(days || 0);
      setRanks(ranks || {});
      setAchievements(achievements || []);
    });
  }, [])
);


  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}> {'\n'}  Achievements ✫</Text>

      <View style={styles.statsBox}>
        <Text style={styles.statsText}>🔥 Consecutive Days: <Text style={styles.highlight}>{daysStreak}</Text></Text>
        <Text style={styles.statsText}>💎 General Rank: <Text style={styles.highlight}>{ranks.general}</Text></Text>
        {["Dribble", "Shooting", "Agility"].map(cat => (
          <Text key={cat} style={styles.statsText}>
            {cat}: <Text style={styles.highlight}>{ranks[cat]}</Text>
          </Text>
        ))}
      </View>

    {Object.entries(grouped).map(([category, items]) => (
      <View key={category}>
        <Text style={styles.category}>{category}</Text>
        <View style={styles.row}>
          {items.map((logro) => (
            <TouchableOpacity
              key={logro.id}
              style={[styles.card, !logro.unlocked && styles.locked]}
              onPress={() => {
                setSelected(logro);
                setModalVisible(true);
              }}
            >
              <Ionicons
                name={logro.unlocked ? "trophy" : "lock-closed"}
                size={32}
                color={logro.unlocked ? "#FFD700" : "#888"}
              />
              <Text style={styles.cardText}>{`${logro.category} - ${logro.title}`}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>
    ))}


      <Modal visible={modalVisible} transparent animationType="slide">
        <View style={styles.modalContainer}>
          <View style={styles.modalBox}>
            <Text style={styles.modalTitle}>{selected?.title}</Text>
            <Text style={styles.modalText}>{selected?.description}</Text>
            <TouchableOpacity onPress={() => setModalVisible(false)} style={styles.closeBtn}>
              <Text style={styles.closeText}>Cerrar</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: "#121212",
    padding: 20,
    paddingBottom: 40,
  },
  title: {
    fontSize: 26,
    color: "#fff",
    fontWeight: "bold",
    marginBottom: 20,
    textAlign: "center",
  },
  statsBox: {
    backgroundColor: "#1f1f1f",
    padding: 15,
    borderRadius: 10,
    marginBottom: 30,
  },
  statsText: {
    color: "#fff",
    fontSize: 14,
    marginBottom: 6,
  },
  highlight: {
    color: "#e04dff",
    fontWeight: "bold",
  },
  category: {
    fontSize: 20,
    color: "#e04dff",
    marginBottom: 10,
    fontWeight: "bold",
  },
  row: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 30,
  },
  card: {
    backgroundColor: "#2c2c2c",
    padding: 15,
    borderRadius: 10,
    width: "45%",
    alignItems: "center",
    marginBottom: 10,
  },
  locked: {
    opacity: 0.5,
  },
  cardText: {
    color: "#fff",
    fontSize: 14,
    textAlign: "center",
    marginTop: 10,
  },
  modalContainer: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.8)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalBox: {
    backgroundColor: "#1e1e1e",
    padding: 20,
    borderRadius: 10,
    width: "85%",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "bold",
    color: "#fff",
    marginBottom: 10,
  },
  modalText: {
    fontSize: 16,
    color: "#ccc",
  },
  closeBtn: {
    marginTop: 20,
    alignItems: "center",
  },
  closeText: {
    color: "#e04dff",
    fontSize: 16,
  },
});
