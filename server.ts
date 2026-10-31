import express, { Request, Response } from 'express';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import multer from 'multer';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = Number(process.env.PORT) || 3000;

// Data directory setup
const DATA_DIR = path.resolve(__dirname, 'data');
const VIDEOS_DIR = path.resolve(DATA_DIR, 'videos');
const THUMBNAILS_DIR = path.resolve(DATA_DIR, 'thumbnails');
const DB_FILE = path.resolve(DATA_DIR, 'videos.json');

if (!fs.existsSync(VIDEOS_DIR)) fs.mkdirSync(VIDEOS_DIR, { recursive: true });
if (!fs.existsSync(THUMBNAILS_DIR)) fs.mkdirSync(THUMBNAILS_DIR, { recursive: true });

// Creator / Admin configurations
const CREATOR_EMAIL = 'dassomnath2025@gmail.com';
const CREATOR_NAME = 'Somnath Das';

export interface Comment {
  id: string;
  author: string;
  avatar: string;
  content: string;
  createdAt: string;
}

export interface VideoItem {
  id: string;
  title: string;
  description: string;
  category: string;
  tags: string[];
  duration: number; // in seconds
  resolution: string;
  fileSize: number; // in bytes
  fileName: string;
  filePath?: string; // local absolute path
  streamUrl?: string; // route
  thumbnailUrl: string;
  uploadedAt: string;
  creatorEmail: string;
  creatorName: string;
  views: number;
  likes: number;
  downloads: number;
  comments: Comment[];
  isSample?: boolean;
}

function getFileSizeSafe(p: string, fallback: number): number {
  try {
    if (fs.existsSync(p)) return fs.statSync(p).size;
  } catch {}
  return fallback;
}

// Initial seed videos with 100% reliable local video files
const bunnyPath = path.resolve(VIDEOS_DIR, 'bunny-clip.mp4');
const naturePath = path.resolve(VIDEOS_DIR, 'nature-clip.mp4');
const scifiPath = path.resolve(VIDEOS_DIR, 'scifi-clip.mp4');
const spacePath = path.resolve(VIDEOS_DIR, 'space-clip.mp4');

const SEED_VIDEOS: VideoItem[] = [
  {
    id: 'seed-big-buck-bunny',
    title: 'Big Buck Bunny - HD Animation Showcase',
    description: 'An open-source animated short featuring Big Buck Bunny. Fully encoded with high-definition AVC/H.264 video and AAC audio for smooth mobile streaming and offline caching.',
    category: 'Animation',
    tags: ['Animation', 'HD', 'Blender', 'Cinema'],
    duration: 25,
    resolution: '1080p 60fps',
    fileSize: getFileSizeSafe(bunnyPath, 1228800),
    fileName: 'bunny-clip.mp4',
    filePath: bunnyPath,
    thumbnailUrl: 'https://images.unsplash.com/photo-1534447677768-be436bb09401?auto=format&fit=crop&w=1200&q=80',
    uploadedAt: new Date(Date.now() - 86400000 * 3).toISOString(),
    creatorEmail: CREATOR_EMAIL,
    creatorName: CREATOR_NAME,
    views: 4820,
    likes: 312,
    downloads: 142,
    comments: [
      {
        id: 'c1',
        author: 'Alex Rivera',
        avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=120&q=80',
        content: 'Streaming is buttery smooth and seeking works instantly! Downloaded it for my subway commute.',
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
    ],
    isSample: true,
  },
  {
    id: 'seed-nature-glaciers',
    title: 'Wonders of Nature: Alpine Horizons & Motion',
    description: 'Immersive cinematic capture of pristine glaciers and alpine landscapes. High clarity encoding suitable for mobile AMOLED displays.',
    category: 'Nature',
    tags: ['Nature', 'Documentary', 'Landscape', 'Wildlife'],
    duration: 20,
    resolution: '4K Ultra HD',
    fileSize: getFileSizeSafe(naturePath, 18874368),
    fileName: 'nature-clip.mp4',
    filePath: naturePath,
    thumbnailUrl: 'https://images.unsplash.com/photo-1517411032315-54ef2cb783bb?auto=format&fit=crop&w=1200&q=80',
    uploadedAt: new Date(Date.now() - 86400000 * 2).toISOString(),
    creatorEmail: CREATOR_EMAIL,
    creatorName: CREATOR_NAME,
    views: 2950,
    likes: 245,
    downloads: 98,
    comments: [],
    isSample: true,
  },
  {
    id: 'seed-tears-of-steel',
    title: 'Cyberpunk Nexus - Sci-Fi Broadcast Demo',
    description: 'Technical calibration and broadcast fidelity test stream with frequency matched audio and SMPTE HD color alignment.',
    category: 'Sci-Fi',
    tags: ['Sci-Fi', 'Broadcast', 'VFX', 'Cyberpunk'],
    duration: 20,
    resolution: '1080p HD',
    fileSize: getFileSizeSafe(scifiPath, 226304),
    fileName: 'scifi-clip.mp4',
    filePath: scifiPath,
    thumbnailUrl: 'https://images.unsplash.com/photo-1518709268805-4e9042af9f23?auto=format&fit=crop&w=1200&q=80',
    uploadedAt: new Date(Date.now() - 86400000).toISOString(),
    creatorEmail: CREATOR_EMAIL,
    creatorName: CREATOR_NAME,
    views: 1840,
    likes: 198,
    downloads: 87,
    comments: [],
    isSample: true,
  },
  {
    id: 'seed-space-voyage',
    title: 'Deep Space Odyssey: Celestial Fractal Voyage',
    description: 'A mathematical cosmic voyage through fractal space topologies with atmospheric spatial synthesizer soundscapes.',
    category: 'Space',
    tags: ['Space', 'Fractal', 'Cosmos', '4K', 'Ambient'],
    duration: 20,
    resolution: '1440p QHD',
    fileSize: getFileSizeSafe(spacePath, 15728640),
    fileName: 'space-clip.mp4',
    filePath: spacePath,
    thumbnailUrl: 'https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80',
    uploadedAt: new Date(Date.now() - 3600000 * 8).toISOString(),
    creatorEmail: CREATOR_EMAIL,
    creatorName: CREATOR_NAME,
    views: 3410,
    likes: 289,
    downloads: 133,
    comments: [],
    isSample: true,
  }
];

function loadVideos(): VideoItem[] {
  try {
    if (fs.existsSync(DB_FILE)) {
      const data = fs.readFileSync(DB_FILE, 'utf-8');
      const parsed = JSON.parse(data);
      if (Array.isArray(parsed) && parsed.length > 0) {
        // Ensure local file paths are valid
        const updated = parsed.map((item: VideoItem) => {
          if (item.id === 'seed-big-buck-bunny') return { ...item, filePath: bunnyPath, fileSize: getFileSizeSafe(bunnyPath, 1228800) };
          if (item.id === 'seed-nature-glaciers') return { ...item, filePath: naturePath, fileSize: getFileSizeSafe(naturePath, 18874368) };
          if (item.id === 'seed-tears-of-steel') return { ...item, filePath: scifiPath, fileSize: getFileSizeSafe(scifiPath, 226304) };
          if (item.id === 'seed-space-voyage') return { ...item, filePath: spacePath, fileSize: getFileSizeSafe(spacePath, 15728640) };
          return item;
        });
        return updated;
      }
    }
  } catch (err) {
    console.error('Error reading videos database:', err);
  }
  // Initialize with seed videos
  saveVideos(SEED_VIDEOS);
  return SEED_VIDEOS;
}

function saveVideos(videos: VideoItem[]) {
  try {
    fs.writeFileSync(DB_FILE, JSON.stringify(videos, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving videos database:', err);
  }
}

// Multer storage for video uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, VIDEOS_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    const uniqueSuffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
    cb(null, `video-${uniqueSuffix}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: {
    fileSize: 1024 * 1024 * 500, // 500MB limit
  },
  fileFilter: (req, file, cb) => {
    const allowedMime = ['video/mp4', 'video/webm', 'video/ogg', 'video/quicktime', 'video/x-matroska'];
    if (allowedMime.includes(file.mimetype) || file.originalname.match(/\.(mp4|webm|mov|mkv|ogg)$/i)) {
      cb(null, true);
    } else {
      cb(new Error('Only video files (.mp4, .webm, .mov, .mkv) are allowed.'));
    }
  },
});

// Enable CORS and range request headers
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Range, x-creator-passkey');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges, Content-Disposition');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(200);
  }
  next();
});

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// ---------------- API ROUTES ----------------

// Creator info
app.get('/api/auth/creator-info', (req: Request, res: Response) => {
  res.json({
    creatorEmail: CREATOR_EMAIL,
    creatorName: CREATOR_NAME,
    bio: 'Digital media engineer and creator. Publishing high-quality video streams with offline caching.',
    avatar: 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&w=200&q=80',
  });
});

// List videos with search and category filter
app.get('/api/videos', (req: Request, res: Response) => {
  const { q, category, sort } = req.query;
  let list = loadVideos();

  if (category && typeof category === 'string' && category.toLowerCase() !== 'all') {
    list = list.filter((v) => v.category.toLowerCase() === category.toLowerCase());
  }

  if (q && typeof q === 'string') {
    const query = q.toLowerCase();
    list = list.filter((v) =>
      v.title.toLowerCase().includes(query) ||
      v.description.toLowerCase().includes(query) ||
      v.tags.some((t) => t.toLowerCase().includes(query))
    );
  }

  if (sort === 'views') {
    list.sort((a, b) => b.views - a.views);
  } else if (sort === 'likes') {
    list.sort((a, b) => b.likes - a.likes);
  } else if (sort === 'downloads') {
    list.sort((a, b) => b.downloads - a.downloads);
  } else {
    // Default newest first
    list.sort((a, b) => new Date(b.uploadedAt).getTime() - new Date(a.uploadedAt).getTime());
  }

  res.json({ videos: list });
});

// Get single video
app.get('/api/videos/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const list = loadVideos();
  const video = list.find((v) => v.id === id);

  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  res.json({ video });
});

// Open Video Upload endpoint (anyone can upload)
app.post('/api/videos', upload.single('video'), (req: Request, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No video file provided' });
    }

    const {
      title,
      description = '',
      category = 'General',
      tags = '',
      customThumbnail = '',
      resolution = '1080p HD',
      duration = '120',
      uploaderName = '',
      uploaderEmail = '',
    } = req.body;

    const videoId = `vid-${Date.now()}-${crypto.randomBytes(4).toString('hex')}`;
    const parsedTags = typeof tags === 'string'
      ? tags.split(',').map((t) => t.trim()).filter(Boolean)
      : Array.isArray(tags) ? tags : [];

    // Thumbnail: use custom upload or a curated high-res poster
    const defaultThumbnails = [
      'https://images.unsplash.com/photo-1536240478700-b869070f9279?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1492691527719-9d1e07e534b4?auto=format&fit=crop&w=1200&q=80',
      'https://images.unsplash.com/photo-1478760329108-5c3ed9d495a0?auto=format&fit=crop&w=1200&q=80',
    ];
    const thumb = customThumbnail || defaultThumbnails[Math.floor(Math.random() * defaultThumbnails.length)];

    const finalUploaderName = uploaderName.trim() || 'Community Creator';
    const finalUploaderEmail = uploaderEmail.trim() || 'community@streamvault.app';

    const newVideo: VideoItem = {
      id: videoId,
      title: title || req.file.originalname,
      description,
      category,
      tags: parsedTags.length > 0 ? parsedTags : ['Community Upload'],
      duration: Number(duration) || 120,
      resolution,
      fileSize: req.file.size,
      fileName: req.file.originalname,
      filePath: req.file.path,
      thumbnailUrl: thumb,
      uploadedAt: new Date().toISOString(),
      creatorEmail: finalUploaderEmail,
      creatorName: finalUploaderName,
      views: 0,
      likes: 0,
      downloads: 0,
      comments: [],
    };

    const list = loadVideos();
    list.unshift(newVideo);
    saveVideos(list);

    res.status(201).json({
      success: true,
      message: 'Video published successfully and is now streamable!',
      video: newVideo,
    });
  } catch (err: unknown) {
    console.error('Error during video upload:', err);
    res.status(500).json({ error: (err as Error).message || 'Failed to upload video' });
  }
});

// Update video metadata
app.put('/api/videos/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const { title, description, category, tags, resolution } = req.body;
  const list = loadVideos();
  const index = list.findIndex((v) => v.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const existing = list[index];
  list[index] = {
    ...existing,
    title: title ?? existing.title,
    description: description ?? existing.description,
    category: category ?? existing.category,
    tags: tags ? (Array.isArray(tags) ? tags : tags.split(',').map((t: string) => t.trim())) : existing.tags,
    resolution: resolution ?? existing.resolution,
  };

  saveVideos(list);
  res.json({ success: true, video: list[index] });
});

// Delete video
app.delete('/api/videos/:id', (req: Request, res: Response) => {
  const { id } = req.params;
  const list = loadVideos();
  const index = list.findIndex((v) => v.id === id);

  if (index === -1) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const [removed] = list.splice(index, 1);
  if (removed.filePath && fs.existsSync(removed.filePath)) {
    try {
      fs.unlinkSync(removed.filePath);
    } catch (e) {
      console.warn('Could not remove file on disk:', e);
    }
  }

  saveVideos(list);
  res.json({ success: true, message: 'Video deleted successfully' });
});

// HTTP 206 Partial Content Video Streaming Route (Optimized for Mobile, Android & Desktop Seeking)
app.get('/api/videos/:id/stream', (req: Request, res: Response) => {
  const { id } = req.params;
  const list = loadVideos();
  const video = list.find((v) => v.id === id);

  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  // Determine local file path
  let filePath = video.filePath;
  if (!filePath || !fs.existsSync(filePath)) {
    // Check fallback in VIDEOS_DIR
    if (id === 'seed-big-buck-bunny') filePath = bunnyPath;
    else if (id === 'seed-nature-glaciers') filePath = naturePath;
    else if (id === 'seed-tears-of-steel') filePath = scifiPath;
    else if (id === 'seed-space-voyage') filePath = spacePath;
  }

  if (filePath && fs.existsSync(filePath)) {
    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = req.headers.range;

    const ext = path.extname(filePath).toLowerCase();
    const contentType = ext === '.webm' ? 'video/webm' : ext === '.ogg' ? 'video/ogg' : 'video/mp4';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize) {
        res.status(416).send(`Requested range not satisfiable\n${start} >= ${fileSize}`);
        return;
      }

      const chunksize = end - start + 1;
      const file = fs.createReadStream(filePath, { start, end });

      const head = {
        'Content-Range': `bytes ${start}-${end}/${fileSize}`,
        'Accept-Ranges': 'bytes',
        'Content-Length': chunksize,
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      };

      res.writeHead(206, head);
      file.pipe(res);
    } else {
      const head = {
        'Content-Length': fileSize,
        'Content-Type': contentType,
        'Accept-Ranges': 'bytes',
        'Cache-Control': 'public, max-age=3600',
        'Access-Control-Allow-Origin': '*',
      };
      res.writeHead(200, head);
      fs.createReadStream(filePath).pipe(res);
    }
    return;
  }

  res.status(404).json({ error: 'Video media source unavailable' });
});

// Video direct download endpoint
app.get('/api/videos/:id/download', async (req: Request, res: Response) => {
  const { id } = req.params;
  const list = loadVideos();
  const video = list.find((v) => v.id === id);

  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  // Increment download counter
  video.downloads = (video.downloads || 0) + 1;
  saveVideos(list);

  const cleanTitle = video.title.replace(/[^a-zA-Z0-9_\-\.]/g, '_');
  const filename = `${cleanTitle}.mp4`;

  let filePath = video.filePath;
  if (!filePath || !fs.existsSync(filePath)) {
    if (id === 'seed-big-buck-bunny') filePath = bunnyPath;
    else if (id === 'seed-nature-glaciers') filePath = naturePath;
    else if (id === 'seed-tears-of-steel') filePath = scifiPath;
    else if (id === 'seed-space-voyage') filePath = spacePath;
  }

  if (filePath && fs.existsSync(filePath)) {
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Type', 'application/octet-stream');
    res.setHeader('Access-Control-Allow-Origin', '*');
    return fs.createReadStream(filePath).pipe(res);
  }

  res.status(404).json({ error: 'File not available for download' });
});

// Increment view count
app.post('/api/videos/:id/view', (req: Request, res: Response) => {
  const { id } = req.params;
  const list = loadVideos();
  const video = list.find((v) => v.id === id);
  if (video) {
    video.views += 1;
    saveVideos(list);
    return res.json({ views: video.views });
  }
  res.status(404).json({ error: 'Not found' });
});

// Like video
app.post('/api/videos/:id/like', (req: Request, res: Response) => {
  const { id } = req.params;
  const list = loadVideos();
  const video = list.find((v) => v.id === id);
  if (video) {
    video.likes += 1;
    saveVideos(list);
    return res.json({ likes: video.likes });
  }
  res.status(404).json({ error: 'Not found' });
});

// Post comment
app.post('/api/videos/:id/comments', (req: Request, res: Response) => {
  const { id } = req.params;
  const { author = 'Viewer', content } = req.body;

  if (!content || !content.trim()) {
    return res.status(400).json({ error: 'Comment content is required' });
  }

  const list = loadVideos();
  const video = list.find((v) => v.id === id);
  if (!video) {
    return res.status(404).json({ error: 'Video not found' });
  }

  const newComment: Comment = {
    id: `c-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`,
    author: author.trim() || 'Anonymous Viewer',
    avatar: `https://api.dicebear.com/7.x/identicon/svg?seed=${encodeURIComponent(author)}`,
    content: content.trim(),
    createdAt: new Date().toISOString(),
  };

  if (!video.comments) video.comments = [];
  video.comments.unshift(newComment);
  saveVideos(list);

  res.status(201).json({ comment: newComment });
});

// Setup server and Vite middleware
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (!isProd) {
    // Vite dev server integration
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    // Production static serving
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));
    app.get('*', (req: Request, res: Response) => {
      res.sendFile(path.join(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`🚀 StreamVault Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
});
