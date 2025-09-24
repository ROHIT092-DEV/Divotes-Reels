import { NextResponse } from 'next/server';

import Reel from '@/models/Reel';
import imagekit from '@/lib/imagekit';
import { connectDB } from '@/lib/mongodb';

type PostBody = {
  file?: string; // data URL
  fileName?: string;
  caption?: string;
  createdBy?: string;
};

export async function GET() {
  try {
    await connectDB();
    const reels = await Reel.find().sort({ createdAt: -1 }).lean();

    // Normalize older documents that may not have likes/comments
    const normalized = (reels as any[]).map((r) => ({
      ...r,
      likes: typeof r.likes === 'number' ? r.likes : 0,
      comments: Array.isArray(r.comments) ? r.comments : [],
    }));

    return NextResponse.json(normalized, { status: 200 });
  } catch (error) {
    console.error('GET /api/reels error:', error);
    return NextResponse.json(
      { message: 'Failed to fetch reels' },
      { status: 500 }
    );
  }
}

export async function POST(req: Request) {
  try {
    await connectDB();
    const body = (await req.json()) as PostBody;

    const { file, fileName, caption, createdBy } = body;

    if (!file || !fileName) {
      return NextResponse.json(
        { message: 'file and fileName required' },
        { status: 400 }
      );
    }

    // Upload to ImageKit
    const uploadResponse = await imagekit.upload({
      file,
      fileName,
      folder: 'reels',
    });

    const newReel = await Reel.create({
      imageUrl: uploadResponse.url,
      caption,
      createdBy: createdBy || 'Anonymous',
      likes: 0,
      comments: [],
    });

    return NextResponse.json(newReel, { status: 201 });
  } catch (error) {
    console.error('POST /api/reels error:', error);
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { message: 'Upload failed', error: message },
      { status: 500 }
    );
  }
}
