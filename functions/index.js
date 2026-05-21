/**
 * VioletCare Cloud Functions
 * Admin controls and user management backend
 */

const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp();

const ADMIN_EMAIL = 'kaphirij9@gmail.com';

/**
 * Helper function to verify admin privileges
 */
async function verifyAdmin(context) {
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'Must be logged in to perform this action'
    );
  }

  const adminDoc = await admin
    .firestore()
    .doc(`users/${context.auth.uid}`)
    .get();

  if (!adminDoc.exists || !adminDoc.data()?.isAdmin) {
    throw new functions.https.HttpsError(
      'permission-denied',
      'Must be an administrator to perform this action'
    );
  }

  return adminDoc.data();
}

/**
 * Trigger: On user creation via Firebase Auth
 * Creates user profile in Firestore with appropriate permissions
 */
exports.onUserCreate = functions.auth.user().onCreate(async (user) => {
  const isAdmin = user.email === ADMIN_EMAIL;

  try {
    await admin.firestore().doc(`users/${user.uid}`).set({
      uid: user.uid,
      email: user.email,
      displayName: user.email?.split('@')[0] || 'User',
      isActive: true,
      isAdmin,
      deviceInstalled: false,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    console.log(`User profile created for ${user.email} (Admin: ${isAdmin})`);
  } catch (error) {
    console.error('Error creating user profile:', error);
    throw error;
  }
});

/**
 * Trigger: On user deletion via Firebase Auth
 * Cleans up user data from Firestore
 */
exports.onUserDelete = functions.auth.user().onDelete(async (user) => {
  try {
    // Delete user profile
    await admin.firestore().doc(`users/${user.uid}`).delete();

    // Delete user data collection
    const userDataRef = admin.firestore().collection(`userData/${user.uid}`);
    const batch = admin.firestore().batch();
    const snapshot = await userDataRef.listDocuments();

    snapshot.forEach((doc) => {
      batch.delete(doc);
    });

    await batch.commit();

    console.log(`User data deleted for ${user.email}`);
  } catch (error) {
    console.error('Error deleting user data:', error);
  }
});

/**
 * Admin: Get all users
 * Returns list of all registered users with their status
 */
exports.adminGetAllUsers = functions.https.onCall(async (data, context) => {
  await verifyAdmin(context);

  try {
    const usersSnapshot = await admin.firestore().collection('users').get();

    const users = usersSnapshot.docs.map((doc) => ({
      uid: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.()?.toISOString() || null,
      lastLoginAt: doc.data().lastLoginAt?.toDate?.()?.toISOString() || null,
      disabledAt: doc.data().disabledAt?.toDate?.()?.toISOString() || null,
    }));

    return { users, count: users.length };
  } catch (error) {
    console.error('Error getting users:', error);
    throw new functions.https.HttpsError('internal', 'Failed to retrieve users');
  }
});

/**
 * Admin: Disable user account
 * Prevents user from accessing the app
 */
exports.adminDisableUser = functions.https.onCall(async (data, context) => {
  await verifyAdmin(context);

  const { uid } = data;

  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
  }

  try {
    // Disable authentication
    await admin.auth().updateUser(uid, { disabled: true });

    // Update Firestore profile
    await admin.firestore().doc(`users/${uid}`).update({
      isActive: false,
      disabledAt: admin.firestore.FieldValue.serverTimestamp(),
      disabledBy: context.auth.uid,
    });

    console.log(`User ${uid} disabled by admin ${context.auth.uid}`);
    return { success: true, message: 'User disabled successfully' };
  } catch (error) {
    console.error('Error disabling user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to disable user');
  }
});

/**
 * Admin: Enable user account
 * Restores user access to the app
 */
exports.adminEnableUser = functions.https.onCall(async (data, context) => {
  await verifyAdmin(context);

  const { uid } = data;

  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
  }

  try {
    // Enable authentication
    await admin.auth().updateUser(uid, { disabled: false });

    // Update Firestore profile
    await admin.firestore().doc(`users/${uid}`).update({
      isActive: true,
      disabledAt: admin.firestore.FieldValue.delete(),
      disabledBy: admin.firestore.FieldValue.delete(),
    });

    console.log(`User ${uid} enabled by admin ${context.auth.uid}`);
    return { success: true, message: 'User enabled successfully' };
  } catch (error) {
    console.error('Error enabling user:', error);
    throw new functions.https.HttpsError('internal', 'Failed to enable user');
  }
});

/**
 * Admin: Send push notification to user
 * Sends a message to a specific user's device
 */
exports.adminSendNotification = functions.https.onCall(async (data, context) => {
  await verifyAdmin(context);

  const { uid, message } = data;

  if (!uid || !message) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'User ID and message are required'
    );
  }

  try {
    // Get user's FCM token
    const userDoc = await admin.firestore().doc(`users/${uid}`).get();

    if (!userDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'User not found');
    }

    const fcmToken = userDoc.data()?.fcmToken;

    if (!fcmToken) {
      return { success: false, message: 'User has no registered device token' };
    }

    // Send notification
    await admin.messaging().send({
      token: fcmToken,
      notification: {
        title: 'Message from VioletCare',
        body: message,
      },
      webpush: {
        fcmOptions: {
          link: '/',
        },
        notification: {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
        },
      },
    });

    console.log(`Notification sent to user ${uid}`);
    return { success: true, message: 'Notification sent successfully' };
  } catch (error) {
    console.error('Error sending notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to send notification');
  }
});

/**
 * Admin: Get user activity log
 * Returns recent activity for a specific user
 */
exports.adminGetUserActivity = functions.https.onCall(async (data, context) => {
  await verifyAdmin(context);

  const { uid, limit = 50 } = data;

  if (!uid) {
    throw new functions.https.HttpsError('invalid-argument', 'User ID is required');
  }

  try {
    const activitySnapshot = await admin
      .firestore()
      .collection(`userData/${uid}/activity`)
      .orderBy('timestamp', 'desc')
      .limit(limit)
      .get();

    const activities = activitySnapshot.docs.map((doc) => ({
      id: doc.id,
      ...doc.data(),
      timestamp: doc.data().timestamp?.toDate?.()?.toISOString() || null,
    }));

    return { activities, count: activities.length };
  } catch (error) {
    console.error('Error getting user activity:', error);
    throw new functions.https.HttpsError('internal', 'Failed to retrieve user activity');
  }
});

/**
 * User: Update last login timestamp
 * Called when user successfully authenticates
 */
exports.updateLastLogin = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  try {
    await admin.firestore().doc(`users/${context.auth.uid}`).update({
      lastLoginAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating last login:', error);
    throw new functions.https.HttpsError('internal', 'Failed to update login timestamp');
  }
});

/**
 * User: Mark device as installed
 * Called when user successfully installs PWA
 */
exports.markDeviceInstalled = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { fcmToken } = data;

  try {
    const updateData = {
      deviceInstalled: true,
      installedAt: admin.firestore.FieldValue.serverTimestamp(),
    };

    if (fcmToken) {
      updateData.fcmToken = fcmToken;
    }

    await admin.firestore().doc(`users/${context.auth.uid}`).update(updateData);

    return { success: true };
  } catch (error) {
    console.error('Error marking device installed:', error);
    throw new functions.https.HttpsError('internal', 'Failed to mark device as installed');
  }
});

/**
 * User: Register FCM token for push notifications
 */
exports.registerFCMToken = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { fcmToken } = data;

  if (!fcmToken) {
    throw new functions.https.HttpsError('invalid-argument', 'FCM token is required');
  }

  try {
    await admin.firestore().doc(`users/${context.auth.uid}`).update({
      fcmToken,
      fcmTokenUpdatedAt: admin.firestore.FieldValue.serverTimestamp(),
    });

    return { success: true };
  } catch (error) {
    console.error('Error registering FCM token:', error);
    throw new functions.https.HttpsError('internal', 'Failed to register FCM token');
  }
});

/**
 * User: Sync data to cloud
 * Backs up local IndexedDB data to Firestore
 */
exports.syncUserData = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  const { dataType, items } = data;

  if (!dataType || !Array.isArray(items)) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Data type and items array are required'
    );
  }

  try {
    const batch = admin.firestore().batch();
    const userDataRef = admin.firestore().collection(`userData/${context.auth.uid}/${dataType}`);

    items.forEach((item) => {
      const docRef = userDataRef.doc(item.id || admin.firestore().collection('_').doc().id);
      batch.set(docRef, {
        ...item,
        syncedAt: admin.firestore.FieldValue.serverTimestamp(),
      });
    });

    await batch.commit();

    console.log(`Synced ${items.length} ${dataType} items for user ${context.auth.uid}`);
    return { success: true, syncedCount: items.length };
  } catch (error) {
    console.error('Error syncing user data:', error);
    throw new functions.https.HttpsError('internal', 'Failed to sync data');
  }
});

/**
 * User: Verify account status
 * Checks if user account is still active
 */
exports.verifyUserStatus = functions.https.onCall(async (data, context) => {
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
  }

  try {
    const userDoc = await admin.firestore().doc(`users/${context.auth.uid}`).get();

    if (!userDoc.exists) {
      return { isActive: false, reason: 'User profile not found' };
    }

    const userData = userDoc.data();

    if (!userData.isActive) {
      return { isActive: false, reason: 'Account has been disabled' };
    }

    return { isActive: true, user: userData };
  } catch (error) {
    console.error('Error verifying user status:', error);
    throw new functions.https.HttpsError('internal', 'Failed to verify user status');
  }
});

/**
 * Scheduled: Clean up old activity logs
 * Runs daily to remove activity logs older than 90 days
 */
exports.cleanupOldActivityLogs = functions.pubsub
  .schedule('every 24 hours')
  .onRun(async (context) => {
    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - 90);

    try {
      const usersSnapshot = await admin.firestore().collection('users').get();

      for (const userDoc of usersSnapshot.docs) {
        const activityRef = admin.firestore().collection(`userData/${userDoc.id}/activity`);
        const oldActivities = await activityRef
          .where('timestamp', '<', cutoffDate)
          .get();

        const batch = admin.firestore().batch();
        oldActivities.docs.forEach((doc) => {
          batch.delete(doc.ref);
        });

        if (oldActivities.size > 0) {
          await batch.commit();
          console.log(`Deleted ${oldActivities.size} old activity logs for user ${userDoc.id}`);
        }
      }

      return null;
    } catch (error) {
      console.error('Error cleaning up activity logs:', error);
      return null;
    }
  });

/**
 * Admin: Broadcast notification to all users
 * Sends a notification to all active users
 */
exports.adminBroadcastNotification = functions.https.onCall(async (data, context) => {
  await verifyAdmin(context);

  const { title, message } = data;

  if (!title || !message) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Title and message are required'
    );
  }

  try {
    const usersSnapshot = await admin
      .firestore()
      .collection('users')
      .where('isActive', '==', true)
      .where('fcmToken', '!=', null)
      .get();

    const tokens = usersSnapshot.docs
      .map((doc) => doc.data().fcmToken)
      .filter((token) => token);

    if (tokens.length === 0) {
      return { success: false, message: 'No registered devices found' };
    }

    const response = await admin.messaging().sendMulticast({
      tokens,
      notification: {
        title,
        body: message,
      },
      webpush: {
        fcmOptions: {
          link: '/',
        },
        notification: {
          icon: '/icon-192.png',
          badge: '/icon-192.png',
        },
      },
    });

    console.log(`Broadcast sent to ${response.successCount} devices`);
    return {
      success: true,
      successCount: response.successCount,
      failureCount: response.failureCount,
    };
  } catch (error) {
    console.error('Error broadcasting notification:', error);
    throw new functions.https.HttpsError('internal', 'Failed to broadcast notification');
  }
});
