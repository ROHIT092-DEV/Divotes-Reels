import React from 'react';

import hero from '@/images/hero.png';
import { currentUser } from '@clerk/nextjs/server';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import Header from '@/components/ui/Header';

export default async function Hero() {
  const user = await currentUser();

  return (
    <>
      <Header />
      <section className="relative bg-gradient-to-r from-purple-500 to-indigo-600 text-white">
        <div className="container mx-auto px-6 py-20 flex flex-col-reverse md:flex-row items-center">
          {/* Left side content */}
          <div className="w-full md:w-1/2 text-center md:text-left">
            <h1 className="text-4xl md:text-6xl font-bold mb-6">
              Share Your All Divotes Experience{' '}
              <span className="text-yellow-300">
                with Everyone and receive Love
              </span>
            </h1>
            <p className="text-lg md:text-xl mb-8">
              Connect, share memories, and spread happiness with your community.
              Click on Lets Start to share your first Post
            </p>
            <div className="flex justify-center md:justify-start gap-4">
              {user ? (
                <div className="flex space-x-2 items-center">
                  <Link
                    href="/reels"
                    className="bg-yellow-300 text-purple-800 font-semibold px-6 py-3 rounded-lg hover:bg-yellow-400 transition"
                  >
                    Lets Start
                  </Link>

                  <Link
                    href="/about"
                    className="border border-white px-6 py-3 rounded-lg hover:bg-white hover:text-purple-600 transition"
                  >
                    Learn More
                  </Link>
                </div>
              ) : (
                <div>
                  <Button>SignIn</Button>
                </div>
              )}
            </div>
          </div>

          {/* Right side image */}
          <div className="w-full md:w-1/2 mb-10 md:mb-0 flex justify-center">
            <div className="relative w-full max-w-lg h-80 md:h-[32rem]">
              <Image
                src={hero}
                alt="Hero Illustration"
                fill
                style={{ objectFit: 'contain' }}
              />
            </div>
          </div>
        </div>

        {/* Decorative background shapes */}
        <div className="absolute top-0 left-0 w-64 h-64 bg-yellow-300 opacity-30 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 right-0 w-72 h-72 bg-pink-400 opacity-30 rounded-full blur-3xl -z-10" />
      </section>
    </>
  );
}
