const express = require('express');
const { bucket, BUCKET_NAME } = require('../../config/storage');
const { requireAuth } = require('../middleware/auth');
const upload = require('../middleware/upload');
const VideoRepository = require('../repositories/VideoRepository');

const router = express.Router();

// POST /api/videos/upload - Upload a video
router.post('/upload', requireAuth, upload.single('video'), async (req, res) => {
  try {
    const userId = req.session.userId;
    const file = req.file;

    if (!file) {
      return res.status(400).json({
        success: false,
        error: 'No video file provided',
      });
    }

    // Generate unique filename with user ID as folder
    const fileExtension = file.originalname.split('.').pop();
    const fileName = `${userId}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExtension}`;

    // Upload to GCS
    const blob = bucket.file(fileName);
    await blob.save(file.buffer, {
      contentType: file.mimetype,
      metadata: {
        metadata: {
          originalName: file.originalname,
          uploadedBy: userId,
        },
      },
    });

    // Construct GCS public URL (or use signed URL pattern)
    const gcsUrl = `https://storage.googleapis.com/${BUCKET_NAME}/${fileName}`;

    // Save video metadata to database
    const videoData = {
      title: req.body.title || file.originalname,
      description: req.body.description || null,
      url: gcsUrl,
      fileSize: file.size,
      mimeType: file.mimetype,
      status: 'completed',
      userId: userId,
    };

    const video = await VideoRepository.createVideo(videoData);

    return res.status(201).json({
      success: true,
      message: 'Video uploaded successfully',
      data: video,
    });
  } catch (error) {
    console.error('Error uploading video:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to upload video',
      message: error.message,
    });
  }
});

// GET /api/videos/:id - Get a single video by ID
router.get('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid video ID format',
      });
    }

    const video = await VideoRepository.findById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found',
      });
    }

    // Extract file path from GCS URL
    const gcsPath = video.url.replace(`https://storage.googleapis.com/${BUCKET_NAME}/`, '');
    const file = bucket.file(gcsPath);

    // Generate signed URL for video access (valid for 1 hour)
    const [signedUrl] = await file.getSignedUrl({
      version: 'v4',
      action: 'read',
      expires: Date.now() + 60 * 60 * 1000, // 1 hour
    });

    return res.json({
      success: true,
      data: {
        ...video,
        signedUrl,
      },
    });
  } catch (error) {
    console.error('Error fetching video:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch video',
      message: error.message,
    });
  }
});

// GET /api/videos/user/:userId - Get all videos for a specific user
router.get('/user/:userId', requireAuth, async (req, res) => {
  try {
    const { userId } = req.params;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(userId)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid user ID format',
      });
    }

    const videos = await VideoRepository.findByUserId(userId);

    return res.json({
      success: true,
      data: videos,
    });
  } catch (error) {
    console.error('Error fetching user videos:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to fetch videos',
      message: error.message,
    });
  }
});

// DELETE /api/videos/:id - Delete a video
router.delete('/:id', requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.session.userId;

    // Validate UUID format
    const uuidRegex = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
    if (!uuidRegex.test(id)) {
      return res.status(400).json({
        success: false,
        error: 'Invalid video ID format',
      });
    }

    const video = await VideoRepository.findById(id);

    if (!video) {
      return res.status(404).json({
        success: false,
        error: 'Video not found',
      });
    }

    // Check if user owns the video
    if (video.userId !== userId) {
      return res.status(403).json({
        success: false,
        error: 'You do not have permission to delete this video',
      });
    }

    // Delete from GCS
    const gcsPath = video.url.replace(`https://storage.googleapis.com/${BUCKET_NAME}/`, '');
    const file = bucket.file(gcsPath);
    await file.delete();

    // Delete from database
    await VideoRepository.deleteVideo(id);

    return res.json({
      success: true,
      message: 'Video deleted successfully',
    });
  } catch (error) {
    console.error('Error deleting video:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to delete video',
      message: error.message,
    });
  }
});

module.exports = router;
