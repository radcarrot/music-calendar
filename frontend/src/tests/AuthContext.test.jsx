import React, { useContext, useEffect } from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import { AuthProvider } from '../context/AuthContext';
import { useAuth } from '../context/AuthContext';

// Mock Axios globally
vi.mock('axios', () => {
    return {
        default: {
            get: vi.fn(),
            post: vi.fn(),
            defaults: { withCredentials: false },
            interceptors: {
                request: { use: vi.fn(), eject: vi.fn() },
                response: { use: vi.fn(), eject: vi.fn() }
            }
        }
    };
});

// A dummy component to consume the AuthContext and test state
const DummyConsumer = ({ triggerApiCall }) => {
    const { user, loading } = useAuth();

    useEffect(() => {
        if (triggerApiCall) triggerApiCall();
    }, [triggerApiCall]);

    if (loading) return <div>Loading...</div>;
    return (
        <div>
            <span data-testid="user-state">{user ? user.name : 'No User'}</span>
        </div>
    );
};

describe('AuthContext Axios Interceptor', () => {
    beforeEach(() => {
        vi.clearAllMocks();
        // Since we explicitly mocked interceptors.response.use,
        // we need to capture the rejected handler to invoke it manually for testing
        // or just let axios act as normal and mock adapter?
        // Actually, since AuthContext imports axios and calls interceptors.response.use,
        // we can capture the error handler it registers.
    });

    it('should clear user state when a 401 occurs and refresh fails', async () => {
        // Mock the initial /api/auth/me call to succeed
        axios.get.mockResolvedValueOnce({ data: { id: 1, name: 'Test User' } });

        let errorHandler = null;
        axios.interceptors.response.use.mockImplementation((success, error) => {
            errorHandler = error;
            return 1; // dummy interceptor id
        });

        render(
            <AuthProvider>
                <DummyConsumer />
            </AuthProvider>
        );

        // Wait for initial load
        await waitFor(() => {
            expect(screen.getByTestId('user-state')).toHaveTextContent('Test User');
        });

        // Now simulate a 401 error from some random API call inside the app
        const mockError = {
            config: { url: '/api/events', _retry: false },
            response: { status: 401 }
        };

        // Mock the subsequent /api/auth/refresh to also fail (e.g. refresh token expired)
        axios.post.mockRejectedValueOnce(new Error('Refresh Failed'));

        // Trigger the interceptor's error handler
        try {
            await errorHandler(mockError);
        } catch (e) {
            // Expected to throw
        }

        // The interceptor should have cleared the user state
        await waitFor(() => {
            expect(screen.getByTestId('user-state')).toHaveTextContent('No User');
        });
    });
});
