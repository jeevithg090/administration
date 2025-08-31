import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { spawn } from 'child_process';
import FormData from 'form-data';
import axios from 'axios';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const app = express();
const PORT = process.env.PORT || 3001;

// Enable CORS for all routes
app.use(cors());
app.use(express.json());

// Create necessary directories
const uploadsDir = path.join(__dirname, 'uploads');
const videosDir = path.join(__dirname, 'videos');
const audioDir = path.join(__dirname, 'audio');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

if (!fs.existsSync(videosDir)) {
  fs.mkdirSync(videosDir, { recursive: true });
}

if (!fs.existsSync(audioDir)) {
  fs.mkdirSync(audioDir, { recursive: true });
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

interface AudioJob {
  id: string;
  status: 'processing' | 'completed' | 'failed';
  audioPath?: string;
  script?: string;
  error?: string;
  progress?: number;
}

const videoJobs: Map<string, VideoJob> = new Map();
const audioJobs: Map<string, AudioJob> = new Map();

// API Keys
const OPENROUTER_API_KEY = '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';
const ELEVENLABS_API_KEY = 'sk_d2669cce5ea21bf9b4568b64f1c6f5e1b077dc537931292a';

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
    const { imageFiles, duration = 2, useTransitions = true, videoQuality = '720p' } = req.body;
    
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
    processVideo(jobId, imageFiles, duration, useTransitions, videoQuality).catch(error => {
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

// Preview video endpoint
app.get('/api/preview/:jobId', (req, res) => {
  const { jobId } = req.params;
  const job = videoJobs.get(jobId);

  if (!job || job.status !== 'completed' || !job.videoPath) {
    return res.status(404).json({ error: 'Video not found or not ready' });
  }

  if (!fs.existsSync(job.videoPath)) {
    return res.status(404).json({ error: 'Video file not found' });
  }

  // Set appropriate headers for video streaming
  const stat = fs.statSync(job.videoPath);
  const fileSize = stat.size;
  const range = req.headers.range;

  if (range) {
    // Parse Range header
    const parts = range.replace(/bytes=/, "").split("-");
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;
    const chunksize = (end - start) + 1;
    
    const file = fs.createReadStream(job.videoPath, { start, end });
    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': 'video/mp4',
    };
    
    res.writeHead(206, head);
    file.pipe(res);
  } else {
    const head = {
      'Content-Length': fileSize,
      'Content-Type': 'video/mp4',
    };
    
    res.writeHead(200, head);
    fs.createReadStream(job.videoPath).pipe(res);
  }
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

// === AUDIO PROCESSING ROUTES ===

// Add background music to video
app.post('/api/add-background-music', upload.single('music'), async (req, res) => {
  try {
    const { videoJobId } = req.body;
    const musicFile = req.file;
    
    if (!musicFile) {
      return res.status(400).json({ error: 'No music file provided' });
    }
    
    if (!videoJobId) {
      return res.status(400).json({ error: 'Video job ID is required' });
    }
    
    const videoJob = videoJobs.get(videoJobId);
    if (!videoJob || videoJob.status !== 'completed' || !videoJob.videoPath) {
      return res.status(400).json({ error: 'Original video not found or not ready' });
    }
    
    const finalJobId = uuidv4();
    videoJobs.set(finalJobId, {
      id: finalJobId,
      status: 'processing',
      progress: 0
    });
    
    // Process background music mixing in background
    mixBackgroundMusic(finalJobId, videoJob.videoPath, musicFile.path).catch(error => {
      console.error('Background music mixing error:', error);
      videoJobs.set(finalJobId, {
        id: finalJobId,
        status: 'failed',
        error: error.message
      });
    });
    
    res.json({
      jobId: finalJobId,
      message: 'Background music processing started'
    });
  } catch (error) {
    console.error('Add background music error:', error);
    res.status(500).json({ error: 'Failed to start background music processing' });
  }
});

// Generate script using OpenRouter
app.post('/api/generate-script', async (req, res) => {
  try {
    const { videoDescription, videoJobId } = req.body;
    
    if (!videoDescription) {
      return res.status(400).json({ error: 'Video description is required' });
    }
    
    if (!videoJobId) {
      return res.status(400).json({ error: 'Video job ID is required' });
    }
    
    const videoJob = videoJobs.get(videoJobId);
    if (!videoJob || videoJob.status !== 'completed') {
      return res.status(400).json({ error: 'Original video not found or not ready' });
    }
    
    const script = await generateScriptWithOpenRouter(videoDescription);
    
    res.json({
      script,
      message: 'Script generated successfully'
    });
  } catch (error) {
    console.error('Script generation error:', error);
    res.status(500).json({ error: 'Failed to generate script' });
  }
});

// Generate audio using ElevenLabs
app.post('/api/generate-audio', async (req, res) => {
  try {
    const { script, videoJobId } = req.body;
    
    if (!script) {
      return res.status(400).json({ error: 'Script is required' });
    }
    
    if (!videoJobId) {
      return res.status(400).json({ error: 'Video job ID is required' });
    }
    
    const audioJobId = uuidv4();
    audioJobs.set(audioJobId, {
      id: audioJobId,
      status: 'processing',
      script,
      progress: 0
    });
    
    // Generate audio in background
    generateAudioWithElevenLabs(audioJobId, script).catch(error => {
      console.error('Audio generation error:', error);
      audioJobs.set(audioJobId, {
        id: audioJobId,
        status: 'failed',
        error: error.message,
        script
      });
    });
    
    res.json({
      audioJobId,
      message: 'Audio generation started'
    });
  } catch (error) {
    console.error('Generate audio error:', error);
    res.status(500).json({ error: 'Failed to start audio generation' });
  }
});

// Mix AI-generated audio with video
app.post('/api/mix-ai-audio', async (req, res) => {
  try {
    const { audioJobId, videoJobId } = req.body;
    
    if (!audioJobId || !videoJobId) {
      return res.status(400).json({ error: 'Both audio and video job IDs are required' });
    }
    
    const audioJob = audioJobs.get(audioJobId);
    const videoJob = videoJobs.get(videoJobId);
    
    if (!audioJob || audioJob.status !== 'completed' || !audioJob.audioPath) {
      return res.status(400).json({ error: 'Audio not found or not ready' });
    }
    
    if (!videoJob || videoJob.status !== 'completed' || !videoJob.videoPath) {
      return res.status(400).json({ error: 'Video not found or not ready' });
    }
    
    const finalJobId = uuidv4();
    videoJobs.set(finalJobId, {
      id: finalJobId,
      status: 'processing',
      progress: 0
    });
    
    // Mix AI audio with video in background
    mixAIAudioWithVideo(finalJobId, videoJob.videoPath, audioJob.audioPath).catch(error => {
      console.error('AI audio mixing error:', error);
      videoJobs.set(finalJobId, {
        id: finalJobId,
        status: 'failed',
        error: error.message
      });
    });
    
    res.json({
      jobId: finalJobId,
      message: 'AI audio mixing started'
    });
  } catch (error) {
    console.error('Mix AI audio error:', error);
    res.status(500).json({ error: 'Failed to start AI audio mixing' });
  }
});

// Get audio job status
app.get('/api/audio-status/:audioJobId', (req, res) => {
  const { audioJobId } = req.params;
  const job = audioJobs.get(audioJobId);

  if (!job) {
    return res.status(404).json({ error: 'Audio job not found' });
  }

  res.json(job);
});

// Video processing function
async function processVideo(jobId: string, imageFiles: string[], duration: number, useTransitions: boolean = true, videoQuality: '720p' | '1080p' = '720p') {
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
    
    // Try Editly first (if available), then fall back to FFmpeg
    try {
      await createVideoWithEditly(validFiles, outputPath, duration, useTransitions, videoQuality);
      console.log('Video created successfully with Editly');
    } catch (editlyError) {
      console.log('Editly not available, falling back to FFmpeg:', editlyError.message);
      try {
        await createVideoWithFFmpeg(validFiles, outputPath, duration);
        console.log('Video created successfully with FFmpeg');
      } catch (ffmpegError) {
        console.log('Primary FFmpeg method failed, trying fallback method:', ffmpegError.message);
        await createSimpleVideo(validFiles, outputPath, duration);
        console.log('Video created successfully with fallback method');
      }
    }
    
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
      
      // Check if the error is due to missing FFmpeg
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      if (errorMessage.includes('command not found') || errorMessage.includes('FFmpeg')) {
        videoJobs.set(jobId, {
          id: jobId,
          status: 'failed',
          error: 'FFmpeg not found. Please install FFmpeg: On macOS run "brew install ffmpeg", on Windows download from https://ffmpeg.org, on Linux run "sudo apt install ffmpeg"'
        });
      } else {
        videoJobs.set(jobId, {
          id: jobId,
          status: 'failed',
          error: errorMessage
        });
      }
    }
}

// Editly video creation function (enhanced capabilities)
async function createVideoWithEditly(imageFiles: string[], outputPath: string, duration: number, useTransitions: boolean = true, videoQuality: '720p' | '1080p' = '720p') {
  // Dynamic import of editly (since it might not be installed)
  let editly: any;
  try {
    // @ts-ignore - editly is optional dependency
    const editlyModule = await import('editly');
    editly = editlyModule.default || editlyModule;
  } catch (error) {
    throw new Error('Editly library not installed');
  }

  // Determine video dimensions based on quality
  const dimensions = videoQuality === '1080p' ? { width: 1920, height: 1080 } : { width: 1280, height: 720 };

  // Create editly configuration
  const editSpec = {
    outPath: outputPath,
    width: dimensions.width,
    height: dimensions.height,
    fps: 30,
    clips: imageFiles.map((filename, index) => {
      const imagePath = path.join(uploadsDir, filename);
      return {
        duration: duration,
        layers: [
          {
            type: 'image',
            path: imagePath,
            resizeMode: 'contain', // Keep aspect ratio with letterboxing
          }
        ],
        // Add a nice transition between clips (except for the last one)
        transition: useTransitions && index < imageFiles.length - 1 ? {
          duration: 0.5,
          name: 'fade' // Use a simple fade transition
        } : undefined
      };
    }),
    defaults: {
      layer: {
        fontPath: undefined // Use system font
      }
    }
  };

  // Execute editly
  await editly(editSpec);
  return outputPath;
}

// FFmpeg video creation function
async function createVideoWithFFmpeg(imageFiles: string[], outputPath: string, duration: number) {
  
  return new Promise((resolve, reject) => {
    // Ensure all image files exist
    const validFiles = imageFiles.filter(filename => {
      const imagePath = path.join(uploadsDir, filename);
      return fs.existsSync(imagePath);
    });
    
    if (validFiles.length === 0) {
      reject(new Error('No valid image files found'));
      return;
    }
    
    // Method 1: Try using FFmpeg with input patterns (simpler approach)
    const tempDir = path.join(__dirname, 'temp');
    if (!fs.existsSync(tempDir)) {
      fs.mkdirSync(tempDir, { recursive: true });
    }
    
    // Copy and rename files to sequential pattern for FFmpeg
    const paddedFiles: string[] = [];
    
    try {
      validFiles.forEach((filename, index) => {
        const sourcePath = path.join(uploadsDir, filename);
        const paddedName = `img${String(index).padStart(3, '0')}.jpg`;
        const destPath = path.join(tempDir, paddedName);
        fs.copyFileSync(sourcePath, destPath);
        paddedFiles.push(destPath);
      });
    } catch (error) {
      reject(new Error('Failed to prepare image files'));
      return;
    }

    // Create FFmpeg command for slideshow
    const ffmpegArgs = [
      '-y', // Overwrite output file
      '-framerate', `${1/duration}`, // Frame rate based on duration
      '-pattern_type', 'glob',
      '-i', path.join(tempDir, 'img*.jpg'),
      '-c:v', 'libx264',
      '-pix_fmt', 'yuv420p',
      '-vf', 'scale=1280:720:force_original_aspect_ratio=decrease,pad=1280:720:(ow-iw)/2:(oh-ih)/2,setsar=1',
      '-r', '30', // Output frame rate
      outputPath
    ];

    console.log('FFmpeg command:', 'ffmpeg', ffmpegArgs.join(' '));

    const ffmpeg = spawn('ffmpeg', ffmpegArgs);

    let stderrOutput = '';
    
    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      stderrOutput += output;
      console.log(`FFmpeg: ${output}`);
    });

    ffmpeg.on('close', (code) => {
      // Clean up temp files
      try {
        paddedFiles.forEach(file => {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        });
        if (fs.existsSync(tempDir)) {
          fs.rmdirSync(tempDir);
        }
      } catch (e) {
        console.error('Failed to clean up temp files:', e);
      }
      
      if (code === 0) {
        console.log('FFmpeg completed successfully');
        resolve(outputPath);
      } else {
        console.error('FFmpeg failed with code:', code);
        console.error('FFmpeg stderr:', stderrOutput);
        reject(new Error(`FFmpeg process exited with code ${code}. Error: ${stderrOutput}`));
      }
    });

    ffmpeg.on('error', (error) => {
      // Clean up temp files
      try {
        paddedFiles.forEach(file => {
          if (fs.existsSync(file)) {
            fs.unlinkSync(file);
          }
        });
        if (fs.existsSync(tempDir)) {
          fs.rmdirSync(tempDir);
        }
      } catch (e) {
        console.error('Failed to clean up temp files:', e);
      }
      
      console.error('FFmpeg error:', error);
      reject(new Error(`FFmpeg error: ${error.message}. Make sure FFmpeg is installed and available in PATH.`));
    });
  });
}

// Fallback video creation method using a different FFmpeg approach
async function createSimpleVideo(imageFiles: string[], outputPath: string, duration: number) {
  return new Promise((resolve, reject) => {
    // Create a simple concat demuxer file
    const fileListPath = path.join(__dirname, `temp-filelist-${uuidv4()}.txt`);
    
    const validFiles = imageFiles.filter(filename => {
      const imagePath = path.join(uploadsDir, filename);
      return fs.existsSync(imagePath);
    });
    
    if (validFiles.length === 0) {
      reject(new Error('No valid image files found'));
      return;
    }
    
    // Create proper concat file format
    const fileListContent = validFiles.map(filename => {
      const imagePath = path.join(uploadsDir, filename);
      return `file '${imagePath}'\nduration ${duration}`;
    }).join('\n') + `\nfile '${path.join(uploadsDir, validFiles[validFiles.length - 1])}'`;
    
    try {
      fs.writeFileSync(fileListPath, fileListContent);
      console.log('Created file list:', fileListContent);
    } catch (err) {
      reject(new Error('Failed to create file list'));
      return;
    }

    const ffmpegArgs = [
      '-y',
      '-f', 'concat',
      '-safe', '0',
      '-i', fileListPath,
      '-vsync', 'vfr',
      '-pix_fmt', 'yuv420p',
      '-c:v', 'libx264',
      '-r', '30',
      outputPath
    ];

    console.log('Fallback FFmpeg command:', 'ffmpeg', ffmpegArgs.join(' '));

    const ffmpeg = spawn('ffmpeg', ffmpegArgs);

    let stderrOutput = '';
    
    ffmpeg.stderr.on('data', (data) => {
      const output = data.toString();
      stderrOutput += output;
      console.log(`Fallback FFmpeg: ${output}`);
    });

    ffmpeg.on('close', (code) => {
      // Clean up temp file
      try {
        if (fs.existsSync(fileListPath)) {
          fs.unlinkSync(fileListPath);
        }
      } catch (e) {
        console.error('Failed to clean up temp file:', e);
      }
      
      if (code === 0) {
        console.log('Fallback FFmpeg completed successfully');
        resolve(outputPath);
      } else {
        console.error('Fallback FFmpeg failed with code:', code);
        reject(new Error(`All video creation methods failed. Please ensure FFmpeg is properly installed.`));
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
      
      reject(new Error(`All video creation methods failed. FFmpeg error: ${error.message}`));
    });
  });
}

// Serve static files
app.use('/uploads', express.static(uploadsDir));
app.use('/videos', express.static(videosDir));
app.use('/audio', express.static(audioDir));

// === AUDIO PROCESSING FUNCTIONS ===

// Mix background music with video
async function mixBackgroundMusic(jobId: string, videoPath: string, musicPath: string) {
  try {
    const job = videoJobs.get(jobId);
    if (!job) return;
    
    videoJobs.set(jobId, { ...job, progress: 10 });
    
    const outputPath = path.join(videosDir, `${jobId}.mp4`);
    
    return new Promise((resolve, reject) => {
      // FFmpeg command to mix video with background music
      // -shortest ensures the output duration matches the shortest input (video)
      // -filter_complex allows us to adjust audio levels
      const ffmpegArgs = [
        '-y', // Overwrite output file
        '-i', videoPath, // Input video
        '-i', musicPath, // Input music
        '-filter_complex',
        '[1:a]volume=0.3[music];[0:a][music]amix=inputs=2:duration=shortest[audio]', // Mix audio with lower music volume
        '-map', '0:v', // Use video from first input
        '-map', '[audio]', // Use mixed audio
        '-c:v', 'copy', // Copy video codec (no re-encoding)
        '-c:a', 'aac', // Encode audio as AAC
        '-shortest', // Match duration to shortest input
        outputPath
      ];
      
      console.log('Background music FFmpeg command:', 'ffmpeg', ffmpegArgs.join(' '));
      
      const ffmpeg = spawn('ffmpeg', ffmpegArgs);
      
      let stderrOutput = '';
      
      ffmpeg.stderr.on('data', (data) => {
        const output = data.toString();
        stderrOutput += output;
        console.log(`Background music FFmpeg: ${output}`);
        
        // Update progress based on FFmpeg output
        const progressMatch = output.match(/time=(\d+):(\d+):(\d+)/);
        if (progressMatch) {
          const currentJob = videoJobs.get(jobId);
          if (currentJob) {
            videoJobs.set(jobId, { ...currentJob, progress: 50 });
          }
        }
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log('Background music mixing completed successfully');
          videoJobs.set(jobId, {
            id: jobId,
            status: 'completed',
            videoPath: outputPath,
            progress: 100
          });
          resolve(outputPath);
        } else {
          console.error('Background music mixing failed with code:', code);
          console.error('FFmpeg stderr:', stderrOutput);
          reject(new Error(`Background music mixing failed: ${stderrOutput}`));
        }
      });
      
      ffmpeg.on('error', (error) => {
        console.error('Background music mixing error:', error);
        reject(new Error(`Background music mixing error: ${error.message}`));
      });
    });
  } catch (error) {
    console.error('Background music mixing failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    videoJobs.set(jobId, {
      id: jobId,
      status: 'failed',
      error: errorMessage
    });
    throw error;
  }
}

// Generate script using OpenRouter API
async function generateScriptWithOpenRouter(videoDescription: string): Promise<string> {
  try {
    const prompt = `Create a natural, engaging script for a slideshow video narration based on this description: "${videoDescription}"

Requirements:
- Write in a warm, conversational tone
- Keep it concise but engaging (aim for 30-60 seconds of narration)
- Make it suitable for a slideshow of images
- Focus on storytelling and emotional connection
- Don't include any stage directions or technical notes
- Write only the spoken narration text

Script:`;

    const response = await axios.post('https://openrouter.ai/api/v1/chat/completions', {
      model: 'meta-llama/llama-3.2-3b-instruct:free', // Using a free model
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 300,
      temperature: 0.7
    }, {
      headers: {
        'Authorization': `Bearer ${OPENROUTER_API_KEY}`,
        'Content-Type': 'application/json',
        'HTTP-Referer': 'http://localhost:3001',
        'X-Title': 'Photo to Video Converter'
      }
    });

    const script = response.data.choices[0]?.message?.content?.trim();
    if (!script) {
      throw new Error('No script generated from OpenRouter');
    }

    console.log('Generated script:', script);
    return script;
  } catch (error) {
    console.error('OpenRouter API error:', error);
    if (axios.isAxiosError(error) && error.response) {
      console.error('Response data:', error.response.data);
      throw new Error(`OpenRouter API error: ${error.response.data.error?.message || 'Unknown error'}`);
    }
    throw new Error('Failed to generate script with OpenRouter');
  }
}

// Generate audio using ElevenLabs API
async function generateAudioWithElevenLabs(audioJobId: string, script: string) {
  try {
    const job = audioJobs.get(audioJobId);
    if (!job) return;
    
    audioJobs.set(audioJobId, { ...job, progress: 10 });
    
    // Use ElevenLabs text-to-speech API
    const voiceId = 'pNInz6obpgDQGcFmaJgB'; // Default voice ID (Adam)
    
    const response = await axios.post(
      `https://api.elevenlabs.io/v1/text-to-speech/${voiceId}`,
      {
        text: script,
        model_id: 'eleven_monolingual_v1',
        voice_settings: {
          stability: 0.5,
          similarity_boost: 0.75,
          style: 0.0,
          use_speaker_boost: true
        }
      },
      {
        headers: {
          'Accept': 'audio/mpeg',
          'Content-Type': 'application/json',
          'xi-api-key': ELEVENLABS_API_KEY
        },
        responseType: 'arraybuffer'
      }
    );
    
    audioJobs.set(audioJobId, { ...job, progress: 70 });
    
    // Save the audio file
    const audioPath = path.join(audioDir, `${audioJobId}.mp3`);
    fs.writeFileSync(audioPath, response.data);
    
    console.log('Audio generated successfully:', audioPath);
    
    audioJobs.set(audioJobId, {
      id: audioJobId,
      status: 'completed',
      audioPath,
      script,
      progress: 100
    });
    
    return audioPath;
  } catch (error) {
    console.error('ElevenLabs audio generation failed:', error);
    let errorMessage = 'Failed to generate audio';
    
    if (axios.isAxiosError(error) && error.response) {
      console.error('ElevenLabs response data:', error.response.data);
      errorMessage = `ElevenLabs API error: ${error.response.status} ${error.response.statusText}`;
    }
    
    audioJobs.set(audioJobId, {
      id: audioJobId,
      status: 'failed',
      error: errorMessage,
      script
    });
    
    throw new Error(errorMessage);
  }
}

// Mix AI-generated audio with video
async function mixAIAudioWithVideo(jobId: string, videoPath: string, audioPath: string) {
  try {
    const job = videoJobs.get(jobId);
    if (!job) return;
    
    videoJobs.set(jobId, { ...job, progress: 10 });
    
    const outputPath = path.join(videosDir, `${jobId}.mp4`);
    
    return new Promise((resolve, reject) => {
      // FFmpeg command to replace video audio with AI-generated audio
      const ffmpegArgs = [
        '-y', // Overwrite output file
        '-i', videoPath, // Input video
        '-i', audioPath, // Input AI audio
        '-c:v', 'copy', // Copy video codec (no re-encoding)
        '-c:a', 'aac', // Encode audio as AAC
        '-map', '0:v', // Use video from first input
        '-map', '1:a', // Use audio from second input
        '-shortest', // Match duration to shortest input
        outputPath
      ];
      
      console.log('AI audio mixing FFmpeg command:', 'ffmpeg', ffmpegArgs.join(' '));
      
      const ffmpeg = spawn('ffmpeg', ffmpegArgs);
      
      let stderrOutput = '';
      
      ffmpeg.stderr.on('data', (data) => {
        const output = data.toString();
        stderrOutput += output;
        console.log(`AI audio mixing FFmpeg: ${output}`);
        
        // Update progress
        const currentJob = videoJobs.get(jobId);
        if (currentJob) {
          videoJobs.set(jobId, { ...currentJob, progress: 50 });
        }
      });
      
      ffmpeg.on('close', (code) => {
        if (code === 0) {
          console.log('AI audio mixing completed successfully');
          videoJobs.set(jobId, {
            id: jobId,
            status: 'completed',
            videoPath: outputPath,
            progress: 100
          });
          resolve(outputPath);
        } else {
          console.error('AI audio mixing failed with code:', code);
          console.error('FFmpeg stderr:', stderrOutput);
          reject(new Error(`AI audio mixing failed: ${stderrOutput}`));
        }
      });
      
      ffmpeg.on('error', (error) => {
        console.error('AI audio mixing error:', error);
        reject(new Error(`AI audio mixing error: ${error.message}`));
      });
    });
  } catch (error) {
    console.error('AI audio mixing failed:', error);
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    videoJobs.set(jobId, {
      id: jobId,
      status: 'failed',
      error: errorMessage
    });
    throw error;
  }
}

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;