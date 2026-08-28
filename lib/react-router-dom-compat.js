'use client';

import { useRouter, usePathname, useParams as useNextParams, useSearchParams as useNextSearchParams } from 'next/navigation';
import NextLink from 'next/link';
import React, { useEffect } from 'react';

export const useNavigate = () => {
  const router = useRouter();
  return (to, options) => {
    // Handle numeric arguments like navigate(-1) for "go back"
    if (typeof to === 'number') {
      if (to < 0) {
        router.back();
      } else {
        router.forward();
      }
      return;
    }
    if (options?.replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  };
};

export const useLocation = () => {
  const pathname = usePathname();
  return { pathname };
};

export const useParams = () => {
  const params = useNextParams();
  return params || {};
};

export const useSearchParams = () => {
  const searchParams = useNextSearchParams();
  const setSearchParams = (newParams) => {
    // Basic mock implementation of setting query params
    const router = useRouter();
    const pathname = usePathname();
    const current = new URLSearchParams(Array.from(searchParams.entries()));
    
    Object.entries(newParams).forEach(([key, value]) => {
      if (value === undefined || value === null) {
        current.delete(key);
      } else {
        current.set(key, value);
      }
    });
    
    const search = current.toString();
    const query = search ? `?${search}` : '';
    router.push(`${pathname}${query}`);
  };
  return [searchParams || new URLSearchParams(), setSearchParams];
};

export const Link = React.forwardRef(({ to, href, ...props }, ref) => {
  return <NextLink ref={ref} href={to || href || '#'} {...props} />;
});
Link.displayName = 'Link';

export const NavLink = React.forwardRef(({ to, className, ...props }, ref) => {
  const pathname = usePathname();
  const isActive = pathname === to;
  
  const resolvedClassName = typeof className === 'function' 
    ? className({ isActive }) 
    : className;

  return <NextLink ref={ref} href={to} className={resolvedClassName} {...props} />;
});
NavLink.displayName = 'NavLink';

export const Navigate = ({ to, replace }) => {
  const router = useRouter();
  useEffect(() => {
    if (replace) {
      router.replace(to);
    } else {
      router.push(to);
    }
  }, [to, replace, router]);
  return null;
};
