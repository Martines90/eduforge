'use client';

import React, { useState } from 'react';
import { IconButton, Menu, MenuItem, Avatar, Divider, ListItemIcon, ListItemText } from '@mui/material';
import PersonIcon from '@mui/icons-material/Person';
import AssignmentIcon from '@mui/icons-material/Assignment';
import LogoutIcon from '@mui/icons-material/Logout';
import { useUser } from '@/lib/context';
import { useRouter } from 'next/navigation';
import { useTranslation } from '@/lib/i18n';
import styles from './UserMenu.module.scss';

export interface UserMenuProps {
  className?: string;
}

/**
 * UserMenu Component
 * Displays user avatar and dropdown menu with profile and logout options
 */
export const UserMenu: React.FC<UserMenuProps> = ({ className }) => {
  const { user, logoutUser } = useUser();
  const router = useRouter();
  const { t } = useTranslation();
  const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
  const open = Boolean(anchorEl);

  const handleClick = (event: React.MouseEvent<HTMLElement>) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleProfile = () => {
    handleClose();
    router.push('/profile');
  };

  const handleMyTasks = () => {
    handleClose();
    router.push('/my-tasks');
  };

  const handleLogout = () => {
    handleClose();
    logoutUser();
    // Clear auth token
    if (typeof window !== 'undefined') {
      localStorage.removeItem('authToken');
    }
    router.push('/');
  };

  // Don't render if user is not registered
  if (!user.isRegistered || !user.profile) {
    return null;
  }

  // Get user initials for avatar
  const getInitials = (name: string) => {
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  };

  return (
    <div className={`${styles.userMenu} ${className || ''}`}>
      <IconButton
        onClick={handleClick}
        size="small"
        aria-controls={open ? 'user-menu' : undefined}
        aria-haspopup="true"
        aria-expanded={open ? 'true' : undefined}
        className={styles.avatarButton}
      >
        <Avatar className={styles.avatar}>
          {getInitials(user.profile.name)}
        </Avatar>
      </IconButton>
      <Menu
        id="user-menu"
        anchorEl={anchorEl}
        open={open}
        onClose={handleClose}
        onClick={handleClose}
        transformOrigin={{ horizontal: 'right', vertical: 'top' }}
        anchorOrigin={{ horizontal: 'right', vertical: 'bottom' }}
        PaperProps={{
          elevation: 3,
          sx: {
            mt: 1.5,
            minWidth: 200,
          },
        }}
      >
        <div className={styles.userInfo}>
          <div className={styles.userName}>{user.profile.name}</div>
          <div className={styles.userEmail}>{user.profile.email}</div>
        </div>
        <Divider />
        <MenuItem onClick={handleProfile}>
          <ListItemIcon>
            <PersonIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('Profile')}</ListItemText>
        </MenuItem>
        {user.identity === 'teacher' && (
          <MenuItem onClick={handleMyTasks}>
            <ListItemIcon>
              <AssignmentIcon fontSize="small" />
            </ListItemIcon>
            <ListItemText>{t('My Tasks')}</ListItemText>
          </MenuItem>
        )}
        <Divider />
        <MenuItem onClick={handleLogout}>
          <ListItemIcon>
            <LogoutIcon fontSize="small" />
          </ListItemIcon>
          <ListItemText>{t('Logout')}</ListItemText>
        </MenuItem>
      </Menu>
    </div>
  );
};

export default UserMenu;
