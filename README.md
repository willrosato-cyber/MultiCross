# MultiCross - Multiplayer Crossword Puzzle

A real-time multiplayer crossword puzzle application built with Next.js and Convex.

## Features

- 🎮 Real-time multiplayer gameplay
- 📱 Support for 15x15 and 21x21 grids
- 🎨 Color-coded player cursors
- ⏱️ Synchronized timer
- 🔗 Easy game sharing with join codes
- 📸 OCR-powered crossword import

## Setup

1. Install dependencies:
```bash
npm install
```

2. Set up Convex:
```bash
npx convex dev
```

3. Copy `.env.example` to `.env.local` and add your Convex URL

4. Run the development server:
```bash
npm run dev
```

## Deploying to Production

### Deploy to Vercel

1. Push your code to GitHub
2. Import your repository in Vercel
3. Set environment variables in Vercel dashboard:
   - `NEXT_PUBLIC_CONVEX_URL` (from your Convex production deployment)
4. Deploy!

### Deploy Convex Backend

```bash
npx convex deploy
```

This will create a production Convex deployment and give you a new URL to use in Vercel.

## Tech Stack

- **Frontend**: Next.js 14, React, TypeScript, Tailwind CSS
- **Backend**: Convex (real-time database)
- **OCR**: Tesseract.js

## License

Private project - All rights reserved
