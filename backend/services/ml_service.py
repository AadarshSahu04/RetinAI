import numpy as np
import json
import os
import logging
from PIL import Image
import io

logger = logging.getLogger(__name__)

# DR severity classes
DR_CLASSES = [
    "No DR",
    "Mild DR",
    "Moderate DR",
    "Severe DR",
    "Proliferative DR"
]

DR_SEVERITY = {
    "No DR": "normal",
    "Mild DR": "mild",
    "Moderate DR": "moderate",
    "Severe DR": "severe",
    "Proliferative DR": "critical"
}


class MLService:
    def __init__(self):
        self.model = None
        self.input_shape = (224, 224)  # default
        self.num_classes = 5
        self._load_config()
        self._load_model()

    def _load_config(self):
        config_path = os.getenv("CONFIG_PATH", "config.json")
        metadata_path = os.getenv("METADATA_PATH", "metadata.json")

        if os.path.exists(config_path):
            try:
                with open(config_path, "r") as f:
                    config = json.load(f)
                # Try to extract input shape from config
                if "input_shape" in config:
                    shape = config["input_shape"]
                    if isinstance(shape, list) and len(shape) >= 2:
                        self.input_shape = (shape[0], shape[1])
                logger.info(f"Loaded config: input_shape={self.input_shape}")
            except Exception as e:
                logger.warning(f"Could not load config: {e}, using defaults")

        if os.path.exists(metadata_path):
            try:
                with open(metadata_path, "r") as f:
                    metadata = json.load(f)
                if "classes" in metadata:
                    global DR_CLASSES
                    DR_CLASSES = metadata["classes"]
                    self.num_classes = len(DR_CLASSES)
                logger.info(f"Loaded metadata: classes={DR_CLASSES}")
            except Exception as e:
                logger.warning(f"Could not load metadata: {e}, using defaults")

    def _load_model(self):
        weights_path = os.getenv("MODEL_WEIGHTS_PATH", "model.weights.h5")

        if not os.path.exists(weights_path):
            logger.warning(
                f"Model weights not found at '{weights_path}'. "
                "Running in DEMO mode — predictions will be simulated."
            )
            self.model = None
            return

        try:
            import tensorflow as tf
            # Build a MobileNetV2-based model matching expected architecture
            base = tf.keras.applications.MobileNetV2(
                input_shape=(*self.input_shape, 3),
                include_top=False,
                weights=None
            )
            x = tf.keras.layers.GlobalAveragePooling2D()(base.output)
            x = tf.keras.layers.Dense(256, activation="relu")(x)
            x = tf.keras.layers.Dropout(0.3)(x)
            outputs = tf.keras.layers.Dense(self.num_classes, activation="softmax")(x)
            self.model = tf.keras.Model(inputs=base.input, outputs=outputs)
            self.model.load_weights(weights_path)
            logger.info("Model loaded successfully.")
        except Exception as e:
            logger.error(f"Failed to load model: {e}. Running in DEMO mode.")
            self.model = None

    def preprocess(self, image_bytes: bytes) -> np.ndarray:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        image = image.resize(self.input_shape, Image.LANCZOS)
        arr = np.array(image, dtype=np.float32) / 255.0
        return np.expand_dims(arr, axis=0)

    def predict(self, image_bytes: bytes) -> dict:
        processed = self.preprocess(image_bytes)

        if self.model is not None:
            probs = self.model.predict(processed, verbose=0)[0]
            class_idx = int(np.argmax(probs))
            confidence = float(probs[class_idx])
        else:
            # Demo mode: deterministic pseudo-random based on image content
            seed = int(np.mean(processed) * 1000) % 100
            np.random.seed(seed)
            probs = np.random.dirichlet(np.ones(self.num_classes))
            class_idx = int(np.argmax(probs))
            confidence = float(probs[class_idx])
            logger.info("DEMO prediction (no model loaded)")

        result_label = DR_CLASSES[class_idx] if class_idx < len(DR_CLASSES) else "Unknown"
        severity = DR_SEVERITY.get(result_label, "unknown")

        return {
            "result": result_label,
            "confidence": round(confidence, 4),
            "severity": severity,
            "all_probabilities": {
                DR_CLASSES[i]: round(float(p), 4)
                for i, p in enumerate(probs)
                if i < len(DR_CLASSES)
            }
        }


# Singleton
_ml_service: MLService | None = None


def get_ml_service() -> MLService:
    global _ml_service
    if _ml_service is None:
        _ml_service = MLService()
    return _ml_service
