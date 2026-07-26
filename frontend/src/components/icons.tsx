type IconProps = {
  className?: string;
};

const BASE_PROPS = {
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export function SparkleIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE_PROPS} fill="currentColor" stroke="none">
      <path d="M12 3l1.6 6.4L20 11l-6.4 1.6L12 19l-1.6-6.4L4 11l6.4-1.6L12 3z" />
    </svg>
  );
}

export function TrendingIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE_PROPS}>
      <polyline points="3,17 9,11 13,15 21,6" />
      <polyline points="15,6 21,6 21,12" />
    </svg>
  );
}

export function ClockIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE_PROPS}>
      <circle cx="12" cy="12" r="8.5" />
      <polyline points="12,7.5 12,12 15,14" />
    </svg>
  );
}

export function LibraryIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE_PROPS}>
      <path d="M4 6c2-1.3 5-1.3 8 0c3-1.3 6-1.3 8 0v13c-2-1.3-5-1.3-8 0c-3-1.3-6-1.3-8 0V6z" />
      <line x1="12" y1="6" x2="12" y2="19" />
    </svg>
  );
}

export function JournalIcon({ className }: IconProps) {
  return (
    <svg className={className} {...BASE_PROPS}>
      <rect x="5" y="3" width="14" height="18" rx="2" />
      <line x1="8.5" y1="3" x2="8.5" y2="21" />
      <line x1="11.5" y1="8" x2="16" y2="8" />
      <line x1="11.5" y1="12" x2="16" y2="12" />
      <line x1="11.5" y1="16" x2="14" y2="16" />
    </svg>
  );
}
