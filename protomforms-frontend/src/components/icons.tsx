import { LucideProps } from 'lucide-react';

export const Icons = {
  microsoft: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 23 23"
      {...props}
    >
      <path fill="#f35325" d="M1 1h10v10H1z" />
      <path fill="#81bc06" d="M1 12h10v10H1z" />
      <path fill="#05a6f0" d="M12 1h10v10H12z" />
      <path fill="#ffba08" d="M12 12h10v10H12z" />
    </svg>
  ),
  teams: (props: LucideProps) => (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      {...props}
    >
      {/* Background circle - lighter purple */}
      <circle
        cx="18"
        cy="6"
        r="8"
        fill="#7B83EB"
        opacity="0.4"
      />
      {/* Background rounded rectangle - lighter purple */}
      <rect
        x="8"
        y="2"
        width="14"
        height="8"
        rx="4"
        fill="#7B83EB"
        opacity="0.3"
      />
      {/* Main square - deep purple #6264A7 */}
      <rect
        x="2"
        y="2"
        width="12"
        height="12"
        rx="2.5"
        fill="#6264A7"
      />
      {/* White T letter */}
      <path
        fill="#FFFFFF"
        d="M6 4h4v1.5H6V4zm0 2.5h4v6H6V6.5z"
      />
      <rect
        x="7"
        y="4"
        width="2"
        height="8"
        fill="#FFFFFF"
      />
    </svg>
  ),
}; 