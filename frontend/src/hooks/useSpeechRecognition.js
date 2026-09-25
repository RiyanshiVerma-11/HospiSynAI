import { useState, useEffect, useRef, useCallback } from 'react';

/**
 * useSpeechRecognition
 * High-performance speech-to-text hook with Web Speech API and live audio waveform analysis.
 * Inspired by MediScribe AI's useAudioRecorder + LiveConsultation STT engine.
 */
export function useSpeechRecognition({ defaultLang = 'en-IN' } = {}) {
  const [isListening, setIsListening] = useState(false);
  const [transcript, setTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [audioLevel, setAudioLevel] = useState(0);
  const [error, setError] = useState(null);
  const [lang, setLang] = useState(defaultLang);
  const [permissionState, setPermissionState] = useState('prompt'); // 'prompt' | 'granted' | 'denied'

  const recognitionRef = useRef(null);
  const audioContextRef = useRef(null);
  const analyserRef = useRef(null);
  const streamRef = useRef(null);
  const rafRef = useRef(null);
  const isListeningRef = useRef(false);
  const baseResultIndexRef = useRef(0);
  const latestResultsLengthRef = useRef(0);

  // Check browser support
  const isSupported = typeof window !== 'undefined' && Boolean(
    window.SpeechRecognition || window.webkitSpeechRecognition
  );

  // Query microphone permission state if available
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' })
        .then((permissionStatus) => {
          setPermissionState(permissionStatus.state);
          permissionStatus.onchange = () => {
            setPermissionState(permissionStatus.state);
          };
        })
        .catch(() => {
          // Some browsers don't support querying 'microphone' permission name
        });
    }
  }, []);

  // Clean up Web Audio stream and context
  const cleanupAudioNodes = useCallback(() => {
    if (rafRef.current) {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = null;
    }
    if (analyserRef.current) {
      try {
        analyserRef.current.disconnect();
      } catch (e) {
        // ignore
      }
      analyserRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch (e) {
        // ignore
      }
      audioContextRef.current = null;
    }
    if (streamRef.current) {
      try {
        streamRef.current.getTracks().forEach(track => track.stop());
      } catch (e) {
        // ignore
      }
      streamRef.current = null;
    }
    setAudioLevel(0);
  }, []);

  // Stop listening
  const stopListening = useCallback(() => {
    isListeningRef.current = false;
    setIsListening(false);
    baseResultIndexRef.current = 0;
    latestResultsLengthRef.current = 0;

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        // already stopped
      }
      recognitionRef.current = null;
    }

    cleanupAudioNodes();
  }, [cleanupAudioNodes]);

  // Request microphone permission explicitly via getUserMedia
  const requestPermission = useCallback(async () => {
    setError(null);
    if (typeof navigator === 'undefined' || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
      setError('Microphone access is not supported by your browser.');
      return false;
    }
    try {
      const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      testStream.getTracks().forEach(t => t.stop());
      setPermissionState('granted');
      return true;
    } catch (err) {
      console.warn('Microphone permission request error:', err);
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        setError('Microphone permission blocked. Please click the lock or camera icon in your address bar to set Microphone to "Allow".');
        setPermissionState('denied');
      } else if (err.name === 'NotFoundError') {
        setError('No microphone hardware detected on this device.');
      } else {
        setError(`Microphone error: ${err.message || err.name}`);
      }
      return false;
    }
  }, []);

  // Start listening (safely handles permission prompt first so Chrome does not abort SpeechRecognition prematurely)
  const startListening = useCallback(async ({ customLang } = {}) => {
    if (!isSupported) {
      setError('Web Speech Recognition is not supported in this browser. Please use Google Chrome, Microsoft Edge, or Brave.');
      return;
    }

    setError(null);
    stopListening();

    // 1. Ensure microphone permission is granted before starting recognition
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      try {
        let currentStatus = permissionState;
        if (navigator.permissions && navigator.permissions.query) {
          try {
            const status = await navigator.permissions.query({ name: 'microphone' });
            currentStatus = status.state;
          } catch (e) {
            // Some browsers do not support querying 'microphone' name
          }
        }
        if (currentStatus !== 'granted') {
          const testStream = await navigator.mediaDevices.getUserMedia({ audio: true });
          testStream.getTracks().forEach(t => t.stop());
          setPermissionState('granted');
        }
      } catch (err) {
        console.warn('Microphone permission verification notice:', err);
        if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
          setError('Microphone permission blocked. Click the lock or settings icon in your browser address bar and set Microphone to "Allow".');
          setPermissionState('denied');
        } else if (err.name === 'NotFoundError') {
          setError('No microphone hardware detected on this device.');
        } else {
          setError(`Microphone error: ${err.message || err.name}`);
        }
        return;
      }
    }

    // 2. Initialize Speech Recognition engine
    const SpeechRec = window.SpeechRecognition || window.webkitSpeechRecognition;
    let recognition;
    try {
      recognition = new SpeechRec();
    } catch (e) {
      setError('Failed to initialize speech engine: ' + e.message);
      return;
    }

    const selectedLang = customLang || lang || 'en-IN';
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = selectedLang;

    recognition.onstart = () => {
      isListeningRef.current = true;
      setIsListening(true);
      setError(null);
    };

    recognition.onresult = (event) => {
      latestResultsLengthRef.current = event.results.length;
      let finalStr = '';
      let interimStr = '';
      const startIndex = Math.min(baseResultIndexRef.current, event.results.length);

      for (let i = startIndex; i < event.results.length; i++) {
        const res = event.results[i];
        if (res.isFinal) {
          finalStr += res[0].transcript + ' ';
        } else {
          interimStr += res[0].transcript;
        }
      }

      setTranscript(finalStr.trim());
      setInterimTranscript(interimStr);
    };

    recognition.onerror = (event) => {
      console.warn('Speech recognition error event:', event.error);
      if (event.error === 'not-allowed') {
        setError('Microphone permission blocked. Click the lock or settings icon in your address bar and set Microphone to "Allow".');
        setPermissionState('denied');
        stopListening();
      } else if (event.error === 'network') {
        setError('Network notice: Chrome speech service could not connect to Google speech servers. Check your internet connection or disable ad blockers.');
        stopListening();
      } else if (event.error === 'no-speech') {
        // Just silent pause, keep listening
      } else if (event.error === 'aborted') {
        // Recognition aborted normally or restarted
      } else {
        setError(`Speech recognition notice: ${event.error}`);
      }
    };

    recognition.onend = () => {
      baseResultIndexRef.current = 0;
      latestResultsLengthRef.current = 0;
      // If user still intends to be listening, cleanly restart continuous recognition
      if (isListeningRef.current) {
        setTimeout(() => {
          if (isListeningRef.current) {
            try {
              const freshRec = new SpeechRec();
              freshRec.continuous = true;
              freshRec.interimResults = true;
              freshRec.lang = selectedLang;
              freshRec.onstart = recognition.onstart;
              freshRec.onresult = recognition.onresult;
              freshRec.onerror = recognition.onerror;
              freshRec.onend = recognition.onend;
              freshRec.start();
              recognitionRef.current = freshRec;
            } catch (e) {
              console.warn('Restart speech recognition notice:', e);
            }
          }
        }, 150);
      } else {
        stopListening();
      }
    };

    // Start speech recognition
    try {
      recognition.start();
      recognitionRef.current = recognition;
      isListeningRef.current = true;
      setIsListening(true);
    } catch (e) {
      console.error('Failed to start speech recognition:', e);
      setError('Could not start microphone: ' + e.message);
      stopListening();
      return;
    }

    // 3. Concurrently initialize Web Audio waveform analyzer safely
    if (typeof navigator !== 'undefined' && navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices.getUserMedia({ audio: true })
        .then((stream) => {
          if (!isListeningRef.current) {
            stream.getTracks().forEach(t => t.stop());
            return;
          }
          streamRef.current = stream;
          setPermissionState('granted');

          const AudioContextClass = window.AudioContext || window.webkitAudioContext;
          if (AudioContextClass) {
            const audioCtx = new AudioContextClass();
            if (audioCtx.state === 'suspended') {
              audioCtx.resume().catch(() => {});
            }
            audioContextRef.current = audioCtx;
            const source = audioCtx.createMediaStreamSource(stream);
            const analyser = audioCtx.createAnalyser();
            analyser.fftSize = 256;
            analyserRef.current = analyser;
            source.connect(analyser);

            const buffer = new Uint8Array(analyser.frequencyBinCount);
            const updateAudioLevel = () => {
              if (!isListeningRef.current || !analyserRef.current) return;
              analyser.getByteTimeDomainData(buffer);
              let sum = 0;
              for (let i = 0; i < buffer.length; i++) {
                sum += Math.abs(buffer[i] - 128);
              }
              const normalized = Math.min(1, sum / buffer.length / 28);
              setAudioLevel(normalized);
              rafRef.current = requestAnimationFrame(updateAudioLevel);
            };
            rafRef.current = requestAnimationFrame(updateAudioLevel);
          }
        })
        .catch((micErr) => {
          console.warn('Waveform audio capture notice (optional fallback):', micErr);
        });
    }
  }, [isSupported, lang, permissionState, stopListening, cleanupAudioNodes]);

  const resetTranscript = useCallback(() => {
    baseResultIndexRef.current = latestResultsLengthRef.current;
    setTranscript('');
    setInterimTranscript('');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      stopListening();
    };
  }, [stopListening]);

  return {
    isListening,
    transcript,
    interimTranscript,
    fullText: (transcript + ' ' + interimTranscript).trim(),
    audioLevel,
    error,
    setError,
    permissionState,
    isSupported,
    lang,
    setLang,
    startListening,
    stopListening,
    resetTranscript,
    setTranscript,
    requestPermission
  };
}
