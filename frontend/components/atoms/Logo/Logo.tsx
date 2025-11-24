'use client';

import React from 'react';
import Link from 'next/link';
import { Typography } from '@mui/material';
import styles from './Logo.module.scss';

export interface LogoProps {
  className?: string;
}

/**
 * Logo Atom Component
 * Brand logo/text that links to home
 */
export const Logo: React.FC<LogoProps> = ({ className }) => {
  return (
    <Link href="/" className={`${styles.logo} ${className || ''}`}>
      <Typography variant="h6" component="span" className={styles.text}>
        EduForge
      </Typography>
    </Link>
  );
};

export default Logo;
