import React from "react";
import { createStackNavigator } from "@react-navigation/stack";
import RoutinesScreen from "../views/screens/Routines/RoutinesScreen";
import NewRoutineScreen from "../views/screens/Routines/NewRoutineScreen";
import RoutineDetails from "../views/screens/Routines/RoutineDetails";

const Stack = createStackNavigator();

export default function ExercisesStack() {
  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      <Stack.Screen name="RoutinesScreen" component={RoutinesScreen} />
      <Stack.Screen name="NewRoutineScreen" component={NewRoutineScreen} />
      <Stack.Screen name="RoutineDetails" component={RoutineDetails} />
    </Stack.Navigator>
  );
}
