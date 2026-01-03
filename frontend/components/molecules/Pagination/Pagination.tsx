import React from 'react';
import { Box, Typography } from '@mui/material';
import { Button } from '@/components/atoms/Button';
import ChevronLeftIcon from '@mui/icons-material/ChevronLeft';
import ChevronRightIcon from '@mui/icons-material/ChevronRight';

export interface PaginationProps {
  currentPage: number;
  totalItems: number;
  itemsPerPage: number;
  onPageChange: (page: number) => void;
  showItemCount?: boolean;
}

/**
 * Pagination Component
 * Displays pagination controls with page numbers and navigation buttons
 */
export const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalItems,
  itemsPerPage,
  onPageChange,
  showItemCount = true,
}) => {
  const totalPages = Math.ceil(totalItems / itemsPerPage);

  // Don't show pagination if there's only one page or no items
  if (totalPages <= 1) {
    return null;
  }

  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  const handlePrevious = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNext = () => {
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const handlePageClick = (page: number) => {
    onPageChange(page);
  };

  // Generate page numbers to display
  const getPageNumbers = () => {
    const pages: (number | string)[] = [];
    const maxPagesToShow = 5;

    if (totalPages <= maxPagesToShow) {
      // Show all pages if total is less than max
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      // Always show first page
      pages.push(1);

      if (currentPage > 3) {
        pages.push('...');
      }

      // Show pages around current page
      const start = Math.max(2, currentPage - 1);
      const end = Math.min(totalPages - 1, currentPage + 1);

      for (let i = start; i <= end; i++) {
        pages.push(i);
      }

      if (currentPage < totalPages - 2) {
        pages.push('...');
      }

      // Always show last page
      pages.push(totalPages);
    }

    return pages;
  };

  const pageNumbers = getPageNumbers();

  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        mt: 3,
        flexWrap: 'wrap',
        gap: 2,
      }}
    >
      {/* Item count */}
      {showItemCount && (
        <Typography variant="body2" color="text.secondary">
          Showing {startItem} to {endItem} of {totalItems} items
        </Typography>
      )}

      {/* Pagination controls */}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
        {/* Previous button */}
        <Button
          variant="secondary"
          size="small"
          onClick={handlePrevious}
          disabled={currentPage === 1}
          startIcon={<ChevronLeftIcon />}
        >
          Previous
        </Button>

        {/* Page numbers */}
        <Box sx={{ display: 'flex', gap: 0.5 }}>
          {pageNumbers.map((page, index) => {
            if (page === '...') {
              return (
                <Box
                  key={`ellipsis-${index}`}
                  sx={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    minWidth: 40,
                    height: 40,
                    px: 1,
                  }}
                >
                  <Typography variant="body2" color="text.secondary">
                    ...
                  </Typography>
                </Box>
              );
            }

            const pageNumber = page as number;
            const isActive = pageNumber === currentPage;

            return (
              <Button
                key={pageNumber}
                variant={isActive ? 'primary' : 'secondary'}
                size="small"
                onClick={() => handlePageClick(pageNumber)}
                sx={{
                  minWidth: 40,
                  height: 40,
                  px: 1,
                }}
              >
                {pageNumber}
              </Button>
            );
          })}
        </Box>

        {/* Next button */}
        <Button
          variant="secondary"
          size="small"
          onClick={handleNext}
          disabled={currentPage === totalPages}
          endIcon={<ChevronRightIcon />}
        >
          Next
        </Button>
      </Box>
    </Box>
  );
};
