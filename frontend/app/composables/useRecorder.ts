import { ref } from 'vue';

const audioContext = ref<AudioContext | null>(null);
const analyserNode = ref<AnalyserNode | null>(null);
let animationFrameId: number;

export const useRecorder = () => {
  const isRecording = ref(false);
  const isReady = ref(false);
  const stream = ref<MediaStream | null>(null);
  const mediaRecorder = ref<MediaRecorder | null>(null);
  const audioChunks = ref<Blob[]>([]);
  const micVolume = ref(0);

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
   * Starts the recording process.
   */
  const startRecording = () => {
    if (!stream.value) {
      console.error("❌ Cannot start recording, media stream is not ready.");
      return;
    }

    audioChunks.value = []; // Clear previous chunks
    mediaRecorder.value = new MediaRecorder(stream.value);

    mediaRecorder.value.ondataavailable = (event) => {
      audioChunks.value.push(event.data);
    };

    mediaRecorder.value.onstop = () => {
      // The upload logic will be triggered here
      const audioBlob = new Blob(audioChunks.value, { type: 'audio/webm;codecs=opus' });
      console.log("Recording stopped. Final audio blob created:", audioBlob);
      // TODO: Call the upload function here
    };

    mediaRecorder.value.start();
    isRecording.value = true;
    console.log("Recording started.");
  };

  /**
   * Stops the recording process.
   */
  const stopRecording = () => {
    if (mediaRecorder.value && isRecording.value) {
      mediaRecorder.value.stop();
      isRecording.value = false;
      // Also stop the tracks to release the microphone
      stream.value?.getTracks().forEach(track => track.stop());
    }
  };

  return {
    isRecording,
    isReady,
    micVolume,
    setupMedia,
    startRecording,
    stopRecording,
    monitorMicVolume,
    stopMonitoring,
  };
};