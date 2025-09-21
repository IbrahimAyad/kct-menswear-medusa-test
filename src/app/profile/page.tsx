'use client';

import dynamic from 'next/dynamic';

// Dynamically import the profile component to prevent SSG issues
const ProfileContent = dynamic(() => import('./ProfileContent'), {
  ssr: false,
  loading: () => (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-charcoal mx-auto"></div>
        <p className="mt-4 text-gray-600">Loading profile...</p>
      </div>
    </div>
  )
});

export default function ProfilePage() {
  return <ProfileContent />;
}