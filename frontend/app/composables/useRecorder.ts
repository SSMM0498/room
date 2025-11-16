import { ref } from 'vue';
import { Recorder } from '~/lib/recorder';
import type { IDEStateCapture, RecorderConfig } from '~/lib/recorder';

// Global state - shared across all component instances
const audioContext = ref<AudioContext | null>(null);
const analyserNode = ref<AnalyserNode | null>(null);
let animationFrameId: number;

const isRecording = ref(false);
const isPaused = ref(false); // Track if recording is paused (socket stays connected)
const isReady = ref(false);
const isInitialCommitReady = ref(false); // Track if initial commit hash is available
const isWaitingForInitialCommit = ref(false); // Track if we're waiting for initial commit after clicking Record
const stream = ref<MediaStream | null>(null);
const mediaRecorder = ref<MediaRecorder | null>(null);
const audioChunks = ref<Blob[]>([]);
const micVolume = ref(0);

// Core Recorder instance
const recorder = ref<Recorder | null>(null);

export const useRecorder = () => {
  // Upload callback function - can be set by components
  const uploadCallback = ref<(audioBlob: Blob, timelineNDJSON: string) => Promise<boolean>>();

  /**
   * Sets the upload callback function
   */
  const setUploadCallback = (callback: (audioBlob: Blob, timelineNDJSON: string) => Promise<boolean>) => {
    uploadCallback.value = callback;
  };

  /**
   * Requests microphone access and prepares for recording.
   */
  const setupMedia = async (): Promise<boolean> => {
    try {
      const audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.value = audioStream;
      isReady.value = true;
      monitorMicVolume(audioStream);
      console.log("🎙️ Microphone access granted.");
      return true;
    } catch (error) {
      console.error("❌ Microphone access denied:", error);
      isReady.value = false;
      return false;
    }
  };

  /**
   * Starts monitoring the microphone volume.
   */
  const monitorMicVolume = (audioStream: MediaStream) => {
    if (!audioContext.value) {
      audioContext.value = new AudioContext();
    }
    analyserNode.value = audioContext.value.createAnalyser();
    const source = audioContext.value.createMediaStreamSource(audioStream);

    source.connect(analyserNode.value);
    analyserNode.value.fftSize = 256; // Smaller size for faster analysis

    const dataArray = new Uint8Array(analyserNode.value.frequencyBinCount);

    const draw = () => {
      animationFrameId = requestAnimationFrame(draw);

      if (analyserNode.value) {
        analyserNode.value.getByteTimeDomainData(dataArray);

        let sum = 0;
        for (const amplitude of dataArray) {
          // Calculate the deviation from the silent midpoint (128)
          sum += Math.abs(amplitude - 128);
        }
        // Update the reactive ref with the average volume
        micVolume.value = sum / dataArray.length;
      }
    };
    draw();
  };

  const stopMonitoring = () => {
    cancelAnimationFrame(animationFrameId);
    audioContext.value?.close();
    audioContext.value = null;
    micVolume.value = 0;
  }

  /**
   * Initialize the Recorder with state capture interface
   */
  const initializeRecorder = (stateCapture: IDEStateCapture, config?: RecorderConfig) => {
    recorder.value = new Recorder(config);
    recorder.value.setStateCapture(stateCapture);
  };

  /**
   * Starts the recording process (both audio and action log).
   * @param initialTabPaths - Optional array of file paths for tabs open at recording start
   * @param activeTabPath - Optional file path of the initially active tab
   */
  const startRecording = () => {
    if (!stream.value) {
      console.error("❌ Cannot start recording, media stream is not ready.");
      return;
    }

    if (!recorder.value) {
      console.error("❌ Recorder not initialized. Call initializeRecorder first.");
      return;
    }

    // Start audio recording
    audioChunks.value = []; // Clear previous chunks
    mediaRecorder.value = new MediaRecorder(stream.value);

    mediaRecorder.value.ondataavailable = (event) => {
      audioChunks.value.push(event.data);
    };

    mediaRecorder.value.onstop = async () => {
      // Create final audio blob
      const audioBlob = new Blob(audioChunks.value, { type: 'audio/webm;codecs=opus' });
      console.log("Recording stopped. Final audio blob created:", audioBlob);

      // Get timeline data
      const timelineNDJSON = getTimelineNDJSON();

      // Trigger upload if callback is set
      if (uploadCallback.value) {
        try {
          console.log("Starting upload process...");
          const success = await uploadCallback.value(audioBlob, timelineNDJSON);
          if (success) {
            console.log("✅ Upload completed successfully");
          } else {
            console.error("❌ Upload failed");
          }
        } catch (error) {
          console.error("❌ Upload error:", error);
        }
      } else {
        console.warn("⚠️ No upload callback set. Audio and timeline data available for manual upload.");
        console.log("Audio blob size:", audioBlob.size, "bytes");
        console.log("Timeline events:", timelineNDJSON.split('\n').length, "events");
      }
    };

    mediaRecorder.value.start();

    // Start action log recording with initial tab state
    recorder.value.start();

    isRecording.value = true;
    console.log("🎬 Recording started (audio + action log).");
  };

  /**
   * Pauses the recording process (keeps socket connection alive).
   */
  const pauseRecording = () => {
    if (mediaRecorder.value && isRecording.value && !isPaused.value) {
      mediaRecorder.value.pause();
      isPaused.value = true;
      console.log("⏸️ Recording paused (socket connection maintained).");
    }
  };

  /**
   * Resumes the recording process.
   */
  const resumeRecording = () => {
    if (mediaRecorder.value && isRecording.value && isPaused.value) {
      mediaRecorder.value.resume();
      isPaused.value = false;
      console.log("▶️ Recording resumed.");
    }
  };

  /**
   * Stops the recording process.
   */
  const stopRecording = () => {
    if (mediaRecorder.value && isRecording.value) {
      mediaRecorder.value.stop();
      isRecording.value = false;
      isPaused.value = false;
      // Also stop the tracks to release the microphone
      stream.value?.getTracks().forEach(track => track.stop());
    }

    if (recorder.value) {
      recorder.value.stop();
    }

    console.log("⏹️ Recording stopped.");
  };

  /**
   * Get the recorded timeline as NDJSON
   */
  const getTimelineNDJSON = (): string => {
    if (!recorder.value) {
      console.error("❌ Recorder not initialized.");
      return '';
    }
    return recorder.value.exportAsNDJSON();
  };

  /**
   * Get the audio blob
   */
  const getAudioBlob = (): Blob | null => {
    if (audioChunks.value.length === 0) {
      return null;
    }
    return new Blob(audioChunks.value, { type: 'audio/webm;codecs=opus' });
  };

  /**
   * Get recording status
   */
  const getRecorderStatus = () => {
    if (!recorder.value) {
      return null;
    }
    return recorder.value.getStatus();
  };

  /**
   * Setup VCS watcher to listen for Git commit events from WebSocket
   * Call this after initializing the recorder and connecting to WebSocket
   */
  const setupVcsWatcher = (socketClient: any) => {
    if (!recorder.value) {
      console.error('❌ Recorder not initialized. Call initializeRecorder first.');
      return;
    }

    const vcsWatcher = recorder.value.getVcsWatcher();

    // Listen for workspace:commit events from the Worker
    socketClient.handleWorkspaceCommit((data: { hash: string; message: string }) => {
      vcsWatcher.recordCommit(data.hash, data.message);

      // Mark initial commit as ready when first commit arrives
      // (since no initial commit is created during init)
      if (!isInitialCommitReady.value) {
        setInitialCommitReady(true);
      }
    });

    console.log('✅ VCS watcher setup complete');
  };

  /**
   * Set the initial commit ready state
   * Call this after receiving the initial commit hash from the worker
   */
  const setInitialCommitReady = (ready: boolean) => {
    isInitialCommitReady.value = ready;
    if (ready) {
      console.log('✅ Initial commit hash ready - recording can start');

      // If we were waiting for the initial commit, auto-start recording now
      if (isWaitingForInitialCommit.value) {
        isWaitingForInitialCommit.value = false;
        console.log('🎬 Auto-starting recording after initial commit received');
        startRecording();
      }
    }
  };

  /**
   * Request to start recording, will wait for initial commit if needed
   * @param socketClient - The socket client instance to trigger initial commit
   */
  const requestRecording = (socketClient?: any) => {
    if (!isInitialCommitReady.value) {
      console.log('⏳ No initial commit yet - creating initial workspace snapshot...');
      isWaitingForInitialCommit.value = true;

      // Trigger creation of initial commit on the worker
      if (socketClient && socketClient.createInitialCommit) {
        socketClient.createInitialCommit((response: any) => {
          if (response.error) {
            console.error('[Recorder] Failed to create initial commit:', response.error);
            isWaitingForInitialCommit.value = false;
          }
          // The workspace:commit event will trigger auto-start via setInitialCommitReady
        });
      } else {
        console.warn('[Recorder] Socket client not provided - cannot trigger initial commit');
      }
    } else {
      startRecording();
    }
  };

  return {
    isRecording,
    isPaused,
    isReady,
    isInitialCommitReady,
    isWaitingForInitialCommit,
    micVolume,
    recorder,
    setupMedia,
    initializeRecorder,
    startRecording,
    pauseRecording,
    resumeRecording,
    stopRecording,
    monitorMicVolume,
    stopMonitoring,
    getTimelineNDJSON,
    getAudioBlob,
    getRecorderStatus,
    setUploadCallback,
    setupVcsWatcher,
    setInitialCommitReady,
    requestRecording,
  };
};