import React from 'react';
import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { NavLink } from '@/components/atoms/NavLink';

// Mock usePathname
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
}));

describe('NavLink Component', () => {
  it('renders with children', () => {
    render(<NavLink href="/">Home</NavLink>);
    expect(screen.getByText('Home')).toBeInTheDocument();
  });

  it('has correct href attribute', () => {
    render(<NavLink href="/test">Test Link</NavLink>);
    const link = screen.getByText('Test Link');
    expect(link).toHaveAttribute('href', '/test');
  });

  it('applies active class when on current page', () => {
    render(<NavLink href="/">Home</NavLink>);
    const link = screen.getByText('Home');
    expect(link.className).toContain('active');
  });

  it('has aria-current attribute when active', () => {
    render(<NavLink href="/">Home</NavLink>);
    const link = screen.getByText('Home');
    expect(link).toHaveAttribute('aria-current', 'page');
  });
});
