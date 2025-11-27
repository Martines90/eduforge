'use client';

import React, { useState } from 'react';
import { AppBar, Toolbar, IconButton, Container, Box } from '@mui/material';
import MenuIcon from '@mui/icons-material/Menu';
import { Logo } from '@/components/atoms/Logo';
import { NavLink } from '@/components/atoms/NavLink';
import { MobileMenu } from '@/components/molecules/MobileMenu';
import { UserMenu } from '@/components/molecules/UserMenu';
import { useTranslation } from '@/lib/i18n';
import styles from './Header.module.scss';

export interface HeaderProps {
  className?: string;
}

/**
 * Header Organism Component
 * Main navigation header with hamburger menu for mobile
 */
export const Header: React.FC<HeaderProps> = ({ className }) => {
  const { t } = useTranslation();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navigationItems = [
    { href: '/', label: t('Home') },
    { href: '/task_creator', label: t('Task Creator') },
  ];

  const handleMenuToggle = () => {
    setMobileMenuOpen(!mobileMenuOpen);
  };

  const handleMenuClose = () => {
    setMobileMenuOpen(false);
  };

  return (
    <>
      <AppBar position="sticky" className={`${styles.appBar} ${className || ''}`}>
        <Container maxWidth="xl">
          <Toolbar className={styles.toolbar} disableGutters>
            {/* Mobile Menu Button */}
            <IconButton
              className={styles.menuButton}
              color="inherit"
              aria-label={t('Open navigation menu')}
              edge="start"
              onClick={handleMenuToggle}
            >
              <MenuIcon />
            </IconButton>

            {/* Logo */}
            <Logo />

            {/* Desktop Navigation */}
            <Box className={styles.desktopNav} component="nav" aria-label="Main navigation">
              {navigationItems.map((item) => (
                <NavLink key={item.href} href={item.href}>
                  {item.label}
                </NavLink>
              ))}
            </Box>

            {/* User Menu */}
            <UserMenu className={styles.userMenu} />
          </Toolbar>
        </Container>
      </AppBar>

      {/* Mobile Menu Drawer */}
      <MobileMenu open={mobileMenuOpen} onClose={handleMenuClose}>
        {navigationItems.map((item) => (
          <NavLink key={item.href} href={item.href} onClick={handleMenuClose}>
            {item.label}
          </NavLink>
        ))}
      </MobileMenu>
    </>
  );
};

export default Header;
