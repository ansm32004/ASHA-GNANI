import { apiClient } from './apiClient';

/**
 * Centralised Authentication API Service
 * Interacts with FastAPI backend auth routes or Firebase Auth bridge.
 */
export const authApi = {
  /**
   * Request OTP verification code for mobile number
   * Endpoint: POST /api/v1/auth/login
   */
  requestOtp: async (phoneNumber, role = 'ASHA') => {
    const res = await apiClient.post('/auth/login', {
      phone_number: phoneNumber,
      role
    });
    return res.data;
  },

  /**
   * Verify 6-digit OTP code and obtain session token
   * Endpoint: POST /api/v1/auth/verify
   */
  verifyOtp: async (sessionId, phoneNumber, otp) => {
    const res = await apiClient.post('/auth/verify', {
      session_id: sessionId,
      phone_number: phoneNumber,
      otp
    });
    return res.data;
  },

  /**
   * Credentials-based login
   * Endpoint: POST /api/v1/auth/login-credentials
   */
  loginWithCredentials: async (email, password, role = null) => {
    const res = await apiClient.post('/auth/login-credentials', {
      email,
      password,
      role
    });
    return res.data;
  },

  /**
   * Get current authenticated user profile
   * Endpoint: GET /api/v1/auth/me
   */
  getCurrentProfile: async () => {
    const res = await apiClient.get('/auth/me');
    return res.data;
  },

  /**
   * Logout session on backend if applicable
   * Endpoint: POST /api/v1/auth/logout
   */
  logout: async () => {
    try {
      await apiClient.post('/auth/logout');
    } catch (e) {
      // Non-fatal if offline
    }
  }
};

export default authApi;

