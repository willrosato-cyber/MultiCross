#!/usr/bin/env node

// Run this with: node scripts/runMigration.js

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://pastel-dodo-340.convex.cloud";

async function runMigration() {
  const client = new ConvexHttpClient(CONVEX_URL);
  
  console.log("🔄 Running username migration...");
  console.log("   billy → will");
  console.log("   saran → sara");
  console.log("");
  
  try {
    const result = await client.mutation(api.migrateUsernames.migrateUsernames, {});
    
    console.log("✅ Migration complete!");
    console.log(`   Games updated: ${result.gamesUpdated}`);
    console.log(`   Players updated: ${result.playersUpdated}`);
    console.log(`   Activity logs updated: ${result.activityLogsUpdated}`);
  } catch (error) {
    console.error("❌ Migration failed:", error);
    process.exit(1);
  }
}

runMigration();

