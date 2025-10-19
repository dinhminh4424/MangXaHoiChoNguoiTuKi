// services/modelService.js
import * as faceapi from "face-api.js";

const LOCAL_MODEL_PATH = "/models";
const FALLBACK_CDN =
  "https://cdn.jsdelivr.net/gh/justadudewhohacks/face-api.js/weights";

class ModelService {
  constructor() {
    this.modelsLoaded = false;
    this.loadingPromise = null;
  }

  async urlExists(url, timeout = 3000) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), timeout);

      const res = await fetch(url, {
        method: "HEAD",
        signal: controller.signal,
      });
      clearTimeout(timeoutId);
      return res.ok;
    } catch (err) {
      console.log(`URL ${url} không khả dụng:`, err.message);
      return false;
    }
  }

  async ensureModels() {
    if (this.loadingPromise) {
      return this.loadingPromise;
    }

    if (this.modelsLoaded) {
      return Promise.resolve(true);
    }

    this.loadingPromise = this._loadModels();
    return this.loadingPromise;
  }

  async _loadModels() {
    const models = [
      { net: faceapi.nets.tinyFaceDetector, name: "tiny_face_detector_model" },
      { net: faceapi.nets.faceLandmark68Net, name: "face_landmark_68_model" },
      { net: faceapi.nets.faceExpressionNet, name: "face_expression_model" },
    ];

    let loadedCount = 0;

    for (const m of models) {
      const manifestLocal = `${LOCAL_MODEL_PATH}/${m.name}-weights_manifest.json`;
      const manifestFallback = `${FALLBACK_CDN}/${m.name}-weights_manifest.json`;

      // Thử tải từ local
      if (await this.urlExists(manifestLocal)) {
        try {
          await m.net.loadFromUri(LOCAL_MODEL_PATH);
          console.log(`✅ Loaded ${m.name} from local`);
          loadedCount++;
          continue;
        } catch (err) {
          console.warn(`Failed to load ${m.name} from local:`, err);
        }
      }

      // Thử tải từ CDN
      if (await this.urlExists(manifestFallback)) {
        try {
          await m.net.loadFromUri(FALLBACK_CDN);
          console.log(`✅ Loaded ${m.name} from CDN`);
          loadedCount++;
          continue;
        } catch (err) {
          console.error(`Failed to load ${m.name} from CDN:`, err);
        }
      }

      // Thử tải trực tiếp
      try {
        await m.net.load();
        console.log(`✅ Loaded ${m.name} directly`);
        loadedCount++;
      } catch (err) {
        console.error(`Failed to load ${m.name} directly:`, err);
        throw new Error(`Không thể tải model ${m.name}`);
      }
    }

    this.modelsLoaded = true;
    this.loadingPromise = null;
    console.log(
      `🎉 Loaded ${loadedCount}/${models.length} models successfully`
    );
    return true;
  }

  isModelsLoaded() {
    return this.modelsLoaded;
  }

  async detectFaces(videoElement, options = {}) {
    if (!this.modelsLoaded) {
      throw new Error("Models chưa được tải");
    }

    const detectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.5,
      ...options,
    });

    return await faceapi
      .detectAllFaces(videoElement, detectorOptions)
      .withFaceLandmarks()
      .withFaceExpressions();
  }

  async detectFacesFromImage(imageElement, options = {}) {
    if (!this.modelsLoaded) {
      throw new Error("Models chưa được tải");
    }

    const detectorOptions = new faceapi.TinyFaceDetectorOptions({
      inputSize: 224,
      scoreThreshold: 0.5,
      ...options,
    });

    return await faceapi
      .detectAllFaces(imageElement, detectorOptions)
      .withFaceLandmarks()
      .withFaceExpressions();
  }
}

export default new ModelService();
