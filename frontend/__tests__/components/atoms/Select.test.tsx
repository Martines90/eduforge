import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { Select } from '@/components/atoms/Select';

describe('Select Component', () => {
  const mockOptions = [
    { value: 'option1', label: 'Option 1' },
    { value: 'option2', label: 'Option 2' },
    { value: 'option3', label: 'Option 3' },
  ];

  const defaultProps = {
    id: 'test-select',
    label: 'Test Select',
    value: '',
    options: mockOptions,
    onChange: vi.fn(),
  };

  it('renders without crashing', () => {
    render(<Select {...defaultProps} />);
    expect(screen.getByRole('combobox', { name: 'Test Select' })).toBeInTheDocument();
  });

  it('displays all options', () => {
    render(<Select {...defaultProps} />);
    const select = screen.getByRole('combobox', { name: 'Test Select' });
    fireEvent.mouseDown(select);

    mockOptions.forEach((option) => {
      expect(screen.getByRole('option', { name: option.label })).toBeInTheDocument();
    });
  });

  it('calls onChange when an option is selected', () => {
    const handleChange = vi.fn();
    render(<Select {...defaultProps} onChange={handleChange} />);

    const select = screen.getByRole('combobox', { name: 'Test Select' });
    fireEvent.mouseDown(select);

    const option = screen.getByRole('option', { name: 'Option 2' });
    fireEvent.click(option);

    expect(handleChange).toHaveBeenCalledWith('option2');
  });

  it('can be disabled', () => {
    render(<Select {...defaultProps} disabled={true} />);
    const select = screen.getByRole('combobox', { name: 'Test Select' });
    expect(select).toHaveAttribute('aria-disabled', 'true');
  });

  it('displays selected value', () => {
    render(<Select {...defaultProps} value="option2" />);
    const select = screen.getByRole('combobox', { name: 'Test Select' });
    expect(select).toHaveTextContent('Option 2');
  });
});
