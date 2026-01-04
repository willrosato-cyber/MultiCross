'use client';

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export default function AdminTab() {
  const [migrationResult, setMigrationResult] = useState<any>(null);
  const [isMigrating, setIsMigrating] = useState(false);
  const [isInvalidating, setIsInvalidating] = useState(false);
  
  // Safely query admin data (may not exist in older deployments)
  let users, activityLog;
  try {
    users = useQuery(api.users?.getAllUsers, api.users?.getAllUsers ? {} : "skip");
    activityLog = useQuery(api.users?.getActivityLog, api.users?.getActivityLog ? {} : "skip");
  } catch {
    users = undefined;
    activityLog = undefined;
  }

  const migrateUsernames = useMutation(api.migrateUsernames?.migrateUsernames || null as any);
  const invalidateAllSessions = useMutation(api.auth?.invalidateAllSessions || null as any);

  const handleMigration = async () => {
    if (!migrateUsernames) {
      alert("Migration function not available");
      return;
    }
    
    if (!confirm("This will update all 'billy' → 'will' and 'saran' → 'sara' in games and logs. Continue?")) {
      return;
    }
    
    setIsMigrating(true);
    try {
      const result = await migrateUsernames({});
      setMigrationResult(result);
      alert(`Migration complete!\nGames updated: ${result.gamesUpdated}\nPlayers updated: ${result.playersUpdated}\nActivity logs updated: ${result.activityLogsUpdated}`);
    } catch (error) {
      console.error("Migration error:", error);
      alert("Migration failed. Check console for details.");
    } finally {
      setIsMigrating(false);
    }
  };

  const handleInvalidateAllSessions = async () => {
    if (!invalidateAllSessions) {
      alert("Session invalidation function not available");
      return;
    }
    
    const username = localStorage.getItem('username');
    if (!username) {
      alert("Not logged in");
      return;
    }
    
    if (!confirm("⚠️ This will LOG OUT ALL USERS (including you) on their next page refresh/reload.\n\nUse this to force everyone to re-login with their own credentials.\n\nContinue?")) {
      return;
    }
    
    setIsInvalidating(true);
    try {
      await invalidateAllSessions({ adminUsername: username });
      alert("✅ All sessions invalidated!\n\nAll users (including you) will be logged out when they refresh the page.\n\nYou'll be logged out now.");
      // Logout yourself immediately
      localStorage.clear();
      window.location.reload();
    } catch (error) {
      console.error("Session invalidation error:", error);
      alert("Failed to invalidate sessions. Check console for details.");
      setIsInvalidating(false);
    }
  };

  const formatTimestamp = (timestamp: number) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString() + ' ' + date.toLocaleTimeString();
  };

  const getActionLabel = (action: string) => {
    switch (action) {
      case 'login':
        return '🔐 Login';
      case 'game_created':
        return '🎮 Created Game';
      case 'game_joined':
        return '👥 Joined Game';
      default:
        return action;
    }
  };

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 text-red-600">🔒 Admin Dashboard</h2>
        <p className="text-gray-600">For authorized personnel only</p>
      </div>

      {/* Migration Tools */}
      <div className="mb-8 space-y-4">
        {/* Username Migration */}
        <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-3 text-yellow-800">⚙️ Username Migration</h3>
          <p className="text-sm text-gray-700 mb-4">
            Fix old usernames in games and activity logs (billy → will, saran → sara)
          </p>
          <button
            onClick={handleMigration}
            disabled={isMigrating}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              isMigrating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-yellow-600 text-white hover:bg-yellow-700'
            }`}
          >
            {isMigrating ? 'Migrating...' : '🔄 Run Username Migration'}
          </button>
          {migrationResult && (
            <div className="mt-4 p-4 bg-green-50 border border-green-200 rounded">
              <p className="font-semibold text-green-800">✅ Migration Complete!</p>
              <p className="text-sm text-gray-700">Games updated: {migrationResult.gamesUpdated}</p>
              <p className="text-sm text-gray-700">Players updated: {migrationResult.playersUpdated}</p>
              <p className="text-sm text-gray-700">Activity logs updated: {migrationResult.activityLogsUpdated}</p>
            </div>
          )}
        </div>

        {/* Session Invalidation */}
        <div className="bg-red-50 border-2 border-red-200 rounded-lg p-6">
          <h3 className="text-xl font-bold mb-3 text-red-800">🚪 Force Logout All Users</h3>
          <p className="text-sm text-gray-700 mb-4">
            <strong>One-time cleanup:</strong> Force everyone to re-login with their own credentials.
            <br />
            <span className="text-red-600 font-semibold">⚠️ Use this only once after dogfooding phase!</span>
          </p>
          <button
            onClick={handleInvalidateAllSessions}
            disabled={isInvalidating}
            className={`px-6 py-2 rounded-lg font-semibold transition ${
              isInvalidating
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-red-600 text-white hover:bg-red-700'
            }`}
          >
            {isInvalidating ? 'Invalidating...' : '🚪 Logout All Users'}
          </button>
          <p className="text-xs text-gray-600 mt-3">
            All users (including you) will be logged out on next page refresh.
          </p>
        </div>
      </div>

      {/* Users Section */}
      <div className="mb-8">
        <h3 className="text-2xl font-bold mb-4">👤 User Accounts</h3>
        {!users ? (
          <p className="text-gray-500">Loading users...</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Username
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Password
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user._id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{user.username}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-mono text-sm text-gray-600">{user.password}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(user.createdAt)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Activity Log Section */}
      <div>
        <h3 className="text-2xl font-bold mb-4">📊 Activity Log</h3>
        <p className="text-sm text-gray-600 mb-4">Last 100 activities</p>
        {!activityLog ? (
          <p className="text-gray-500">Loading activity log...</p>
        ) : activityLog.length === 0 ? (
          <p className="text-gray-500">No activity yet.</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Timestamp
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Action
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Details
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {activityLog.map((log) => (
                  <tr key={log._id}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatTimestamp(log.timestamp)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="font-semibold text-gray-900">{log.username}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="text-sm">{getActionLabel(log.action)}</span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {log.joinCode && (
                        <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                          {log.joinCode}
                        </span>
                      )}
                      {log.gameId && !log.joinCode && (
                        <span className="text-xs text-gray-400">Game ID: {log.gameId.slice(0, 8)}...</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

