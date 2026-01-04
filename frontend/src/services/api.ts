/**
 * API Client
 * Handles all API requests with credentials and CSRF token management
 */

import { API_ENDPOINTS } from '../utils/constants';

let csrfToken: string | null = null;

/**
 * Get CSRF token from session
 */
export async function getCSRFToken(): Promise<string | null> {
  if (csrfToken) {
    return csrfToken;
  }

  try {
    const response = await fetch(API_ENDPOINTS.AUTH.CHECK, {
      method: 'GET',
      credentials: 'include',
    });

    if (response.ok) {
      const data = await response.json();
      if (data.csrf_token) {
        csrfToken = data.csrf_token;
        return csrfToken;
      }
    }
  } catch (error) {
    console.error('Failed to get CSRF token:', error);
  }

  return null;
}

/**
 * Clear CSRF token
 */
export function clearCSRFToken() {
  csrfToken = null;
}

/**
 * API Request wrapper
 */
async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> {
  const method = options.method || 'GET';
  const isStateChanging = ['POST', 'PUT', 'PATCH', 'DELETE'].includes(method);

  // Get CSRF token for state-changing operations
  if (isStateChanging) {
    const token = await getCSRFToken();
    if (token) {
      options.headers = {
        ...options.headers,
        'X-CSRF-Token': token,
      };
    }
  }

  const response = await fetch(endpoint, {
    ...options,
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      ...options.headers,
    },
  });

  // Update CSRF token if provided in response
  if (response.headers.get('X-CSRF-Token')) {
    csrfToken = response.headers.get('X-CSRF-Token');
  }

  // Handle non-JSON responses (like 401 before JSON is sent)
  let data;
  const contentType = response.headers.get('content-type');
  
  try {
    if (contentType && contentType.includes('application/json')) {
      const text = await response.text();
      // Try to parse JSON, but handle parse errors gracefully
      try {
        data = JSON.parse(text);
      } catch (parseError) {
        // If JSON parse fails, log the actual response for debugging
        console.error('JSON parse error for endpoint:', endpoint);
        console.error('Response text:', text.substring(0, 200));
        throw new Error('Invalid JSON response from server');
      }
    } else {
      // If response is not JSON, create error object
      const text = await response.text();
      data = { error: text || 'API request failed' };
    }
  } catch (error) {
    // If we can't read the response, create a generic error
    console.error('Error reading response:', error);
    data = { error: 'Failed to read server response' };
  }

  if (!response.ok) {
    // If 401, clear auth state
    if (response.status === 401) {
      clearCSRFToken();
      // Only redirect to login if not already there AND not checking auth status
      // The /api/auth/check endpoint should return 200, not 401
      if (typeof window !== 'undefined' && 
          !window.location.pathname.includes('/login') &&
          !endpoint.includes('/auth/check')) {
        window.location.href = '/login';
      }
    }
    // Include detailed error message from server
    const errorMessage = data.error || data.message || 'API request failed';
    const fullError = data.message ? `${errorMessage}: ${data.message}` : errorMessage;
    console.error('API Error:', {
      status: response.status,
      endpoint,
      error: data,
      fullResponse: data
    });
    throw new Error(fullError);
  }

  return data;
}

/**
 * GET request
 */
export async function apiGet<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'GET' });
}

/**
 * POST request
 */
export async function apiPost<T>(endpoint: string, body: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'POST',
    body: JSON.stringify(body),
  });
}

/**
 * PUT request
 */
export async function apiPut<T>(endpoint: string, body: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PUT',
    body: JSON.stringify(body),
  });
}

/**
 * PATCH request
 */
export async function apiPatch<T>(endpoint: string, body: any): Promise<T> {
  return apiRequest<T>(endpoint, {
    method: 'PATCH',
    body: JSON.stringify(body),
  });
}

/**
 * DELETE request
 */
export async function apiDelete<T>(endpoint: string): Promise<T> {
  return apiRequest<T>(endpoint, { method: 'DELETE' });
}

/**
 * Upload image file
 */
export async function apiUploadImage(file: File): Promise<{ success: boolean; url: string; filename: string; message: string }> {
  const token = await getCSRFToken();
  
  const formData = new FormData();
  formData.append('image', file);
  
  const headers: HeadersInit = {
    'X-CSRF-Token': token || '',
  };
  
  const response = await fetch(API_ENDPOINTS.UPLOAD.IMAGE, {
    method: 'POST',
    credentials: 'include',
    headers: headers,
    body: formData,
  });
  
  const data = await response.json();
  
  if (!response.ok) {
    throw new Error(data.error || 'Image upload failed');
  }
  
  return data;
}


