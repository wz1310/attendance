
import * as faceapi from '@vladmandic/face-api';
import { VerificationResult } from '../types';

const MODEL_URL = 'https://justadudewhohacks.github.io/face-api.js/models';
let modelsLoaded = false;

export async function loadModels() {
  if (modelsLoaded) return;
  try {
    await Promise.all([
      faceapi.nets.tinyFaceDetector.loadFromUri(MODEL_URL),
      faceapi.nets.faceLandmark68Net.loadFromUri(MODEL_URL),
      faceapi.nets.faceRecognitionNet.loadFromUri(MODEL_URL)
    ]);
    modelsLoaded = true;
    console.log('Face-API models loaded successfully');
  } catch (error) {
    console.error('Failed to load Face-API models', error);
    throw error;
  }
}

async function getDescriptorFromBase64(base64: string): Promise<Float32Array | null> {
  const img = await faceapi.fetchImage(base64);
  const detection = await faceapi
    .detectSingleFace(img, new faceapi.TinyFaceDetectorOptions())
    .withFaceLandmarks()
    .withFaceDescriptor();
  
  return detection ? detection.descriptor : null;
}

export async function verifyFace(storedPhotoBase64: string, capturedPhotoBase64: string): Promise<VerificationResult> {
  try {
    if (!modelsLoaded) await loadModels();

    const storedDescriptor = await getDescriptorFromBase64(storedPhotoBase64);
    if (!storedDescriptor) {
      return { isMatch: false, score: 0, message: "Could not detect face in registered photo." };
    }

    const capturedDescriptor = await getDescriptorFromBase64(capturedPhotoBase64);
    if (!capturedDescriptor) {
      return { isMatch: false, score: 0, message: "Could not detect your face. Please try again with better lighting." };
    }

    // Euclidean distance. Lower is better. Threshold is usually 0.6
    const distance = faceapi.euclideanDistance(storedDescriptor, capturedDescriptor);
    const score = Math.max(0, Math.min(100, (1 - distance) * 100));
    const isMatch = distance < 0.6;

    return {
      isMatch,
      score,
      message: isMatch 
        ? "Face verification successful." 
        : `Face does not match (Distance: ${distance.toFixed(2)}).`
    };
  } catch (error) {
    console.error("Face-API Verification Error:", error);
    return {
      isMatch: false,
      score: 0,
      message: "An error occurred during facial verification."
    };
  }
}

export async function isFaceDetected(base64: string): Promise<boolean> {
  if (!modelsLoaded) await loadModels();
  const img = await faceapi.fetchImage(base64);
  const detection = await faceapi.detectSingleFace(img, new faceapi.TinyFaceDetectorOptions());
  return !!detection;
}
