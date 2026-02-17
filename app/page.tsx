"use client";

import { useState, useEffect } from "react";
import { parseWorkout, getVideoIdForExercise, type Exercise, type CompletedSet, type WorkoutSession } from "@/lib/workout-parser";
import { saveWorkoutSession, getWorkoutSessions } from "@/lib/storage";

const DEFAULT_WORKOUT = `Push Ups on Bench 3X12
DB floor Press 3X8
DB Lateral raises 3X8
Leg press machine 3X10
Half Kneeling Cable Rows 3X8 each side (Heavy)
DB Bicep curls 3X6 each side
DB Side Bends (minimize movement at the HIP) 3X8 each side`;

export default function Home() {
  const [exercises, setExercises] = useState<Exercise[]>([]);
  const [currentSession, setCurrentSession] = useState<WorkoutSession | null>(null);
  const [weights, setWeights] = useState<Record<string, number>>({});

  useEffect(() => {
    // Load or create today's workout session
    const sessions = getWorkoutSessions();
    const today = new Date().toISOString().split('T')[0];
    const todaySession = sessions.find(s => s.date === today);

    if (todaySession) {
      setCurrentSession(todaySession);
      setExercises(todaySession.exercises);
    } else {
      // Parse default workout
      const parsed = parseWorkout(DEFAULT_WORKOUT);
      const newSession: WorkoutSession = {
        id: `workout-${Date.now()}`,
        date: today,
        exercises: parsed,
        completedSets: {},
      };
      setCurrentSession(newSession);
      setExercises(parsed);
    }
  }, []);

  const markSetComplete = (exerciseId: string, setNumber: number, weight: number) => {
    if (!currentSession) return;

    const exercise = exercises.find(e => e.id === exerciseId);
    if (!exercise) return;

    const completedSet: CompletedSet = {
      setNumber,
      weight,
      reps: parseInt(exercise.reps, 10),
      completed: true,
      timestamp: new Date().toISOString(),
    };

    const updated: WorkoutSession = {
      ...currentSession,
      completedSets: {
        ...currentSession.completedSets,
        [exerciseId]: [
          ...(currentSession.completedSets[exerciseId] || []).filter(s => s.setNumber !== setNumber),
          completedSet,
        ].sort((a, b) => a.setNumber - b.setNumber),
      },
    };

    setCurrentSession(updated);
    saveWorkoutSession(updated);
  };

  const getSetStatus = (exerciseId: string, setNumber: number): CompletedSet | undefined => {
    return currentSession?.completedSets[exerciseId]?.find(s => s.setNumber === setNumber);
  };

  const updateWeight = (exerciseId: string, setNum: number, weight: number) => {
    setWeights(prev => ({ ...prev, [`${exerciseId}-${setNum}`]: weight }));
  };

  const getWeight = (exerciseId: string, setNum: number): number => {
    const key = `${exerciseId}-${setNum}`;
    if (weights[key] !== undefined) return weights[key];
    
    const setStatus = getSetStatus(exerciseId, setNum);
    return setStatus?.weight || 0;
  };

  if (!currentSession) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-lg text-slate-600">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Header */}
      <div className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-4xl px-4 py-4">
          <h1 className="text-2xl font-semibold text-slate-900">Today's Workout</h1>
          <p className="text-sm text-slate-600">{new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}</p>
        </div>
      </div>

      {/* Workout Exercises */}
      <div className="mx-auto max-w-4xl px-4 py-8 space-y-8">
        {exercises.map((exercise) => {
          const videoId = getVideoIdForExercise(exercise.name);
          const completedCount = currentSession.completedSets[exercise.id]?.length || 0;
          
          return (
            <div key={exercise.id} className="rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
              {/* Exercise Header */}
              <div className="mb-4">
                <h2 className="text-xl font-semibold text-slate-900">{exercise.name}</h2>
                <div className="mt-1 flex items-center gap-4 text-sm text-slate-600">
                  <span>{exercise.sets} sets × {exercise.reps} reps</span>
                  <span className="text-blue-600">
                    {completedCount}/{exercise.sets} sets complete
                  </span>
                </div>
                {exercise.notes && (
                  <p className="mt-2 text-sm text-slate-500 italic">{exercise.notes}</p>
                )}
              </div>

              {/* YouTube Video */}
              {videoId && (
                <div className="mb-6 aspect-video w-full overflow-hidden rounded-lg bg-slate-900">
                  <iframe
                    width="100%"
                    height="100%"
                    src={`https://www.youtube.com/embed/${videoId}`}
                    title={exercise.name}
                    frameBorder="0"
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                    allowFullScreen
                    className="h-full w-full"
                  />
                </div>
              )}

              {/* Set Tracking */}
              <div className="space-y-3">
                {Array.from({ length: exercise.sets }, (_, i) => i + 1).map((setNum) => {
                  const setStatus = getSetStatus(exercise.id, setNum);
                  const currentWeight = getWeight(exercise.id, setNum);

                  return (
                    <div key={setNum} className="flex items-center gap-3">
                      <span className="w-16 text-sm font-medium text-slate-700">
                        Set {setNum}
                      </span>
                      
                      <input
                        type="number"
                        value={currentWeight}
                        onChange={(e) => updateWeight(exercise.id, setNum, parseInt(e.target.value, 10) || 0)}
                        placeholder="Weight"
                        className="w-24 rounded border border-slate-300 px-3 py-2 text-sm focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                        disabled={setStatus?.completed}
                      />
                      
                      <span className="text-sm text-slate-600">lbs</span>
                      
                      <button
                        onClick={() => markSetComplete(exercise.id, setNum, currentWeight)}
                        disabled={setStatus?.completed}
                        className={`ml-auto rounded px-4 py-2 text-sm font-medium transition-colors ${
                          setStatus?.completed
                            ? 'bg-green-100 text-green-700 cursor-not-allowed'
                            : 'bg-blue-600 text-white hover:bg-blue-700'
                        }`}
                      >
                        {setStatus?.completed ? '✓ Complete' : 'Mark Complete'}
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
