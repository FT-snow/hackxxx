const OUTER = 'ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ';
const INNER = 'ᛗᛁᛗᛁᚱᛗᛁᛗᛁᚱᛗᛁᛗᛁᚱᛗᛁᛗᛁᚱᛗᛁᛗᛁᚱ';

export default function RuneWell({ className = '' }: { className?: string }) {
  return (
    <div className={`pointer-events-none select-none ${className}`} aria-hidden>
      <svg viewBox="0 0 640 640" className="h-full w-full">
        <defs>
          <path
            id="rune-ring-outer"
            d="M320,320 m-252,0 a252,252 0 1,1 504,0 a252,252 0 1,1 -504,0"
          />
          <path
            id="rune-ring-inner"
            d="M320,320 m-196,0 a196,196 0 1,1 392,0 a196,196 0 1,1 -392,0"
          />
        </defs>

        <circle
          cx="320"
          cy="320"
          r="284"
          fill="none"
          stroke="rgba(255,255,255,0.05)"
        />
        <circle
          cx="320"
          cy="320"
          r="226"
          fill="none"
          stroke="rgba(255,255,255,0.04)"
        />
        <circle
          cx="320"
          cy="320"
          r="160"
          fill="none"
          stroke="rgba(233,196,104,0.10)"
        />

        <g
          className="animate-rspin-slow"
          style={{ transformOrigin: '320px 320px' }}
        >
          <text fontSize="24" letterSpacing="14" fill="#3a3a3a">
            <textPath href="#rune-ring-outer">{OUTER}</textPath>
          </text>
        </g>

        <g
          className="animate-rspin-fast"
          style={{ transformOrigin: '320px 320px' }}
        >
          <text fontSize="17" letterSpacing="18" fill="#C8A45C" opacity="0.55">
            <textPath href="#rune-ring-inner">{INNER}</textPath>
          </text>
        </g>

        <g style={{ transformOrigin: '320px 320px' }}>
          <circle
            cx="320"
            cy="320"
            r="70"
            fill="none"
            stroke="rgba(233,196,104,0.5)"
            className="well-ripple"
          />
          <circle
            cx="320"
            cy="320"
            r="70"
            fill="none"
            stroke="rgba(233,196,104,0.35)"
            className="well-ripple well-ripple-late"
          />
        </g>
        <circle cx="320" cy="320" r="4.5" fill="#E9C468" className="well-eye" />
      </svg>
    </div>
  );
}
