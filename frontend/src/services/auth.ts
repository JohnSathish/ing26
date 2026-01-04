/**
 * Authentication Service
 */

import { apiPost, apiGet, clearCSRFToken } from './api';
import { API_ENDPOINTS } from '../utils/constants';

export interface User {
  id: number;
  username: string;
  role: 'admin' | 'editor';
}

export interface AuthResponse {
  success: boolean;
  user: User;
  csrf_token: string;
}

export interface LoginCredentials {
  username: string;
  password: string;
}

/**
 * Login
 */
export async function login(credentials: LoginCredentials): Promise<AuthResponse> {
  const response = await apiPost<AuthResponse>(
    API_ENDPOINTS.AUTH.LOGIN,
    credentials
  );
  return response;
}

/**
 * Logout
 */
export async function logout(): Promise<void> {
  try {
    await apiPost(API_ENDPOINTS.AUTH.LOGOUT, {});
  } catch (error) {
    console.error('Logout error:', error);
  } finally {
    clearCSRFToken();
  }
}

/**
 * Check authentication status
 */
export async function checkAuth(): Promise<{ authenticated: boolean; user?: User }> {
  try {
    const response = await apiGet<{ authenticated: boolean; user?: User; csrf_token?: string }>(
      API_ENDPOINTS.AUTH.CHECK
    );
    return response;
  } catch (error) {
    return { authenticated: false };
  }
}


