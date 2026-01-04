'use client';

import { useQuery, useMutation } from "convex/react";
import { api } from "@/convex/_generated/api";
import { useState } from "react";

export default function AdminTab() {
  const [isInvalidating, setIsInvalidating] = useState(false);
  const [selectedDay, setSelectedDay] = useState<string>('all');
  const [selectedUser, setSelectedUser] = useState<string>('all');
  const [selectedAction, setSelectedAction] = useState<string>('all');
  
  // Safely query admin data (may not exist in older deployments)
  let users, activityLog;
  try {
    users = useQuery(api.users?.getAllUsers, api.users?.getAllUsers ? {} : "skip");
    activityLog = useQuery(api.users?.getActivityLog, api.users?.getActivityLog ? {} : "skip");
  } catch {
    users = undefined;
    activityLog = undefined;
  }

  const invalidateAllSessions = useMutation(api.auth?.invalidateAllSessions || null as any);

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

  // Get unique users and days for filters
  const uniqueUsers = activityLog 
    ? Array.from(new Set(activityLog.map((log: any) => log.username))).sort()
    : [];
  
  const uniqueDays = activityLog
    ? Array.from(new Set(activityLog.map((log: any) => {
        const date = new Date(log.timestamp);
        return date.toLocaleDateString();
      }))).sort().reverse()
    : [];

  // Filter activity log
  const filteredActivityLog = activityLog?.filter((log: any) => {
    const logDay = new Date(log.timestamp).toLocaleDateString();
    const dayMatch = selectedDay === 'all' || logDay === selectedDay;
    const userMatch = selectedUser === 'all' || log.username === selectedUser;
    const actionMatch = selectedAction === 'all' || log.action === selectedAction;
    return dayMatch && userMatch && actionMatch;
  }) || [];

  return (
    <div className="max-w-7xl mx-auto p-4 md:p-8">
      <div className="mb-8">
        <h2 className="text-3xl font-bold mb-2 text-red-600">🔒 Admin Dashboard</h2>
        <p className="text-gray-600">For authorized personnel only</p>
      </div>

      {/* Force Logout Tool */}
      <div className="mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6 shadow-sm">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Force Logout All Users</h3>
              <p className="text-sm text-gray-600">
                Invalidate all current sessions. All users will be logged out on their next page refresh.
              </p>
            </div>
            <button
              onClick={handleInvalidateAllSessions}
              disabled={isInvalidating}
              className={`ml-4 px-5 py-2 rounded-lg font-medium transition flex items-center gap-2 ${
                isInvalidating
                  ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                  : 'bg-red-600 text-white hover:bg-red-700'
              }`}
            >
              🚪 {isInvalidating ? 'Logging out...' : 'Logout All'}
            </button>
          </div>
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
        
        {/* Filters */}
        <div className="mb-4 flex flex-wrap gap-4">
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Day</label>
            <select
              value={selectedDay}
              onChange={(e) => setSelectedDay(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Days</option>
              {uniqueDays.map((day) => (
                <option key={day} value={day}>{day}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by User</label>
            <select
              value={selectedUser}
              onChange={(e) => setSelectedUser(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Users</option>
              {uniqueUsers.map((user) => (
                <option key={user} value={user}>{user}</option>
              ))}
            </select>
          </div>
          
          <div className="flex-1 min-w-[200px]">
            <label className="block text-sm font-medium text-gray-700 mb-1">Filter by Action</label>
            <select
              value={selectedAction}
              onChange={(e) => setSelectedAction(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Actions</option>
              <option value="login">🔐 Login</option>
              <option value="game_created">🎮 Created Game</option>
              <option value="game_joined">👥 Joined Game</option>
            </select>
          </div>
        </div>
        
        {!activityLog ? (
          <p className="text-gray-500">Loading activity log...</p>
        ) : filteredActivityLog.length === 0 ? (
          <p className="text-gray-500">No activities match your filters.</p>
        ) : (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
              <p className="text-sm text-gray-600">
                Showing {filteredActivityLog.length} of {activityLog.length} activities
              </p>
            </div>
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
                {filteredActivityLog.map((log) => (
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

