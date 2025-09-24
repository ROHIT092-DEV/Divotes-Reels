"use client";

import Link from "next/link";
import {
  UserButton,
  useUser,
  SignInButton,
  SignUpButton,
  SignIn,
  SignedOut,
  SignedIn,
} from "@clerk/nextjs";
import { useState } from "react";
import { Button } from "./button";

export default function Header() {
  const { isSignedIn, user } = useUser();
  const [loading, setLoading] = useState(false);

  return (
    <header className="w-full border-b bg-white dark:bg-gray-900 shadow-sm">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="text-2xl font-bold text-purple-600">
          Divotes Share
        </Link>

        {/* Navigation */}

        <div className="flex space-x-3">
          <Link href={`/reels`}>
            <Button>Reels</Button>
          </Link>

          <SignedOut>
            <div className="rounded-lg cursor-pointer bg-purple-500 px-4 py-2 text-white hover:bg-purple-600">
              <SignInButton />
            </div>
            <SignUpButton>
              <button className="cursor-pointer rounded-lg border border-purple-500 px-4 py-2 text-purple-500 hover:bg-purple-600 hover:text-white">
                Sign Up
              </button>
            </SignUpButton>
          </SignedOut>
          <SignedIn>
            <UserButton />
          </SignedIn>
        </div>
      </div>
    </header>
  );
}
