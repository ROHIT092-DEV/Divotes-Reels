'use client';
import React, { useState } from 'react';
import Image from 'next/image';

type UploadModalProps = {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (file: File, caption: string) => void;
};

export default function UploadModal({
  isOpen,
  onClose,
  onUpload,
}: UploadModalProps) {
  const [file, setFile] = useState<File | null>(null);
  const [caption, setCaption] = useState('');

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  };

  const handleUpload = () => {
    if (file && caption.trim()) {
      onUpload(file, caption.trim());
      setFile(null);
      setCaption('');
      onClose();
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50">
      <div className="bg-white text-black rounded-2xl p-6 w-96 relative">
        <button
          onClick={onClose}
          className="absolute top-2 right-2 text-gray-600 hover:text-black"
        >
          ✖
        </button>

        <h2 className="text-xl font-semibold mb-4">Upload Reel</h2>

        <input
          type="file"
          accept="image/*,video/*"
          onChange={handleFileChange}
          className="mb-3"
        />

        <textarea
          value={caption}
          onChange={(e) => setCaption(e.target.value)}
          placeholder="Write a caption..."
          className="w-full border rounded-lg p-2 h-20 mb-4"
        />

        {file && (
          <div className="mb-3">
            {file.type.startsWith('video/') ? (
              <video
                src={URL.createObjectURL(file)}
                className="w-full h-40 object-cover rounded-lg"
                controls
              />
            ) : (
              <div className="relative w-full h-40 rounded-lg overflow-hidden">
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

        <button
          onClick={handleUpload}
          disabled={!file || !caption.trim()}
          className="w-full bg-blue-600 text-white py-2 rounded-lg disabled:bg-gray-400"
        >
          Upload
        </button>
      </div>
    </div>
  );
}
