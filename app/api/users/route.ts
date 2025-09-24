
import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import User from "@/models/User";
import { currentUser } from "@clerk/nextjs/server";

export async function POST() {
  try {
    const user = await currentUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    await connectDB();

    let dbUser = await User.findOne({ clerkId: user.id });
    if (!dbUser) {
      dbUser = await User.create({
        clerkId: user.id,
        email: user.emailAddresses[0].emailAddress,
        role: "user", // default role
      });
    }

    return NextResponse.json({ user: dbUser });
  } catch (error) {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
