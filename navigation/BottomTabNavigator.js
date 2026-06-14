import React from "react";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import TrainingScreen from "../views/screens/Training/TrainingScreen";
import Profile from "../views/screens/Profile/Profile";
import AchievementsScreen from "../views/screens/Achievements/AchievementsScreen"; 
import ExercisesStack from "../navigation/ExercisesStack"; 

const Tab = createBottomTabNavigator();

export default function BottomTabNavigator() {
  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: "#1f1f1f",
          borderTopWidth: 0,
          height: 100,
        },
        tabBarLabelStyle: {
          fontSize: 12,
          fontWeight: "bold",
          color: "#fff",
        },
        tabBarIcon: ({ focused }) => {
          let iconName;

          switch (route.name) {
            case "Logs":
              iconName = focused ? "home" : "home-outline";
              break;
            case "Routines":
              iconName = focused ? "barbell" : "barbell-outline";
              break;
            case "Achievements":
              iconName = focused ? "trophy" : "trophy-outline";
              break;
            case "Profile":
              iconName = focused ? "person" : "person-outline";
              break;
          }

          return (
            <Ionicons
              name={iconName}
              size={24}
              color={focused ? "#e04dff" : "#aaa"}
            />
          );
        },
      })}
    >
      <Tab.Screen name="Logs" component={TrainingScreen} />
      <Tab.Screen name="Routines" component={ExercisesStack} />
      <Tab.Screen name="Achievements" component={AchievementsScreen} />
      <Tab.Screen name="Profile" component={Profile} />
    </Tab.Navigator>
  );
}
