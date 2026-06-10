import { useAuthStore } from '../store/useAuthStore';
import * as SecureStore from 'expo-secure-store';

jest.mock('expo-secure-store', () => ({
  setItemAsync: jest.fn(),
  getItemAsync: jest.fn(),
  deleteItemAsync: jest.fn(),
}));

describe('useAuthStore Authentication Unit Tests', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: null,
      isAuthenticated: false,
      mfaPending: false,
      loading: false,
      error: null,
    });
    jest.clearAllMocks();
  });

  it('should initialize with guest/unauthenticated state', () => {
    const state = useAuthStore.getState();
    expect(state.user).toBeNull();
    expect(state.isAuthenticated).toBe(false);
  });

  it('should set MFA pending when logging in as admin without OTP', async () => {
    const result = await useAuthStore.getState().login('admin@netstream.com');
    expect(result.requiresMfa).toBe(true);
    expect(useAuthStore.getState().mfaPending).toBe(true);
  });

  it('should authenticate regular users successfully', async () => {
    const result = await useAuthStore.getState().login('fred@netstream.com');
    expect(result.success).toBe(true);
    expect(useAuthStore.getState().isAuthenticated).toBe(true);
    expect(useAuthStore.getState().user?.role).toBe('USER');
    expect(SecureStore.setItemAsync).toHaveBeenCalledWith('user_access_token', expect.any(String));
  });

  it('should clear sessions and delete tokens on logout', async () => {
    // Populate session
    useAuthStore.setState({
      user: {
        id: 'u1',
        email: 'fred@netstream.com',
        username: 'fred',
        displayName: 'Fred',
        avatarUrl: '',
        role: 'USER',
        mfaEnabled: false,
        biometricsEnabled: false,
        accessToken: 't1',
        refreshToken: 'r1',
        devices: [],
      },
      isAuthenticated: true,
    });

    await useAuthStore.getState().logout();
    expect(useAuthStore.getState().isAuthenticated).toBe(false);
    expect(useAuthStore.getState().user).toBeNull();
    expect(SecureStore.deleteItemAsync).toHaveBeenCalledWith('user_access_token');
  });
});
