import Link from 'next/link';

interface FooterLink {
  label: string;
  href: string;
}

interface FooterProps {
  links?: FooterLink[];
}

const defaultLinks: FooterLink[] = [
  { label: 'Privacy', href: '/privacy' },
  { label: 'Terms', href: '/terms' },
  { label: 'Support', href: '/support' },
];

export default function Footer({ links = defaultLinks }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer className="w-full border-t bg-white">
      <div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 px-4 py-6 sm:flex-row">
        <p className="text-sm text-gray-800">
          © {year} Nua File Storage. All rights reserved.
        </p>

        <div className="flex text-gray-800 gap-4">
          <p>Assignment Project by Vishal Sahani</p>
        </div>
      </div>
    </footer>
  );
}
