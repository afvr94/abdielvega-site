import { profile } from '@/lib/portfolio/content';

// Flat four-ink lithograph: each ink lives in its own `plate-*` group so the
// press run in crate.css can print them one after another. Groups of the same
// ink are split where the stacking order needs it.

const TREES: Array<[number, number, number]> = [
  [36, 486, 30],
  [98, 470, 32],
  [162, 474, 31],
  [226, 490, 30],
  [70, 546, 34],
  [138, 538, 35],
  [206, 552, 33],
  [272, 578, 32],
];

const FRUIT_DOTS: Array<[number, number]> = [
  [26, 478],
  [46, 496],
  [92, 462],
  [110, 482],
  [156, 470],
  [174, 488],
  [220, 484],
  [62, 540],
  [84, 558],
  [130, 532],
  [150, 552],
  [198, 548],
  [218, 566],
  [264, 574],
  [284, 590],
];

export function PackersSeal({
  className = '',
  style,
}: {
  className?: string;
  style?: React.CSSProperties;
}) {
  return (
    <svg viewBox="0 0 120 120" aria-hidden className={className} style={style}>
      <defs>
        <path id="seal-ring" d="M60 60m-43 0a43 43 0 1 1 86 0a43 43 0 1 1-86 0" />
      </defs>
      <circle cx="60" cy="60" r="57" fill="var(--color-lemon)" />
      <circle cx="60" cy="60" r="52" fill="none" stroke="var(--color-lake)" strokeWidth="1.5" />
      <circle cx="60" cy="60" r="31" fill="none" stroke="var(--color-lake)" strokeWidth="1.5" />
      <text
        fill="var(--color-lake)"
        fontSize="11"
        fontWeight="800"
        letterSpacing="2.1"
        style={{ fontFamily: 'var(--font-shoulders)' }}
      >
        <textPath href="#seal-ring">
          {`${profile.town} · Florida · Est. ${profile.since} ·`.toUpperCase()}
        </textPath>
      </text>
      <text
        x="60"
        y="68"
        textAnchor="middle"
        fill="var(--color-lake)"
        fontSize="24"
        style={{ fontFamily: 'var(--font-ultra)' }}
      >
        AV
      </text>
    </svg>
  );
}

const ARCH = 'M0 660V250C0 112 134 0 300 0s300 112 300 250v410Z';

// The page paints with the theme's CSS variables; the OG image renders outside
// the page (Satori) and passes literal hex instead.
const CSS_INKS = {
  lemon: 'var(--color-lemon)',
  paper: 'var(--color-paper)',
  grove: 'var(--color-grove)',
  sprout: 'var(--color-sprout)',
  reef: 'var(--color-reef)',
  lake: 'var(--color-lake)',
  tangelo: 'var(--color-tangelo)',
};

export type GroveInks = typeof CSS_INKS;

export function GroveScene({
  className = '',
  inks = CSS_INKS,
  width,
  height,
}: {
  className?: string;
  inks?: GroveInks;
  width?: number;
  height?: number;
}) {
  return (
    <svg
      viewBox="0 0 620 720"
      width={width}
      height={height}
      role="img"
      aria-label="A lake at sunset behind a citrus grove, with a Minneola tangelo in front"
      className={className}
    >
      <defs>
        <clipPath id="grove-arch">
          <path d={ARCH} />
        </clipPath>
      </defs>

      <g clipPath="url(#grove-arch)">
        <g className="plate plate-lemon">
          <rect width="600" height="660" fill={inks.lemon} />
          <circle cx="410" cy="300" r="80" fill={inks.paper} />
        </g>

        <g className="plate plate-green">
          <path
            d="M0 352c48-30 96-38 150-22 40-34 96-44 150-18 44-26 104-30 150-6 56-22 112-14 150 10v74H0Z"
            fill={inks.grove}
          />
        </g>

        <g className="plate plate-blue">
          <rect y="362" width="600" height="300" fill={inks.reef} />
          {[392, 414, 436, 458, 480, 502].map((y, i) => (
            <line
              key={y}
              x1={410 - (70 - i * 10)}
              x2={410 + (70 - i * 10)}
              y1={y}
              y2={y}
              stroke={inks.paper}
              strokeWidth="7"
              strokeLinecap="round"
            />
          ))}
          {[548, 584, 620].map((y) => (
            <path
              key={y}
              d={`M300 ${y}q30-12 60 0t60 0 60 0 60 0 60 0 60 0`}
              fill="none"
              stroke={inks.lake}
              strokeWidth="5"
              strokeLinecap="round"
            />
          ))}
        </g>

        <g className="plate plate-green">
          <path d="M0 660V470c70-34 170-30 250 6 52 24 92 70 112 184Z" fill={inks.sprout} />
          {TREES.map(([cx, cy, r]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r={r} fill={inks.grove} />
          ))}
        </g>

        <g className="plate plate-tangelo">
          {FRUIT_DOTS.map(([cx, cy]) => (
            <circle key={`${cx}-${cy}`} cx={cx} cy={cy} r="5.5" fill={inks.tangelo} />
          ))}
        </g>
      </g>

      <g className="plate plate-lemon">
        <path d={ARCH} fill="none" stroke={inks.lemon} strokeWidth="5" />
      </g>

      {/* The tangelo breaks out of the arch, as the hero fruit on a crate label does. */}
      <g className="plate plate-tangelo">
        <circle cx="492" cy="598" r="112" fill={inks.tangelo} />
        <ellipse
          cx="462"
          cy="484"
          rx="34"
          ry="26"
          transform="rotate(-24 462 484)"
          fill={inks.tangelo}
        />
        <ellipse
          cx="440"
          cy="560"
          rx="26"
          ry="13"
          transform="rotate(-38 440 560)"
          fill={inks.lemon}
        />
      </g>

      <g className="plate plate-green">
        <path d="M452 466c-28-44-84-60-128-40 26 42 82 58 128 40Z" fill={inks.grove} />
        <path d="M452 466c-38-14-80-24-118-36" stroke={inks.sprout} strokeWidth="3" />
        <path d="M466 462c16-48 64-78 112-70-12 48-62 76-112 70Z" fill={inks.grove} />
        <path d="M466 462c32-22 70-48 104-62" stroke={inks.sprout} strokeWidth="3" />
      </g>
    </svg>
  );
}
