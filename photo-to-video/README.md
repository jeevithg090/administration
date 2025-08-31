# Photo to Video Converter

A React + TypeScript + Vite application that converts a series of images into a video slideshow with smooth transitions.

## Features

- 📸 Upload multiple images (JPG, PNG, GIF)
- 🎬 Create MP4 videos with customizable duration per image
- 🔄 Smooth fade transitions between images (optional)
- 🎯 Multiple video quality options (720p, 1080p)
- 👀 **Video Preview** - Preview your video directly in the browser before downloading
- ⬬ Download generated videos
- 🚀 Real-time processing status with progress bar

## Technology Stack

- **Frontend**: React 19 + TypeScript + Vite
- **Backend**: Express.js + Node.js
- **Video Processing**: FFmpeg (fallback) or Editly (enhanced)
- **File Upload**: Multer

## Quick Start

### Prerequisites

- Node.js (v16+ recommended)
- FFmpeg installed and available in PATH
- (Optional) Editly for enhanced video generation

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd photo-to-video
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install FFmpeg** (if not already installed)
   - **macOS**: `brew install ffmpeg`
   - **Windows**: Download from [FFmpeg website](https://ffmpeg.org/download.html)
   - **Linux**: `sudo apt update && sudo apt install ffmpeg`

4. **Optional: Install Editly for enhanced features**
   ```bash
   npm install editly
   ```
   Editly provides:
   - Better transition effects
   - Higher quality video processing
   - More consistent output
   - Professional-grade video editing capabilities

### Running the Application

**Development Mode (recommended)**
```bash
npm run dev:full
```
This starts both the frontend (Vite) and backend (Express) servers concurrently.

**Alternative: Start servers separately**
```bash
# Terminal 1: Start backend
npm run server

# Terminal 2: Start frontend
npm run dev
```

### Usage

1. **Upload Images**: Drag and drop or click to select multiple images
2. **Configure Settings**: 
   - Set duration per image (0.5-10 seconds)
   - Choose video quality (720p or 1080p)
   - Enable/disable smooth transitions
3. **Create Video**: Click "Create Video" to start processing
4. **Preview**: Once complete, click "Preview Video" to watch in-browser
5. **Download**: Click "Download Video" to save the MP4 file

## API Endpoints

- `POST /api/upload` - Upload image files
- `POST /api/create-video` - Start video processing
- `GET /api/video-status/:jobId` - Check processing status
- `GET /api/preview/:jobId` - Stream video for preview
- `GET /api/download/:jobId` - Download completed video

## Video Processing

The application uses a tiered approach for video generation:

1. **Editly** (preferred): Advanced video editing with smooth transitions
2. **FFmpeg** (fallback): Basic video creation when Editly is unavailable

### Editly Integration

When Editly is installed, you get:
- Professional fade transitions between images
- Better aspect ratio handling
- Consistent video quality
- More reliable processing

### FFmpeg Fallback

Basic video creation using FFmpeg's concat filter:
- Simple slideshow creation
- No transitions
- Reliable on all systems with FFmpeg

## Project Structure

```
photo-to-video/
├── src/                    # Frontend React code
│   ├── components/         # React components
│   │   ├── ImageUploader.tsx
│   │   ├── VideoProcessor.tsx
│   │   └── VideoDownloader.tsx
│   ├── App.tsx
│   └── main.tsx
├── server/                 # Backend Express code
│   ├── app.ts             # Main server file
│   ├── uploads/           # Uploaded images
│   └── videos/            # Generated videos
├── package.json
└── README.md
```

## Configuration

### Environment Variables

- `PORT` - Backend server port (default: 3001)

### Video Settings

- **Quality**: 720p (1280x720) or 1080p (1920x1080)
- **Duration**: 0.5-10 seconds per image
- **Transitions**: Fade transitions (when using Editly)
- **Format**: MP4 with H.264 codec

## Troubleshooting

### FFmpeg not found
```
Error: FFmpeg process exited with code 1
```
**Solution**: Install FFmpeg and ensure it's in your system PATH.

**Quick Installation:**
- **macOS**: `brew install ffmpeg` (requires Homebrew)
- **Windows**: Download from [https://ffmpeg.org](https://ffmpeg.org)
- **Linux**: `sudo apt install ffmpeg`

**Alternative**: If FFmpeg installation isn't possible, the app will automatically offer browser-based video creation as a fallback.

### Port already in use
If port 5173 is busy, Vite automatically tries 5174, 5175, etc.

### Video processing fails
1. Check that FFmpeg is properly installed
2. Ensure uploaded images are valid formats
3. Check server logs for detailed error messages

## Development

### Available Scripts

- `npm run dev` - Start frontend development server
- `npm run server` - Start backend server
- `npm run dev:full` - Start both frontend and backend
- `npm run build` - Build for production
- `npm run preview` - Preview production build

### Tech Stack Details

- **Build Tool**: Vite for fast development and building
- **Type Checking**: TypeScript for type safety
- **File Upload**: Multer for handling multipart/form-data
- **Video Processing**: Child process management for FFmpeg/Editly
- **Progress Tracking**: Server-sent events simulation with polling

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Test thoroughly
5. Submit a pull request

## License

MIT License - see LICENSE file for details
