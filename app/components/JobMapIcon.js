// Jobs on Map Icon - Represents jobs displayed on a map
// Design: Map view with location pin and briefcase (job marker)
export default function JobMapIcon({ size = 24, className = "" }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      {/* Map background (folded paper style) */}
      <rect
        x="3"
        y="4"
        width="18"
        height="16"
        rx="1"
        fill="currentColor"
        opacity="0.1"
      />
      {/* Map grid lines */}
      <line x1="6" y1="7" x2="18" y2="7" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="6" y1="10" x2="18" y2="10" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="6" y1="13" x2="18" y2="13" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="9" y1="4" x2="9" y2="20" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      <line x1="15" y1="4" x2="15" y2="20" stroke="currentColor" strokeWidth="0.5" opacity="0.3" />
      
      {/* Location pin with briefcase (job marker) */}
      <g transform="translate(12, 8)">
        {/* Pin base */}
        <path
          d="M0 0C-2.76 0 -5 2.24 -5 5c0 3.5 5 9 5 9s5-5.5 5-9c0-2.76-2.24-5-5-5z"
          fill="currentColor"
        />
        {/* Briefcase on pin */}
        <rect
          x="-3"
          y="-1"
          width="6"
          height="4"
          rx="0.3"
          fill="white"
        />
        {/* Briefcase handle */}
        <path
          d="M-2 -1V-2.5C-2 -2.78 -1.78 -3 -1.5 -3h3c0.28 0 0.5 0.22 0.5 0.5V-1"
          stroke="white"
          strokeWidth="0.8"
          fill="none"
        />
      </g>
      
      {/* Map fold corner detail */}
      <path
        d="M19 4L21 6L19 8V4Z"
        fill="currentColor"
        opacity="0.2"
      />
    </svg>
  );
}
