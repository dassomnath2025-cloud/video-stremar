import React, { useState, useRef } from 'react';
import {
  X,
  Upload,
  Film,
  CheckCircle,
  AlertCircle,
  Loader2,
  Camera,
  Sparkles,
  FileVideo,
  User,
} from 'lucide-react';
import { VideoItem } from '../types';

interface UploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onVideoPublished: (video: VideoItem) => void;
}

export const UploadModal: React.FC<UploadModalProps> = ({
  isOpen,
  onClose,
  onVideoPublished,
}) => {
  // Uploader and Video details
  const [uploaderName, setUploaderName] = useState(() => {
    return localStorage.getItem('streamvault_uploader_name') || 'Somnath Das';
  });
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Technology');
  const [tags, setTags] = useState('Community, 4K, Showcase');
  const [resolution, setResolution] = useState('1080p HD');
  const [duration, setDuration] = useState(0);
  const [customThumbnail, setCustomThumbnail] = useState<string>('');

  const [isUploading, setIsUploading] = useState(false);
  const [uploadPercent, setUploadPercent] = useState(0);
  const [uploadError, setUploadError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  const videoPreviewRef = useRef<HTMLVideoElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const thumbnailInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  // Video File Selection
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFile(file);
    setUploadError('');
    setIsSuccess(false);

    // Auto-generate title from filename
    const cleanName = file.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
    setTitle(cleanName.charAt(0).toUpperCase() + cleanName.slice(1));

    // Create local object URL for preview
    const url = URL.createObjectURL(file);
    setPreviewUrl(url);
  };

  // When video preview metadata loads, grab duration and resolution
  const handlePreviewLoadedMetadata = () => {
    const el = videoPreviewRef.current;
    if (el) {
      setDuration(Math.round(el.duration));
      if (el.videoHeight >= 2160) {
        setResolution('4K Ultra HD');
      } else if (el.videoHeight >= 1440) {
        setResolution('1440p QHD');
      } else if (el.videoHeight >= 1080) {
        setResolution('1080p 60fps');
      } else if (el.videoHeight >= 720) {
        setResolution('720p HD');
      }
      // Auto capture frame as thumbnail at 1s mark
      captureCurrentFrame();
    }
  };

  // Capture video frame to canvas as thumbnail
  const captureCurrentFrame = () => {
    const video = videoPreviewRef.current;
    if (!video) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = video.videoWidth || 640;
      canvas.height = video.videoHeight || 360;
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        setCustomThumbnail(dataUrl);
      }
    } catch (e) {
      console.warn('Canvas frame capture:', e);
    }
  };

  // Custom thumbnail file upload
  const handleCustomThumbnailUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      setCustomThumbnail(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  // Submit Upload to Backend
  const handleUploadSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedFile) {
      setUploadError('Please select a video file to upload.');
      return;
    }
    if (!title.trim()) {
      setUploadError('Please enter a video title.');
      return;
    }

    setIsUploading(true);
    setUploadPercent(0);
    setUploadError('');

    // Remember uploader name in local storage
    if (uploaderName.trim()) {
      localStorage.setItem('streamvault_uploader_name', uploaderName.trim());
    }

    const formData = new FormData();
    formData.append('video', selectedFile);
    formData.append('uploaderName', uploaderName.trim() || 'Anonymous Creator');
    formData.append('title', title.trim());
    formData.append('description', description.trim());
    formData.append('category', category);
    formData.append('tags', tags);
    formData.append('resolution', resolution);
    formData.append('duration', String(duration));
    if (customThumbnail) {
      formData.append('customThumbnail', customThumbnail);
    }

    const xhr = new XMLHttpRequest();
    xhr.open('POST', '/api/videos', true);

    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable) {
        const percent = Math.round((event.loaded / event.total) * 100);
        setUploadPercent(percent);
      }
    };

    xhr.onload = () => {
      setIsUploading(false);
      if (xhr.status >= 200 && xhr.status < 300) {
        const res = JSON.parse(xhr.responseText);
        setIsSuccess(true);
        if (res.video) {
          onVideoPublished(res.video);
        }
        setTimeout(() => {
          onClose();
        }, 1200);
      } else {
        try {
          const errData = JSON.parse(xhr.responseText);
          setUploadError(errData.error || 'Failed to publish video.');
        } catch {
          setUploadError('Upload failed with status ' + xhr.status);
        }
      }
    };

    xhr.onerror = () => {
      setIsUploading(false);
      setUploadError('Network error occurred during video upload.');
    };

    xhr.send(formData);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-2xl rounded-2xl bg-slate-900 border border-slate-800 shadow-2xl overflow-hidden my-8 text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between p-4 sm:p-5 border-b border-slate-800 bg-slate-950/60">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600/20 border border-indigo-500/30 flex items-center justify-center text-indigo-400">
              <Film className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-white flex items-center gap-2">
                Upload New Video
                <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-500/20 border border-emerald-500/30 text-emerald-300">
                  OPEN TO EVERYONE
                </span>
              </h2>
              <p className="text-xs text-slate-400">
                Share high-definition videos with streaming, offline caching, and downloads
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-6 max-h-[80vh] overflow-y-auto">
          <form onSubmit={handleUploadSubmit} className="space-y-5">
            {uploadError && (
              <div className="p-3 rounded-xl bg-rose-500/10 border border-rose-500/20 text-rose-300 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 flex-shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            {isSuccess && (
              <div className="p-3 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300 text-xs flex items-center gap-2">
                <CheckCircle className="w-4 h-4 flex-shrink-0" />
                <span>Video published successfully! It is now streaming and downloadable.</span>
              </div>
            )}

            {/* Uploader Name */}
            <div>
              <label className="block text-xs font-semibold text-slate-300 mb-1">
                Your Name / Channel Name *
              </label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <input
                  type="text"
                  value={uploaderName}
                  onChange={(e) => setUploaderName(e.target.value)}
                  placeholder="e.g. Somnath Das or your channel"
                  required
                  className="w-full pl-9 pr-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500 transition"
                />
              </div>
            </div>

            {/* Video File Dropzone */}
            {!selectedFile ? (
              <div
                onClick={() => fileInputRef.current?.click()}
                className="border-2 border-dashed border-slate-700 hover:border-indigo-500 rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition bg-slate-950/40 hover:bg-slate-950/70"
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="video/mp4,video/webm,video/ogg,video/quicktime,video/x-matroska"
                  onChange={handleFileChange}
                  className="hidden"
                />
                <div className="w-14 h-14 rounded-2xl bg-indigo-600/10 text-indigo-400 flex items-center justify-center mx-auto mb-3">
                  <Upload className="w-7 h-7" />
                </div>
                <h4 className="text-sm sm:text-base font-semibold text-white">
                  Select video to upload
                </h4>
                <p className="mt-1 text-xs text-slate-400">
                  Supports MP4, WebM, MOV, MKV up to 500 MB
                </p>
                <button
                  type="button"
                  className="mt-4 px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-xs font-semibold text-white transition"
                >
                  Browse Files
                </button>
              </div>
            ) : (
              /* Video Preview & Thumbnail Extractor */
              <div className="space-y-3">
                <div className="relative aspect-video rounded-xl bg-black overflow-hidden border border-slate-800">
                  <video
                    ref={videoPreviewRef}
                    src={previewUrl || undefined}
                    onLoadedMetadata={handlePreviewLoadedMetadata}
                    controls
                    className="w-full h-full object-contain"
                  />
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedFile(null);
                      setPreviewUrl(null);
                    }}
                    className="absolute top-2 right-2 p-1.5 rounded-lg bg-black/60 hover:bg-black text-white text-xs"
                    title="Choose another video"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-950 border border-slate-800 text-xs">
                  <div className="flex items-center gap-2 truncate max-w-[60%]">
                    <FileVideo className="w-4 h-4 text-indigo-400 flex-shrink-0" />
                    <span className="truncate text-slate-300 font-medium">{selectedFile.name}</span>
                    <span className="text-[10px] text-slate-500">
                      ({(selectedFile.size / (1024 * 1024)).toFixed(1)} MB)
                    </span>
                  </div>

                  {/* Frame Capture for Thumbnail */}
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={captureCurrentFrame}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 text-xs font-medium transition"
                      title="Set current video frame as poster thumbnail"
                    >
                      <Camera className="w-3.5 h-3.5" />
                      <span>Grab Frame as Thumbnail</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => thumbnailInputRef.current?.click()}
                      className="flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-medium transition"
                    >
                      <Sparkles className="w-3.5 h-3.5 text-amber-400" />
                      <span>Custom Image</span>
                    </button>
                    <input
                      ref={thumbnailInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleCustomThumbnailUpload}
                      className="hidden"
                    />
                  </div>
                </div>

                {/* Thumbnail Preview strip */}
                {customThumbnail && (
                  <div className="flex items-center gap-3 p-2 rounded-xl bg-slate-950/60 border border-slate-800 text-xs">
                    <img
                      src={customThumbnail}
                      alt="Thumbnail preview"
                      className="w-20 h-12 object-cover rounded-lg border border-slate-700"
                    />
                    <span className="text-slate-400 text-[11px]">
                      Poster thumbnail generated and attached.
                    </span>
                  </div>
                )}
              </div>
            )}

            {/* Title & Description */}
            <div className="space-y-3">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Video Title *
                </label>
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Amazing Travel Drone Footage 4K"
                  required
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Description
                </label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Describe your video, camera settings, equipment, or story..."
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-sm text-white focus:outline-none focus:border-indigo-500 resize-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="Animation">Animation</option>
                    <option value="Sci-Fi">Sci-Fi</option>
                    <option value="Nature">Nature & Wildlife</option>
                    <option value="Space">Space & Cosmos</option>
                    <option value="Technology">Technology</option>
                    <option value="Cinema">Film & Cinema</option>
                    <option value="Tutorial">Tutorial</option>
                    <option value="Music">Music & Audio</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Quality Target
                  </label>
                  <select
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                  >
                    <option value="4K Ultra HD">4K Ultra HD (2160p)</option>
                    <option value="1440p QHD">1440p QHD</option>
                    <option value="1080p 60fps">1080p 60fps HD</option>
                    <option value="720p HD">720p HD</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Tags (comma separated)
                </label>
                <input
                  type="text"
                  value={tags}
                  onChange={(e) => setTags(e.target.value)}
                  placeholder="Drone, Cinematic, Nature, 4K"
                  className="w-full px-3.5 py-2 rounded-xl bg-slate-950 border border-slate-700 text-xs sm:text-sm text-white focus:outline-none focus:border-indigo-500"
                />
              </div>
            </div>

            {/* Upload Progress */}
            {isUploading && (
              <div className="space-y-1.5 p-3 rounded-xl bg-slate-950 border border-slate-800">
                <div className="flex items-center justify-between text-xs text-slate-300">
                  <span className="flex items-center gap-1.5">
                    <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-400" />
                    Uploading and processing video stream...
                  </span>
                  <span className="font-mono font-bold text-indigo-400">{uploadPercent}%</span>
                </div>
                <div className="w-full h-2 rounded-full bg-slate-800 overflow-hidden">
                  <div
                    className="h-full bg-indigo-500 transition-all duration-200"
                    style={{ width: `${uploadPercent}%` }}
                  />
                </div>
              </div>
            )}

            {/* Submit Buttons */}
            <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-800">
              <button
                type="button"
                onClick={onClose}
                disabled={isUploading}
                className="px-4 py-2 rounded-xl border border-slate-700 text-xs sm:text-sm text-slate-300 hover:text-white hover:bg-slate-800 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isUploading || !selectedFile}
                className="px-5 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-violet-600 hover:from-indigo-500 hover:to-violet-500 text-white font-semibold text-xs sm:text-sm shadow-lg shadow-indigo-600/30 flex items-center gap-2 transition disabled:opacity-50 active:scale-95"
              >
                {isUploading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>Publishing Video...</span>
                  </>
                ) : (
                  <>
                    <Upload className="w-4 h-4" />
                    <span>Publish Video</span>
                  </>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};
