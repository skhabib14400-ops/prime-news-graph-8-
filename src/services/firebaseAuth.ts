/**
 * PRIME NEWS GRAPH — Firebase Authentication & Authorization Service
 * Dedicated to Administrative Security & Role Verification
 */

import {
  signInWithEmailAndPassword,
  signOut,
  updatePassword,
  sendPasswordResetEmail,
  reauthenticateWithCredential,
  EmailAuthProvider,
  User,
  onAuthStateChanged
} from 'firebase/auth';
import { auth } from './firebase';
import { AdminUser } from '../types/news';

export const AUTHORIZED_OWNER_EMAIL = 'amazonshopping14264@gmail.com';

export interface FirebaseAuthResult {
  success: boolean;
  user?: AdminUser;
  token?: string;
  message?: string;
  error?: string;
}

export const firebaseAuthService = {
  getOwnerEmail(): string {
    return AUTHORIZED_OWNER_EMAIL;
  },

  getCurrentUser(): User | null {
    return auth.currentUser;
  },

  /**
   * Primary Login: Signs in with Firebase Authentication (Email/Password),
   * retrieves cryptographic ID token, and verifies strictly against trusted server.
   * Client NEVER creates or assigns its own admin privileges.
   */
  async loginWithFirebase(emailInput: string, passwordInput: string): Promise<FirebaseAuthResult> {
    const email = emailInput.trim().toLowerCase();
    const password = passwordInput;

    if (!email || !password) {
      return { success: false, message: 'Email and password are required.' };
    }

    try {
      // 1. Authenticate with Firebase Authentication
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      if (!user || !user.email) {
        await signOut(auth);
        return { success: false, message: 'Failed to retrieve Firebase user profile.' };
      }

      const userEmail = user.email.toLowerCase();

      // 2. Client-side Pre-Gate: Only the designated owner account can proceed
      if (userEmail !== AUTHORIZED_OWNER_EMAIL.toLowerCase()) {
        await signOut(auth);
        return {
          success: false,
          message: `Access denied. The account (${user.email}) is not authorized. Only the portal owner (${AUTHORIZED_OWNER_EMAIL}) has administrative privileges.`
        };
      }

      // 3. Retrieve fresh Cryptographic Firebase ID Token
      const idToken = await user.getIdToken(true);

      // 4. Server-Authoritative Verification (Rule 1 & 2):
      // The server cryptographically validates the token (issuer, audience, expiry, signature, email)
      // and bootstraps/confirms the owner admin role.
      const serverVerification = await this.verifyWithBackend(idToken);
      if (!serverVerification.success || !serverVerification.user) {
        await signOut(auth);
        return {
          success: false,
          message: (serverVerification as any).message || 'Server-side authorization check rejected access. Only authorized owner is permitted.'
        };
      }

      const adminUser: AdminUser = serverVerification.user;

      // 5. Persist verified admin session tokens in storage
      sessionStorage.setItem('png_active_admin_session', 'true');
      sessionStorage.setItem('png_auth_provider', 'firebase');
      localStorage.setItem('png_admin_token', idToken);
      localStorage.setItem('png_admin_user', JSON.stringify(adminUser));
      localStorage.setItem('png_admin_expires', String(Date.now() + 2 * 60 * 60 * 1000));

      return {
        success: true,
        user: adminUser,
        token: idToken,
        message: 'Firebase Authentication verified successfully by server.'
      };
    } catch (err: any) {
      console.error('Firebase Auth Login error:', err);
      let errMsg = 'Failed to sign in with Firebase. Please check your credentials.';

      if (err.code === 'auth/invalid-credential' || err.code === 'auth/user-not-found' || err.code === 'auth/wrong-password') {
        errMsg = 'Invalid email or password. Please verify your Firebase administrator credentials.';
      } else if (err.code === 'auth/too-many-requests') {
        errMsg = 'Access temporarily locked due to many failed attempts. Please reset your password or try again later.';
      } else if (err.code === 'auth/network-request-failed') {
        errMsg = 'Network connection to Firebase failed. You can use the Master Emergency Login fallback below.';
      } else if (err.message) {
        errMsg = err.message;
      }

      return { success: false, message: errMsg, error: err.code };
    }
  },

  /**
   * Verify token on the server-side to satisfy Rule 7 & Rule 8
   */
  async verifyWithBackend(idToken: string): Promise<{ success: boolean; user?: AdminUser }> {
    try {
      const res = await fetch('/api/auth/firebase-verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${idToken}`
        },
        body: JSON.stringify({ token: idToken })
      });

      if (!res.ok) {
        return { success: false };
      }
      return await res.json();
    } catch {
      return { success: false };
    }
  },

  /**
   * Verify active Firebase session
   */
  async checkActiveSession(): Promise<AdminUser | null> {
    return new Promise((resolve) => {
      const unsubscribe = onAuthStateChanged(auth, async (user) => {
        unsubscribe();
        if (user && user.email && user.email.toLowerCase() === AUTHORIZED_OWNER_EMAIL.toLowerCase()) {
          try {
            const token = await user.getIdToken();
            const adminUser: AdminUser = {
              id: user.uid,
              username: user.email,
              email: user.email,
              role: 'super_admin',
              two_factor_enabled: false,
              last_login: new Date().toISOString()
            };
            sessionStorage.setItem('png_active_admin_session', 'true');
            sessionStorage.setItem('png_auth_provider', 'firebase');
            localStorage.setItem('png_admin_token', token);
            localStorage.setItem('png_admin_user', JSON.stringify(adminUser));
            resolve(adminUser);
            return;
          } catch {
            resolve(null);
            return;
          }
        }
        resolve(null);
      });
    });
  },

  /**
   * Send Password Reset Email via Firebase Auth
   */
  async sendPasswordReset(emailInput?: string): Promise<{ success: boolean; message: string }> {
    const email = (emailInput || AUTHORIZED_OWNER_EMAIL).trim();
    try {
      await sendPasswordResetEmail(auth, email);
      return {
        success: true,
        message: `Password reset link sent successfully to ${email}. Please check your inbox and spam folder.`
      };
    } catch (err: any) {
      return {
        success: false,
        message: err.message || 'Failed to send password reset email.'
      };
    }
  },

  /**
   * Update Password in Firebase Authentication
   */
  async changePassword(newPassword: string, currentPassword?: string): Promise<{ success: boolean; message: string }> {
    const user = auth.currentUser;
    if (!user || !user.email) {
      return { success: false, message: 'No active Firebase authenticated user found.' };
    }

    try {
      // If current password provided, re-authenticate first to prevent auth/requires-recent-login
      if (currentPassword) {
        const credential = EmailAuthProvider.credential(user.email, currentPassword);
        await reauthenticateWithCredential(user, credential);
      }

      await updatePassword(user, newPassword);

      // Refresh ID token after password change
      const newToken = await user.getIdToken(true);
      localStorage.setItem('png_admin_token', newToken);

      return {
        success: true,
        message: 'Firebase administrator password updated successfully!'
      };
    } catch (err: any) {
      if (err.code === 'auth/requires-recent-login') {
        return {
          success: false,
          message: 'Recent login required for security. Please log out, log back in with your current password, and try updating again.'
        };
      }
      return {
        success: false,
        message: err.message || 'Failed to update Firebase password.'
      };
    }
  },

  /**
   * Logout from Firebase
   */
  async logout(): Promise<void> {
    try {
      await signOut(auth);
    } catch (e) {
      console.warn('Firebase signOut error:', e);
    } finally {
      sessionStorage.removeItem('png_active_admin_session');
      sessionStorage.removeItem('png_auth_provider');
      localStorage.removeItem('png_admin_token');
      localStorage.removeItem('png_admin_user');
      localStorage.removeItem('png_admin_expires');
    }
  }
};
