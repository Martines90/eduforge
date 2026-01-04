import React from 'react';
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';
import { Pagination } from './Pagination';

describe('Pagination Component', () => {
  const mockOnPageChange = vi.fn();

  beforeEach(() => {
    mockOnPageChange.mockClear();
  });

  describe('Rendering', () => {
    it('should not render when there is only one page', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalItems={5}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should not render when there are no items', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalItems={0}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should render when there are multiple pages', () => {
      render(
        <Pagination
          currentPage={1}
          totalItems={25}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      expect(screen.getByText('Previous')).toBeInTheDocument();
      expect(screen.getByText('Next')).toBeInTheDocument();
    });

    it('should display item count by default', () => {
      render(
        <Pagination
          currentPage={1}
          totalItems={25}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      expect(screen.getByText('Showing 1 to 10 of 25 items')).toBeInTheDocument();
    });

    it('should not display item count when showItemCount is false', () => {
      render(
        <Pagination
          currentPage={1}
          totalItems={25}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
          showItemCount={false}
        />
      );
      expect(screen.queryByText(/Showing/)).not.toBeInTheDocument();
    });
  });

  describe('Page Numbers', () => {
    it('should display correct page numbers for small page count', () => {
      render(
        <Pagination
          currentPage={1}
          totalItems={30}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
      expect(screen.getByText('3')).toBeInTheDocument();
    });

    it('should display ellipsis for large page count', () => {
      render(
        <Pagination
          currentPage={1}
          totalItems={100}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('10')).toBeInTheDocument();
      expect(screen.getAllByText('...').length).toBeGreaterThan(0);
    });

    it('should highlight current page', () => {
      render(
        <Pagination
          currentPage={2}
          totalItems={30}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      const page2Button = screen.getAllByRole('button').find(btn => btn.textContent === '2');
      expect(page2Button).toHaveClass('MuiButton-containedPrimary');
    });
  });

  describe('Navigation Buttons', () => {
    it('should disable Previous button on first page', () => {
      render(
        <Pagination
          currentPage={1}
          totalItems={30}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      const prevButton = screen.getByText('Previous').closest('button');
      expect(prevButton).toBeDisabled();
    });

    it('should enable Previous button when not on first page', () => {
      render(
        <Pagination
          currentPage={2}
          totalItems={30}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      const prevButton = screen.getByText('Previous').closest('button');
      expect(prevButton).not.toBeDisabled();
    });

    it('should disable Next button on last page', () => {
      render(
        <Pagination
          currentPage={3}
          totalItems={30}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      const nextButton = screen.getByText('Next').closest('button');
      expect(nextButton).toBeDisabled();
    });

    it('should enable Next button when not on last page', () => {
      render(
        <Pagination
          currentPage={1}
          totalItems={30}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      const nextButton = screen.getByText('Next').closest('button');
      expect(nextButton).not.toBeDisabled();
    });
  });

  describe('User Interactions', () => {
    it('should call onPageChange when clicking Next button', () => {
      render(
        <Pagination
          currentPage={1}
          totalItems={30}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      const nextButton = screen.getByText('Next').closest('button');
      fireEvent.click(nextButton!);
      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('should call onPageChange when clicking Previous button', () => {
      render(
        <Pagination
          currentPage={2}
          totalItems={30}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      const prevButton = screen.getByText('Previous').closest('button');
      fireEvent.click(prevButton!);
      expect(mockOnPageChange).toHaveBeenCalledWith(1);
    });

    it('should call onPageChange when clicking page number', () => {
      render(
        <Pagination
          currentPage={1}
          totalItems={30}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      const page2Button = screen.getAllByRole('button').find(btn => btn.textContent === '2');
      fireEvent.click(page2Button!);
      expect(mockOnPageChange).toHaveBeenCalledWith(2);
    });

    it('should not navigate beyond first page', () => {
      render(
        <Pagination
          currentPage={1}
          totalItems={30}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      const prevButton = screen.getByText('Previous').closest('button');
      fireEvent.click(prevButton!);
      expect(mockOnPageChange).not.toHaveBeenCalled();
    });

    it('should not navigate beyond last page', () => {
      render(
        <Pagination
          currentPage={3}
          totalItems={30}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      const nextButton = screen.getByText('Next').closest('button');
      fireEvent.click(nextButton!);
      expect(mockOnPageChange).not.toHaveBeenCalled();
    });
  });

  describe('Item Count Display', () => {
    it('should show correct range for first page', () => {
      render(
        <Pagination
          currentPage={1}
          totalItems={25}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      expect(screen.getByText('Showing 1 to 10 of 25 items')).toBeInTheDocument();
    });

    it('should show correct range for middle page', () => {
      render(
        <Pagination
          currentPage={2}
          totalItems={25}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      expect(screen.getByText('Showing 11 to 20 of 25 items')).toBeInTheDocument();
    });

    it('should show correct range for last page with partial items', () => {
      render(
        <Pagination
          currentPage={3}
          totalItems={25}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      expect(screen.getByText('Showing 21 to 25 of 25 items')).toBeInTheDocument();
    });
  });

  describe('Edge Cases', () => {
    it('should handle exactly itemsPerPage items (one full page)', () => {
      const { container } = render(
        <Pagination
          currentPage={1}
          totalItems={10}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      expect(container.firstChild).toBeNull();
    });

    it('should handle itemsPerPage + 1 items (two pages)', () => {
      render(
        <Pagination
          currentPage={1}
          totalItems={11}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      expect(screen.getByText('1')).toBeInTheDocument();
      expect(screen.getByText('2')).toBeInTheDocument();
    });

    it('should handle large total items', () => {
      render(
        <Pagination
          currentPage={50}
          totalItems={1000}
          itemsPerPage={10}
          onPageChange={mockOnPageChange}
        />
      );
      expect(screen.getByText('Showing 491 to 500 of 1000 items')).toBeInTheDocument();
    });

    it('should handle different itemsPerPage values', () => {
      render(
        <Pagination
          currentPage={1}
          totalItems={100}
          itemsPerPage={25}
          onPageChange={mockOnPageChange}
        />
      );
      expect(screen.getByText('Showing 1 to 25 of 100 items')).toBeInTheDocument();
    });
  });
});
