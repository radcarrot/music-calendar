import React from 'react';
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import { Button } from '../components/ui/button';

describe('Button Component', () => {
    it('renders a native button element by default', () => {
        render(<Button>Click Me</Button>);
        const button = screen.getByRole('button', { name: /click me/i });
        expect(button).toBeInTheDocument();
        expect(button.tagName.toLowerCase()).toBe('button');
    });

    it('renders polymorphically using Radix Slot when asChild is passed', () => {
        // We pass an anchor tag inside. The Button should merge its props and classNames,
        // but render an <a> tag instead of a <button> tag.
        render(
            <Button asChild variant="outline">
                <a href="https://google.com">External Link</a>
            </Button>
        );
        const link = screen.getByRole('link', { name: /external link/i });
        expect(link).toBeInTheDocument();
        expect(link.tagName.toLowerCase()).toBe('a');
        expect(link).toHaveAttribute('href', 'https://google.com');
        expect(link).toHaveClass('border', 'border-input'); // outline variant classes
    });

    it('applies the correct Tailwind variant and size classes via CVA', () => {
        render(<Button variant="destructive" size="lg">Delete</Button>);
        const button = screen.getByRole('button', { name: /delete/i });
        
        // Check destructive styles
        expect(button).toHaveClass('bg-destructive', 'text-destructive-foreground');
        // Check large size styles
        expect(button).toHaveClass('h-10', 'px-8');
    });

    it('accepts additional user-defined class names and passes standard props', () => {
        const onClickMock = vitest.fn();
        render(<Button className="custom-test-class" onClick={onClickMock} disabled>Disabled Button</Button>);
        
        const button = screen.getByRole('button', { name: /disabled button/i });
        expect(button).toHaveClass('custom-test-class');
        expect(button).toBeDisabled();
    });
});
