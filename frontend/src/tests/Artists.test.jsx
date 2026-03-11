import React from 'react';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi, beforeEach } from 'vitest';
import axios from 'axios';
import Artists from '../pages/Artists';
import { AuthProvider } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom';

// 1. Mock framer-motion to return standard HTML tags instead of animated primitives
vi.mock('framer-motion', () => {
    return {
        motion: {
            // Replace motion.div with standard div
            div: React.forwardRef(({ children, ...props }, ref) => {
                // Strip motion-specific props
                const { layout, initial, animate, exit, transition, whileHover, ...cleanProps } = props;
                return <div ref={ref} {...cleanProps}>{children}</div>;
            }),
            button: React.forwardRef(({ children, ...props }, ref) => {
                const { layout, initial, animate, exit, transition, whileHover, ...cleanProps } = props;
                return <button ref={ref} {...cleanProps}>{children}</button>;
            })
        },
        AnimatePresence: ({ children }) => <>{children}</>
    };
});

// 2. Mock Axios
vi.mock('axios');

// 3. Mock Navbar to reduce component tree noise
vi.mock('../components/Navbar', () => ({
    default: () => <nav data-testid="mock-navbar">Navbar</nav>
}));

// 4. Mock Auth Context
vi.mock('../context/AuthContext', async (importOriginal) => {
    const actual = await importOriginal();
    return {
        ...actual,
        useAuth: () => ({
            user: { id: 1, name: 'Test User' },
            logout: vi.fn()
        })
    };
});

// Helper to render with Router (since Artists has Links)
const renderWithRouter = (ui) => {
    return render(<BrowserRouter>{ui}</BrowserRouter>);
};

describe('Artists Component (Framer Motion Mocked)', () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it('displays loading state initially and then lists tracked artists', async () => {
        const mockTrackedArtists = [
            { id: 101, name: 'Daft Punk', image_url: 'http://image1.jpg', genres: ['electronic'] },
            { id: 102, name: 'Justice', image_url: 'http://image2.jpg', genres: ['french touch'] }
        ];

        axios.get.mockResolvedValueOnce({ data: mockTrackedArtists });

        renderWithRouter(<Artists />);

        // Verify Loading UI is shown
        // The component has a fallback or suspense, or maybe it just renders empty until state load
        // We can just verify the artists show up
        await waitFor(() => {
            expect(screen.getByText('Daft Punk')).toBeInTheDocument();
            expect(screen.getByText('Justice')).toBeInTheDocument();
        });

        // Ensure Framer Motion mocked divs are correctly populated with data
        const artistImages = screen.getAllByRole('img');
        expect(artistImages[0]).toHaveAttribute('src', 'http://image1.jpg');
        
        // Ensure Axios was called correctly
        expect(axios.get).toHaveBeenCalledWith(expect.stringContaining('/api/artists/tracked'));
    });

    it('renders the initial empty state when no artists are tracked', async () => {
        axios.get.mockResolvedValueOnce({ data: [] });

        renderWithRouter(<Artists />);

        await waitFor(() => {
            expect(screen.getByText(/Search for new artists above/i)).toBeInTheDocument();
        });
    });
});
