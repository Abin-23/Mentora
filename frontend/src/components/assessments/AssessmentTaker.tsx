import { useState, useEffect, useRef } from 'react';
import { useProctoring } from '../../hooks/useProctoring';
import { useFaceDetection } from '../../hooks/useFaceDetection';
import { useAudioActivity, initGlobalAudioContext } from '../../hooks/useAudioActivity';

interface AssessmentTakerProps {
  assessmentId: number;
  onClose: () => void;
}

export default function AssessmentTaker({ assessmentId, onClose }: AssessmentTakerProps) {
  const [attempt, setAttempt] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isGeneratingNext, setIsGeneratingNext] = useState(false);
  
  const [answers, setAnswers] = useState<Record<number, number>>({}); // questionId -> optionId
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasStarted, setHasStarted] = useState(false);
  
  const [videoEl, setVideoEl] = useState<HTMLVideoElement | null>(null);

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';
  const token = localStorage.getItem('access_token');

  const { stream, permissionGranted, isCameraEnabled, isMicrophoneEnabled, isMonitoring, error: proctorError, startMonitoring, stopMonitoring } = useProctoring();
  const { faceCount, faceStatus, isPhoneDetected, isLookingAway, isModelLoading, error: faceError, startFaceDetection, stopFaceDetection } = useFaceDetection(videoEl);
  const audioLevelRef = useRef<HTMLSpanElement>(null);
  const { audioStatus, startAudioDetection, stopAudioDetection } = useAudioActivity(stream, {
    onAudioLevel: (level) => {
      if (audioLevelRef.current) {
        audioLevelRef.current.innerText = `Vol: ${level}`;
      }
    }
  });

  const [warningCount, setWarningCount] = useState(0);
  const [showWarningModal, setShowWarningModal] = useState(false);
  const [latestWarningReason, setLatestWarningReason] = useState('');

  const warningInProgressRef = useRef(false);
  const assessmentTerminatedRef = useRef(false);
  const activeIncidentRef = useRef<string | null>(null);

  const [showPipeline, setShowPipeline] = useState(false);
  const [pipelineStep, setPipelineStep] = useState(0);
  const [pipelineStatus, setPipelineStatus] = useState<'PENDING' | 'PROCESSING' | 'COMPLETED' | 'FAILED'>('PENDING');
  const [analysisData, setAnalysisData] = useState<any>(null);
  const [finalScore, setFinalScore] = useState<number | null>(null);

  const [timeLeft, setTimeLeft] = useState<number | null>(null);
  const timerRef = useRef<number | null>(null);

  const timeoutRef = useRef<number | null>(null);
  const phoneTimeoutRef = useRef<number | null>(null);
  const gazeTimeoutRef = useRef<number | null>(null);

  // Fetch attempt on mount to check if it's already terminated
  useEffect(() => {
    const fetchCurrentAttempt = async () => {
      try {
        const res = await fetch(`${API_URL}/assessments/${assessmentId}/attempts/current`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          if (data) {
             const isTerminated = data.status === 'CANCELLED' || data.warningCount >= 3;
             if (isTerminated) {
                assessmentTerminatedRef.current = true;
                setWarningCount(data.warningCount >= 3 ? data.warningCount : 3);
                setLatestWarningReason('Previous proctoring violation');
                
                const assessmentRes = await fetch(`${API_URL}/assessments/${assessmentId}`, {
                  headers: { Authorization: `Bearer ${token}` }
                });
                const assessmentData = await assessmentRes.json();
                
                setAttempt({ ...data, assessment: assessmentData });
                setHasStarted(true);
                setShowWarningModal(true);
             }
          }
        }
      } catch (err) {
        console.warn('Failed to fetch current attempt', err);
      }
    };
    fetchCurrentAttempt();
  }, [assessmentId, API_URL, token]);

  // Timer logic
  useEffect(() => {
    if (!attempt?.expires_at || assessmentTerminatedRef.current || !hasStarted) {
       if (timerRef.current) window.clearInterval(timerRef.current);
       return;
    }
    
    const updateTimer = () => {
      if (assessmentTerminatedRef.current) {
        if (timerRef.current) window.clearInterval(timerRef.current);
        return;
      }
      const now = new Date().getTime();
      const expiry = new Date(attempt.expires_at).getTime();
      const diff = Math.max(0, Math.floor((expiry - now) / 1000));
      setTimeLeft(diff);
      if (diff === 0) {
        if (timerRef.current) window.clearInterval(timerRef.current);
      }
    };
    
    updateTimer();
    timerRef.current = window.setInterval(updateTimer, 1000);
    
    return () => {
      if (timerRef.current) window.clearInterval(timerRef.current);
    };
  }, [attempt?.expires_at, assessmentTerminatedRef.current, hasStarted]);

  const formatTime = (secs: number) => {
    const m = Math.floor(secs / 60);
    const s = secs % 60;
    return `${m}:${s < 10 ? '0' : ''}${s}`;
  };

  const startAttempt = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch(`${API_URL}/assessments/${assessmentId}/attempts`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to start attempt');
      
      const assessmentRes = await fetch(`${API_URL}/assessments/${assessmentId}`, {
        headers: { Authorization: `Bearer ${token}` }
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
    
    // Explicitly initialize and resume the audio context right on the user's click!
    initGlobalAudioContext();
    
    setHasStarted(true);
    startAttempt();
  };

  const logSecurityEvent = async (eventType: string, severity: string, metadata?: any) => {
    if (!attempt?.attempt_id || assessmentTerminatedRef.current || warningInProgressRef.current) return;
    
    warningInProgressRef.current = true;
    try {
      const res = await fetch(`${API_URL}/assessments/attempts/${attempt.attempt_id}/events`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
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
        'MICROPHONE_DISCONNECTED': 'Microphone disconnected',
        'AUDIO_ACTIVITY': 'Audio activity detected during the assessment.'
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
      warningInProgressRef.current = false;
    }
  };

  useEffect(() => {
    if (hasStarted && isMonitoring && videoEl) {
      startFaceDetection();
      startAudioDetection();
    } else {
      stopFaceDetection();
      stopAudioDetection();
    }
  }, [hasStarted, isMonitoring, videoEl, startFaceDetection, stopFaceDetection, startAudioDetection, stopAudioDetection]);

  // Monitor for device disconnection
  useEffect(() => {
    if (!stream || !hasStarted || isSubmitting || assessmentTerminatedRef.current) return;

    const tracks = stream.getTracks();
    const handleTrackEnded = async (e: Event) => {
      const track = e.target as MediaStreamTrack;
      const eventType = track.kind === 'video' ? 'CAMERA_DISCONNECTED' : 'MICROPHONE_DISCONNECTED';
      if (activeIncidentRef.current !== eventType && !warningInProgressRef.current && !assessmentTerminatedRef.current) {
        activeIncidentRef.current = eventType;
        await logSecurityEvent(eventType, 'HIGH', { source: "BROWSER_PROCTORING" });
      }
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
      if (document.visibilityState === 'hidden' && attempt?.attempt_id && !isSubmitting && !assessmentTerminatedRef.current && !warningInProgressRef.current) {
        await logSecurityEvent('TAB_SWITCH', 'HIGH', { source: "BROWSER_PROCTORING" });
      }
    };
    
    const handleFullscreenChange = async () => {
      if (!document.fullscreenElement && attempt?.attempt_id && !isSubmitting && !assessmentTerminatedRef.current && !warningInProgressRef.current) {
        await logSecurityEvent('FULLSCREEN_EXIT', 'HIGH', { source: "BROWSER_PROCTORING" });
      }
    };

    // Anti-Cheating: Block Right-Click and Copy/Paste
    const handleContextMenu = (e: MouseEvent) => e.preventDefault();
    const handleCopyPaste = (e: ClipboardEvent) => e.preventDefault();
    const handleKeyDown = (e: KeyboardEvent) => {
      // Block Ctrl+C, Ctrl+V, Cmd+C, Cmd+V, and Print Screen
      if ((e.ctrlKey || e.metaKey) && (e.key === 'c' || e.key === 'v' || e.key === 'x')) {
        e.preventDefault();
      }
      if (e.key === 'PrintScreen') {
        e.preventDefault();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    document.addEventListener('contextmenu', handleContextMenu);
    document.addEventListener('copy', handleCopyPaste);
    document.addEventListener('cut', handleCopyPaste);
    document.addEventListener('paste', handleCopyPaste);
    document.addEventListener('keydown', handleKeyDown);
    
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      document.removeEventListener('fullscreenchange', handleFullscreenChange);
      document.removeEventListener('contextmenu', handleContextMenu);
      document.removeEventListener('copy', handleCopyPaste);
      document.removeEventListener('cut', handleCopyPaste);
      document.removeEventListener('paste', handleCopyPaste);
      document.removeEventListener('keydown', handleKeyDown);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasStarted, isSubmitting, attempt]);

  // Face detection debouncing
  useEffect(() => {
    if (!hasStarted || isSubmitting || !attempt?.attempt_id || assessmentTerminatedRef.current) return;
    
    if (faceStatus === 'ONE_FACE') {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
        timeoutRef.current = null;
      }
      activeIncidentRef.current = null;
    } else if (faceStatus === 'NO_FACE') {
      if (activeIncidentRef.current !== 'NO_FACE' && !timeoutRef.current && !warningInProgressRef.current && !assessmentTerminatedRef.current) {
        timeoutRef.current = window.setTimeout(() => {
          activeIncidentRef.current = 'NO_FACE';
          timeoutRef.current = null;
          logSecurityEvent('FACE_NOT_DETECTED', 'MEDIUM', { source: "BROWSER_PROCTORING", faceCount: 0 });
        }, 3000);
      }
    } else if (faceStatus === 'MULTIPLE_FACES') {
      if (activeIncidentRef.current !== 'MULTIPLE_FACES' && !timeoutRef.current && !warningInProgressRef.current && !assessmentTerminatedRef.current) {
        timeoutRef.current = window.setTimeout(() => {
          activeIncidentRef.current = 'MULTIPLE_FACES';
          timeoutRef.current = null;
          logSecurityEvent('MULTIPLE_FACES', 'HIGH', { source: "BROWSER_PROCTORING", faceCount });
        }, 2500);
      }
    }

    // Cell Phone logic - Triggers Instantly
    if (isPhoneDetected) {
      if (activeIncidentRef.current !== 'CELL_PHONE_DETECTED' && !warningInProgressRef.current && !assessmentTerminatedRef.current) {
        activeIncidentRef.current = 'CELL_PHONE_DETECTED';
        logSecurityEvent('CELL_PHONE_DETECTED', 'HIGH', { source: "BROWSER_PROCTORING" });
      }
    }

    // Gaze tracking logic
    if (isLookingAway) {
      if (activeIncidentRef.current !== 'SUSPICIOUS_GAZE' && !gazeTimeoutRef.current && !warningInProgressRef.current && !assessmentTerminatedRef.current) {
        gazeTimeoutRef.current = window.setTimeout(() => {
          activeIncidentRef.current = 'SUSPICIOUS_GAZE';
          gazeTimeoutRef.current = null;
          logSecurityEvent('SUSPICIOUS_GAZE', 'MEDIUM', { source: "BROWSER_PROCTORING" });
        }, 1000); // reduced to 1s
      }
    } else {
      if (gazeTimeoutRef.current) {
        clearTimeout(gazeTimeoutRef.current);
        gazeTimeoutRef.current = null;
      }
    }

    // Audio Activity logic
    if (audioStatus === 'SUSTAINED_ACTIVITY') {
      if (activeIncidentRef.current !== 'AUDIO_ACTIVITY' && !warningInProgressRef.current && !assessmentTerminatedRef.current) {
        activeIncidentRef.current = 'AUDIO_ACTIVITY';
        logSecurityEvent('AUDIO_ACTIVITY', 'MEDIUM', { source: "BROWSER_PROCTORING" });
      }
    } else if (audioStatus === 'IDLE' && activeIncidentRef.current === 'AUDIO_ACTIVITY') {
      activeIncidentRef.current = null;
    }

    return () => {};
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [faceStatus, audioStatus, isPhoneDetected, isLookingAway, hasStarted, isSubmitting, attempt?.attempt_id, faceCount]);

  useEffect(() => {
    return () => {
       if (timeoutRef.current) clearTimeout(timeoutRef.current);
       if (phoneTimeoutRef.current) clearTimeout(phoneTimeoutRef.current);
       if (gazeTimeoutRef.current) clearTimeout(gazeTimeoutRef.current);
    }
  }, []);

  const handleSelectOption = async (questionId: number, optionId: number) => {
    if (assessmentTerminatedRef.current) return;
    setAnswers(prev => ({ ...prev, [questionId]: optionId }));
    
    try {
      await fetch(`${API_URL}/assessments/attempts/${attempt.attempt_id}/answers`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}` 
        },
        body: JSON.stringify({ questionId, selectedOptionId: optionId })
      });

      if (
        attempt?.assessment?.is_system_generated && 
        attempt?.assessment?.assessment_type === 'TOPIC' &&
        !isGeneratingNext
      ) {
        const isLastCurrentQuestion = attempt.assessment.questions[attempt.assessment.questions.length - 1].question.question_id === questionId;
        
        if (isLastCurrentQuestion && attempt.assessment.questions.length < attempt.assessment.total_questions) {
          setIsGeneratingNext(true);
          try {
            const nextRes = await fetch(`${API_URL}/assessments/attempts/${attempt.attempt_id}/next-question`, {
              method: 'POST',
              headers: { Authorization: `Bearer ${token}` }
            });
            
            if (nextRes.ok) {
              const newQuestion = await nextRes.json();
              setAttempt((prev: any) => ({
                ...prev,
                assessment: {
                  ...prev.assessment,
                  questions: [
                    ...prev.assessment.questions,
                    { question: newQuestion, sequence_number: prev.assessment.questions.length + 1 }
                  ]
                }
              }));
            }
          } catch (e) {
            console.error('Failed to generate next question', e);
            alert("Failed to generate the next question because the AI service is currently overloaded or out of quota. You may submit the assessment as is, or refresh the page to try again.");
          } finally {
            setIsGeneratingNext(false);
          }
        }
      }
    } catch (e) {
      console.error('Failed to save answer', e);
    }
  };

  const submitAssessment = async () => {
    if (assessmentTerminatedRef.current) return;
    if (!window.confirm('Are you sure you want to submit your assessment?')) return;
    setIsSubmitting(true);
    setShowPipeline(true);
    setPipelineStatus('PROCESSING');
    setPipelineStep(0);
    
    if (document.fullscreenElement) {
      await document.exitFullscreen().catch(e => console.warn(e));
    }
    stopFaceDetection();
    stopAudioDetection();
    stopMonitoring();

    // Start a visual progression timer so the user sees steps advancing while waiting for backend
    let visualStep = 0;
    const visualInterval = setInterval(() => {
      if (visualStep < 4) { // Don't advance past Knowledge Graph without data
        visualStep++;
        setPipelineStep(visualStep);
      }
    }, 1000);

    try {
      const res = await fetch(`${API_URL}/assessments/attempts/${attempt.attempt_id}/submit`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.message || 'Failed to submit');
      
      clearInterval(visualInterval);
      setFinalScore(data.attempt?.percentage || data.percentage);
      setAnalysisData(data.analysis);
      
      // Fast-forward remaining steps now that we have data
      let fastStep = visualStep;
      const fastInterval = setInterval(() => {
        fastStep++;
        setPipelineStep(fastStep);
        if (fastStep >= 8) {
          clearInterval(fastInterval);
          setPipelineStatus('COMPLETED');
        }
      }, 200);
      
    } catch (err: any) {
      clearInterval(visualInterval);
      setPipelineStatus('FAILED');
      alert(`Processing Failed: ${err.message}`);
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

  if (showPipeline) {
    const steps = [
      { id: 0, title: "Assessment Submitted", icon: "task_alt" },
      { id: 1, title: "Question-level performance", icon: "analytics" },
      { id: 2, title: "Topic performance", icon: "category" },
      { id: 3, title: "Concept performance", icon: "psychology" },
      { id: 4, title: "Knowledge graph sync", icon: "hub" },
      { id: 5, title: "Identify strengths / weaknesses", icon: "troubleshoot" },
      { id: 6, title: "Adaptive recommendation", icon: "model_training" },
      { id: 7, title: "Personalized next activity", icon: "auto_awesome" }
    ];

    if (pipelineStatus === 'COMPLETED' && analysisData) {
      return (
        <div className="bg-surface rounded-2xl shadow-2xl border border-outline-variant/30 p-12 h-full flex flex-col relative overflow-y-auto max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
              Assessment Analysis Complete
            </h2>
            <div className="flex justify-center items-center gap-6 mt-4">
              <div className="text-center">
                <div className="text-4xl font-bold text-on-surface">{finalScore}%</div>
                <div className="text-xs font-bold text-text-secondary uppercase tracking-widest mt-1">Overall Score</div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-6 mb-8">
            <div className="bg-green-500/5 border border-green-500/20 rounded-xl p-6">
              <h3 className="font-bold text-green-700 flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined">trending_up</span> Strengths
              </h3>
              {analysisData.strengths?.length > 0 ? (
                <ul className="space-y-2">
                  {analysisData.strengths.map((s: any, i: number) => (
                    <li key={i} className="text-sm font-medium flex justify-between">
                      <span>{s.title}</span>
                      <span className="text-green-600 font-bold">{s.percentage}%</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-text-secondary italic">No clear strengths identified yet.</div>
              )}
            </div>

            <div className="bg-orange-500/5 border border-orange-500/20 rounded-xl p-6">
              <h3 className="font-bold text-orange-700 flex items-center gap-2 mb-4">
                <span className="material-symbols-outlined">trending_down</span> Needs Practice
              </h3>
              {analysisData.weaknesses?.length > 0 ? (
                <ul className="space-y-2">
                  {analysisData.weaknesses.map((s: any, i: number) => (
                    <li key={i} className="text-sm font-medium flex justify-between">
                      <span>{s.title}</span>
                      <span className="text-orange-600 font-bold">{s.percentage}%</span>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="text-sm text-text-secondary italic">No major weaknesses identified!</div>
              )}
            </div>
          </div>

          <div className="bg-surface-container rounded-xl p-6 mb-8">
            <h3 className="font-bold text-lg mb-4 flex items-center gap-2">
              <span className="material-symbols-outlined text-primary">hub</span> Knowledge Graph
            </h3>
            {analysisData.neo4jSyncSuccess ? (
              <div className="text-green-600 font-bold flex items-center gap-2">
                <span className="material-symbols-outlined">check_circle</span> Knowledge Graph Updated Successfully
              </div>
            ) : (
              <div className="text-error font-bold flex items-center gap-2">
                <span className="material-symbols-outlined">warning</span> Knowledge Graph Update Failed
              </div>
            )}
          </div>

          <div className="flex justify-center mt-auto">
            <button 
              onClick={onClose}
              className="bg-primary text-white px-10 py-4 rounded-xl font-bold text-lg hover:scale-105 active:scale-95 transition-transform shadow-xl shadow-primary/20 flex items-center gap-2"
            >
              Continue Learning
              <span className="material-symbols-outlined">arrow_forward</span>
            </button>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-surface rounded-2xl shadow-2xl border border-outline-variant/30 p-12 h-full flex flex-col items-center justify-center max-w-4xl mx-auto animate-in fade-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <h2 className="text-4xl font-black bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent mb-2">
            Analyzing Performance
          </h2>
          <p className="text-text-secondary text-lg">
            Generating your personalized learning intelligence...
          </p>
        </div>

        <div className="w-full max-w-2xl bg-surface-container rounded-2xl p-8 relative overflow-hidden">
          {/* Animated Background Gradient */}
          <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-secondary/5 animate-pulse" />
          
          <div className="relative z-10 flex flex-col gap-4">
            {steps.map((s, index) => {
              const isPast = pipelineStep > index;
              const isCurrent = pipelineStep === index;
              const isFailed = pipelineStatus === 'FAILED' && isCurrent;
              
              let statusIcon = s.icon;
              if (isPast) statusIcon = 'check';
              if (isFailed) statusIcon = 'warning';
              if (s.id === 4 && analysisData && !analysisData.neo4jSyncSuccess) statusIcon = 'warning';

              return (
                <div 
                  key={s.id} 
                  className={`flex items-center gap-4 p-4 rounded-xl transition-all duration-500 ${
                    pipelineStep >= index 
                      ? 'bg-white shadow-md border border-primary/20 scale-100 opacity-100 translate-x-0' 
                      : 'opacity-30 scale-95 -translate-x-4 border border-transparent'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                    isFailed || (s.id === 4 && analysisData && !analysisData.neo4jSyncSuccess)
                      ? 'bg-error text-white'
                      : isPast 
                        ? 'bg-green-500 text-white' 
                        : isCurrent 
                          ? 'bg-primary text-white animate-pulse' 
                          : 'bg-surface-container-highest text-text-secondary'
                  }`}>
                    <span className="material-symbols-outlined text-xl">
                      {statusIcon}
                    </span>
                  </div>
                  <div className="flex-1">
                    <h4 className={`font-bold text-lg ${pipelineStep >= index ? 'text-on-surface' : 'text-text-secondary'}`}>
                      {s.title}
                    </h4>
                    {isCurrent && !isFailed && (
                      <div className="w-full h-1 bg-surface-container-highest rounded-full mt-2 overflow-hidden">
                        <div className="h-full bg-primary animate-[progress_0.8s_ease-in-out_infinite]" style={{width: '50%', transformOrigin: 'left'}} />
                      </div>
                    )}
                    {isFailed && (
                      <div className="text-error text-sm font-bold mt-1">Processing Failed</div>
                    )}
                    {s.id === 4 && analysisData && !analysisData.neo4jSyncSuccess && (
                       <div className="text-error text-sm font-bold mt-1">Update Failed</div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
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
        <p className="text-text-secondary mb-4">
          This assessment requires camera and microphone monitoring to ensure academic integrity. Face analysis is performed locally in your browser. Camera footage is not recorded or uploaded.
        </p>

        <div className="bg-error/5 border border-error/20 rounded-xl p-6 mb-6">
          <h3 className="text-lg font-bold text-error mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined">rule</span>
            Strict Proctoring Rules & Regulations
          </h3>
          <ul className="list-disc pl-5 space-y-2 text-sm text-on-surface">
            <li><strong>Face Visibility:</strong> Your face must remain visible and centered at all times. Multiple faces are prohibited.</li>
            <li><strong>Audio Monitoring:</strong> Talking or sustained background noise will trigger a warning.</li>
            <li><strong>Device Prohibition:</strong> The use of cell phones, tablets, or secondary devices is strictly prohibited. AI Object Detection will instantly flag physical devices.</li>
            <li><strong>Gaze Tracking:</strong> Your eye movements are tracked. Looking away from the screen for prolonged periods will result in a strike.</li>
            <li><strong>Browser Lockdown:</strong> Switching tabs or exiting full-screen mode will instantly trigger a warning. Right-clicking, highlighting, and copy/pasting are disabled.</li>
            <li><strong>Strikes:</strong> You are allowed a maximum of 3 warnings. On the 3rd warning, your assessment will be immediately terminated.</li>
          </ul>
        </div>
        
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

  // Generate dynamic watermark pattern
  const watermarkText = `MENTORA - Student ID: ${attempt.student_id} - ${new Date().toISOString().split('T')[0]}`;

  return (
    <div className="bg-white rounded-2xl shadow-xl shadow-black/5 border border-outline-variant/30 p-8 h-full flex flex-col relative overflow-hidden select-none">
      
      {/* Dynamic Screen Watermark */}
      <div className="absolute inset-0 pointer-events-none opacity-[0.03] z-50 flex flex-wrap justify-center items-center overflow-hidden" aria-hidden="true">
        {Array.from({ length: 50 }).map((_, i) => (
          <div key={i} className="transform -rotate-45 text-xl font-bold whitespace-nowrap px-8 py-12 text-black">
            {watermarkText}
          </div>
        ))}
      </div>

      {/* Warning Modal Overlay */}
      {showWarningModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm px-4">
          <div className="bg-surface rounded-2xl shadow-2xl p-8 max-w-md w-full border border-outline-variant/30 text-center animate-in fade-in zoom-in-95 duration-200">
            <span className="material-symbols-outlined text-6xl text-error mb-4">
              {warningCount >= 3 ? 'block' : 'warning'}
            </span>
            
            <h3 className="text-2xl font-bold mb-2 text-on-surface">
              {warningCount >= 3 ? 'Assessment Terminated' : 'Assessment Integrity Warning'}
            </h3>
            
            <p className="text-on-surface font-medium mb-4">
              {warningCount >= 3 ? 'Maximum allowed proctoring warnings reached.' : 'Proctoring rule triggered'}
            </p>

            <p className="text-error font-bold text-lg mb-6 bg-error/10 py-3 px-4 rounded-xl inline-block">
              {warningCount >= 3 ? `Final violation:\n${latestWarningReason}` : `Reason:\n${latestWarningReason}`}
            </p>
            
            <div className="text-text-secondary space-y-4 mb-8">
              <p className="font-medium text-lg">
                {warningCount >= 3 ? 'Warnings: 3 / 3' : `${warningCount} of 3`}
              </p>
              {warningCount < 3 && (
                <p>Please follow the assessment rules to continue.</p>
              )}
            </div>
            
            {warningCount < 3 ? (
              <button
                onClick={() => {
                  if (document.documentElement.requestFullscreen) {
                    document.documentElement.requestFullscreen().catch(() => {});
                  }
                  setShowWarningModal(false);
                  
                  // Give the user a 3-second grace period to fix the violation 
                  // before the AI is allowed to strike them again!
                  setTimeout(() => {
                    warningInProgressRef.current = false;
                    activeIncidentRef.current = null;
                  }, 3000);
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
          <div className="flex gap-4 items-center">
            <p className="text-sm text-text-secondary">Attempt {attempt.attempt_number} of {attempt.assessment.max_attempts}</p>
            {timeLeft !== null && (
               <p className="text-sm font-bold bg-primary/10 text-primary px-2 py-0.5 rounded">
                 Time Left: {formatTime(timeLeft)}
               </p>
            )}
            <p className="text-sm font-bold bg-error/10 text-error px-2 py-0.5 rounded">
               Integrity: {warningCount} / 3
            </p>
          </div>
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
                  <label key={opt.option_id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${answers[q.question_id] === opt.option_id ? 'border-primary bg-primary/5' : 'border-outline-variant/30 hover:bg-surface-container-low'} ${(assessmentTerminatedRef.current || (attempt?.assessment?.is_system_generated && attempt?.assessment?.assessment_type === 'TOPIC' && answers[q.question_id] !== undefined)) ? 'opacity-50 cursor-not-allowed' : ''}`}>
                    <input 
                      type="radio" 
                      name={`question-${q.question_id}`} 
                      value={opt.option_id}
                      checked={answers[q.question_id] === opt.option_id}
                      onChange={() => handleSelectOption(q.question_id, opt.option_id)}
                      disabled={assessmentTerminatedRef.current || (attempt?.assessment?.is_system_generated && attempt?.assessment?.assessment_type === 'TOPIC' && answers[q.question_id] !== undefined)}
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
        
        {isGeneratingNext && (
          <div className="bg-surface-container-lowest p-6 rounded-xl border border-outline-variant/30 flex items-center justify-center gap-3 animate-pulse">
            <span className="material-symbols-outlined animate-spin text-primary">refresh</span>
            <span className="text-text-secondary font-medium">Adapting to your answer and generating next question...</span>
          </div>
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
        <div className="fixed bottom-8 right-8 z-50 flex flex-col items-end gap-2 pointer-events-none">
          <div className="w-48 aspect-video bg-black rounded-xl overflow-hidden shadow-2xl border-2 border-primary/50 flex items-center justify-center group relative">
            <video
              ref={(node) => {
                if (node) {
                  if (stream && node.srcObject !== stream) {
                    node.srcObject = stream;
                  }
                  if (node !== videoEl) {
                    setVideoEl(node);
                  }
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
            {faceError ? (
              <div className="text-[10px] font-bold text-error break-words w-full">{faceError}</div>
            ) : isModelLoading ? (
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
          <div className="bg-white/95 backdrop-blur-sm border border-outline-variant/30 shadow-lg px-3 py-2 rounded-lg flex items-center justify-between gap-2 max-w-[192px] w-full">
            <div className="flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
              <span className="text-xs font-bold text-text-secondary">Mic</span>
            </div>
            <span ref={audioLevelRef} className="text-xs font-mono font-bold text-text-secondary">Vol: 0</span>
          </div>
          <div className="text-[9px] text-text-secondary/70 bg-white/50 backdrop-blur-sm px-2 py-1 rounded">
            Processed locally
          </div>
        </div>
      )}
    </div>
  );
}
