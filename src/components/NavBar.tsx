'use client';

import Link from 'next/link';
import { useState } from 'react';

type NavItem = {
  label: string;
  href: string;
};

interface HeaderProps {
  brandName?: string;
  navItems?: NavItem[];
  showAuthButtons?: boolean;
}

const defaultNavItems: NavItem[] = [
  { label: 'My Files', href: '/files' },
  { label: 'Shared', href: '/shared' },
  { label: 'Storage', href: '/storage' },
];

export default function NavBar({
  brandName = 'Nua',
  navItems = defaultNavItems,
  showAuthButtons = true,
}: HeaderProps) {
  const [menuOpen, setMenuOpen] = useState<boolean>(false);

  return (
    <header className="w-full border-b bg-white">
      <div className="mx-auto max-w-7xl px-4">
        <div className="flex h-16 items-center justify-between">
          {/* Logo */}
          <Link href="/" className="text-xl font-semibold">
            {brandName}
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden items-center gap-6 md:flex">
            {navItems.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="text-sm text-gray-600 hover:text-black"
              >
                {item.label}
              </Link>
            ))}
          </nav>

          {/* Desktop Auth Buttons */}
          {showAuthButtons && (
            <div className="hidden items-center gap-3 md:flex">
              <Link
                href="/signin"
                className="text-sm text-gray-600 hover:text-black"
              >
                Sign in
              </Link>
              <Link
                href="/signup"
                className="rounded-md bg-black px-4 py-2 text-sm text-white hover:bg-gray-800"
              >
                Sign up
              </Link>
            </div>
          )}

          {/* Mobile Menu Button */}
          <button
            onClick={() => setMenuOpen((prev) => !prev)}
            className="md:hidden"
            aria-label="Toggle menu"
          >
            <span className="block h-0.5 w-6 bg-black mb-1" />
            <span className="block h-0.5 w-6 bg-black mb-1" />
            <span className="block h-0.5 w-6 bg-black" />
          </button>
        </div>

        {/* Mobile Menu */}
        {menuOpen && (
          <div className="md:hidden border-t py-4">
            <nav className="flex flex-col gap-3">
              {navItems.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="text-sm text-gray-700"
                  onClick={() => setMenuOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
            </nav>

            {showAuthButtons && (
              <div className="mt-4 flex flex-col gap-2">
                <Link
                  href="/signin"
                  className="rounded-md border px-4 py-2 text-center text-sm"
                >
                  Sign in
                </Link>
                <Link
                  href="/signup"
                  className="rounded-md bg-black px-4 py-2 text-center text-sm text-white"
                >
                  Sign up
                </Link>
              </div>
            )}
          </div>
        )}
      </div>
    </header>
  );
}
