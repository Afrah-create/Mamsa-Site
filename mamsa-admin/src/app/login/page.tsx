'use client';

import Link from 'next/link';
import { SignIn } from '@clerk/nextjs';

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-6 space-y-6">
          <div className="text-center">
            <div className="mx-auto h-20 w-20 flex items-center justify-center rounded-full bg-white shadow-lg border-4 border-blue-100">
              <img src="/mamsa-logo.JPG" alt="MAMSA Logo" className="h-12 w-12 rounded-full object-cover" />
            </div>
            <Link
              href="/"
              className="mt-4 inline-flex items-center rounded-full bg-blue-50 px-3 py-1 text-xs font-semibold text-blue-600 transition hover:bg-blue-100"
            >
              <svg className="mr-2 h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
              </svg>
              Back to public site
            </Link>
            <h2 className="mt-4 text-2xl font-bold text-gray-900">MAMSA Admin Portal</h2>
            <p className="mt-1 text-sm text-gray-600">Sign in to access the admin dashboard</p>
          </div>

          <div className="flex justify-center">
            <SignIn
              path="/login"
              routing="path"
              forceRedirectUrl="/admin"
              fallbackRedirectUrl="/admin"
              signUpUrl="/login"
              appearance={{
                elements: {
                  card: 'shadow-none p-0',
                  rootBox: 'w-full',
                },
              }}
            />
          </div>
        </div>

        <div className="mt-4 text-center">
          <p className="text-xs text-gray-500">© {new Date().getFullYear()} MAMSA. All rights reserved.</p>
        </div>
      </div>
    </div>
  );
}
