const { Storage } = require('@google-cloud/storage');

// Initialize GCS client
// Authentication:
// - If GCP_KEY_FILE is set, use service account key file
// - Otherwise, use Application Default Credentials (ADC)
const storageConfig = {};

if (process.env.GCP_KEY_FILE) {
  storageConfig.keyFilename = process.env.GCP_KEY_FILE;
} else if (process.env.GCP_PROJECT_ID) {
  storageConfig.projectId = process.env.GCP_PROJECT_ID;
}

const storage = new Storage(storageConfig);

const BUCKET_NAME = process.env.GCS_BUCKET_NAME || 'review-bot-videos';

// Get bucket reference
const bucket = storage.bucket(BUCKET_NAME);

module.exports = {
  storage,
  bucket,
  BUCKET_NAME,
};
