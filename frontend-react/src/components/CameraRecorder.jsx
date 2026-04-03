import { useEffect, useMemo, useRef, useState } from 'react';

function getSpeechRecognitionClass() {
  return window.SpeechRecognition || window.webkitSpeechRecognition || null;
}

export default function CameraRecorder({ onComplete, disabled }) {
  const videoRef = useRef(null);
  const mediaRecorderRef = useRef(null);
  const streamRef = useRef(null);
  const chunksRef = useRef([]);
  const recognitionRef = useRef(null);
  const finalTranscriptRef = useRef('');

  const [recording, setRecording] = useState(false);
  const [error, setError] = useState('');
  const [previewReady, setPreviewReady] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const [speechActive, setSpeechActive] = useState(false);
  const [finalTranscript, setFinalTranscript] = useState('');
  const [interimTranscript, setInterimTranscript] = useState('');
  const [manualTranscript, setManualTranscript] = useState('');

  useEffect(() => {
    setSpeechSupported(Boolean(getSpeechRecognitionClass()));
    return () => {
      stopSpeechRecognition();
      stopTracks();
    };
  }, []);

  const mergedTranscript = useMemo(() => {
    const autoText = [finalTranscript, interimTranscript].filter(Boolean).join(' ').trim();
    return [autoText, manualTranscript.trim()].filter(Boolean).join(' ').trim();
  }, [finalTranscript, interimTranscript, manualTranscript]);

  async function setupStream() {
    const stream = await navigator.mediaDevices.getUserMedia({
      video: true,
      audio: true
    });

    streamRef.current = stream;
    if (videoRef.current) {
      videoRef.current.srcObject = stream;
    }
    setPreviewReady(true);
    return stream;
  }

  function stopTracks() {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setPreviewReady(false);
  }

  function startSpeechRecognition() {
    const SpeechRecognitionClass = getSpeechRecognitionClass();
    if (!SpeechRecognitionClass) return;

    try {
      const recognition = new SpeechRecognitionClass();
      recognition.lang = 'en-US';
      recognition.continuous = true;
      recognition.interimResults = true;

      finalTranscriptRef.current = '';
      setFinalTranscript('');
      setInterimTranscript('');

      recognition.onstart = () => {
        setSpeechActive(true);
      };

      recognition.onresult = (event) => {
        let nextFinal = finalTranscriptRef.current;
        let nextInterim = '';

        for (let index = event.resultIndex; index < event.results.length; index += 1) {
          const result = event.results[index];
          const transcriptText = result[0]?.transcript?.trim() || '';
          if (!transcriptText) continue;

          if (result.isFinal) {
            nextFinal = [nextFinal, transcriptText].filter(Boolean).join(' ').trim();
          } else {
            nextInterim = [nextInterim, transcriptText].filter(Boolean).join(' ').trim();
          }
        }

        finalTranscriptRef.current = nextFinal;
        setFinalTranscript(nextFinal);
        setInterimTranscript(nextInterim);
      };

      recognition.onerror = () => {
        setSpeechActive(false);
      };

      recognition.onend = () => {
        setSpeechActive(false);
      };

      recognition.start();
      recognitionRef.current = recognition;
    } catch (err) {
      setError(err.message || 'Speech recognition could not start');
    }
  }

  function stopSpeechRecognition() {
    const recognition = recognitionRef.current;
    if (recognition) {
      recognition.onresult = null;
      recognition.onstart = null;
      recognition.onerror = null;
      recognition.onend = null;
      try {
        recognition.stop();
      } catch {
        // ignore stop race errors
      }
      recognitionRef.current = null;
    }
    setSpeechActive(false);
    setInterimTranscript('');
  }

  async function startRecording() {
    try {
      setError('');
      const stream = streamRef.current || (await setupStream());
      const mimeType = MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? 'video/webm;codecs=vp8,opus'
        : 'video/webm';

      const recorder = new MediaRecorder(stream, { mimeType });
      chunksRef.current = [];
      mediaRecorderRef.current = recorder;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          chunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const blob = new Blob(chunksRef.current, { type: 'video/webm' });
        const autoTranscript = [finalTranscriptRef.current, interimTranscript].filter(Boolean).join(' ').trim();
        const transcript = [autoTranscript, manualTranscript.trim()].filter(Boolean).join(' ').trim();
        stopTracks();
        await onComplete({
          videoBlob: blob,
          transcript,
          transcriptSource: speechSupported ? 'browser-speech-api' : manualTranscript.trim() ? 'manual' : 'none'
        });
      };

      if (speechSupported) {
        startSpeechRecognition();
      }

      recorder.start();
      setRecording(true);
    } catch (err) {
      setError(err.message || 'Failed to start recording');
      stopSpeechRecognition();
      stopTracks();
    }
  }

  function stopRecording() {
    if (mediaRecorderRef.current && recording) {
      stopSpeechRecognition();
      mediaRecorderRef.current.stop();
      setRecording(false);
    }
  }

  return (
    <div className="card">
      <div className="card-header compact-header">
        <h3 className="section-title">Record your response</h3>
        <span className={`mini-pill ${previewReady ? 'live' : ''}`}>
          {recording ? 'Recording live' : previewReady ? 'Camera ready' : 'Camera off'}
        </span>
      </div>
      <video className="camera-preview" ref={videoRef} autoPlay muted playsInline />
      <p className="muted small-text">
        This multimodal version analyzes video, audio, and an optional transcript captured from your browser speech recognition.
      </p>
      <p className="muted small-text">
        {speechSupported
          ? speechActive
            ? 'Speech transcript is listening while you record.'
            : 'Speech transcript is supported in this browser.'
          : 'Browser speech recognition is not available here. You can still add a manual transcript below.'}
      </p>
      {error ? <p className="error-text">{error}</p> : null}
      <div className="button-row">
        <button className="primary-btn" disabled={disabled || recording} onClick={startRecording}>
          Start Recording
        </button>
        <button className="secondary-btn" disabled={disabled || !recording} onClick={stopRecording}>
          Stop Recording
        </button>
      </div>

      <div className="card nested-card transcript-panel">
        <h4 className="section-title small-title">Transcript</h4>
        <div className="transcript-box">
          {mergedTranscript || 'Your spoken words will appear here when available.'}
        </div>
        <label className="form-label" htmlFor="manualTranscript">
          Optional notes or transcript correction
        </label>
        <textarea
          id="manualTranscript"
          className="text-input"
          rows="3"
          value={manualTranscript}
          onChange={(event) => setManualTranscript(event.target.value)}
          placeholder="Add a short transcript or extra notes if needed..."
        />
      </div>
    </div>
  );
}
