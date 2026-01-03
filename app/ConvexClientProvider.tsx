"use client";

import { ReactNode } from "react";
import { ConvexProvider, ConvexReactClient } from "convex/react";

const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;

if (!convexUrl) {
  console.error("❌ NEXT_PUBLIC_CONVEX_URL is not set! Convex will not work.");
  console.error("Run 'npx convex dev' in a terminal to set up Convex.");
}

const convex = new ConvexReactClient(convexUrl || "");

export function ConvexClientProvider({ children }: { children: ReactNode }) {
  if (!convexUrl) {
    return (
      <div className="p-8 bg-red-50 border-2 border-red-500 rounded-lg m-8">
        <h2 className="text-2xl font-bold text-red-800 mb-4">⚠️ Convex Not Configured</h2>
        <p className="text-red-700 mb-2">
          The multiplayer backend (Convex) is not set up yet.
        </p>
        <ol className="list-decimal ml-6 text-red-700 space-y-2">
          <li>Open a new terminal</li>
          <li>Run: <code className="bg-red-200 px-2 py-1 rounded">npx convex dev</code></li>
          <li>Follow the prompts to create a free Convex account</li>
          <li>Refresh this page</li>
        </ol>
        <div className="mt-4 p-4 bg-white rounded border border-red-300">
          <p className="text-sm text-gray-600">The app will still work, but multiplayer features won't be available.</p>
          {children}
        </div>
      </div>
    );
  }
  
  return <ConvexProvider client={convex}>{children}</ConvexProvider>;
}

