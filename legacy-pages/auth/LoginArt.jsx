import '../../app/login-art.css';
/**
 * Decorative animated scene for the left side of the login page (desktop only).
 * Pure SVG + CSS, no libraries, no data. Brand colours come from the Collegeshub logo
 * (dark variants: blue #4C94E8, green #3DBE63). Always designed for a dark background.
 */
const C = 300; // centre of the 600×600 viewBox
const pt = (r, deg) => {
    const a = (deg * Math.PI) / 180;
    return [C + r * Math.cos(a), C + r * Math.sin(a)];
};

// 24×24 outline icons (Heroicons-style)
const ICON = {
    admissions: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4',
    academics: 'M12 14l9-5-9-5-9 5 9 5zM12 14l6.16-3.422a12.083 12.083 0 01.665 6.479A11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z',
    fees: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
    exams: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z',
    learning: 'M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253',
    ai: 'M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z',
};

const RING2 = { r: 150, d: '80s', nodes: [[20, 'admissions', 'b'], [140, 'academics', 'g'], [260, 'fees', 'b']] };
const RING3 = { r: 214, d: '120s', nodes: [[80, 'exams', 'g'], [200, 'learning', 'b'], [320, 'ai', 'g']] };

function Node({ x, y, icon, tone, rev, delay }) {
    const stroke = tone === 'g' ? '#3DBE63' : '#4C94E8';
    return (
        <g transform={`translate(${x.toFixed(1)} ${y.toFixed(1)})`}>
            <g className={`la-counter ${rev ? 'rev' : ''}`}>
                <circle r="27" fill="none" stroke={stroke} strokeWidth="1.2" className="la-ping" style={{ '--delay': delay }} />
                <circle r="27" fill="url(#la-node)" stroke={stroke} strokeOpacity=".75" strokeWidth="1.3" />
                <g transform="translate(-10.5 -10.5) scale(.875)">
                    <path d={ICON[icon]} fill="none" stroke="#fff" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </g>
            </g>
        </g>
    );
}

export default function LoginArt({ className = '' }) {
    return (
        <svg viewBox="0 0 600 600" className={className} role="presentation" aria-hidden="true" focusable="false">
            <defs>
                <radialGradient id="la-core" cx="50%" cy="50%" r="50%">
                    <stop offset="0%" stopColor="#4C94E8" stopOpacity=".55" />
                    <stop offset="55%" stopColor="#3DBE63" stopOpacity=".18" />
                    <stop offset="100%" stopColor="#4C94E8" stopOpacity="0" />
                </radialGradient>
                <linearGradient id="la-node" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#12294d" />
                    <stop offset="100%" stopColor="#0a1a33" />
                </linearGradient>
                <linearGradient id="la-bar" x1="0" y1="1" x2="0" y2="0">
                    <stop offset="0%" stopColor="#4C94E8" />
                    <stop offset="100%" stopColor="#3DBE63" />
                </linearGradient>
                <linearGradient id="la-glass" x1="0" y1="0" x2="1" y2="1">
                    <stop offset="0%" stopColor="#fff" stopOpacity=".12" />
                    <stop offset="100%" stopColor="#fff" stopOpacity=".03" />
                </linearGradient>
            </defs>

            {/* soft glow behind the logo */}
            <circle cx={C} cy={C} r="150" fill="url(#la-core)" className="la-pulse" />

            {/* static orbit rings */}
            <circle cx={C} cy={C} r="92" fill="none" stroke="#9db8e6" strokeOpacity=".2" />
            <circle cx={C} cy={C} r={RING2.r} fill="none" stroke="#9db8e6" strokeOpacity=".16" />
            <circle cx={C} cy={C} r={RING3.r} fill="none" stroke="#9db8e6" strokeOpacity=".4" strokeWidth="1.4" strokeLinecap="round" className="la-dash" />

            {/* fast inner ring with two "data" dots */}
            <g className="la-orbit" style={{ '--d': '16s' }}>
                <circle cx={C + 92} cy={C} r="4.5" fill="#3DBE63" />
                <circle cx={C + 92} cy={C} r="10" fill="#3DBE63" opacity=".2" />
                <circle cx={C - 92} cy={C} r="3.5" fill="#4C94E8" />
                <circle cx={C - 92} cy={C} r="8" fill="#4C94E8" opacity=".2" />
            </g>

            {/* middle ring: three modules */}
            <g className="la-orbit" style={{ '--d': RING2.d }}>
                {RING2.nodes.map(([deg, icon, tone], i) => {
                    const [x, y] = pt(RING2.r, deg);
                    return <Node key={icon} x={x} y={y} icon={icon} tone={tone} delay={`${i * 1.1}s`} />;
                })}
            </g>

            {/* outer ring: three modules, opposite direction */}
            <g className="la-orbit rev" style={{ '--d': RING3.d }}>
                {RING3.nodes.map(([deg, icon, tone], i) => {
                    const [x, y] = pt(RING3.r, deg);
                    return <Node key={icon} x={x} y={y} icon={icon} tone={tone} rev delay={`${i * 1.1 + 0.5}s`} />;
                })}
            </g>

            {/* logo mark in the centre */}
            <circle cx={C} cy={C} r="62" fill="url(#la-glass)" stroke="#fff" strokeOpacity=".16" />
            <image href="/logo-mark.svg" x={C - 46} y={C - 44} width="92" height="87" />

            {/* floating glass card: analytics bars (decorative, no data) */}
            <g transform="translate(418 70)">
                <g className="la-float">
                    <rect width="136" height="84" rx="16" fill="url(#la-glass)" stroke="#fff" strokeOpacity=".16" />
                    <rect x="14" y="14" width="44" height="6" rx="3" fill="#fff" opacity=".5" />
                    <rect x="14" y="26" width="26" height="5" rx="2.5" fill="#fff" opacity=".22" />
                    {[0, 1, 2, 3, 4, 5].map((i) => (
                        <rect key={i} x={14 + i * 19} y={40} width="12" height="32" rx="4" fill="url(#la-bar)" className="la-bar" style={{ '--delay': `${i * 0.35}s` }} />
                    ))}
                </g>
            </g>

            {/* floating glass card: check list */}
            <g transform="translate(36 448)">
                <g className="la-float" style={{ '--delay': '-3s' }}>
                    <rect width="150" height="70" rx="16" fill="url(#la-glass)" stroke="#fff" strokeOpacity=".16" />
                    <circle cx="32" cy="35" r="15" fill="#3DBE63" opacity=".2" className="la-pulse" />
                    <circle cx="32" cy="35" r="11" fill="#3DBE63" />
                    <path d="M26.5 35.5l3.6 3.6 7-7.4" fill="none" stroke="#06231a" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    <rect x="56" y="24" width="68" height="7" rx="3.5" fill="#fff" opacity=".55" />
                    <rect x="56" y="38" width="46" height="6" rx="3" fill="#fff" opacity=".22" />
                </g>
            </g>

            {/* tiny floating particles */}
            {[[96, 120, 4, '0s'], [520, 300, 3, '-2s'], [140, 330, 3, '-4s'], [470, 520, 4, '-1s'], [330, 52, 3, '-3s'], [58, 250, 2.5, '-5s']].map(([x, y, r, d], i) => (
                <g key={i} transform={`translate(${x} ${y})`}>
                    <circle r={r} fill={i % 2 ? '#3DBE63' : '#4C94E8'} opacity=".7" className="la-float" style={{ '--delay': d }} />
                </g>
            ))}
        </svg>
    );
}