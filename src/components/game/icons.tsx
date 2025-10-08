import type { SVGProps } from "react";

export function StacksCoinIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <circle cx="12" cy="12" r="10" />
      <path d="M16 8c-2 0-3 1-3 3s1 3 3 3 3-1 3-3-1-3-3-3zM8 16c2 0 3-1 3-3s-1-3-3-3-3 1-3 3 1 3 3 3z" />
    </svg>
  );
}

export function BitcoinGemIcon(props: SVGProps<SVGSVGElement>) {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      {...props}
    >
      <path d="M6 3h12l4 6-10 12L2 9z" />
      <path d="M12 3v12" />
      <path d="M2 9h20" />
    </svg>
  );
}
