import { useState, useEffect, useRef } from 'react';

// Feature data with extended info for bento cards
const features = [
  {
    id: 'browser',
    icon: (
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
      </svg>
    ),
    title: 'True Browser Gaming',
    description: 'No downloads, no installations. Jump into battle directly from your browser with cutting-edge WebGL graphics.',
    highlight: 'Zero Install',
    color: 'mystical',
    size: 'large',
  },
  {
    id: 'combat',
    icon: (
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
      </svg>
    ),
    title: 'Real-Time Combat',
    description: 'Authoritative server architecture ensures fair, lag-compensated gameplay with tick-perfect ability execution.',
    highlight: '60 TPS',
    stats: [
      { label: 'Tick Rate', value: '60/s' },
      { label: 'Latency', value: '<50ms' },
    ],
    color: 'human',
    size: 'medium',
  },
  {
    id: 'team',
    icon: (
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
      </svg>
    ),
    title: '5v5 Team Battles',
    description: 'Coordinate with your team across three lanes. Strategic depth meets fast-paced action.',
    highlight: '5v5',
    color: 'ancient',
    size: 'medium',
  },
  {
    id: 'heroes',
    icon: (
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
      </svg>
    ),
    title: 'Deep Hero System',
    description: '20+ unique heroes across two factions, each with 4 abilities and distinct playstyles to master.',
    highlight: '20+',
    highlightLabel: 'Heroes',
    color: 'mystical',
    size: 'small',
  },
  {
    id: 'ranked',
    icon: (
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
      </svg>
    ),
    title: 'Ranked Competition',
    description: 'Climb the ladder with skill-based matchmaking. Prove your worth and earn rewards each season.',
    highlight: 'Competitive',
    color: 'human',
    size: 'small',
  },
  {
    id: 'free',
    icon: (
      <svg className="w-full h-full" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    ),
    title: 'Free to Play',
    description: 'All heroes playable for free. Cosmetics only. No pay-to-win mechanics, ever.',
    highlight: '$0',
    highlightLabel: 'Pay to Win',
    color: 'ancient',
    size: 'small',
  },
];

// Color configurations
const colorConfig = {
  mystical: {
    bg: 'from-mystical-500/20 via-mystical-600/10 to-transparent',
    border: 'border-mystical-500/30 hover:border-mystical-400/50',
    icon: 'text-mystical-400',
    iconBg: 'bg-mystical-500/20',
    highlight: 'text-mystical-400',
    glow: 'shadow-mystical-500/20',
    accent: 'bg-mystical-500',
  },
  human: {
    bg: 'from-human-500/20 via-human-600/10 to-transparent',
    border: 'border-human-500/30 hover:border-human-400/50',
    icon: 'text-human-400',
    iconBg: 'bg-human-500/20',
    highlight: 'text-human-400',
    glow: 'shadow-human-500/20',
    accent: 'bg-human-500',
  },
  ancient: {
    bg: 'from-ancient-500/20 via-ancient-600/10 to-transparent',
    border: 'border-ancient-500/30 hover:border-ancient-400/50',
    icon: 'text-ancient-400',
    iconBg: 'bg-ancient-500/20',
    highlight: 'text-ancient-400',
    glow: 'shadow-ancient-500/20',
    accent: 'bg-ancient-500',
  },
};

// Scroll animation hook
function useInView(threshold = 0.2) {
  const ref = useRef<HTMLDivElement>(null);
  const [isInView, setIsInView] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true);
        }
      },
      { threshold }
    );

    if (ref.current) {
      observer.observe(ref.current);
    }

    return () => observer.disconnect();
  }, [threshold]);

  return { ref, isInView };
}

// Large feature card (spans 2 columns)
function LargeFeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const colors = colorConfig[feature.color as keyof typeof colorConfig];
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`
        relative col-span-1 md:col-span-2 row-span-1
        rounded-3xl overflow-hidden
        border ${colors.border}
        bg-gradient-to-br ${colors.bg}
        backdrop-blur-sm
        transition-all duration-700 ease-out
        hover:shadow-2xl ${colors.glow}
        group
        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Background pattern */}
      <div className="absolute inset-0 opacity-5">
        <div
          className="absolute inset-0"
          style={{
            backgroundImage: `radial-gradient(circle at 2px 2px, currentColor 1px, transparent 0)`,
            backgroundSize: '24px 24px',
          }}
        />
      </div>

      {/* Animated gradient orb */}
      <div className={`
        absolute -top-20 -right-20 w-64 h-64 rounded-full blur-3xl opacity-20
        ${colors.accent}
        group-hover:opacity-40 transition-opacity duration-700
      `} />

      <div className="relative z-10 p-8 md:p-10 h-full flex flex-col md:flex-row md:items-center gap-8">
        {/* Icon section */}
        <div className="flex-shrink-0">
          <div className={`
            w-20 h-20 md:w-28 md:h-28 rounded-2xl ${colors.iconBg}
            flex items-center justify-center
            group-hover:scale-110 transition-transform duration-500
          `}>
            <div className={`w-10 h-10 md:w-14 md:h-14 ${colors.icon}`}>
              {feature.icon}
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1">
          {/* Highlight badge */}
          <div className={`
            inline-flex items-center gap-2 px-3 py-1 rounded-full mb-4
            ${colors.iconBg} border border-white/10
          `}>
            <span className={`text-xs font-bold uppercase tracking-wider ${colors.highlight}`}>
              {feature.highlight}
            </span>
          </div>

          <h3 className="text-2xl md:text-3xl font-display font-bold text-white mb-3">
            {feature.title}
          </h3>
          <p className="text-gray-400 leading-relaxed max-w-xl">
            {feature.description}
          </p>
        </div>

        {/* Decorative arrow */}
        <div className={`
          hidden md:flex items-center justify-center w-12 h-12 rounded-full
          ${colors.iconBg} opacity-0 group-hover:opacity-100
          transition-all duration-300 group-hover:translate-x-2
        `}>
          <svg className={`w-6 h-6 ${colors.icon}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
          </svg>
        </div>
      </div>
    </div>
  );
}

// Medium feature card
function MediumFeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const colors = colorConfig[feature.color as keyof typeof colorConfig];
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`
        relative rounded-3xl overflow-hidden
        border ${colors.border}
        bg-gradient-to-br ${colors.bg}
        backdrop-blur-sm
        transition-all duration-700 ease-out
        hover:shadow-2xl ${colors.glow}
        group
        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      {/* Background glow */}
      <div className={`
        absolute -bottom-10 -right-10 w-40 h-40 rounded-full blur-3xl opacity-20
        ${colors.accent}
        group-hover:opacity-40 transition-opacity duration-700
      `} />

      <div className="relative z-10 p-6 md:p-8 h-full flex flex-col">
        {/* Top row: Icon and highlight */}
        <div className="flex items-start justify-between mb-6">
          <div className={`
            w-14 h-14 rounded-xl ${colors.iconBg}
            flex items-center justify-center
            group-hover:scale-110 transition-transform duration-500
          `}>
            <div className={`w-7 h-7 ${colors.icon}`}>
              {feature.icon}
            </div>
          </div>

          {/* Highlight number */}
          <div className="text-right">
            <div className={`text-3xl font-display font-bold ${colors.highlight}`}>
              {feature.highlight}
            </div>
            {feature.highlightLabel && (
              <div className="text-xs text-gray-500 uppercase tracking-wider">
                {feature.highlightLabel}
              </div>
            )}
          </div>
        </div>

        {/* Content */}
        <h3 className="text-xl font-display font-bold text-white mb-2">
          {feature.title}
        </h3>
        <p className="text-gray-500 text-sm leading-relaxed flex-1">
          {feature.description}
        </p>

        {/* Stats row if available */}
        {feature.stats && (
          <div className="flex gap-4 mt-4 pt-4 border-t border-white/5">
            {feature.stats.map((stat) => (
              <div key={stat.label}>
                <div className={`text-lg font-bold ${colors.highlight}`}>
                  {stat.value}
                </div>
                <div className="text-xs text-gray-600">{stat.label}</div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

// Small feature card
function SmallFeatureCard({ feature, index }: { feature: typeof features[0]; index: number }) {
  const colors = colorConfig[feature.color as keyof typeof colorConfig];
  const { ref, isInView } = useInView();

  return (
    <div
      ref={ref}
      className={`
        relative rounded-2xl overflow-hidden
        border ${colors.border}
        bg-gradient-to-br ${colors.bg}
        backdrop-blur-sm
        transition-all duration-700 ease-out
        hover:shadow-xl ${colors.glow}
        group
        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
      style={{ transitionDelay: `${index * 100}ms` }}
    >
      <div className="relative z-10 p-5 h-full">
        {/* Header with icon and highlight */}
        <div className="flex items-center justify-between mb-4">
          <div className={`
            w-10 h-10 rounded-lg ${colors.iconBg}
            flex items-center justify-center
            group-hover:scale-110 transition-transform duration-500
          `}>
            <div className={`w-5 h-5 ${colors.icon}`}>
              {feature.icon}
            </div>
          </div>

          <div className={`
            px-2.5 py-1 rounded-full ${colors.iconBg}
            text-xs font-bold ${colors.highlight}
          `}>
            {feature.highlight}
          </div>
        </div>

        {/* Content */}
        <h3 className="text-lg font-display font-bold text-white mb-1.5">
          {feature.title}
        </h3>
        <p className="text-gray-500 text-xs leading-relaxed">
          {feature.description}
        </p>
      </div>
    </div>
  );
}

export function Features() {
  const { ref: headerRef, isInView: headerInView } = useInView();

  return (
    <section className="py-24 md:py-32 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-game-darker via-game-dark to-game-darker" />

      {/* Decorative elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-0 w-[500px] h-[500px] bg-mystical-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-0 w-[500px] h-[500px] bg-human-500/5 rounded-full blur-[120px]" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Section Header */}
        <div
          ref={headerRef}
          className={`
            text-center mb-16
            transition-all duration-700
            ${headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-human-500" />
            <span className="text-xs uppercase tracking-[0.3em] text-gray-500">Core Features</span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-human-500" />
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4">
            Built for{' '}
            <span className="relative inline-block">
              <span className="bg-gradient-to-r from-human-400 via-ancient-400 to-mystical-400 bg-clip-text text-transparent">
                Competitive
              </span>
              <div className="absolute -inset-x-4 -inset-y-2 bg-gradient-to-r from-human-500/20 via-transparent to-mystical-500/20 blur-2xl -z-10" />
            </span>
            {' '}Play
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Every system designed with esports-level integrity and browser-first performance.
          </p>
        </div>

        {/* Bento Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
          {/* Large card - Browser Gaming (spans 2 cols) */}
          <LargeFeatureCard feature={features[0]} index={0} />

          {/* Medium cards */}
          <MediumFeatureCard feature={features[1]} index={1} />
          <MediumFeatureCard feature={features[2]} index={2} />

          {/* Small cards */}
          <SmallFeatureCard feature={features[3]} index={3} />
          <SmallFeatureCard feature={features[4]} index={4} />
          <SmallFeatureCard feature={features[5]} index={5} />
        </div>

        {/* Bottom decorative line */}
        <div className="mt-16 flex items-center justify-center">
          <div className="flex items-center gap-4">
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
            <div className="w-2 h-2 rounded-full bg-ancient-500/50" />
            <div className="w-16 h-px bg-gradient-to-r from-transparent via-gray-700 to-transparent" />
          </div>
        </div>
      </div>
    </section>
  );
}
