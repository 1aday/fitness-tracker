export interface Exercise {
  id: string;
  name: string;
  sets: number;
  reps: string; // Can be "8", "8 each side", etc.
  notes?: string;
  videoUrl?: string;
}

export interface CompletedSet {
  setNumber: number;
  weight: number;
  reps: number;
  completed: boolean;
  timestamp: string;
}

export interface WorkoutSession {
  id: string;
  date: string;
  exercises: Exercise[];
  completedSets: Record<string, CompletedSet[]>; // exerciseId -> sets
}

// Parse workout format like "Push Ups on Bench 3X12"
export function parseWorkout(workoutText: string): Exercise[] {
  const lines = workoutText.split('\n').filter(line => line.trim());
  
  return lines.map((line, index) => {
    // Match pattern: "Exercise Name 3X12" or "Exercise Name 3X8 each side"
    const match = line.match(/^(.+?)\s+(\d+)X(\d+)(.*)$/i);
    
    if (!match) {
      // Fallback: treat as exercise name with default 3x10
      return {
        id: `ex-${index}`,
        name: line.trim(),
        sets: 3,
        reps: '10',
        notes: '',
      };
    }
    
    const [, exerciseName, sets, reps, notes] = match;
    
    return {
      id: `ex-${index}`,
      name: exerciseName.trim(),
      sets: parseInt(sets, 10),
      reps: reps.trim() + (notes?.trim() || ''),
      notes: notes?.trim() || undefined,
    };
  });
}

// YouTube video IDs for common exercises (placeholder)
export const exerciseVideos: Record<string, string> = {
  'push ups on bench': 'IODxDxX7oi4',
  'db floor press': '_QpY-zSg23w',
  'db lateral raises': '3VcKaXpzqRo',
  'leg press machine': 'IZxyjW7MPJQ',
  'half kneeling cable rows': 'PgpQ4-jO9HI',
  'db bicep curls': 'ykJmrZ5v0Oo',
  'db side bends': 'dL9ZzqtQI5c',
};

export function getVideoIdForExercise(exerciseName: string): string | undefined {
  const normalized = exerciseName.toLowerCase().trim();
  
  // Try exact match first
  if (exerciseVideos[normalized]) {
    return exerciseVideos[normalized];
  }
  
  // Try partial match
  for (const [key, videoId] of Object.entries(exerciseVideos)) {
    if (normalized.includes(key) || key.includes(normalized)) {
      return videoId;
    }
  }
  
  return undefined;
}
