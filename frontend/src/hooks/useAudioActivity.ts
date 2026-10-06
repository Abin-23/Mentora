import { useState, useRef, useCallback, useEffect } from 'react';

export let globalAudioContext: AudioContext | null = null;

export function initGlobalAudioContext() {
  if (!globalAudioContext) {
    globalAudioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
  }
  if (globalAudioContext.state === 'suspended') {
    globalAudioContext.resume().catch(console.warn);
  }
  return globalAudioContext;
}

interface AudioConfig {
  threshold?: number;
  sustainedDurationMs?: number;
  cooldownMs?: number;
  onAudioLevel?: (level: number) => void;
}

export function useAudioActivity(stream: MediaStream | null, config?: AudioConfig) {
  const threshold = config?.threshold || 15; // RMS threshold (0-100)
  const sustainedDurationMs = config?.sustainedDurationMs || 1500;
  const cooldownMs = config?.cooldownMs || 15000;

  const [audioStatus, setAudioStatus] = useState<'IDLE' | 'SUSTAINED_ACTIVITY'>('IDLE');
  const [error, setError] = useState<string | null>(null);

  const analyserRef = useRef<AnalyserNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const requestAnimationFrameRef = useRef<number | null>(null);

  const sustainedStartTimeRef = useRef<number | null>(null);
  const lastBelowThresholdTimeRef = useRef<number | null>(null);
  const lastIncidentTimeRef = useRef<number>(0);
  const smoothedLevelRef = useRef<number>(0);

  const startAudioDetection = useCallback(() => {
    if (!stream || stream.getAudioTracks().length === 0) {
      setError('No audio stream available');
      return;
    }

    try {
      const audioCtx = globalAudioContext || initGlobalAudioContext();

      if (!analyserRef.current) {
        analyserRef.current = audioCtx.createAnalyser();
        analyserRef.current.fftSize = 256;
      }
      const analyser = analyserRef.current;

      if (!sourceRef.current) {
        sourceRef.current = audioCtx.createMediaStreamSource(stream);
        sourceRef.current.connect(analyser);
      }

      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkAudioLevel = () => {
        analyser.getByteTimeDomainData(dataArray);
        
        let sumSquares = 0;
        for (let i = 0; i < dataArray.length; i++) {
          const normalized = (dataArray[i] - 128) / 128;
          sumSquares += normalized * normalized;
        }
        const rms = Math.sqrt(sumSquares / dataArray.length);
        
        // Multiply by 500 to map normal speech RMS to 25-100 scale
        const currentLevel = Math.min(100, rms * 500);
        
        // Fast attack, slow release smoothing
        if (currentLevel > smoothedLevelRef.current) {
          smoothedLevelRef.current = (smoothedLevelRef.current * 0.5) + (currentLevel * 0.5); // Attack
        } else {
          smoothedLevelRef.current = (smoothedLevelRef.current * 0.95) + (currentLevel * 0.05); // Release
        }
        
        const normalizedLevel = Math.round(smoothedLevelRef.current);
        
        if (config?.onAudioLevel) {
          config.onAudioLevel(normalizedLevel);
        }
        
        const now = Date.now();
        
        if (now - lastIncidentTimeRef.current < cooldownMs) {
          sustainedStartTimeRef.current = null;
          lastBelowThresholdTimeRef.current = null;
          // Do NOT setAudioStatus('IDLE') here. The 1000ms setTimeout handles it. 
          // Setting it here instantly overwrote the SUSTAINED_ACTIVITY state in 16ms!
        } else {
          if (normalizedLevel >= threshold) {
            if (sustainedStartTimeRef.current === null) {
              sustainedStartTimeRef.current = now;
            } else if (now - sustainedStartTimeRef.current >= sustainedDurationMs) {
              setAudioStatus('SUSTAINED_ACTIVITY');
              lastIncidentTimeRef.current = now;
              sustainedStartTimeRef.current = null;
              lastBelowThresholdTimeRef.current = null;
              
              setTimeout(() => setAudioStatus('IDLE'), 1000);
            }
            lastBelowThresholdTimeRef.current = null; // Clear grace period if back above threshold
          } else {
            // Grace period: Don't cancel timer immediately if it drops below threshold!
            if (sustainedStartTimeRef.current !== null) {
              if (lastBelowThresholdTimeRef.current === null) {
                lastBelowThresholdTimeRef.current = now; // Start grace period
              } else if (now - lastBelowThresholdTimeRef.current > 2000) {
                // If it's been silent for more than 2 seconds, then reset.
                sustainedStartTimeRef.current = null;
                lastBelowThresholdTimeRef.current = null;
                setAudioStatus('IDLE');
              }
            }
          }
        }
        
        requestAnimationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      };

      requestAnimationFrameRef.current = requestAnimationFrame(checkAudioLevel);
      setError(null);
    } catch (err: any) {
      console.error('Audio setup failed:', err);
      setError('Audio monitoring failed to start');
    }
  }, [stream, threshold, sustainedDurationMs, cooldownMs]);

  const stopAudioDetection = useCallback(() => {
    if (requestAnimationFrameRef.current) {
      cancelAnimationFrame(requestAnimationFrameRef.current);
      requestAnimationFrameRef.current = null;
    }
    if (sourceRef.current) {
      sourceRef.current.disconnect();
      sourceRef.current = null;
    }
    analyserRef.current = null;
    setAudioStatus('IDLE');
    sustainedStartTimeRef.current = null;
    lastBelowThresholdTimeRef.current = null;
    smoothedLevelRef.current = 0;
  }, []);

  useEffect(() => {
    return () => stopAudioDetection();
  }, [stopAudioDetection]);

  return {
    audioStatus,
    audioLevel: Math.round(smoothedLevelRef.current),
    startAudioDetection,
    stopAudioDetection,
    error
  };
}
