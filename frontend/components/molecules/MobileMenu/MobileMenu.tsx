'use client';

import React from 'react';
import { Drawer, Box, IconButton, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import { Logo } from '@/components/atoms/Logo';
import styles from './MobileMenu.module.scss';

export interface MobileMenuProps {
  open: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

/**
 * MobileMenu Molecule Component
 * Drawer-based mobile navigation menu
 */
export const MobileMenu: React.FC<MobileMenuProps> = ({
  open,
  onClose,
  children,
}) => {
  return (
    <Drawer
      anchor="left"
      open={open}
      onClose={onClose}
      className={styles.drawer}
      PaperProps={{
        className: styles.drawerPaper,
      }}
    >
      <Box className={styles.menuHeader}>
        <Logo />
        <IconButton
          onClick={onClose}
          aria-label={typeof window !== 'undefined' ? 'Close menu' : 'Close menu'}
          className={styles.closeButton}
        >
          <CloseIcon />
        </IconButton>
      </Box>
      <Divider />
      <nav className={styles.menuContent} aria-label="Mobile navigation">
        {children}
      </nav>
    </Drawer>
  );
};

export default MobileMenu;
