// The possession mark next to a team's name: the same leather-brown ball the
// field strip draws, so "who has it" reads the same in both places.
export const BALL_BROWN = "#8b4a1e";

export const BallIcon = ({ abbr }: { abbr: string }) => (
  <svg
    role="img"
    aria-label={`${abbr} has the ball`}
    viewBox="0 0 20 12"
    width={16}
    height={10}
    style={{ flexShrink: 0, alignSelf: "center", display: "block" }}
  >
    <path d="M1 6C4 .5 16 .5 19 6C16 11.5 4 11.5 1 6Z" fill={BALL_BROWN} />
    <path
      d="M6.5 6h7M8 4.6v2.8M10 4.6v2.8M12 4.6v2.8"
      stroke="#fff"
      strokeWidth={1.1}
      strokeLinecap="round"
    />
  </svg>
);
