import { useState, useEffect, useMemo, useCallback } from 'react';
import { generateMissionFrames, MISSION_EVENTS, MissionReplayFrame } from '../data/mockMission';

export function useMissionReplay() {
  const frames = useMemo(() => generateMissionFrames(), []);
  const [currentTick, setCurrentTick] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<1 | 2 | 5>(1);

  const currentFrame: MissionReplayFrame = frames[currentTick] || frames[0];

  useEffect(() => {
    if (!isPlaying) return;

    const intervalMs = 1000 / playbackSpeed;
    const timer = setInterval(() => {
      setCurrentTick((prev) => {
        if (prev >= frames.length - 1) {
          setIsPlaying(false);
          return prev;
        }
        return prev + 1;
      });
    }, intervalMs);

    return () => clearInterval(timer);
  }, [isPlaying, playbackSpeed, frames.length]);

  const togglePlay = useCallback(() => {
    if (currentTick >= frames.length - 1) {
      setCurrentTick(0);
    }
    setIsPlaying((prev) => !prev);
  }, [currentTick, frames.length]);

  const seek = useCallback((tick: number) => {
    setCurrentTick(Math.max(0, Math.min(frames.length - 1, tick)));
  }, [frames.length]);

  const setSpeed = useCallback((speed: 1 | 2 | 5) => {
    setPlaybackSpeed(speed);
  }, []);

  const reset = useCallback(() => {
    setIsPlaying(false);
    setCurrentTick(0);
  }, []);

  return {
    frames,
    currentTick,
    currentFrame,
    isPlaying,
    playbackSpeed,
    events: MISSION_EVENTS,
    togglePlay,
    seek,
    setSpeed,
    reset,
  };
}
