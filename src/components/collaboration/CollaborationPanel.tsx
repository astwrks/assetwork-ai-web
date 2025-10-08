'use client';

import React, { useState, useEffect } from 'react';
import { Users, UserPlus, Settings, MessageSquare, Eye, Edit3 } from 'lucide-react';
import { CollaborationManager, User, CursorPosition, Selection } from '@/lib/collaboration/CollaborationManager';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';

interface CollaborationPanelProps {
  collaborationManager: CollaborationManager;
  currentUser: User;
  reportId: string;
  onInviteUser?: (email: string) => void;
  onManagePermissions?: (userId: string) => void;
}

export function CollaborationPanel({
  collaborationManager,
  currentUser,
  reportId,
  onInviteUser,
  onManagePermissions,
}: CollaborationPanelProps) {
  const [activeUsers, setActiveUsers] = useState<User[]>([]);
  const [cursors, setCursors] = useState<CursorPosition[]>([]);
  const [selections, setSelections] = useState<Selection[]>([]);
  const [isConnected, setIsConnected] = useState(false);
  const [showInviteDialog, setShowInviteDialog] = useState(false);
  const [inviteEmail, setInviteEmail] = useState('');

  useEffect(() => {
    // Set up event listeners
    collaborationManager.on('connected', () => {
      setIsConnected(true);
      collaborationManager.joinSession(reportId, currentUser);
    });

    collaborationManager.on('disconnected', () => {
      setIsConnected(false);
    });

    collaborationManager.on('userJoined', (user: User) => {
      setActiveUsers(prev => [...prev.filter(u => u.id !== user.id), user]);
    });

    collaborationManager.on('userLeft', (userId: string) => {
      setActiveUsers(prev => prev.filter(u => u.id !== userId));
    });

    collaborationManager.on('cursorUpdated', (cursor: CursorPosition) => {
      setCursors(prev => {
        const filtered = prev.filter(c => c.userId !== cursor.userId);
        return [...filtered, cursor];
      });
    });

    collaborationManager.on('selectionUpdated', (selection: Selection) => {
      setSelections(prev => {
        const filtered = prev.filter(s => s.userId !== selection.userId);
        return [...filtered, selection];
      });
    });

    // Connect to collaboration server
    collaborationManager.connect().catch(console.error);

    return () => {
      collaborationManager.disconnect();
    };
  }, [collaborationManager, currentUser, reportId]);

  const handleInviteUser = () => {
    if (inviteEmail && onInviteUser) {
      onInviteUser(inviteEmail);
      setInviteEmail('');
      setShowInviteDialog(false);
    }
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'owner': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'editor': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'viewer': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      default: return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'owner': return <Settings className="h-3 w-3" />;
      case 'editor': return <Edit3 className="h-3 w-3" />;
      case 'viewer': return <Eye className="h-3 w-3" />;
      default: return <Users className="h-3 w-3" />;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-700">
      {/* Header */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Collaboration
          </h3>
          <div className="flex items-center space-x-2">
            <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-green-500' : 'bg-red-500'}`} />
            <span className="text-sm text-gray-500 dark:text-gray-400">
              {isConnected ? 'Connected' : 'Disconnected'}
            </span>
          </div>
        </div>
      </div>

      {/* Active Users */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-sm font-medium text-gray-900 dark:text-white">
            Active Users ({activeUsers.length})
          </h4>
          <Button
            size="sm"
            variant="outline"
            onClick={() => setShowInviteDialog(true)}
            className="h-8 px-2"
          >
            <UserPlus className="h-3 w-3 mr-1" />
            Invite
          </Button>
        </div>
        
        <ScrollArea className="h-32">
          <div className="space-y-2">
            {activeUsers.map((user) => (
              <div key={user.id} className="flex items-center justify-between p-2 rounded-lg bg-gray-50 dark:bg-gray-800">
                <div className="flex items-center space-x-2">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user.avatar} />
                    <AvatarFallback className="text-xs">
                      {user.name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">
                      {user.name}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {user.email}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-1">
                  <Badge className={`text-xs ${getRoleColor(user.role)}`}>
                    {getRoleIcon(user.role)}
                    <span className="ml-1">{user.role}</span>
                  </Badge>
                  {user.id !== currentUser.id && (
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={() => onManagePermissions?.(user.id)}
                      className="h-6 w-6 p-0"
                    >
                      <Settings className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Cursors and Selections */}
      <div className="p-4 border-b border-gray-200 dark:border-gray-700">
        <h4 className="text-sm font-medium text-gray-900 dark:text-white mb-3">
          Live Activity
        </h4>
        
        <div className="space-y-2">
          {cursors.map((cursor) => (
            <div key={cursor.userId} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: cursor.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {cursor.userName} is active
              </span>
            </div>
          ))}
          
          {selections.map((selection) => (
            <div key={selection.userId} className="flex items-center space-x-2">
              <div
                className="w-3 h-3 rounded-full"
                style={{ backgroundColor: selection.color }}
              />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {selection.userName} is selecting
              </span>
            </div>
          ))}
        </div>
      </div>

      {/* Invite Dialog */}
      {showInviteDialog && (
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="space-y-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white">
              Invite User
            </h4>
            <div className="flex space-x-2">
              <input
                type="email"
                placeholder="Enter email address"
                value={inviteEmail}
                onChange={(e) => setInviteEmail(e.target.value)}
                className="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
              />
              <Button size="sm" onClick={handleInviteUser}>
                Send
              </Button>
            </div>
            <Button
              size="sm"
              variant="ghost"
              onClick={() => setShowInviteDialog(false)}
              className="w-full"
            >
              Cancel
            </Button>
          </div>
        </div>
      )}

      {/* Footer */}
      <div className="mt-auto p-4">
        <div className="flex items-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
          <MessageSquare className="h-3 w-3" />
          <span>Real-time collaboration enabled</span>
        </div>
      </div>
    </div>
  );
}
