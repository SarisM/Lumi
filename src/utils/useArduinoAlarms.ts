import { useEffect, useRef } from "react";
import { useBluetooth, LED_COMMANDS } from "../contexts/BluetoothContext";
import {
  AlarmState,
  loadAlarmState,
  saveAlarmState,
  shouldResetAlarms,
  initializeAlarmState,
  shouldTriggerWaterAlarm,
  shouldTriggerMealAlarm,
  shouldTriggerDayEnd,
  registerWaterIntake,
  registerMealIntake,
} from "./alarms";
import { debugLog } from "./debug";

interface UseArduinoAlarmsProps {
  waterGlasses: number;
  dailyWaterGoal: number;
  totalProtein: number;
  totalFiber: number;
  dailyProteinGoal: number;
  dailyFiberGoal: number;
  dayStartTime: string;
  dayEndTime: string;
  lastMealBalanced: boolean;
}

export function useArduinoAlarms({
  waterGlasses,
  dailyWaterGoal,
  totalProtein,
  totalFiber,
  dailyProteinGoal,
  dailyFiberGoal,
  dayStartTime,
  dayEndTime,
  lastMealBalanced,
}: UseArduinoAlarmsProps) {
  const { isConnected, sendCommand, sendBlueTestPulse } = useBluetooth();
  const alarmStateRef = useRef<AlarmState | null>(null);
  const lastWaterRef = useRef<number>(0);
  const lastMealRef = useRef<{ protein: number; fiber: number }>({ protein: 0, fiber: 0 });
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);

  // Inicializar o resetear estado de alarmas
  useEffect(() => {
    if (shouldResetAlarms()) {
      // Nuevo día - resetear estado
      const newState = initializeAlarmState(dayStartTime, dayEndTime);
      alarmStateRef.current = newState;
  saveAlarmState(newState);
  debugLog("Alarms", "Sistema de alarmas reiniciado para nuevo día");
    } else {
      // Cargar estado existente
      const savedState = loadAlarmState();
      if (savedState) {
        alarmStateRef.current = {
          ...savedState,
          dayStartTime,
          dayEndTime,
        };
      } else {
        const newState = initializeAlarmState(dayStartTime, dayEndTime);
        alarmStateRef.current = newState;
        saveAlarmState(newState);
      }
    }
  }, [dayStartTime, dayEndTime]);

  // Detectar cuando se registra agua
  useEffect(() => {
    if (waterGlasses > lastWaterRef.current) {
      // Se registró agua
      if (alarmStateRef.current) {
        const newState = registerWaterIntake(alarmStateRef.current);
        alarmStateRef.current = newState;
  saveAlarmState(newState);
  debugLog("Alarms", "Agua registrada - alarmas de agua reseteadas");
        // Test hook: optionally send a short blue LED pulse to the ESP32 when user adds a glass.
        // To opt-in, set localStorage key `lumi_test_bluetooth_on_water` to '1' or 'true'.
        try {
          const testFlag = localStorage.getItem("lumi_test_bluetooth_on_water");
          const testEnabled = testFlag === "1" || testFlag === "true";
          if (testEnabled && isConnected && typeof sendBlueTestPulse === "function") {
            // Fire-and-forget; this is a test-only pulse and should not interfere with other protocols
            sendBlueTestPulse(1500).catch((e) => debugLog("Alarms", `Bluetooth test pulse failed: ${e}`));
            debugLog("Alarms", "Se envió pulso de prueba Bluetooth (agua) - Azul");
          }
        } catch (e) {
          debugLog("Alarms", "No se pudo leer localStorage para prueba Bluetooth: " + String(e));
        }
      }
    }
    lastWaterRef.current = waterGlasses;
  }, [waterGlasses]);

  // Detectar cuando se registra comida
  useEffect(() => {
    const currentMeal = { protein: totalProtein, fiber: totalFiber };
    if (
      currentMeal.protein > lastMealRef.current.protein ||
      currentMeal.fiber > lastMealRef.current.fiber
    ) {
      // Se registró comida
      if (alarmStateRef.current) {
        const newState = registerMealIntake(alarmStateRef.current);
        alarmStateRef.current = newState;
  saveAlarmState(newState);
  debugLog("Alarms", "Comida registrada - alarmas de comida reseteadas");

        // Enviar feedback inmediato si está conectado
        if (isConnected) {
          const proteinMet = totalProtein >= dailyProteinGoal * 0.8;
          const fiberMet = totalFiber >= dailyFiberGoal * 0.8;
          const isBalanced = proteinMet && fiberMet;

          if (isBalanced) {
            sendCommand(LED_COMMANDS.BALANCED);
            debugLog("Alarms", "LED: Verde - Comida balanceada");
          } else {
            sendCommand(LED_COMMANDS.UNBALANCED);
            debugLog("Alarms", "LED: Naranja - Comida no balanceada");
          }
        }
      }
    }
    lastMealRef.current = currentMeal;
  }, [totalProtein, totalFiber, isConnected, sendCommand, dailyProteinGoal, dailyFiberGoal]);

  // Actualizar metas cumplidas
  useEffect(() => {
    if (alarmStateRef.current) {
      const waterGoalMet = waterGlasses >= dailyWaterGoal;
      const proteinMet = totalProtein >= dailyProteinGoal * 0.8;
      const fiberMet = totalFiber >= dailyFiberGoal * 0.8;
      const nutritionGoalMet = proteinMet && fiberMet;

      if (
        alarmStateRef.current.waterGoalMet !== waterGoalMet ||
        alarmStateRef.current.nutritionGoalMet !== nutritionGoalMet
      ) {
        alarmStateRef.current = {
          ...alarmStateRef.current,
          waterGoalMet,
          nutritionGoalMet,
        };
        saveAlarmState(alarmStateRef.current);

        // Si ambas metas están cumplidas, enviar feedback positivo
        if (waterGoalMet && nutritionGoalMet && isConnected) {
          sendCommand(LED_COMMANDS.GREAT_FINISH);
          debugLog("Alarms", "LED: Amarillo - ¡Todo perfecto!");
        }
      }
    }
  }, [
    waterGlasses,
    dailyWaterGoal,
    totalProtein,
    totalFiber,
    dailyProteinGoal,
    dailyFiberGoal,
    isConnected,
    sendCommand,
  ]);

  // Verificar alarmas periódicamente
  useEffect(() => {
    if (!isConnected || !alarmStateRef.current) {
      return;
    }

    const checkAlarms = () => {
      const state = alarmStateRef.current;
      if (!state) return;

      // Verificar si es hora de fin del día
      if (shouldTriggerDayEnd(state)) {
        const waterPercentage = (waterGlasses / dailyWaterGoal) * 100;
        const proteinPercentage = (totalProtein / dailyProteinGoal) * 100;
        const fiberPercentage = (totalFiber / dailyFiberGoal) * 100;
        const nutritionPercentage = (proteinPercentage + fiberPercentage) / 2;
        const totalProgress = (waterPercentage + nutritionPercentage) / 2;

        if (totalProgress >= 80) {
          sendCommand(LED_COMMANDS.GREAT_FINISH);
          debugLog("Alarms", "LED: Amarillo - ¡Gran final del día!");
        } else {
          sendCommand(LED_COMMANDS.BAD_FINISH);
          debugLog("Alarms", "LED: Naranja titilante - Necesitas mejorar mañana");
        }
        return;
      }

      // Verificar alarma de agua
      if (shouldTriggerWaterAlarm(state)) {
  sendCommand(LED_COMMANDS.WATER);
  debugLog("Alarms", "LED: Azul - ¡Hora de hidratarte!");

        // Incrementar contador de alarmas
        alarmStateRef.current = {
          ...state,
          waterAlarmsToday: state.waterAlarmsToday + 1,
        };
        saveAlarmState(alarmStateRef.current);
        return;
      }

      // Verificar alarma de comida
      // Contar comidas registradas (simplificado)
      const mealsCount = state.lastMealTime ? 1 : 0;
      if (shouldTriggerMealAlarm(state, mealsCount)) {
  sendCommand(LED_COMMANDS.UNBALANCED);
  debugLog("Alarms", "LED: Naranja - ¡Hora de comer!");

        // Incrementar contador de alarmas
        alarmStateRef.current = {
          ...state,
          mealAlarmsToday: state.mealAlarmsToday + 1,
        };
        saveAlarmState(alarmStateRef.current);
        return;
      }
    };

    // Verificar cada minuto
    checkIntervalRef.current = setInterval(checkAlarms, 60000);

    // Verificar inmediatamente
    checkAlarms();

    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, [
    isConnected,
    waterGlasses,
    dailyWaterGoal,
    totalProtein,
    totalFiber,
    dailyProteinGoal,
    dailyFiberGoal,
    sendCommand,
  ]);

  return {
    alarmState: alarmStateRef.current,
  };
}
