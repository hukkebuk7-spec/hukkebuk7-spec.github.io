type IconName =
  | 'arrow'
  | 'arrow-up-right'
  | 'copy'
  | 'check'
  | 'play'
  | 'pause'
  | 'reset'
  | 'close'
  | 'search'

const paths: Record<IconName, React.ReactNode> = {
  arrow: (
    <>
      <path d="M4 12h15" />
      <path d="m13 6 6 6-6 6" />
    </>
  ),
  'arrow-up-right': (
    <>
      <path d="M7 17 17 7" />
      <path d="M8 7h9v9" />
    </>
  ),
  copy: (
    <>
      <rect x="8" y="8" width="12" height="12" rx="0" />
      <path d="M16 8V4H4v12h4" />
    </>
  ),
  check: <path d="m5 13 4 4L19 7" />,
  play: <path d="M8 5v14l11-7L8 5Z" />,
  pause: (
    <>
      <path d="M8 5v14" />
      <path d="M16 5v14" />
    </>
  ),
  reset: (
    <>
      <path d="M4 11a8 8 0 1 1 2.3 6.7" />
      <path d="M4 5v6h6" />
    </>
  ),
  close: (
    <>
      <path d="m6 6 12 12" />
      <path d="M18 6 6 18" />
    </>
  ),
  search: (
    <>
      <circle cx="11" cy="11" r="6.5" />
      <path d="m16 16 4 4" />
    </>
  ),
}

export function Icon({
  name,
  size = 18,
  className,
  strokeWidth = 1.5,
  filled = false,
}: {
  name: IconName
  size?: number
  className?: string
  strokeWidth?: number
  filled?: boolean
}) {
  return (
    <svg
      className={className}
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill={filled ? 'currentColor' : 'none'}
      stroke={filled ? 'none' : 'currentColor'}
      strokeWidth={strokeWidth}
      strokeLinecap="square"
      strokeLinejoin="miter"
      aria-hidden="true"
      focusable="false"
    >
      {paths[name]}
    </svg>
  )
}

export function Wordmark({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 32 32" fill="none" aria-hidden="true" focusable="false">
      <rect x="1" y="1" width="30" height="30" stroke="currentColor" strokeWidth="1.5" />
      <path d="M5 11h22M5 16h22M5 21h22" stroke="currentColor" strokeWidth="1.5" />
      <path d="M11 5v22M21 5v22" stroke="currentColor" strokeWidth="1.5" opacity="0.28" />
      <rect x="13" y="13.5" width="6" height="5" fill="#E5441C" />
    </svg>
  )
}
