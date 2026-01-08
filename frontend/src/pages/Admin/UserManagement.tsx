import { useState, useEffect } from 'react';
import { useAuth } from '../../hooks/useAuth';
import { useToast } from '../../contexts/ToastContext';
import { apiGet, apiPost } from '../../services/api';
import { API_ENDPOINTS } from '../../utils/constants';
import AdminLayout from '../../components/AdminLayout/AdminLayout';
import LoadingSpinner from '../../components/LoadingSpinner/LoadingSpinner';
import './UserManagement.css';

interface UserData {
  id: number;
  username: string;
  role: string;
  created_at?: string;
  updated_at?: string;
  failed_attempts?: number;
  is_locked?: boolean;
}

function UserManagement() {
  const { user, refreshAuth } = useAuth();
  const { showSuccess, showError } = useToast();
  
  const [loading, setLoading] = useState(false);
  const [loadingUsers, setLoadingUsers] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [activeTab, setActiveTab] = useState<'my-account' | 'create-user' | 'all-users'>('my-account');
  
  // My Account form data
  const [formData, setFormData] = useState({
    username: '',
    current_password: '',
    new_password: '',
    confirm_password: ''
  });
  
  // Create User form data
  const [createUserData, setCreateUserData] = useState({
    username: '',
    password: '',
    confirm_password: '',
    role: 'admin'
  });
  
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createErrors, setCreateErrors] = useState<Record<string, string>>({});
  const [showPasswordFields, setShowPasswordFields] = useState(false);

  useEffect(() => {
    if (user) {
      setFormData(prev => ({
        ...prev,
        username: user.username || ''
      }));
    }
  }, [user]);

  useEffect(() => {
    if (activeTab === 'all-users') {
      loadUsers();
    }
  }, [activeTab]);

  const loadUsers = async () => {
    setLoadingUsers(true);
    try {
      const response = await apiGet<{ success: boolean; users: UserData[] }>(
        API_ENDPOINTS.ADMIN.LIST_USERS
      );
      if (response.success && response.users) {
        setUsers(response.users);
      }
    } catch (error: any) {
      console.error('Error loading users:', error);
      showError('Failed to load users');
    } finally {
      setLoadingUsers(false);
    }
  };

  const validateMyAccountForm = () => {
    const newErrors: Record<string, string> = {};

    if (formData.username && formData.username !== user?.username) {
      if (formData.username.length < 3 || formData.username.length > 50) {
        newErrors.username = 'Username must be between 3 and 50 characters';
      } else if (!/^[a-zA-Z0-9_]+$/.test(formData.username)) {
        newErrors.username = 'Username can only contain letters, numbers, and underscores';
      }
    }

    if (showPasswordFields) {
      if (!formData.current_password) {
        newErrors.current_password = 'Current password is required';
      }
      
      if (!formData.new_password) {
        newErrors.new_password = 'New password is required';
      } else if (formData.new_password.length < 8) {
        newErrors.new_password = 'Password must be at least 8 characters long';
      }
      
      if (formData.new_password !== formData.confirm_password) {
        newErrors.confirm_password = 'Passwords do not match';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const validateCreateUserForm = () => {
    const newErrors: Record<string, string> = {};

    if (!createUserData.username) {
      newErrors.username = 'Username is required';
    } else if (createUserData.username.length < 3 || createUserData.username.length > 50) {
      newErrors.username = 'Username must be between 3 and 50 characters';
    } else if (!/^[a-zA-Z0-9_]+$/.test(createUserData.username)) {
      newErrors.username = 'Username can only contain letters, numbers, and underscores';
    }
    
    if (!createUserData.password) {
      newErrors.password = 'Password is required';
    } else if (createUserData.password.length < 8) {
      newErrors.password = 'Password must be at least 8 characters long';
    }
    
    if (createUserData.password !== createUserData.confirm_password) {
      newErrors.confirm_password = 'Passwords do not match';
    }

    setCreateErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleMyAccountSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateMyAccountForm()) {
      return;
    }

    const usernameChanged = formData.username !== user?.username;
    const passwordChanged = showPasswordFields && formData.new_password;
    
    if (!usernameChanged && !passwordChanged) {
      showError('No changes to save');
      return;
    }

    setLoading(true);
    
    try {
      const payload: any = {};
      
      if (usernameChanged) {
        payload.username = formData.username;
      }
      
      if (passwordChanged) {
        payload.current_password = formData.current_password;
        payload.new_password = formData.new_password;
        payload.confirm_password = formData.confirm_password;
      }

      const response = await apiPost<{ success: boolean; message: string; user: UserData }>(
        API_ENDPOINTS.ADMIN.UPDATE_CREDENTIALS,
        payload
      );

      if (response.success) {
        showSuccess(response.message || 'Credentials updated successfully');
        await refreshAuth();
        setFormData({
          username: response.user.username,
          current_password: '',
          new_password: '',
          confirm_password: ''
        });
        setShowPasswordFields(false);
        setErrors({});
      } else {
        showError(response.error || 'Failed to update credentials');
      }
    } catch (error: any) {
      console.error('Error updating credentials:', error);
      showError(error.message || 'An error occurred while updating credentials');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!validateCreateUserForm()) {
      return;
    }

    setLoading(true);
    
    try {
      const response = await apiPost<{ success: boolean; message: string; user: UserData }>(
        API_ENDPOINTS.ADMIN.CREATE_USER,
        {
          username: createUserData.username,
          password: createUserData.password,
          confirm_password: createUserData.confirm_password,
          role: createUserData.role
        }
      );

      if (response.success) {
        showSuccess(response.message || 'User created successfully');
        setCreateUserData({
          username: '',
          password: '',
          confirm_password: '',
          role: 'admin'
        });
        setCreateErrors({});
        // Reload users list if on that tab
        if (activeTab === 'all-users') {
          await loadUsers();
        }
      } else {
        showError(response.error || 'Failed to create user');
      }
    } catch (error: any) {
      console.error('Error creating user:', error);
      showError(error.message || 'An error occurred while creating user');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (errors[name]) {
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  const handleCreateUserInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    setCreateUserData(prev => ({
      ...prev,
      [name]: value
    }));
    
    if (createErrors[name]) {
      setCreateErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[name];
        return newErrors;
      });
    }
  };

  if (!user) {
    return <LoadingSpinner fullScreen message="Loading user data..." />;
  }

  return (
    <AdminLayout>
      <div className="user-management-container">
        <div className="user-management-header">
          <h1>User Management</h1>
          <p className="subtitle">Manage admin users and account settings</p>
        </div>

        <div className="tabs">
          <button
            className={`tab ${activeTab === 'my-account' ? 'active' : ''}`}
            onClick={() => setActiveTab('my-account')}
          >
            My Account
          </button>
          <button
            className={`tab ${activeTab === 'create-user' ? 'active' : ''}`}
            onClick={() => setActiveTab('create-user')}
          >
            Create New User
          </button>
          <button
            className={`tab ${activeTab === 'all-users' ? 'active' : ''}`}
            onClick={() => setActiveTab('all-users')}
          >
            All Users
          </button>
        </div>

        <div className="user-management-content">
          {activeTab === 'my-account' && (
            <>
              <div className="user-info-card">
                <h2>Current Account Information</h2>
                <div className="info-grid">
                  <div className="info-item">
                    <label>User ID</label>
                    <span>{user.id}</span>
                  </div>
                  <div className="info-item">
                    <label>Username</label>
                    <span>{user.username}</span>
                  </div>
                  <div className="info-item">
                    <label>Role</label>
                    <span className="role-badge">{user.role}</span>
                  </div>
                </div>
              </div>

              <form className="credentials-form" onSubmit={handleMyAccountSubmit}>
                <div className="form-section">
                  <h2>Update Credentials</h2>
                  
                  <div className="form-group">
                    <label htmlFor="username">
                      Username
                      <span className="required">*</span>
                    </label>
                    <input
                      type="text"
                      id="username"
                      name="username"
                      value={formData.username}
                      onChange={handleInputChange}
                      className={errors.username ? 'error' : ''}
                      placeholder="Enter new username"
                      disabled={loading}
                    />
                    {errors.username && (
                      <span className="error-message">{errors.username}</span>
                    )}
                    <small className="hint">
                      Username must be 3-50 characters and contain only letters, numbers, and underscores
                    </small>
                  </div>

                  <div className="password-toggle">
                    <button
                      type="button"
                      className="toggle-password-btn"
                      onClick={() => setShowPasswordFields(!showPasswordFields)}
                      disabled={loading}
                    >
                      {showPasswordFields ? 'Hide' : 'Change'} Password
                    </button>
                  </div>

                  {showPasswordFields && (
                    <>
                      <div className="form-group">
                        <label htmlFor="current_password">
                          Current Password
                          <span className="required">*</span>
                        </label>
                        <input
                          type="password"
                          id="current_password"
                          name="current_password"
                          value={formData.current_password}
                          onChange={handleInputChange}
                          className={errors.current_password ? 'error' : ''}
                          placeholder="Enter current password"
                          disabled={loading}
                        />
                        {errors.current_password && (
                          <span className="error-message">{errors.current_password}</span>
                        )}
                      </div>

                      <div className="form-group">
                        <label htmlFor="new_password">
                          New Password
                          <span className="required">*</span>
                        </label>
                        <input
                          type="password"
                          id="new_password"
                          name="new_password"
                          value={formData.new_password}
                          onChange={handleInputChange}
                          className={errors.new_password ? 'error' : ''}
                          placeholder="Enter new password"
                          disabled={loading}
                        />
                        {errors.new_password && (
                          <span className="error-message">{errors.new_password}</span>
                        )}
                        <small className="hint">
                          Password must be at least 8 characters long
                        </small>
                      </div>

                      <div className="form-group">
                        <label htmlFor="confirm_password">
                          Confirm New Password
                          <span className="required">*</span>
                        </label>
                        <input
                          type="password"
                          id="confirm_password"
                          name="confirm_password"
                          value={formData.confirm_password}
                          onChange={handleInputChange}
                          className={errors.confirm_password ? 'error' : ''}
                          placeholder="Confirm new password"
                          disabled={loading}
                        />
                        {errors.confirm_password && (
                          <span className="error-message">{errors.confirm_password}</span>
                        )}
                      </div>
                    </>
                  )}

                  <div className="form-actions">
                    <button
                      type="submit"
                      className="btn-primary"
                      disabled={loading}
                    >
                      {loading ? 'Updating...' : 'Update Credentials'}
                    </button>
                    <button
                      type="button"
                      className="btn-secondary"
                      onClick={() => {
                        setFormData({
                          username: user.username || '',
                          current_password: '',
                          new_password: '',
                          confirm_password: ''
                        });
                        setShowPasswordFields(false);
                        setErrors({});
                      }}
                      disabled={loading}
                    >
                      Reset
                    </button>
                  </div>
                </div>
              </form>
            </>
          )}

          {activeTab === 'create-user' && (
            <form className="credentials-form" onSubmit={handleCreateUserSubmit}>
              <div className="form-section">
                <h2>Create New Admin User</h2>
                
                <div className="form-group">
                  <label htmlFor="create_username">
                    Username
                    <span className="required">*</span>
                  </label>
                  <input
                    type="text"
                    id="create_username"
                    name="username"
                    value={createUserData.username}
                    onChange={handleCreateUserInputChange}
                    className={createErrors.username ? 'error' : ''}
                    placeholder="Enter username"
                    disabled={loading}
                  />
                  {createErrors.username && (
                    <span className="error-message">{createErrors.username}</span>
                  )}
                  <small className="hint">
                    Username must be 3-50 characters and contain only letters, numbers, and underscores
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="create_role">
                    Role
                    <span className="required">*</span>
                  </label>
                  <select
                    id="create_role"
                    name="role"
                    value={createUserData.role}
                    onChange={handleCreateUserInputChange}
                    disabled={loading}
                    className="form-select"
                  >
                    <option value="admin">Admin</option>
                    <option value="editor">Editor</option>
                  </select>
                  <small className="hint">
                    Admin: Full access to all features | Editor: Can edit content
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="create_password">
                    Password
                    <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    id="create_password"
                    name="password"
                    value={createUserData.password}
                    onChange={handleCreateUserInputChange}
                    className={createErrors.password ? 'error' : ''}
                    placeholder="Enter password"
                    disabled={loading}
                  />
                  {createErrors.password && (
                    <span className="error-message">{createErrors.password}</span>
                  )}
                  <small className="hint">
                    Password must be at least 8 characters long
                  </small>
                </div>

                <div className="form-group">
                  <label htmlFor="create_confirm_password">
                    Confirm Password
                    <span className="required">*</span>
                  </label>
                  <input
                    type="password"
                    id="create_confirm_password"
                    name="confirm_password"
                    value={createUserData.confirm_password}
                    onChange={handleCreateUserInputChange}
                    className={createErrors.confirm_password ? 'error' : ''}
                    placeholder="Confirm password"
                    disabled={loading}
                  />
                  {createErrors.confirm_password && (
                    <span className="error-message">{createErrors.confirm_password}</span>
                  )}
                </div>

                <div className="form-actions">
                  <button
                    type="submit"
                    className="btn-primary"
                    disabled={loading}
                  >
                    {loading ? 'Creating...' : 'Create User'}
                  </button>
                  <button
                    type="button"
                    className="btn-secondary"
                    onClick={() => {
                      setCreateUserData({
                        username: '',
                        password: '',
                        confirm_password: '',
                        role: 'admin'
                      });
                      setCreateErrors({});
                    }}
                    disabled={loading}
                  >
                    Reset
                  </button>
                </div>
              </div>
            </form>
          )}

          {activeTab === 'all-users' && (
            <div className="users-list-container">
              <div className="users-list-header">
                <h2>All Admin Users</h2>
                <button
                  className="btn-refresh"
                  onClick={loadUsers}
                  disabled={loadingUsers}
                >
                  {loadingUsers ? 'Loading...' : 'Refresh'}
                </button>
              </div>

              {loadingUsers ? (
                <LoadingSpinner message="Loading users..." />
              ) : (
                <div className="users-table-container">
                  <table className="users-table">
                    <thead>
                      <tr>
                        <th>ID</th>
                        <th>Username</th>
                        <th>Role</th>
                        <th>Created</th>
                        <th>Status</th>
                      </tr>
                    </thead>
                    <tbody>
                      {users.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="no-data">
                            No users found
                          </td>
                        </tr>
                      ) : (
                        users.map((u) => (
                          <tr key={u.id} className={u.id === user.id ? 'current-user' : ''}>
                            <td>{u.id}</td>
                            <td>
                              <strong>{u.username}</strong>
                              {u.id === user.id && <span className="you-badge">(You)</span>}
                            </td>
                            <td>
                              <span className={`role-badge role-${u.role}`}>
                                {u.role}
                              </span>
                            </td>
                            <td>
                              {u.created_at
                                ? new Date(u.created_at).toLocaleDateString()
                                : 'N/A'}
                            </td>
                            <td>
                              {u.is_locked ? (
                                <span className="status-badge status-locked">Locked</span>
                              ) : (
                                <span className="status-badge status-active">Active</span>
                              )}
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}

          <div className="security-notice">
            <h3>Security Notice</h3>
            <ul>
              <li>Always use strong, unique passwords</li>
              <li>Never share your credentials with anyone</li>
              <li>Change passwords regularly</li>
              <li>If you suspect unauthorized access, change your password immediately</li>
              <li>Only create users with appropriate roles and permissions</li>
            </ul>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}

export default UserManagement;
