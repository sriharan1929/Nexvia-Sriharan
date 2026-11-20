import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from 'react';
import type { ReactNode } from 'react';
import api from '../../lib/api';
import type { User } from '../../types';
import toast from 'react-hot-toast';

interface AuthContextType {
  user: User | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  register: (
    name: string,
    email: string,
    password: string,
    role?: 'CUSTOMER' | 'VENDOR'
  ) => Promise<boolean>;
  logout: () => Promise<void>;
  hasRole: (role: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [accessToken, setAccessToken] = useState<string | null>(() =>
    localStorage.getItem('accessToken')
  );
  const [isLoading, setIsLoading] = useState<boolean>(true);

  const hasRole = useCallback(
    (role: string): boolean => {
      if (!user || !user.roles) return false;
      return user.roles.includes(role);
    },
    [user]
  );

  useEffect(() => {
    let isMounted = true;

    const initializeAuth = async () => {
      const storedToken = localStorage.getItem('accessToken');
      if (storedToken) {
        try {
          const res = await api.get('/users/me');
          if (isMounted && res.data?.data?.user) {
            setUser(res.data.data.user);
          }
        } catch {

          try {
            const refreshRes = await api.post('/auth/refresh');
            const newToken = refreshRes.data?.data?.accessToken;
            if (newToken) {
              localStorage.setItem('accessToken', newToken);
              if (isMounted) setAccessToken(newToken);
              const meRes = await api.get('/users/me');
              if (isMounted && meRes.data?.data?.user) {
                setUser(meRes.data.data.user);
              }
            }
          } catch {
            localStorage.removeItem('accessToken');
            if (isMounted) {
              setAccessToken(null);
              setUser(null);
            }
          }
        }
      }
      if (isMounted) setIsLoading(false);
    };

    initializeAuth();

    return () => {
      isMounted = false;
    };
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      const res = await api.post('/auth/login', { email, password });
      const { user: userData, accessToken: token } = res.data.data;

      localStorage.setItem('accessToken', token);
      setAccessToken(token);
      setUser(userData);
      toast.success(`Welcome back, ${userData.name}!`);
      return true;
    } catch (error: any) {
      const message =
        error.response?.data?.message || 'Login failed. Please try again.';
      toast.error(message);
      return false;
    }
  };

  const register = async (
    name: string,
    email: string,
    password: string,
    role: 'CUSTOMER' | 'VENDOR' = 'CUSTOMER'
  ): Promise<boolean> => {
    try {
      const res = await api.post('/auth/register', {
        name,
        email,
        password,
        role,
      });
      const { user: userData, accessToken: token } = res.data.data;

      localStorage.setItem('accessToken', token);
      setAccessToken(token);
      setUser(userData);
      toast.success('Account created successfully!');
      return true;
    } catch (error: any) {
      const message =
        error.response?.data?.message ||
        'Registration failed. Please check your inputs.';
      toast.error(message);
      return false;
    }
  };

  const logout = async (): Promise<void> => {
    try {
      await api.post('/auth/logout');
    } catch {
      // Ignore network errors on logout
    } finally {
      localStorage.removeItem('accessToken');
      setAccessToken(null);
      setUser(null);
      toast.success('Logged out successfully');
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        accessToken,
        isAuthenticated: !!user,
        isLoading,
        login,
        register,
        logout,
        hasRole,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuthContext(): AuthContextType {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
}
