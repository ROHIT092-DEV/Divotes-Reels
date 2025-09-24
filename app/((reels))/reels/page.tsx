'use client';
import React, { useState, useEffect } from 'react';
import { useUser } from '@clerk/nextjs';
import Image from 'next/image';
import Link from 'next/link';

type Reel = {
  _id: string;
  imageUrl: string;
  caption?: string;
  createdBy?: string;
  likes: number;
  hasLiked?: boolean;
  comments: {
    userId?: string;
    userName?: string;
    text: string;
    createdAt?: string | Date;
  }[];
};

type ReelFromServer = Partial<Reel> & { _id: string; imageUrl: string };

export default function ReelsPage() {
  const [reels, setReels] = useState<Reel[]>([]);
  const [showUploadDrawer, setShowUploadDrawer] = useState(false);
  const [showCommentDrawer, setShowCommentDrawer] = useState(false);
  const [selectedReelId, setSelectedReelId] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');
  const [commentText, setCommentText] = useState('');
  const [uploading, setUploading] = useState(false);
  const { user } = useUser();

  // Fetch reels
  useEffect(() => {
    fetch('/api/reels')
      .then((res) => res.json())
      .then((data) =>
        setReels(
          (data as ReelFromServer[]).map((r) => ({
            _id: r._id,
            imageUrl: r.imageUrl as string,
            caption: r.caption ?? '',
            createdBy: r.createdBy ?? 'Anonymous',
            // normalize comments: legacy string -> object
            comments: (r.comments ?? []).map((c: any) =>
              typeof c === 'string'
                ? { userName: '', text: c }
                : {
                    userId: c.userId,
                    userName: c.userName,
                    text: c.text,
                    createdAt: c.createdAt,
                  }
            ),
            likes: r.likes ?? 0,
            hasLiked:
              (r as any).likedBy && user
                ? ((r as any).likedBy || []).includes(user.id)
                : false,
          }))
        )
      )
      .catch((err) => console.error(err));
  }, [user]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFile(e.target.files?.[0] ?? null);
  };

  const handleUpload = () => {
    if (!file || !caption.trim()) return;
    setUploading(true);

    const reader = new FileReader();
    reader.onloadend = async () => {
      const dataUrl = reader.result as string;
      try {
        const res = await fetch('/api/reels', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            file: dataUrl,
            fileName: file.name,
            caption,
            createdBy:
              user?.fullName ||
              user?.primaryEmailAddress?.emailAddress ||
              user?.username ||
              'Anonymous',
          }),
        });
        if (!res.ok) throw new Error('Upload failed');

        const newReel = await res.json();
        setReels((prev) => [
          {
            ...newReel,
            comments: newReel.comments ?? [],
            likes: newReel.likes ?? 0,
          },
          ...prev,
        ]);
        setCaption('');
        setFile(null);
        setShowUploadDrawer(false);
      } catch (err) {
        console.error(err);
        alert('Upload failed');
      } finally {
        setUploading(false);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleLike = async (id: string) => {
    // Optimistic update
    setReels((prev) =>
      prev.map((reel) =>
        reel._id === id
          ? {
              ...reel,
              likes: reel.hasLiked ? reel.likes - 1 : reel.likes + 1,
              hasLiked: !reel.hasLiked,
            }
          : reel
      )
    );

    try {
      const res = await fetch(`/api/reels/${id}/like`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user?.id }),
      });
      if (!res.ok) throw new Error('like failed');
      const data = await res.json();
      // Sync with server
      setReels((prev) =>
        prev.map((r) => (r._id === id ? { ...r, likes: data.likes } : r))
      );
    } catch (err) {
      console.error(err);
    }
  };

  const openCommentDrawer = (id: string) => {
    setSelectedReelId(id);
    setShowCommentDrawer(true);
  };

  const handleCommentSubmit = () => {
    if (!commentText || !selectedReelId) return;

    const payload = {
      userId: user?.id,
      userName:
        user?.fullName ||
        user?.primaryEmailAddress?.emailAddress ||
        'Anonymous',
      text: commentText,
    };

    // Optimistic update: add comment object
    const optimistic = {
      userId: payload.userId,
      userName: payload.userName,
      text: payload.text,
      createdAt: new Date().toISOString(),
    };
    setReels((prev) =>
      prev.map((reel) =>
        reel._id === selectedReelId
          ? { ...reel, comments: [...(reel.comments ?? []), optimistic] }
          : reel
      )
    );

    setCommentText('');

    // Send to server
    fetch(`/api/reels/${selectedReelId}/comments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    })
      .then((res) => res.json())
      .then((data) => {
        // Replace comments with server response (ensure normalized shape)
        const serverComments = (data.comments ?? []).map((c: any) =>
          typeof c === 'string' ? { userName: '', text: c } : c
        );
        setReels((prev) =>
          prev.map((r) =>
            r._id === selectedReelId ? { ...r, comments: serverComments } : r
          )
        );
      })
      .catch((err) => console.error(err));
  };

  return (
    <div className="w-full min-h-screen bg-black text-white relative">
      {/* Reels container: full-screen vertical snaps */}
      <div className="h-screen overflow-y-scroll snap-y snap-mandatory">
        {reels.map((reel) => (
          <div
            key={reel._id}
            className="h-screen w-full snap-start relative flex items-center justify-center bg-black"
          >
            {/* Media occupies full viewport */}
            <div className="absolute inset-0">
              {reel.imageUrl.match(/\.(mp4|webm|mov)(\?|$)/i) ? (
                <video
                  src={reel.imageUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="h-full w-full object-cover"
                />
              ) : (
                <Image
                  src={reel.imageUrl}
                  alt={reel.caption ?? 'reel'}
                  fill
                  style={{ objectFit: 'cover' }}
                  unoptimized
                />
              )}
            </div>

            {/* Right vertical action bar (like, comment, share) */}
            <div className="absolute right-4 top-1/2 transform -translate-y-1/2 flex flex-col items-center space-y-5 z-50">
              <button
                onClick={() => handleLike(reel._id)}
                aria-label="Like"
                className="flex flex-col items-center text-center p-3 rounded-full bg-black/70 hover:bg-black/80 shadow-xl"
              >
                <span className="text-4xl">{reel.hasLiked ? '❤️' : '🤍'}</span>
                <small className="text-sm mt-1 block">{reel.likes}</small>
              </button>

              <button
                onClick={() => openCommentDrawer(reel._id)}
                aria-label="Comments"
                className="flex flex-col items-center text-center p-3 rounded-full bg-black/70 hover:bg-black/80 shadow-xl"
              >
                <span className="text-3xl">💬</span>
                <small className="text-sm mt-1 block">
                  {reel.comments?.length ?? 0}
                </small>
              </button>

              <button
                className="flex flex-col items-center text-center p-3 rounded-full bg-black/70 hover:bg-black/80 shadow-xl"
                aria-label="Share"
              >
                <span className="text-3xl">↗️</span>
                <small className="text-sm mt-1 block">Share</small>
              </button>
            </div>

            {/* Caption & author bottom-left */}
            <div className="absolute left-4 bottom-8 max-w-xs z-40">
              <div className="bg-black/50 p-2 rounded">
                <h2 className="text-lg font-semibold">
                  {reel.createdBy || 'Anonymous'}
                </h2>
                <p className="text-sm text-gray-200 mt-1 line-clamp-3">
                  {reel.caption}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Create Reel floating button (center bottom) */}
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
        {/* Fixed top-left logo */}
        <Link href="/" className="fixed top-4 left-4 z-50">
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-white/10 backdrop-blur flex items-center justify-center shadow-md">
              <Image src="/file.svg" alt="Home" width={24} height={24} />
            </div>
            <span className="hidden sm:inline text-white font-semibold">
              Home
            </span>
          </div>
        </Link>

        {/* Create Reel floating button (center bottom) - interactive */}
        <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50">
          <button
            onClick={() => setShowUploadDrawer(true)}
            className="relative inline-flex items-center justify-center bg-blue-600 w-48 md:w-56 px-5 py-3 rounded-full text-white font-medium hover:scale-105 transform transition-all shadow-2xl overflow-hidden"
          >
            <span
              className="absolute -inset-1 rounded-full opacity-30 bg-blue-400 blur-lg animate-pulse"
              aria-hidden
            />
            <span className="relative flex items-center gap-3">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 4v16m8-8H4"
                />
              </svg>
              <span>Create Reel</span>
            </span>
          </button>
        </div>
      </div>

      {/* Upload drawer modal */}
      <div
        className={`fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/50 transition-all ${
          showUploadDrawer
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`bg-white text-black rounded-2xl shadow-xl w-full md:w-3/5 lg:w-2/5 p-6 transform transition-transform ${
            showUploadDrawer ? 'translate-y-0' : 'translate-y-12'
          }`}
        >
          <div className="flex justify-between items-center mb-4">
            <h2 className="text-lg font-semibold">Create Reel</h2>
            <button
              onClick={() => setShowUploadDrawer(false)}
              className="text-gray-600"
            >
              ✖
            </button>
          </div>

          {/* Drag & drop / file input */}
          <label className="block mb-4">
            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center cursor-pointer hover:border-gray-400">
              <p className="mb-2 font-medium">
                Drag & drop a photo or video here
              </p>
              <p className="text-sm text-gray-500">or click to browse</p>
              <input
                type="file"
                accept="image/*,video/*"
                onChange={handleFileChange}
                className="sr-only"
              />
            </div>
          </label>

          {/* Preview */}
          {file && (
            <div className="mb-4">
              {file.type.startsWith('video/') ? (
                <video
                  src={URL.createObjectURL(file)}
                  className="w-full h-56 object-cover rounded-lg"
                  controls
                />
              ) : (
                <div className="relative w-full h-56 rounded-lg overflow-hidden">
                  <Image
                    src={URL.createObjectURL(file)}
                    alt="preview"
                    fill
                    style={{ objectFit: 'cover' }}
                    unoptimized
                  />
                </div>
              )}
            </div>
          )}

          <textarea
            placeholder="Write a caption..."
            value={caption}
            onChange={(e) => setCaption(e.target.value)}
            className="w-full border rounded p-3 mb-4 resize-none h-24"
          />

          <div className="flex justify-between items-center">
            <small className="text-sm text-gray-500">
              {file ? file.name : 'No file selected'}
            </small>
            <div className="flex gap-3">
              <button
                onClick={() => setShowUploadDrawer(false)}
                className="px-4 py-2 rounded bg-gray-200"
              >
                Cancel
              </button>
              <button
                onClick={handleUpload}
                disabled={!file || !caption.trim() || uploading}
                className="px-4 py-2 rounded bg-blue-600 text-white disabled:opacity-60"
              >
                {uploading ? 'Posting...' : 'Post'}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Comment drawer full width */}
      <div
        className={`fixed inset-0 z-50 flex items-end md:items-center justify-center p-4 bg-black/40 transition-all ${
          showCommentDrawer
            ? 'opacity-100 pointer-events-auto'
            : 'opacity-0 pointer-events-none'
        }`}
      >
        <div
          className={`bg-black text-white rounded-2xl shadow-xl w-full md:w-2/5 p-4 transform transition-transform ${
            showCommentDrawer ? 'translate-y-0' : 'translate-y-12'
          }`}
        >
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-semibold">Comments</h2>
            <button
              onClick={() => setShowCommentDrawer(false)}
              className="text-gray-400"
            >
              ✖
            </button>
          </div>

          <div className="max-h-64 overflow-y-auto mb-3 space-y-2">
            {selectedReelId &&
              reels
                .find((r) => r._id === selectedReelId)
                ?.comments.map((c, i) => (
                  <div key={i} className="py-2 border-b border-gray-800">
                    <div className="text-sm font-semibold">
                      {c.userName ?? 'Anonymous'}
                    </div>
                    <div className="text-sm text-gray-200">{c.text ?? c}</div>
                  </div>
                ))}
          </div>

          <div className="flex gap-2 items-center">
            <input
              type="text"
              placeholder="Add a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              className="flex-1 p-3 rounded-xl bg-black text-white border border-gray-800"
            />
            <button
              onClick={handleCommentSubmit}
              className="bg-blue-600 px-4 py-2 rounded-full text-white"
            >
              Post
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
