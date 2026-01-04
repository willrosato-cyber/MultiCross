#!/usr/bin/env node

// Quick script to delete the 'saran' account
// Run with: node scripts/deleteSaran.js

import { ConvexHttpClient } from "convex/browser";
import { api } from "../convex/_generated/api.js";

const CONVEX_URL = process.env.NEXT_PUBLIC_CONVEX_URL || "https://warmhearted-panda-868.convex.cloud";

async function deleteSaran() {
  const client = new ConvexHttpClient(CONVEX_URL);
  
  console.log("🗑️  Deleting 'saran' account...");
  
  try {
    const result = await client.mutation(api.users.deleteUser, {
      username: "saran",
      adminUsername: "will"
    });
    
    console.log("✅ Success! Deleted user:", result.username);
    console.log("");
    console.log("The 'saran' account has been removed from the database.");
  } catch (error) {
    console.error("❌ Failed to delete:", error.message);
    process.exit(1);
  }
}

deleteSaran();

