import { NextResponse } from 'next/server';
import Reel from '@/models/Reel';
import { connectDB } from '@/lib/mongodb';

export async function POST(req: Request, context: { params: any }) {
  try {
    await connectDB();
    const params = await context.params;
    const { id } = params as { id: string };
    const body = await req.json();
    const { userId } = body as { userId?: string };

    if (!userId) {
      return NextResponse.json({ message: 'userId required' }, { status: 400 });
    }

    const reel = await Reel.findById(id);
    if (!reel)
      return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const hasLiked = (reel.likedBy || []).includes(userId);
    if (hasLiked) {
      // Unlike
      reel.likedBy = (reel.likedBy || []).filter((u) => u !== userId);
      reel.likes = Math.max(0, (reel.likes || 0) - 1);
    } else {
      reel.likedBy = [...(reel.likedBy || []), userId];
      reel.likes = (reel.likes || 0) + 1;
    }

    await reel.save();

    return NextResponse.json(
      { likes: reel.likes, likedBy: reel.likedBy },
      { status: 200 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed' }, { status: 500 });
  }
}
