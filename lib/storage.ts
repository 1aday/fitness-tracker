import type { WorkoutSession } from './workout-parser';

const STORAGE_KEY = 'fitness-tracker-sessions';

export function getWorkoutSessions(): WorkoutSession[] {
  if (typeof window === 'undefined') return [];
  
  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Failed to load workout sessions:', error);
    return [];
  }
}

export function saveWorkoutSession(session: WorkoutSession): void {
  if (typeof window === 'undefined') return;
  
  try {
    const sessions = getWorkoutSessions();
    const existingIndex = sessions.findIndex(s => s.id === session.id);
    
    if (existingIndex >= 0) {
      sessions[existingIndex] = session;
    } else {
      sessions.push(session);
    }
    
    localStorage.setItem(STORAGE_KEY, JSON.stringify(sessions));
  } catch (error) {
    console.error('Failed to save workout session:', error);
  }
}

export function getWorkoutHistory(exerciseId: string, limit = 10): Array<{
  date: string;
  sets: Array<{ weight: number; reps: number }>;
}> {
  const sessions = getWorkoutSessions();
  
  return sessions
    .filter(session => session.completedSets[exerciseId]?.length > 0)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .slice(0, limit)
    .map(session => ({
      date: session.date,
      sets: session.completedSets[exerciseId].map(set => ({
        weight: set.weight,
        reps: set.reps,
      })),
    }));
}
