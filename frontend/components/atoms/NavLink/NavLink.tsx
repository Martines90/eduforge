'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import styles from './NavLink.module.scss';

export interface NavLinkProps {
  href: string;
  children: React.ReactNode;
  onClick?: () => void;
  className?: string;
}

/**
 * NavLink Atom Component
 * Navigation link with active state
 */
export const NavLink: React.FC<NavLinkProps> = ({
  href,
  children,
  onClick,
  className,
}) => {
  const pathname = usePathname();
  const isActive = pathname === href;

  return (
    <Link
      href={href}
      onClick={onClick}
      className={`${styles.navLink} ${isActive ? styles.active : ''} ${className || ''}`}
      aria-current={isActive ? 'page' : undefined}
    >
      {children}
    </Link>
  );
};

export default NavLink;
