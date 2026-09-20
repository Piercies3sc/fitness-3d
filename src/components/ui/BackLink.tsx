import Link from 'next/link';

export function BackLink({ href, text }: { href: string; text: string }) {
  return (
    <Link 
      href={href} 
      className="inline-flex min-h-11 items-center text-sm font-medium text-text-secondary hover:text-text-primary transition-colors mb-4 group"
    >
      <span className="mr-1 group-hover:-translate-x-0.5 transition-transform">←</span>
      {text}
    </Link>
  );
}
