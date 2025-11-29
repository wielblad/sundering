import { useState, useEffect, useRef } from 'react';
import { FACTION_THEMES } from '../../constants/loreData';

// Scroll animation hook
function useInView<T extends HTMLElement = HTMLDivElement>(threshold = 0.2) {
  const ref = useRef<T>(null);
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

// Faction Card Component with enhanced visuals
function FactionCard({ faction, delay = 0 }: { faction: 'mystical' | 'human'; delay?: number }) {
  const theme = FACTION_THEMES[faction];
  const isMystical = faction === 'mystical';
  const { ref, isInView } = useInView(0.2);

  return (
    <div
      ref={ref}
      className={`
        relative group transition-all duration-700
        ${isInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
      `}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Outer glow */}
      <div className={`
        absolute -inset-1 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 blur-xl
        ${isMystical
          ? 'bg-gradient-to-br from-mystical-500/30 to-indigo-500/20'
          : 'bg-gradient-to-br from-human-500/30 to-orange-500/20'
        }
      `} />

      <div className={`
        relative rounded-2xl overflow-hidden
        bg-gradient-to-br ${isMystical
          ? 'from-mystical-950/80 via-game-card to-indigo-950/50'
          : 'from-human-950/80 via-game-card to-orange-950/50'
        }
        border ${isMystical ? 'border-mystical-500/30' : 'border-human-500/30'}
        p-8 md:p-10
      `}>
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-5">
          <div
            className="absolute inset-0"
            style={{
              backgroundImage: isMystical
                ? `radial-gradient(circle at 2px 2px, rgba(99,102,241,0.5) 1px, transparent 0)`
                : `radial-gradient(circle at 2px 2px, rgba(239,68,68,0.5) 1px, transparent 0)`,
              backgroundSize: '20px 20px',
            }}
          />
        </div>

        {/* Decorative corner elements */}
        <div className={`
          absolute top-0 left-0 w-20 h-20 border-t-2 border-l-2 rounded-tl-2xl
          ${isMystical ? 'border-mystical-500/40' : 'border-human-500/40'}
        `} />
        <div className={`
          absolute bottom-0 right-0 w-20 h-20 border-b-2 border-r-2 rounded-br-2xl
          ${isMystical ? 'border-mystical-500/40' : 'border-human-500/40'}
        `} />

        <div className="relative">
          {/* Icon with glow */}
          <div className="relative mb-8">
            <div className={`
              absolute inset-0 rounded-full blur-2xl opacity-50
              ${isMystical ? 'bg-mystical-500/30' : 'bg-human-500/30'}
            `} />
            <div className={`
              relative w-20 h-20 rounded-2xl flex items-center justify-center
              ${isMystical ? 'bg-mystical-500/20' : 'bg-human-500/20'}
              group-hover:scale-110 transition-transform duration-500
            `}>
              {isMystical ? (
                <svg className="w-10 h-10 text-mystical-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              ) : (
                <svg className="w-10 h-10 text-human-400" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z" />
                </svg>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className={`
            text-3xl font-display font-bold mb-3
            ${isMystical ? 'text-mystical-300' : 'text-human-300'}
          `}>
            {theme.name}
          </h3>

          {/* Philosophy tagline */}
          <p className={`
            text-sm font-medium uppercase tracking-wider mb-6 flex items-center gap-2
            ${isMystical ? 'text-mystical-400' : 'text-human-400'}
          `}>
            <span className="w-6 h-px bg-current opacity-50" />
            {theme.philosophy}
            <span className="w-6 h-px bg-current opacity-50" />
          </p>

          {/* Description */}
          <p className="text-gray-400 leading-relaxed mb-6">
            {theme.description}
          </p>

          {/* Philosophy Quote */}
          <blockquote className={`
            pl-5 border-l-2 text-sm italic text-gray-500 mb-8
            ${isMystical ? 'border-mystical-500/50' : 'border-human-500/50'}
          `}>
            "{theme.philosophyQuote}"
          </blockquote>

          {/* War Objective */}
          <div className="mb-8 p-4 rounded-xl bg-white/5 border border-white/5">
            <h4 className="text-xs uppercase tracking-wider text-gray-500 mb-2 flex items-center gap-2">
              <svg className={`w-4 h-4 ${isMystical ? 'text-mystical-500' : 'text-human-500'}`} fill="currentColor" viewBox="0 0 24 24">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
              </svg>
              War Objective
            </h4>
            <p className="text-gray-300 text-sm">{theme.warObjective}</p>
          </div>

          {/* Tags */}
          <div className="flex gap-2 flex-wrap">
            {theme.tags.map((tag) => (
              <span
                key={tag}
                className={`
                  px-4 py-1.5 text-xs rounded-full border font-medium
                  transition-all duration-300 hover:scale-105
                  ${isMystical
                    ? 'bg-mystical-500/10 text-mystical-400 border-mystical-500/30 hover:bg-mystical-500/20'
                    : 'bg-human-500/10 text-human-400 border-human-500/30 hover:bg-human-500/20'
                  }
                `}
              >
                {tag}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

export function Lore() {
  const { ref: headerRef, isInView: headerInView } = useInView();

  return (
    <section id="lore" className="py-24 md:py-32 px-4 relative overflow-hidden">
      {/* Background */}
      <div className="absolute inset-0 bg-gradient-to-b from-game-dark via-game-darker to-game-dark" />

      {/* Decorative particles */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-mystical-500/5 rounded-full blur-[100px]" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-human-500/5 rounded-full blur-[100px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-ancient-500/5 rounded-full blur-[150px]" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto">
        {/* Section Title */}
        <div
          ref={headerRef}
          className={`
            text-center mb-20
            transition-all duration-700
            ${headerInView ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-8'}
          `}
        >
          <div className="inline-flex items-center gap-3 mb-6">
            <div className="w-12 h-px bg-gradient-to-r from-transparent to-mystical-500" />
            <span className="text-xs uppercase tracking-[0.3em] text-gray-500">World Lore</span>
            <div className="w-12 h-px bg-gradient-to-l from-transparent to-human-500" />
          </div>

          <h2 className="text-4xl md:text-5xl lg:text-6xl font-display font-bold mb-4">
            The{' '}
            <span className="bg-gradient-to-r from-mystical-400 via-ancient-400 to-human-400 bg-clip-text text-transparent">
              Eternal
            </span>
            {' '}Conflict
          </h2>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            A war ten thousand years in the making. The fate of magic itself hangs in the balance.
          </p>
        </div>

        {/* Faction Cards */}
        <div className="mb-24">
          <h3 className="text-xl font-display font-bold text-center mb-10 text-gray-300">
            Two Sides, <span className="text-human-400">One War</span>
          </h3>

          <div className="grid md:grid-cols-2 gap-8">
            <FactionCard faction="mystical" delay={0} />
            <FactionCard faction="human" delay={150} />
          </div>

          {/* VS Divider */}
          <div className="mt-12 text-center">
            <div className="inline-flex items-center gap-6">
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-mystical-500/50 to-transparent" />
              <div className="relative">
                <span className="text-3xl font-display font-bold text-white/10">VS</span>
                <div className="absolute inset-0 bg-gradient-to-r from-mystical-500 to-human-500 bg-clip-text text-transparent text-3xl font-display font-bold opacity-30">
                  VS
                </div>
              </div>
              <div className="w-24 h-px bg-gradient-to-r from-transparent via-human-500/50 to-transparent" />
            </div>
          </div>
        </div>

        {/* Call to Action */}
        <div className="text-center max-w-2xl mx-auto">
          <div className="inline-flex items-center gap-4 mb-6">
            <div className="w-8 h-px bg-gradient-to-r from-transparent to-gray-700" />
            <svg className="w-5 h-5 text-ancient-500/50" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
            <div className="w-8 h-px bg-gradient-to-l from-transparent to-gray-700" />
          </div>

          <p className="text-gray-500 italic text-lg leading-relaxed">
            "The world stands upon the precipice. The Nexus pulses, and both armies
            gather for the final battle. Will magic survive at the cost of humanity?
            Will humanity build its future upon the ruins of magic? Or perhaps...
            perhaps there exists a third path."
          </p>
          <p className="text-gray-600 text-sm mt-4 font-display">
            — Fragment from the Chronicles of the Eternal Conflict
          </p>
        </div>
      </div>
    </section>
  );
}
