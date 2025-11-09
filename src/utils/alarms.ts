import { LED_COMMANDS } from "../contexts/BluetoothContext";

export interface AlarmState {
  lastWaterTime: number | null;
  lastMealTime: number | null;
  waterAlarmsToday: number;
  mealAlarmsToday: number;
  dayStartTime: string; // "HH:MM"
  dayEndTime: string; // "HH:MM"
  waterGoalMet: boolean;
  nutritionGoalMet: boolean;
}

// Guardar estado de alarmas en localStorage
export function saveAlarmState(state: AlarmState) {
  localStorage.setItem("lumi_alarm_state", JSON.stringify(state));
}

// Cargar estado de alarmas desde localStorage
export function loadAlarmState(): AlarmState | null {
  const stored = localStorage.getItem("lumi_alarm_state");
  if (!stored) return null;
  
  try {
    return JSON.parse(stored);
  } catch (e) {
    console.error("Error parsing alarm state:", e);
    return null;
  }
}

// Verificar si es hora de disparar alarma de agua
export function shouldTriggerWaterAlarm(state: AlarmState): boolean {
  // Si ya se cumplió la meta, no disparar alarma
  if (state.waterGoalMet) {
    return false;
  }

  const now = Date.now();
  
  // Si no hay registro de agua, verificar si es hora de la primera alarma
  if (!state.lastWaterTime) {
    // Primera alarma después de 1.5 horas del inicio del día
    const dayStart = parseTime(state.dayStartTime);
    const elapsed = now - dayStart;
    const oneAndHalfHours = 1.5 * 60 * 60 * 1000;
    return elapsed >= oneAndHalfHours;
  }

  // Verificar tiempo desde el último registro de agua
  const timeSinceLastWater = now - state.lastWaterTime;
  
  // Si no se ha registrado agua después de apagar la alarma, disparar cada 30 min
  if (state.waterAlarmsToday > 0) {
    const thirtyMinutes = 30 * 60 * 1000;
    return timeSinceLastWater >= thirtyMinutes;
  } else {
    // Primera alarma después de 1.5 horas del último registro
    const oneAndHalfHours = 1.5 * 60 * 60 * 1000;
    return timeSinceLastWater >= oneAndHalfHours;
  }
}

// Verificar si es hora de disparar alarma de comida
export function shouldTriggerMealAlarm(state: AlarmState, mealsToday: number): boolean {
  // Si ya se cumplió la meta, no disparar alarma
  if (state.nutritionGoalMet) {
    return false;
  }

  const now = Date.now();
  const currentTime = new Date(now);
  const hour = currentTime.getHours();
  
  // Si no hay comidas registradas hoy
  if (mealsToday === 0) {
    // Disparar alarma a partir de las 9am
    return hour >= 9;
  }

  // Si hay comidas registradas, verificar tiempo desde la última
  if (!state.lastMealTime) {
    return false;
  }

  const timeSinceLastMeal = now - state.lastMealTime;
  const fiveHours = 5 * 60 * 60 * 1000;
  
  // Disparar alarma 5 horas después de la última comida
  return timeSinceLastMeal >= fiveHours;
}

// Verificar si es hora de enviar feedback final del día
export function shouldTriggerDayEnd(state: AlarmState): boolean {
  const now = new Date();
  const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;
  
  // Verificar si llegó la hora de fin del día
  return currentTime >= state.dayEndTime;
}

// Determinar qué comando enviar al Arduino basado en el estado actual
export function determineArduinoCommand(
  state: AlarmState,
  waterPercentage: number,
  nutritionPercentage: number,
  lastBalancedMeal: boolean
): number {
  // Si es hora de fin del día, enviar feedback final
  if (shouldTriggerDayEnd(state)) {
    const totalProgress = (waterPercentage + nutritionPercentage) / 2;
    
    if (totalProgress >= 80) {
      return LED_COMMANDS.GREAT_FINISH; // Amarillo - gran final
    } else {
      return LED_COMMANDS.BAD_FINISH; // Naranja titilante - mal final
    }
  }

  // Prioridad: Agua > Comida
  if (shouldTriggerWaterAlarm(state)) {
    return LED_COMMANDS.WATER; // Azul - necesita agua
  }

  // Verificar alarma de comida
  const mealsCount = state.lastMealTime ? 1 : 0; // Simplificado, debería contar comidas reales
  if (shouldTriggerMealAlarm(state, mealsCount)) {
    return LED_COMMANDS.UNBALANCED; // Naranja - necesita comer
  }

  // Si se acaba de registrar una comida, mostrar feedback
  if (lastBalancedMeal) {
    return LED_COMMANDS.BALANCED; // Verde - comida balanceada
  } else if (state.lastMealTime && Date.now() - state.lastMealTime < 5000) {
    // Comida recién registrada pero no balanceada
    return LED_COMMANDS.UNBALANCED; // Naranja - comida no balanceada
  }

  // Si todo está bien, apagar
  if (state.waterGoalMet && state.nutritionGoalMet) {
    return LED_COMMANDS.GREAT_FINISH; // Amarillo - todo perfecto
  }

  return LED_COMMANDS.OFF; // Apagado por defecto
}

// Parsear hora en formato "HH:MM" a timestamp de hoy
function parseTime(timeStr: string): number {
  const [hours, minutes] = timeStr.split(':').map(Number);
  const now = new Date();
  now.setHours(hours, minutes, 0, 0);
  return now.getTime();
}

// Inicializar estado de alarmas para un nuevo día
export function initializeAlarmState(dayStartTime: string, dayEndTime: string): AlarmState {
  return {
    lastWaterTime: null,
    lastMealTime: null,
    waterAlarmsToday: 0,
    mealAlarmsToday: 0,
    dayStartTime,
    dayEndTime,
    waterGoalMet: false,
    nutritionGoalMet: false,
  };
}

// Verificar si necesita reiniciar alarmas (nuevo día)
export function shouldResetAlarms(): boolean {
  const lastReset = localStorage.getItem("lumi_alarm_last_reset");
  const today = new Date().toDateString();
  
  if (!lastReset || lastReset !== today) {
    localStorage.setItem("lumi_alarm_last_reset", today);
    return true;
  }
  
  return false;
}

// Registrar acción de agua
export function registerWaterIntake(state: AlarmState): AlarmState {
  return {
    ...state,
    lastWaterTime: Date.now(),
    waterAlarmsToday: 0, // Reset contador de alarmas
  };
}

// Registrar acción de comida
export function registerMealIntake(state: AlarmState): AlarmState {
  return {
    ...state,
    lastMealTime: Date.now(),
    mealAlarmsToday: 0, // Reset contador de alarmas
  };
}

// Incrementar contador de alarmas de agua
export function incrementWaterAlarms(state: AlarmState): AlarmState {
  return {
    ...state,
    waterAlarmsToday: state.waterAlarmsToday + 1,
  };
}

// Incrementar contador de alarmas de comida
export function incrementMealAlarms(state: AlarmState): AlarmState {
  return {
    ...state,
    mealAlarmsToday: state.mealAlarmsToday + 1,
  };
}
