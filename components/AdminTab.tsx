'use client';

import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function AdminTab() {
  // Safely query admin data (may not exist in older deployments)
  let users, activityLog;
  try {
    users = useQuery(api.users?.getAllUsers, api.users?.getAllUsers ? {} : "skip");
    activityLog = useQuery(api.users?.getActivityLog, api.users?.getActivityLog ? {} : "skip");
  } catch {
    users = undefined;
    activityLog = undefined;
  }

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

