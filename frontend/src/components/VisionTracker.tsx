import { useEffect, useRef, useState } from 'react';
import { visionAPI } from '../services/api';
import { usePomodoroStore } from '../store/pomodoroStore';

// Access MediaPipe from global window object (loaded via CDN in index.html)
const Camera = (window as any).Camera;
const FaceMesh = (window as any).FaceMesh;

const LEFT_EYE = [362, 385, 387, 263, 373, 380];
const RIGHT_EYE = [33, 160, 158, 133, 153, 144];
const EAR_THRESHOLD = 0.22;
const DROWSY_TIME_MS = 3000; // 3 seconds
const FACE_MISSING_MS = 10000; // 10 seconds
const LEFT_DESK_MS = 60000; // 60 seconds

export default function VisionTracker() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  
  const [isCameraActive, setIsCameraActive] = useState(false);
  const [status, setStatus] = useState('Initializing...');
  const [earValue, setEarValue] = useState(0);
  const [isMinimized, setIsMinimized] = useState(false);

  // State refs for logic within the mediapipe callback
  const stateRef = useRef({
    drowsyStart: 0,
    faceMissingStart: 0,
    lastFocusEvent: '',
    drowsyAlertSent: false
  });

  const { isRunning } = usePomodoroStore();

  useEffect(() => {
    if (!videoRef.current || !canvasRef.current) return;

    const faceMesh = new FaceMesh({
      locateFile: (file) => `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`
    });

    faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5
    });

    faceMesh.onResults(onResults);

    const camera = new Camera(videoRef.current, {
      onFrame: async () => {
        if (videoRef.current) {
          await faceMesh.send({ image: videoRef.current });
        }
      },
      width: 320,
      height: 240
    });

    camera.start().then(() => {
      setIsCameraActive(true);
      setStatus('Active');
    }).catch(err => {
      console.error(err);
      setStatus('Camera Access Denied');
    });

    return () => {
      camera.stop();
      faceMesh.close();
    };
  }, []);

  const calculateEAR = (landmarks: any[], indices: number[]) => {
    const p = indices.map(i => landmarks[i]);
    
    // distance = sqrt((x2-x1)^2 + (y2-y1)^2)
    const dist = (p1: any, p2: any) => Math.sqrt(Math.pow(p1.x - p2.x, 2) + Math.pow(p1.y - p2.y, 2));

    const vertical1 = dist(p[1], p[5]);
    const vertical2 = dist(p[2], p[4]);
    const horizontal = dist(p[0], p[3]);

    if (horizontal === 0) return 0;
    return (vertical1 + vertical2) / (2.0 * horizontal);
  };

  const onResults = (results: any) => {
    const canvas = canvasRef.current;
    const video = videoRef.current;
    if (!canvas || !video) return;

    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.save();
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    ctx.drawImage(results.image, 0, 0, canvas.width, canvas.height);

    const now = Date.now();
    const state = stateRef.current;

    // Check if face exists
    if (results.multiFaceLandmarks && results.multiFaceLandmarks.length > 0) {
      // Face detected
      if (state.faceMissingStart > 0) {
        state.faceMissingStart = 0;
        state.lastFocusEvent = '';
        setStatus('Active');
      }

      const landmarks = results.multiFaceLandmarks[0];
      
      const leftEar = calculateEAR(landmarks, LEFT_EYE);
      const rightEar = calculateEAR(landmarks, RIGHT_EYE);
      const avgEar = (leftEar + rightEar) / 2.0;
      
      setEarValue(avgEar);

      // Draw eye landmarks
      ctx.fillStyle = avgEar < EAR_THRESHOLD ? '#ff4757' : '#2ed573';
      [...LEFT_EYE, ...RIGHT_EYE].forEach(idx => {
        const point = landmarks[idx];
        ctx.beginPath();
        ctx.arc(point.x * canvas.width, point.y * canvas.height, 1.5, 0, 2 * Math.PI);
        ctx.fill();
      });

      // Drowsiness logic
      if (avgEar < EAR_THRESHOLD) {
        if (state.drowsyStart === 0) {
          state.drowsyStart = now;
        } else {
          const durationMs = now - state.drowsyStart;
          if (durationMs > DROWSY_TIME_MS) {
            setStatus(`DROWSY! (${(durationMs/1000).toFixed(1)}s)`);
            ctx.fillStyle = 'red';
            ctx.font = '24px Arial';
            ctx.fillText('DROWSY WARNING', 20, 50);

            if (!state.drowsyAlertSent && isRunning) { // Only report if pomodoro is running
              let severity = 'low';
              if (durationMs > 10000) severity = 'high';
              else if (durationMs > 5000) severity = 'medium';
              
              visionAPI.reportDrowsiness({
                eye_closure_duration: durationMs / 1000,
                severity
              }).catch(console.error);
              
              state.drowsyAlertSent = true;
            }
          }
        }
      } else {
        state.drowsyStart = 0;
        state.drowsyAlertSent = false;
        setStatus('Active');
      }

    } else {
      // No face detected
      if (state.faceMissingStart === 0) {
        state.faceMissingStart = now;
      } else {
        const durationMs = now - state.faceMissingStart;
        setStatus(`No Face Detected (${(durationMs/1000).toFixed(0)}s)`);
        
        if (durationMs > LEFT_DESK_MS && state.lastFocusEvent !== 'LEFT_DESK') {
          state.lastFocusEvent = 'LEFT_DESK';
          if (isRunning) {
            visionAPI.reportFocus({ event_type: 'LEFT_DESK', duration: durationMs / 1000 }).catch(console.error);
          }
        } else if (durationMs > FACE_MISSING_MS && state.lastFocusEvent !== 'FACE_MISSING' && state.lastFocusEvent !== 'LEFT_DESK') {
          state.lastFocusEvent = 'FACE_MISSING';
          if (isRunning) {
            visionAPI.reportFocus({ event_type: 'FACE_MISSING', duration: durationMs / 1000 }).catch(console.error);
          }
        }
      }
    }
    
    ctx.restore();
  };

  return (
    <div className={`vision-widget ${isMinimized ? 'minimized' : ''}`}>
      <div className="vision-header" onClick={() => setIsMinimized(!isMinimized)}>
        <span className="vision-title">📷 AI Vision Tracker</span>
        <span className="vision-toggle">{isMinimized ? '+' : '-'}</span>
      </div>
      
      {!isMinimized && (
        <div className="vision-body">
          <div className="video-container">
            {/* Hidden video element used for Mediapipe */}
            <video ref={videoRef} style={{ display: 'none' }} playsInline></video>
            {/* Canvas is what the user actually sees */}
            <canvas ref={canvasRef} width="320" height="240" className="vision-canvas"></canvas>
            
            {status.includes('DROWSY') && (
              <div className="vision-alert-overlay"></div>
            )}
          </div>
          
          <div className="vision-stats">
            <div className="stat-row">
              <span>Status:</span>
              <span className={status.includes('DROWSY') || status.includes('No Face') ? 'text-danger' : 'text-success'}>
                {status}
              </span>
            </div>
            <div className="stat-row">
              <span>EAR:</span>
              <span>{earValue.toFixed(3)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
