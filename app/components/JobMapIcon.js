// JobMapCompany Icon - Combines job, map, and company elements
// Design: Map pin (location) with briefcase (job) and building (company)
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
      {/* Map pin shape (location marker) */}
      <path
        d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7z"
        fill="currentColor"
      />
      {/* Briefcase body (job symbol) */}
      <rect
        x="8"
        y="9"
        width="8"
        height="5"
        rx="0.5"
        fill="white"
      />
      {/* Briefcase handle */}
      <path
        d="M10 9V7.5C10 7.22 10.22 7 10.5 7h3c0.28 0 0.5 0.22 0.5 0.5V9"
        stroke="white"
        strokeWidth="1"
        fill="none"
      />
      {/* Building/Company (small structure on top of pin) */}
      <rect
        x="10"
        y="5"
        width="4"
        height="3"
        rx="0.3"
        fill="white"
      />
      {/* Building window */}
      <rect
        x="11"
        y="6"
        width="1"
        height="1"
        fill="currentColor"
        opacity="0.3"
      />
      <rect
        x="12.5"
        y="6"
        width="1"
        height="1"
        fill="currentColor"
        opacity="0.3"
      />
    </svg>
  );
}
