import { useState, useEffect, useCallback } from 'react';

export function useProctoring() {
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [permissionDenied, setPermissionDenied] = useState<boolean>(false);
  const [isMonitoring, setIsMonitoring] = useState<boolean>(false);
  const [error, setError] = useState<string>('');

  const startMonitoring = useCallback(async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: true,
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false
        }
      });
      setStream(mediaStream);
      setPermissionDenied(false);
      setIsMonitoring(true);
      setError('');
      return true;
    } catch (err: any) {
      console.error('Proctoring setup failed:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setPermissionDenied(true);
        setError('Camera and microphone access is required to take this assessment. Please grant permissions and try again.');
      } else if (err.name === 'NotFoundError' || err.name === 'DevicesNotFoundError') {
        setError('No camera or microphone found. Please connect them and try again.');
        setPermissionDenied(true);
      } else {
        setError('An unexpected error occurred while accessing the camera/microphone.');
        setPermissionDenied(true);
      }
      return false;
    }
  }, []);

  const stopMonitoring = useCallback(() => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
    setIsMonitoring(false);
  }, [stream]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach(track => track.stop());
      }
    };
  }, [stream]);

  const permissionGranted = !!stream && !permissionDenied;
  const isCameraEnabled = !!stream && stream.getVideoTracks().length > 0;
  const isMicrophoneEnabled = !!stream && stream.getAudioTracks().length > 0;

  return {
    stream,
    permissionGranted,
    isCameraEnabled,
    isMicrophoneEnabled,
    permissionDenied,
    isMonitoring,
    error,
    startMonitoring,
    stopMonitoring
  };
}
