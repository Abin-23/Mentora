import { useState, useEffect, useRef, useCallback } from 'react';
import { FaceLandmarker, ObjectDetector, FilesetResolver } from '@mediapipe/tasks-vision';

export type FaceStatus = 'NO_FACE' | 'ONE_FACE' | 'MULTIPLE_FACES' | 'UNKNOWN';

export function useFaceDetection(videoElement: HTMLVideoElement | null) {
  const [faceCount, setFaceCount] = useState<number>(0);
  const [faceStatus, setFaceStatus] = useState<FaceStatus>('UNKNOWN');
  const [isPhoneDetected, setIsPhoneDetected] = useState<boolean>(false);
  const [isLookingAway, setIsLookingAway] = useState<boolean>(false);
  
  const [isModelLoading, setIsModelLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>('');
  const [isActive, setIsActive] = useState<boolean>(false);
  
  const landmarkerRef = useRef<FaceLandmarker | null>(null);
  const objectDetectorRef = useRef<ObjectDetector | null>(null);
  const requestRef = useRef<number | null>(null);
  const lastVideoTimeRef = useRef<number>(-1);

  const startFaceDetection = useCallback(() => {
    setIsActive(true);
  }, []);

  const stopFaceDetection = useCallback(() => {
    setIsActive(false);
    setFaceStatus('UNKNOWN');
    setFaceCount(0);
    if (requestRef.current) {
      cancelAnimationFrame(requestRef.current);
    }
  }, []);

  // Initialize MediaPipe Models
  useEffect(() => {
    let isMounted = true;
    
    const initializeModel = async () => {
      try {
        setIsModelLoading(true);
        const vision = await FilesetResolver.forVisionTasks(
          "https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@0.10.3/wasm"
        );
        
        // 1. Face Landmarker (Replaces FaceDetector, gives us Iris tracking + Head Pose)
        const landmarker = await FaceLandmarker.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task`,
            delegate: "GPU"
          },
          outputFaceBlendshapes: true,
          runningMode: "VIDEO",
          numFaces: 5
        });

        // 2. Object Detector (For catching cell phones/tablets)
        const objectDetector = await ObjectDetector.createFromOptions(vision, {
          baseOptions: {
            modelAssetPath: `https://storage.googleapis.com/mediapipe-models/object_detector/efficientdet_lite0/float16/1/efficientdet_lite0.tflite`,
            delegate: "GPU"
          },
          scoreThreshold: 0.25, // Lowered from 0.5 to catch blurry or partial phones instantly
          runningMode: "VIDEO"
        });
        
        if (isMounted) {
          landmarkerRef.current = landmarker;
          objectDetectorRef.current = objectDetector;
          setIsModelLoading(false);
        }
      } catch (err: any) {
        console.error('Failed to initialize AI Models:', err);
        if (isMounted) {
          setError('Failed to load AI models. Please ensure you are connected to the internet.');
          setIsModelLoading(false);
        }
      }
    };

    initializeModel();

    return () => {
      isMounted = false;
      if (landmarkerRef.current) landmarkerRef.current.close();
      if (objectDetectorRef.current) objectDetectorRef.current.close();
    };
  }, []);

  // Run Detection Loop
  useEffect(() => {
    if (!isActive || !videoElement || !landmarkerRef.current || !objectDetectorRef.current) return;

    const detectFrame = () => {
      if (!isActive) return;
      
      // Ensure video is playing and has data
      if (videoElement.readyState >= 2 && !videoElement.paused) {
        const currentTime = videoElement.currentTime;
        
        // Only run detection if the video frame has advanced
        if (currentTime !== lastVideoTimeRef.current) {
          lastVideoTimeRef.current = currentTime;
          
          try {
            // 1. Check for Cell Phones
            if (objectDetectorRef.current) {
              const objDetections = objectDetectorRef.current.detectForVideo(videoElement, performance.now());
              const foundPhone = objDetections.detections.some(d => {
                const name = d.categories[0]?.categoryName?.toLowerCase() || '';
                return name.includes('cell phone') || name.includes('laptop') || name.includes('tv');
              });
              setIsPhoneDetected(foundPhone);
            }

            // 2. Process Faces & Gaze
            if (landmarkerRef.current) {
              const faceResult = landmarkerRef.current.detectForVideo(videoElement, performance.now());
              const numFaces = faceResult.faceLandmarks.length;
              
              setFaceCount(numFaces);
              
              if (numFaces === 0) {
                setFaceStatus('NO_FACE');
                setIsLookingAway(false);
              } else if (numFaces === 1) {
                setFaceStatus('ONE_FACE');
                
                // Extremely simple Gaze/Pose approximation:
                if (faceResult.faceBlendshapes && faceResult.faceBlendshapes.length > 0) {
                  const shapes = faceResult.faceBlendshapes[0].categories;
                  const lookDownL = shapes.find(s => s.categoryName === 'eyeLookDownLeft')?.score || 0;
                  const lookDownR = shapes.find(s => s.categoryName === 'eyeLookDownRight')?.score || 0;
                  const lookOutL = shapes.find(s => s.categoryName === 'eyeLookOutLeft')?.score || 0;
                  const lookOutR = shapes.find(s => s.categoryName === 'eyeLookOutRight')?.score || 0;
                  
                  // Average the left and right eye to prevent glitches from a single eye tracking error
                  const avgLookDown = (lookDownL + lookDownR) / 2;
                  const avgLookOut = (lookOutL + lookOutR) / 2;
                  
                  // Threshold raised to 0.35. A user looking down at a phone will score > 0.5.
                  // Looking at the bottom edge of a laptop screen rarely exceeds 0.25.
                  if (avgLookDown > 0.35 || avgLookOut > 0.35) {
                    setIsLookingAway(true);
                  } else {
                    setIsLookingAway(false);
                  }
                }
              } else {
                setFaceStatus('MULTIPLE_FACES');
                setIsLookingAway(false);
              }
            }
          } catch (err: any) {
            console.error('Detection runtime error:', err);
            setError(err.message || 'Detection failed');
          }
        }
      }
      
      requestRef.current = requestAnimationFrame(detectFrame);
    };

    requestRef.current = requestAnimationFrame(detectFrame);

    return () => {
      if (requestRef.current) {
        cancelAnimationFrame(requestRef.current);
      }
    };
  }, [isActive, videoElement]);

  return {
    faceCount,
    faceStatus,
    isPhoneDetected,
    isLookingAway,
    isModelLoading,
    error,
    startFaceDetection,
    stopFaceDetection
  };
}
