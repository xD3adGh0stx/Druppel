// Shared logo component matching the official Druppel two-droplet design.
// Small complete drop (left/front) + large open-bottom drop (right/behind).

const COLOR = '#7CBDE8'

export default function DruppelLogo({ className = 'w-8 h-8' }: { className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} xmlns="http://www.w3.org/2000/svg">
      {/* Large drop — behind, right side, open at bottom */}
      <path
        d="M47 88 C38 78,37 60,43 44 C48 28,57 15,65 5 C73 15,88 28,94 50 C97 68,88 88,73 94 C67 96,61 93,58 87"
        fill="none"
        stroke={COLOR}
        strokeWidth="12"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Small drop — front, left side, filled with inner hole */}
      <path
        fillRule="evenodd"
        fill={COLOR}
        d="M29 10 C24 16,8 36,8 54 C8 68,18 79,29 79 C40 79,50 68,50 54 C50 36,34 16,29 10Z M29 28 C26 33,18 44,18 54 C18 62,23 67,29 67 C35 67,40 62,40 54 C40 44,32 33,29 28Z"
      />
    </svg>
  )
}
