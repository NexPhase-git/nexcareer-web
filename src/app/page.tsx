'use client'

import Link from 'next/link'
import { Rocket } from 'lucide-react'
import { Button } from '@/components/ui/button'

export default function LandingPage() {
  return (
    <main className="min-h-screen bg-background flex items-center justify-center">
      <div className="w-full max-w-md px-6 py-12 flex flex-col items-center min-h-screen">
        <div className="flex-1" />

        {/* Logo/Icon */}
        <div className="p-8 rounded-full bg-[rgba(22,51,0,0.1)] dark:bg-[rgba(159,232,112,0.12)]">
          <Rocket className="w-16 h-16 text-accent-green" />
        </div>

        <div className="h-8" />

        {/* Title */}
        <h1 className="text-4xl font-black text-content-primary tracking-tight">
          NexCareer
        </h1>

        <div className="h-2" />

        {/* Tagline */}
        <p className="text-base text-content-secondary text-center">
          Your AI-powered career companion
        </p>

        <div className="flex-1" />

        {/* CTA Buttons */}
        <div className="w-full space-y-3">
          <Button
            asChild
            className="w-full h-12 text-base font-medium bg-bright-green hover:bg-[#8AD960] text-forest-green"
          >
            <Link href="/signup">Get Started</Link>
          </Button>

          <Button
            asChild
            variant="outline"
            className="w-full h-12 text-base font-medium border-accent-green text-accent-green hover:bg-[rgba(22,51,0,0.08)] dark:hover:bg-[rgba(159,232,112,0.08)]"
          >
            <Link href="/login">I already have an account</Link>
          </Button>
        </div>

        <div className="h-8" />
      </div>
    </main>
  )
}
