import { mutation } from "./_generated/server";

// Migration to update old usernames in games and activity logs
export const migrateUsernames = mutation({
  args: {},
  handler: async (ctx) => {
    const results = {
      gamesUpdated: 0,
      playersUpdated: 0,
      activityLogsUpdated: 0,
    };

    // Username mappings
    const usernameMappings: Record<string, string> = {
      'billy': 'will',
      'saran': 'sara',
    };

    // Update all games
    const games = await ctx.db.query("games").collect();
    
    for (const game of games) {
      let updated = false;
      
      // Update createdBy field
      if (game.createdBy && usernameMappings[game.createdBy.toLowerCase()]) {
        game.createdBy = usernameMappings[game.createdBy.toLowerCase()];
        updated = true;
      }
      
      // Update players array
      if (game.players) {
        game.players = game.players.map(player => {
          const lowerName = player.name.toLowerCase();
          if (usernameMappings[lowerName]) {
            results.playersUpdated++;
            return { ...player, name: usernameMappings[lowerName] };
          }
          return player;
        });
        updated = true;
      }
      
      if (updated) {
        await ctx.db.patch(game._id, {
          createdBy: game.createdBy,
          players: game.players,
        });
        results.gamesUpdated++;
      }
    }

    // Update activity logs
    const activityLogs = await ctx.db.query("activityLog").collect();
    
    for (const log of activityLogs) {
      const lowerUsername = log.username.toLowerCase();
      if (usernameMappings[lowerUsername]) {
        await ctx.db.patch(log._id, {
          username: usernameMappings[lowerUsername],
        });
        results.activityLogsUpdated++;
      }
    }

    return results;
  },
});

