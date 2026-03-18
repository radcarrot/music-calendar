import { createContext, useState, useEffect, useContext } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    // Ensure cookies are sent with every request and baseURL is strictly bound to production API
    axios.defaults.withCredentials = true;
    axios.defaults.baseURL = import.meta.env.VITE_API_URL || '';

    useEffect(() => {
        // Setup interceptor for automatic token refresh
        const interceptor = axios.interceptors.response.use(
            (response) => response,
            async (error) => {
                const originalRequest = error.config;
                // If 401 Unauthorized, and we haven't already retried
                if (error.response?.status === 401 && !originalRequest._retry && originalRequest.url !== '/api/auth/login' && originalRequest.url !== '/api/auth/refresh') {
                    originalRequest._retry = true;
                    try {
                        // Attempt to refresh token
                        await axios.post('/api/auth/refresh');
                        // Retry original request (cookies and withCredentials handle passing the new JWT)
                        return axios(originalRequest);
                    } catch (refreshError) {
                        // Refresh failed, user must log in again
                        setUser(null);
                        return Promise.reject(refreshError);
                    }
                }
                return Promise.reject(error);
            }
        );

        // Fetch user on initial load
        fetchUser();

        return () => {
            axios.interceptors.response.eject(interceptor);
        };
    }, []);

    const fetchUser = async () => {
        try {
            const res = await axios.get('/api/auth/me');
            setUser(res.data);
        } catch {
            setUser(null);
        } finally {
            setLoading(false);
        }
    };

    const refreshUser = async () => {
        try {
            const res = await axios.get('/api/auth/me');
            setUser(res.data);
        } catch {
            // silently fail — user stays as-is
        }
    };

    const login = async (email, password) => {
        const res = await axios.post('/api/auth/login', { email, password });
        setUser(res.data.user);
        return res.data.user;
    };

    const register = async (name, email, password) => {
        const res = await axios.post('/api/auth/register', { name, email, password });
        setUser(res.data.user);
        return res.data.user;
    };

    const logout = async () => {
        try {
            await axios.post('/api/auth/logout');
        } catch (err) {
            console.error('Logout error', err);
        } finally {
            setUser(null);
        }
    };

    return (
        <AuthContext.Provider value={{ user, loading, login, register, logout, refreshUser }}>
            {!loading && children}
        </AuthContext.Provider>
    );
};

// eslint-disable-next-line react-refresh/only-export-components
export const useAuth = () => useContext(AuthContext);
