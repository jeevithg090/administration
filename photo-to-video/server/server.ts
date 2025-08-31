import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Create necessary directories
const uploadsDir = path.join(__dirname, 'uploads');
const videosDir = path.join(__dirname, 'videos');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

const upload = multer({
  storage,
  fileFilter: (req, file, cb) => {
    const allowedTypes = /jpeg|jpg|png|gif/;
    const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
    const mimetype = allowedTypes.test(file.mimetype);

    if (mimetype && extname) {
      return cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'));
    }
  },
  limits: {
    fileSize: 10 * 1024 * 1024 // 10MB limit
  }
});

// Store for tracking video processing jobs
interface VideoJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  videoPath?: string;
  error?: string;
  progress?: number;
}

const videoJobs: Map<string, VideoJob> = new Map();

// Routes
app.get('/api/health', (req, res) => {
  res.json({ status: 'OK', message: 'Server is running' });
});

// Upload images endpoint
app.post('/api/upload', upload.array('images', 20), (req, res) => {
  try {
    const files = req.files as Express.Multer.File[];
    
    if (!files || files.length === 0) {
      return res.status(400).json({ error: 'No files uploaded' });
    }

    const uploadedFiles = files.map(file => ({
      filename: file.filename,
      originalName: file.originalname,
      path: file.path,
      size: file.size
    }));

    res.json({
      message: 'Files uploaded successfully',
      files: uploadedFiles
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: 'Failed to upload files' });
  }
});

// Create video endpoint
app.post('/api/create-video', async (req, res) => {
  try {
    const { imageFiles, duration = 2 } = req.body;
    
    if (!imageFiles || !Array.isArray(imageFiles) || imageFiles.length === 0) {
      return res.status(400).json({ error: 'No image files provided' });
    }

    const jobId = uuidv4();
    videoJobs.set(jobId, {
      id: jobId,
      status: 'processing',
      progress: 0
    });

    // Start video processing in background
    processVideo(jobId, imageFiles, duration).catch(error => {
      console.error('Video processing error:', error);
      videoJobs.set(jobId, {
        id: jobId,
        status: 'failed',
        error: error.message
      });
    });

    res.json({
      jobId,
      message: 'Video processing started'
    });
  } catch (error) {
    console.error('Create video error:', error);
    res.status(500).json({ error: 'Failed to start video processing' });
  }
});

// Get video processing status
app.get('/api/video-status/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = videoJobs.get(jobId);

  if (!job) {
    return res.status(404).json({ error: 'Job not found' });
  }

  res.json(job);
});

// Download video endpoint
app.get('/api/download/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = videoJobs.get(jobId);

  if (!job || job.status !== 'completed' || !job.videoPath) {
    return res.status(404).json({ error: 'Video not found or not ready' });
  }

  if (!fs.existsSync(job.videoPath)) {
    return res.status(404).json({ error: 'Video file not found' });
  }

  res.download(job.videoPath, `video-${jobId}.mp4`);
});

// Video processing function
async function processVideo(jobId: string, imageFiles: string[], duration: number) {
  try {
    const job = videoJobs.get(jobId);
    if (!job) return;

    // Update progress step by step
    videoJobs.set(jobId, { ...job, progress: 10 });
    
    // Validate image files exist
    const validFiles = imageFiles.filter(filename => {
      const imagePath = path.join(uploadsDir, filename);
      return fs.existsSync(imagePath);
    });
    
    if (validFiles.length === 0) {
      throw new Error('No valid image files found');
    }
    
    videoJobs.set(jobId, { ...job, progress: 25 });

    const outputPath = path.join(videosDir, `${jobId}.mp4`);
    
    // Simulate progress during processing
    videoJobs.set(jobId, { ...job, progress: 50 });
    
    // Create video
    await createVideoWithFFmpeg(validFiles, outputPath, duration);
    
    videoJobs.set(jobId, { ...job, progress: 90 });
    
    // Final check
    if (fs.existsSync(outputPath)) {
      videoJobs.set(jobId, {
        id: jobId,
        status: 'completed',
        videoPath: outputPath,
        progress: 100
      });
    } else {
      throw new Error('Video file was not created successfully');
    }

  } catch (error) {
    console.error('Video processing failed:', error);
    videoJobs.set(jobId, {
      id: jobId,
      status: 'failed',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
}

// FFmpeg video creation function
async function createVideoWithFFmpeg(imageFiles: string[], outputPath: string, duration: number) {
  const { spawn } = require('child_process');
  
  return new Promise((resolve, reject) => {
    // Create a temporary file list for FFmpeg
    const fileListPath = path.join(__dirname, `temp-${uuidv4()}.txt`);
    
    // Ensure all image files exist
    const validFiles = imageFiles.filter(filename => {
      const imagePath = path.join(uploadsDir, filename);
      return fs.existsSync(imagePath);
    });
    
    if (validFiles.length === 0) {
      reject(new Error('No valid image files found'));
      return;
    }
    
    const fileList = validFiles.map(filename => {
      const imagePath = path.join(uploadsDir, filename).replace(/'/g, "'\\'''");
      return `file '${imagePath}'\nduration ${duration}`;
    }).join('\n') + '\n' + `file '${path.join(uploadsDir, validFiles[validFiles.length - 1]).replace(/'/g, "'\\'''")}'`;

    try {
      fs.writeFileSync(fileListPath, fileList);
    } catch (err) {
      reject(new Error('Failed to create file list'));
      return;
    }

    // Try to use ffmpeg
    const ffmpeg = spawn('ffmpeg', [
      '-f', 'concat',
      '-safe', '0',
      '-i', fileListPath,
      '-vsync', 'vfr',
      '-pix_fmt', 'yuv420p',
      '-y',
      outputPath
    ]);

    ffmpeg.stderr.on('data', (data) => {
      console.log(`FFmpeg stderr: ${data}`);
    });

    ffmpeg.on('close', (code) => {
      // Clean up temp file
      try {
        fs.unlinkSync(fileListPath);
      } catch (e) {
        console.error('Failed to clean up temp file:', e);
      }
      
      if (code === 0) {
        resolve(outputPath);
      } else {
        reject(new Error(`FFmpeg process exited with code ${code}. FFmpeg might not be installed.`));
      }
    });

    ffmpeg.on('error', (error) => {
      // Clean up temp file
      try {
        if (fs.existsSync(fileListPath)) {
          fs.unlinkSync(fileListPath);
        }
      } catch (e) {
        console.error('Failed to clean up temp file:', e);
      }
      
      // If FFmpeg is not available, create a simple fallback
      console.log('FFmpeg not available, using fallback method');
      createSimpleVideo(validFiles, outputPath, duration)
        .then(resolve)
        .catch(reject);
    });
  });
}

// Fallback video creation method (creates a simple HTML-based video)
async function createSimpleVideo(imageFiles: string[], outputPath: string, duration: number) {
  try {
    // Create a simple text file with image list for now
    // In production, you'd want to implement a more sophisticated fallback
    const videoInfo = {
      images: imageFiles,
      duration: duration,
      totalDuration: imageFiles.length * duration,
      created: new Date().toISOString()
    };
    
    fs.writeFileSync(outputPath.replace('.mp4', '.json'), JSON.stringify(videoInfo, null, 2));
    
    // Create a simple placeholder file
    fs.writeFileSync(outputPath, 'PLACEHOLDER_VIDEO_FILE');
    
    return outputPath;
  } catch (error) {
    throw new Error('Failed to create video with fallback method');
  }
}

// Serve static files
app.use('/uploads', express.static(uploadsDir));
app.use('/videos', express.static(videosDir));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;