import { NextResponse } from 'next/server';
import Reel from '@/models/Reel';
import { connectDB } from '@/lib/mongodb';

export async function POST(req: Request, context: { params: any }) {
  try {
    await connectDB();
    const params = await context.params;
    const { id } = params as { id: string };
    const body = await req.json();
    const { userId, userName, text } = body as {
      userId?: string;
      userName?: string;
      text?: string;
    };

    if (!text || !text.trim())
      return NextResponse.json({ message: 'text required' }, { status: 400 });
    if (!userId || !userName)
      return NextResponse.json(
        { message: 'userId and userName required' },
        { status: 400 }
      );

    const reel = await Reel.findById(id);
    if (!reel)
      return NextResponse.json({ message: 'Not found' }, { status: 404 });

    const newComment = {
      userId,
      userName,
      text: text.trim(),
      createdAt: new Date(),
    };
    reel.comments = [...(reel.comments || []), newComment];
    await reel.save();

    return NextResponse.json(
      { comments: reel.comments, newComment },
      { status: 201 }
    );
  } catch (error) {
    console.error(error);
    return NextResponse.json({ message: 'Failed' }, { status: 500 });
  }
}
