const fs = require('fs');

const content = `import { useState, useEffect, useRef } from 'react';
import { useProctoring } from '../../hooks/useProctoring';
import { useFaceDetection } from '../../hooks/useFaceDetection';

interface AssessmentTakerProps {
  assessmentId: number;
  onClose: () => void;
}

export default function AssessmentTaker({ assessmentId, onClose }: AssessmentTakerProps) {
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const [answers, setAnswers] = useState<Record<number, number>>({}); // questionId -> optionId
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  const { stream, permissionGranted, isCameraEnabled, isMicrophoneEnabled, permissionDenied, isMonitoring, error: proctorError, startMonitoring, stopMonitoring } = useProctoring();
  const { faceCount, faceStatus, isModelLoading, error: faceError, startFaceDetection, stopFaceDetection } = useFaceDetection(videoEl);

  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [latestWarningReason, setLatestWarningReason] = useState('');

  const warningInProgressRef = useRef(false);
  const assessmentTerminatedRef = useRef(false);

  const lastEventTimeRef = useRef<Record<string, number>>({});
  const timeoutRef = useRef<NodeJS.Timeout | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  const startAttempt = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(\`\${API_URL}/assessments/\${assessmentId}/attempts\`, {
        method: 'POST',
        headers: { Authorization: \`Bearer \${token}\` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to start attempt');
      
      const assessmentRes = await fetch(\`\${API_URL}/assessments/\${assessmentId}\`, {
        headers: { Authorization: \`Bearer \${token}\` }
      });
      const assessmentData = await assessmentRes.json();
      
      setAttempt({ ...data, assessment: assessmentData });
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const startAssessmentUI = async () => {
    if (!permissionGranted || !isCameraEnabled || !isMicrophoneEnabled) {
      return;
    }

    try {
      if (document.documentElement.requestFullscreen) {
        await document.documentElement.requestFullscreen();
      }
    } catch (e) {
      console.warn('Fullscreen request failed', e);
    }
    setHasStarted(true);
    startAttempt();
  };

  const logSecurityEvent = async (eventType: string, severity: string, metadata?: any) => {
    if (!attempt?.attempt_id || assessmentTerminatedRef.current || warningInProgressRef.current) return;
    
    warningInProgressRef.current = true;
    try {
      const res = await fetch(\`\${API_URL}/assessments/attempts/\${attempt.attempt_id}/events\`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${token}\` 
        },
        body: JSON.stringify({ eventType, severity, metadata })
      });
      
      if (!res.ok) throw new Error('API failed');
      const data = await res.json();
      
      setWarningCount(data.warningCount);
      
      const humanReadableReason: Record<string, string> = {
        'TAB_SWITCH': 'Tab switch detected',
        'FULLSCREEN_EXIT': 'Exited fullscreen mode',
        'FACE_NOT_DETECTED': 'Face not detected',
        'MULTIPLE_FACES': 'Multiple faces detected',
        'CAMERA_DISCONNECTED': 'Camera disconnected',
        'MICROPHONE_DISCONNECTED': 'Microphone disconnected'
      };

      setLatestWarningReason(humanReadableReason[eventType] || eventType);

      if (data.terminated || data.warningCount >= 3) {
        assessmentTerminatedRef.current = true;
        stopFaceDetection();
        stopMonitoring();
        setShowWarningModal(true);
      } else if (data.warningCount > 0) {
        setShowWarningModal(true);
      }
      
    } catch (e) {
      console.warn('Failed to log security event', e);
    } finally {
      warningInProgressRef.current = false;
    }
  };

  useEffect(() => {
    if (hasStarted && isMonitoring && videoEl) {
      startFaceDetection();
    } else {
      stopFaceDetection();
    }
  }, [hasStarted, isMonitoring, videoEl, startFaceDetection, stopFaceDetection]);

  // Monitor for device disconnection
  useEffect(() => {
    if (!stream || !hasStarted || isSubmitting || assessmentTerminatedRef.current) return;

    const tracks = stream.getTracks();
    const handleTrackEnded = async (e: Event) => {
      const track = e.target as MediaStreamTrack;
      const eventType = track.kind === 'video' ? 'CAMERA_DISCONNECTED' : 'MICROPHONE_DISCONNECTED';
      await logSecurityEvent(eventType, 'HIGH', { source: "BROWSER_PROCTORING" });
    };

    tracks.forEach(track => {
      track.addEventListener('ended', handleTrackEnded);
    });

    return () => {
      tracks.forEach(track => {
        track.removeEventListener('ended', handleTrackEnded);
      });
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [stream, hasStarted, isSubmitting]);

  useEffect(() => {
    if (!hasStarted || isSubmitting || assessmentTerminatedRef.current) return;

    const handleVisibilityChange = async () => {
      if (document.visibilityState === 'hidden' && attempt?.attempt_id && !isSubmitting && !assessmentTerminatedRef.current) {
        await logSecurityEvent('TAB_SWITCH', 'HIGH', { source: "BROWSER_PROCTORING" });
      }
    };
    
    const handleFullscreenChange = async () => {
      if (!document.fullscreenElement && attempt?.attempt_id && !isSubmitting && !assessmentTerminatedRef.current) {
        await logSecurityEvent('FULLSCREEN_EXIT', 'HIGH', { source: "BROWSER_PROCTORING" });
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted, isSubmitting, attempt]);

  // Face detection debouncing
  useEffect(() => {
    if (!hasStarted || isSubmitting || !attempt?.attempt_id || assessmentTerminatedRef.current) return;
    
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    if (faceStatus === 'NO_FACE') {
      timeoutRef.current = setTimeout(() => {
        const now = Date.now();
        const lastTime = lastEventTimeRef.current['FACE_NOT_DETECTED'] || 0;
        if (now - lastTime > 15000) { // 15s cooldown
          logSecurityEvent('FACE_NOT_DETECTED', 'MEDIUM', { source: "BROWSER_PROCTORING", faceCount: 0 });
          lastEventTimeRef.current['FACE_NOT_DETECTED'] = now;
        }
      }, 3000); // 3 seconds debounce
    } else if (faceStatus === 'MULTIPLE_FACES') {
      timeoutRef.current = setTimeout(() => {
        const now = Date.now();
        const lastTime = lastEventTimeRef.current['MULTIPLE_FACES'] || 0;
        if (now - lastTime > 15000) { // 15s cooldown
          logSecurityEvent('MULTIPLE_FACES', 'HIGH', { source: "BROWSER_PROCTORING", faceCount });
          lastEventTimeRef.current['MULTIPLE_FACES'] = now;
        }
      }, 2500); // 2.5 seconds debounce
    }

    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceStatus, hasStarted, isSubmitting, attempt?.attempt_id, faceCount]);

  const handleSelectOption = async (questionId: number, optionId: number) => {
    if (assessmentTerminatedRef.current) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    
    try {
      await fetch(\`\${API_URL}/assessments/attempts/\${attempt.attempt_id}/answers\`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: \`Bearer \${token}\` 
        },
        body: JSON.stringify({ questionId, selectedOptionId: optionId })
      });
    } catch (e) {
      console.error('Failed to save answer', e);
    }
  };

  const submitAssessment = async () => {
    if (assessmentTerminatedRef.current) return;
    if (!window.confirm('Are you sure you want to submit your assessment?')) return;
    setIsSubmitting(true);
    try {
      const res = await fetch(\`\${API_URL}/assessments/attempts/\${attempt.attempt_id}/submit\`, {
        method: 'POST',
        headers: { Authorization: \`Bearer \${token}\` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit');
      
      alert(\`Assessment Submitted! Score: \${data.percentage}%\`);
      
      if (document.fullscreenElement) {
        await document.exitFullscreen().catch(e => console.warn(e));
      }
      stopFaceDetection();
      stopMonitoring();
      onClose();
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (loading) {
    return <div className="p-10 text-center"><span className="material-symbols-outlined animate-spin text-4xl text-primary">refresh</span></div>;
  }

  if (error) {
    return (
      <div className="p-10 text-center text-error">
        <span className="material-symbols-outlined text-4xl mb-4">error</span>
        <p>{error}</p>
      </div>
    );
  }

  if (!hasStarted) {
    return (
      <div className="p-8 max-w-2xl mx-auto space-y-6">
        <div className="flex items-center gap-4 text-primary">
          <span className="material-symbols-outlined text-4xl">gpp_good</span>
          <h2 className="text-2xl font-bold">Assessment Setup</h2>
        </div>
        <p className="text-text-secondary">
          This assessment requires camera and microphone monitoring to ensure academic integrity. Face analysis is performed locally in your browser. Camera footage is not recorded or uploaded.
        </p>
        
        <div className="bg-surface-container rounded-xl p-6 space-y-4">
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">videocam</span> Camera
            </span>
            {isCameraEnabled ? (
              <span className="text-green-600 flex items-center gap-1 font-bold"><span className="material-symbols-outlined text-sm">check_circle</span> Ready</span>
            ) : (
              <span className="text-text-secondary">Not checked</span>
            )}
          </div>
          
          <div className="flex items-center justify-between">
            <span className="font-bold flex items-center gap-2">
              <span className="material-symbols-outlined">mic</span> Microphone
            </span>
            {isMicrophoneEnabled ? (
              <span className="text-green-600 flex items-center gap-1 font-bold"><span className="material-symbols-outlined text-sm">check_circle</span> Ready</span>
            ) : (
              <span className="text-text-secondary">Not checked</span>
            )}
          </div>
        </div>

        {permissionDenied && (
          <div className="bg-error/10 text-error p-4 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined">warning</span>
            <p className="text-sm">Camera or microphone access was denied. Please allow permissions in your browser settings to continue.</p>
          </div>
        )}

        {proctorError && (
          <div className="bg-error/10 text-error p-4 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined">error</span>
            <p className="text-sm">{proctorError}</p>
          </div>
        )}

        {faceError && (
          <div className="bg-error/10 text-error p-4 rounded-xl flex items-start gap-3">
            <span className="material-symbols-outlined">error</span>
            <p className="text-sm">{faceError}</p>
          </div>
        )}

        <div className="flex flex-col sm:flex-row gap-4 pt-4 border-t border-outline-variant/30">
          {!permissionGranted && (
            <button 
              onClick={startMonitoring}
              className="bg-primary/10 text-primary hover:bg-primary/20 px-6 py-3 rounded-xl font-bold flex-1 transition-colors"
            >
              Allow Camera & Microphone
            </button>
          )}
          <button 
            onClick={startAssessmentUI}
            disabled={!permissionGranted || !isCameraEnabled || !isMicrophoneEnabled}
            className="bg-primary text-white disabled:bg-surface-container-highest disabled:text-text-secondary px-6 py-3 rounded-xl font-bold flex-1 transition-all"
          >
            Start Assessment
          </button>
        </div>
      </div>
    );
  }

  if (!attempt || !attempt.assessment) return null;

  const questions = attempt.assessment.questions || [];

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-outline-variant/30 p-8 h-full flex flex-col relative">
      
      {/* Warning Modal Overlay */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-surface rounded-2xl shadow-2xl p-8 max-w-md w-full border border-outline-variant/30 text-center animate-in fade-in zoom-in-95 duration-200">
            <span className="material-symbols-outlined text-6xl text-error mb-4">
              {warningCount >= 3 ? 'block' : 'warning'}
            </span>
            
            <h3 className="text-2xl font-bold mb-2 text-on-surface">
              {warningCount >= 3 ? 'Final Assessment Integrity Warning' : 'Assessment Integrity Warning'}
            </h3>
            
            <p className="text-error font-bold text-lg mb-6 bg-error/10 py-3 px-4 rounded-xl inline-block">
              {latestWarningReason}
            </p>
            
            <div className="text-text-secondary space-y-4 mb-8">
              <p className="font-medium">
                {warningCount >= 3 ? 'Warning count: 3 / 3' : \`Warning \${warningCount} of 3\`}
              </p>
              <p>
                {warningCount >= 3 
                  ? 'The assessment has been terminated because the maximum number of permitted rule violations was reached.' 
                  : 'Please follow the assessment rules to continue.'}
              </p>
            </div>
            
            {warningCount < 3 ? (
              <button
                onClick={() => {
                  if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  }
                  setShowWarningModal(false);
                }}
                className="w-full bg-primary text-white font-bold py-3 px-6 rounded-xl hover:scale-[1.02] active:scale-[0.98] transition-transform"
              >
                Continue Assessment
              </button>
            ) : (
              <button
                onClick={() => {
                  if (document.fullscreenElement) {
                    document.exitFullscreen().catch(() => {});
                  }
                  onClose();
                }}
                className="w-full bg-surface-container-highest text-on-surface font-bold py-3 px-6 rounded-xl hover:bg-outline-variant transition-colors"
              >
                Close Assessment
              </button>
            )}
          </div>
        </div>
      )}

      <div className="flex justify-between items-center mb-6 border-b border-outline-variant/30 pb-4">
        <div>
          <h2 className="text-2xl font-bold">{attempt.assessment.title}</h2>
          <p className="text-sm text-text-secondary">Attempt {attempt.attempt_number} of {attempt.assessment.max_attempts}</p>
        </div>
        <button onClick={onClose} className="text-text-secondary hover:text-error transition-colors">
           <span className="material-symbols-outlined">close</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto custom-scrollbar pr-4 space-y-8">
        {questions.map((qMap: any, index: number) => {
          const q = qMap.question;
          if (!q) return null; // safety check
          return (
            <div key={q.question_id} className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30">
              <h3 className="font-bold text-lg mb-4 flex gap-3">
                <span className="text-primary">{index + 1}.</span> {q.question_text}
              </h3>
              <div className="space-y-3">
                {q.options?.map((opt: any) => (
                  <label key={opt.option_id} className={\`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors \${answers[q.question_id] === opt.option_id ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:bg-surface-container-low'} \${assessmentTerminatedRef.current ? 'opacity-50 cursor-not-allowed' : ''}\`}>
                    <input 
                      type="radio" 
                      name={\`question-\${q.question_id}\`} 
                      value={opt.option_id}
                      checked={answers[q.question_id] === opt.option_id}
                      onChange={() => handleSelectOption(q.question_id, opt.option_id)}
                      disabled={assessmentTerminatedRef.current}
                      className="w-4 h-4 text-primary focus:ring-primary disabled:opacity-50"
                    />
                    <span className="text-sm text-on-surface font-medium">{opt.option_text}</span>
                  </label>
                ))}
              </div>
            </div>
          );
        })}
        {questions.length === 0 && (
          <p className="text-center text-text-secondary">No questions loaded.</p>
        )}
      </div>

      <div className="mt-6 pt-4 border-t border-outline-variant/30 flex justify-end">
        <button 
          onClick={submitAssessment} 
          disabled={isSubmitting || assessmentTerminatedRef.current} 
          className="bg-primary text-white px-8 py-3 rounded-xl font-bold flex items-center gap-2 hover:scale-105 transition-all shadow-md disabled:bg-surface-container-highest disabled:text-text-secondary disabled:hover:scale-100"
        >
          {isSubmitting ? <span className="material-symbols-outlined animate-spin text-sm">refresh</span> : <span className="material-symbols-outlined text-sm">done_all</span>}
          Submit Assessment
        </button>
      </div>

      {/* Floating Video Feed */}
      {isMonitoring && !assessmentTerminatedRef.current && (
        <div className="absolute bottom-6 right-6 flex flex-col items-end gap-2 pointer-events-none">
          <div className="w-48 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-primary/50 flex items-center justify-center group relative">
            <video
              ref={(node) => {
                if (node && stream) {
                  node.srcObject = stream;
                  if (node !== videoEl) setVideoEl(node);
                }
              }}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
              style={{ transform: 'scaleX(-1)' }}
            />
            <div className="absolute top-2 left-2 flex items-center gap-1.5 bg-black/60 px-2 py-1 rounded-full backdrop-blur-sm">
              <span className="w-2 h-2 rounded-full bg-error animate-pulse"></span>
              <span className="text-[10px] text-white font-bold uppercase tracking-wider">Recording</span>
            </div>
          </div>
          
          {/* Face Detection Status Indicator */}
          <div className="bg-white/95 backdrop-blur-sm border border-outline-variant/30 shadow-lg px-3 py-2 rounded-lg flex items-center gap-2 max-w-[192px] w-full">
            {isModelLoading ? (
              <>
                <span className="material-symbols-outlined animate-spin text-sm text-text-secondary">refresh</span>
                <span className="text-xs font-bold text-text-secondary">Loading AI...</span>
              </>
            ) : faceStatus === 'ONE_FACE' ? (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-green-500"></span>
                <span className="text-xs font-bold text-text-secondary">Face detected</span>
              </>
            ) : faceStatus === 'NO_FACE' ? (
              <>
                <span className="material-symbols-outlined text-sm text-error">warning</span>
                <span className="text-xs font-bold text-error">Face not detected</span>
              </>
            ) : faceStatus === 'MULTIPLE_FACES' ? (
              <>
                <span className="material-symbols-outlined text-sm text-error">warning</span>
                <span className="text-xs font-bold text-error">Multiple faces detected</span>
              </>
            ) : (
              <>
                <span className="w-2.5 h-2.5 rounded-full bg-surface-container-highest"></span>
                <span className="text-xs font-bold text-text-secondary">Camera</span>
              </>
            )}
          </div>
          <div className="text-[9px] text-text-secondary/70 bg-white/50 backdrop-blur-sm px-2 py-1 rounded">
            Processed locally
          </div>
        </div>
      )}
    </div>
  );
}
`;

fs.writeFileSync('frontend/src/components/assessments/AssessmentTaker.tsx', content);
