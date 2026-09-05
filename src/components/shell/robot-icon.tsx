// Mascote pixelado do Claude Code — usado no item de menu que leva de volta
// pro hub. Grade fixa 9x7, cor herdada (currentColor) por padrão.
export function RobotIcon({
  width = 21,
  height = 13,
  color = "currentColor",
  className,
}: {
  width?: number
  height?: number
  color?: string
  className?: string
}) {
  return (
    <svg
      width={width}
      height={height}
      viewBox="0 0 9 7"
      fill={color}
      shape-rendering="crispEdges"
      className={className}
      aria-hidden
    >
      <rect x="2" y="0" width="5" height="1" />
      <rect x="2" y="1" width="5" height="1" />
      <rect x="0" y="2" width="3" height="1" />
      <rect x="4" y="2" width="1" height="1" />
      <rect x="6" y="2" width="3" height="1" />
      <rect x="2" y="3" width="5" height="1" />
      <rect x="2" y="4" width="5" height="1" />
      <rect x="2" y="5" width="1" height="1" />
      <rect x="4" y="5" width="1" height="1" />
      <rect x="6" y="5" width="1" height="1" />
      <rect x="2" y="6" width="1" height="1" />
      <rect x="6" y="6" width="1" height="1" />
    </svg>
  )
}
