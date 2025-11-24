'use client';

import React from 'react';
import { Button as MuiButton, ButtonProps as MuiButtonProps } from '@mui/material';
import styles from './Button.module.scss';

export interface ButtonProps extends Omit<MuiButtonProps, 'variant'> {
  variant?: 'primary' | 'secondary' | 'text';
}

/**
 * Button Atom Component
 * A reusable button component following atomic design principles
 */
export const Button: React.FC<ButtonProps> = ({
  variant = 'primary',
  children,
  className,
  ...props
}) => {
  const muiVariant = variant === 'text' ? 'text' : 'contained';
  const color = variant === 'secondary' ? 'secondary' : 'primary';

  return (
    <MuiButton
      variant={muiVariant}
      color={color}
      className={`${styles.button} ${className || ''}`}
      {...props}
    >
      {children}
    </MuiButton>
  );
};

export default Button;
