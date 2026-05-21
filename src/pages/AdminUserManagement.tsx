import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Users, UserCheck, UserX, Mail, Calendar, Shield, AlertTriangle,
  Eye, Ban, CheckCircle, Send, Activity, Clock, Smartphone
} from 'lucide-react';
import {
  adminGetAllUsers,
  adminDisableUser,
  adminEnableUser,
  adminSendNotification,
  adminGetUserActivity,
  getCurrentUser,
  type UserProfile
} from '../utils/firebase';

const AdminUserManagement = () => {
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);
  const [showUserDetails, setShowUserDetails] = useState(false);
  const [showConfirmDisable, setShowConfirmDisable] = useState<string | null>(null);
  const [showSendNotification, setShowSendNotification] = useState<string | null>(null);
  const [notificationMessage, setNotificationMessage] = useState('');
  const [adminUser, setAdminUser] = useState<UserProfile | null>(null);
  const [userActivity, setUserActivity] = useState<any>(null);

  useEffect(() => {
    loadUsers();
    loadAdminUser();
  }, []);

  const loadAdminUser = async () => {
    const user = await getCurrentUser();
    setAdminUser(user);
  };

  const loadUsers = async () => {
    setLoading(true);
    try {
      const allUsers = await adminGetAllUsers();
      setUsers(allUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleViewDetails = async (user: UserProfile) => {
    setSelectedUser(user);
    setShowUserDetails(true);
    
    // Load user activity
    try {
      const activity = await adminGetUserActivity(user.uid);
      setUserActivity(activity);
    } catch (error) {
      console.error('Failed to load user activity:', error);
    }
  };

  const handleDisableUser = async (uid: string) => {
    if (!adminUser) return;
    
    try {
      await adminDisableUser(uid, adminUser.uid);
      await loadUsers();
      setShowConfirmDisable(null);
      if (selectedUser?.uid === uid) {
        setShowUserDetails(false);
      }
    } catch (error) {
      console.error('Failed to disable user:', error);
      alert('Failed to disable user. Please try again.');
    }
  };

  const handleEnableUser = async (uid: string) => {
    try {
      await adminEnableUser(uid);
      await loadUsers();
      if (selectedUser?.uid === uid) {
        const updatedUser = users.find(u => u.uid === uid);
        if (updatedUser) {
          setSelectedUser(updatedUser);
        }
      }
    } catch (error) {
      console.error('Failed to enable user:', error);
      alert('Failed to enable user. Please try again.');
    }
  };

  const handleSendNotification = async (uid: string) => {
    if (!notificationMessage.trim()) {
      alert('Please enter a message');
      return;
    }

    try {
      await adminSendNotification(uid, notificationMessage);
      setNotificationMessage('');
      setShowSendNotification(null);
      alert('Notification sent successfully!');
    } catch (error) {
      console.error('Failed to send notification:', error);
      alert('Failed to send notification. Please try again.');
    }
  };

  const stats = {
    total: users.length,
    active: users.filter(u => u.isActive).length,
    inactive: users.filter(u => !u.isActive).length,
    installed: users.filter(u => u.deviceInstalled).length,
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-violet flex items-center justify-center">
        <div className="w-8 h-8 rounded-full border-2 border-violet-400 border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen px-4 pt-6 pb-28">
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-2xl font-playfair font-semibold text-white flex items-center gap-2">
          <Users size={24} className="text-violet-400" />
          User Management
        </h1>
        <p className="text-white/60 text-sm font-dm-sans mt-1">
          Manage all VioletCare users and their access
        </p>
      </motion.div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-violet-500/20 border border-violet-400/40 rounded-xl flex items-center justify-center">
              <Users size={20} className="text-violet-300" />
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">Total Users</p>
              <p className="text-white text-2xl font-playfair font-semibold">{stats.total}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-emerald-500/20 border border-emerald-400/40 rounded-xl flex items-center justify-center">
              <UserCheck size={20} className="text-emerald-300" />
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">Active</p>
              <p className="text-white text-2xl font-playfair font-semibold">{stats.active}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-rose-500/20 border border-rose-400/40 rounded-xl flex items-center justify-center">
              <UserX size={20} className="text-rose-300" />
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">Disabled</p>
              <p className="text-white text-2xl font-playfair font-semibold">{stats.inactive}</p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.25 }}
          className="glass-card p-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-500/20 border border-blue-400/40 rounded-xl flex items-center justify-center">
              <Smartphone size={20} className="text-blue-300" />
            </div>
            <div>
              <p className="text-white/60 text-xs uppercase tracking-wider">Installed</p>
              <p className="text-white text-2xl font-playfair font-semibold">{stats.installed}</p>
            </div>
          </div>
        </motion.div>
      </div>

      {/* Users List */}
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card p-5"
      >
        <h2 className="text-white font-playfair text-lg mb-4">All Users</h2>
        
        {users.length === 0 ? (
          <div className="text-center py-8">
            <Users size={48} className="text-white/20 mx-auto mb-3" />
            <p className="text-white/50 text-sm">No users yet</p>
          </div>
        ) : (
          <div className="space-y-2">
            {users.map((user) => (
              <div
                key={user.uid}
                className="p-4 bg-white/5 border border-white/10 rounded-xl hover:bg-white/10 transition-colors"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <Mail size={14} className="text-white/40" />
                      <p className="text-white text-sm font-medium">{user.email}</p>
                      {user.isAdmin && (
                        <span className="px-2 py-0.5 bg-violet-500/30 border border-violet-400/40 rounded-full text-[10px] text-violet-200 uppercase tracking-wider">
                          Admin
                        </span>
                      )}
                    </div>
                    
                    <div className="flex items-center gap-4 text-xs text-white/50 mt-2">
                      <div className="flex items-center gap-1">
                        <Calendar size={12} />
                        <span>Joined {new Date(user.createdAt).toLocaleDateString()}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <Clock size={12} />
                        <span>Last login {new Date(user.lastLoginAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 mt-2">
                      {user.isActive ? (
                        <span className="flex items-center gap-1 px-2 py-1 bg-emerald-500/20 border border-emerald-400/40 rounded-lg text-[10px] text-emerald-200">
                          <CheckCircle size={10} />
                          Active
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 px-2 py-1 bg-rose-500/20 border border-rose-400/40 rounded-lg text-[10px] text-rose-200">
                          <Ban size={10} />
                          Disabled
                        </span>
                      )}
                      {user.deviceInstalled && (
                        <span className="flex items-center gap-1 px-2 py-1 bg-blue-500/20 border border-blue-400/40 rounded-lg text-[10px] text-blue-200">
                          <Smartphone size={10} />
                          Installed
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="flex flex-col gap-2">
                    <button
                      onClick={() => handleViewDetails(user)}
                      className="p-2 bg-violet-500/20 border border-violet-400/40 rounded-lg text-violet-300 hover:bg-violet-500/30 transition-colors"
                    >
                      <Eye size={16} />
                    </button>
                    {!user.isAdmin && (
                      <>
                        {user.isActive ? (
                          <button
                            onClick={() => setShowConfirmDisable(user.uid)}
                            className="p-2 bg-rose-500/20 border border-rose-400/40 rounded-lg text-rose-300 hover:bg-rose-500/30 transition-colors"
                          >
                            <Ban size={16} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleEnableUser(user.uid)}
                            className="p-2 bg-emerald-500/20 border border-emerald-400/40 rounded-lg text-emerald-300 hover:bg-emerald-500/30 transition-colors"
                          >
                            <CheckCircle size={16} />
                          </button>
                        )}
                        <button
                          onClick={() => setShowSendNotification(user.uid)}
                          className="p-2 bg-blue-500/20 border border-blue-400/40 rounded-lg text-blue-300 hover:bg-blue-500/30 transition-colors"
                        >
                          <Send size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </motion.div>

      {/* User Details Modal */}
      <AnimatePresence>
        {showUserDetails && selectedUser && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
            onClick={() => setShowUserDetails(false)}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg max-h-[80vh] overflow-y-auto p-6 rounded-2xl bg-[#1a0533] border border-white/15"
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-white font-playfair text-xl">User Details</h3>
                <button
                  onClick={() => setShowUserDetails(false)}
                  className="p-2 hover:bg-white/10 rounded-lg transition-colors"
                >
                  <span className="text-white text-xl">×</span>
                </button>
              </div>

              <div className="space-y-4">
                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Email</p>
                  <p className="text-white text-sm">{selectedUser.email}</p>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-white/60 text-xs uppercase tracking-wider mb-1">User ID</p>
                  <p className="text-white text-xs font-mono break-all">{selectedUser.uid}</p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Created</p>
                    <p className="text-white text-sm">{new Date(selectedUser.createdAt).toLocaleString()}</p>
                  </div>

                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-white/60 text-xs uppercase tracking-wider mb-1">Last Login</p>
                    <p className="text-white text-sm">{new Date(selectedUser.lastLoginAt).toLocaleString()}</p>
                  </div>
                </div>

                <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                  <p className="text-white/60 text-xs uppercase tracking-wider mb-2">Status</p>
                  <div className="flex flex-wrap gap-2">
                    {selectedUser.isActive ? (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-emerald-500/20 border border-emerald-400/40 rounded-lg text-xs text-emerald-200">
                        <CheckCircle size={14} />
                        Active
                      </span>
                    ) : (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-rose-500/20 border border-rose-400/40 rounded-lg text-xs text-rose-200">
                        <Ban size={14} />
                        Disabled
                      </span>
                    )}
                    {selectedUser.deviceInstalled && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-blue-500/20 border border-blue-400/40 rounded-lg text-xs text-blue-200">
                        <Smartphone size={14} />
                        App Installed
                      </span>
                    )}
                    {selectedUser.isAdmin && (
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-violet-500/20 border border-violet-400/40 rounded-lg text-xs text-violet-200">
                        <Shield size={14} />
                        Admin
                      </span>
                    )}
                  </div>
                </div>

                {selectedUser.disabledAt && (
                  <div className="p-4 bg-rose-500/10 border border-rose-400/30 rounded-xl">
                    <p className="text-rose-200 text-xs uppercase tracking-wider mb-1">Disabled At</p>
                    <p className="text-rose-100 text-sm">{new Date(selectedUser.disabledAt).toLocaleString()}</p>
                  </div>
                )}

                {userActivity && (
                  <div className="p-4 bg-white/5 border border-white/10 rounded-xl">
                    <p className="text-white/60 text-xs uppercase tracking-wider mb-2 flex items-center gap-1">
                      <Activity size={12} />
                      Recent Activity
                    </p>
                    <p className="text-white/50 text-xs italic">Activity data will be shown here</p>
                  </div>
                )}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Confirm Disable Modal */}
      <AnimatePresence>
        {showConfirmDisable && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-sm p-6 rounded-2xl bg-[#1a0533] border border-white/15"
            >
              <div className="flex items-center gap-3 mb-4">
                <AlertTriangle size={24} className="text-amber-400" />
                <h3 className="text-white font-playfair text-lg">Disable User?</h3>
              </div>
              
              <p className="text-white/70 text-sm mb-6 font-dm-sans">
                This will prevent the user from accessing the app. They will be logged out and cannot sign in until re-enabled.
              </p>

              <div className="flex gap-3">
                <button
                  onClick={() => handleDisableUser(showConfirmDisable)}
                  className="flex-1 py-3 bg-rose-500 hover:bg-rose-600 text-white rounded-xl font-dm-sans font-medium transition-colors"
                >
                  Disable User
                </button>
                <button
                  onClick={() => setShowConfirmDisable(null)}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-dm-sans transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Send Notification Modal */}
      <AnimatePresence>
        {showSendNotification && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[70] bg-black/60 backdrop-blur-sm flex items-center justify-center px-6"
          >
            <motion.div
              initial={{ scale: 0.9 }}
              animate={{ scale: 1 }}
              exit={{ scale: 0.9 }}
              className="w-full max-w-sm p-6 rounded-2xl bg-[#1a0533] border border-white/15"
            >
              <div className="flex items-center gap-3 mb-4">
                <Send size={24} className="text-blue-400" />
                <h3 className="text-white font-playfair text-lg">Send Notification</h3>
              </div>
              
              <textarea
                value={notificationMessage}
                onChange={(e) => setNotificationMessage(e.target.value)}
                placeholder="Enter notification message..."
                className="w-full h-32 px-4 py-3 bg-white/10 border border-white/20 rounded-xl text-white placeholder-white/40 resize-none focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none transition-all font-dm-sans text-sm"
              />

              <div className="flex gap-3 mt-4">
                <button
                  onClick={() => handleSendNotification(showSendNotification)}
                  disabled={!notificationMessage.trim()}
                  className="flex-1 py-3 bg-blue-500 hover:bg-blue-600 disabled:bg-blue-500/50 disabled:cursor-not-allowed text-white rounded-xl font-dm-sans font-medium transition-colors"
                >
                  Send
                </button>
                <button
                  onClick={() => {
                    setShowSendNotification(null);
                    setNotificationMessage('');
                  }}
                  className="flex-1 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-dm-sans transition-colors"
                >
                  Cancel
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default AdminUserManagement;
