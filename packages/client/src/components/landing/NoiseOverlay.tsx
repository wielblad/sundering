// Global noise texture overlay for cinematic effect
export function NoiseOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 opacity-[0.015]"
      style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.8' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
        backgroundRepeat: 'repeat',
      }}
    />
  );
}

// Scanline effect for retro/CRT feel (optional - more subtle)
export function ScanlineOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-50 opacity-[0.02]"
      style={{
        backgroundImage: 'repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(0,0,0,0.3) 2px, rgba(0,0,0,0.3) 4px)',
      }}
    />
  );
}

// Vignette effect for dramatic edges
export function VignetteOverlay() {
  return (
    <div
      className="fixed inset-0 pointer-events-none z-40"
      style={{
        background: 'radial-gradient(ellipse at center, transparent 0%, transparent 60%, rgba(0,0,0,0.4) 100%)',
      }}
    />
  );
}

// Combined cinematic overlay
export function CinematicOverlay({
  noise = true,
  vignette = true,
  scanlines = false,
}: {
  noise?: boolean;
  vignette?: boolean;
  scanlines?: boolean;
}) {
  return (
    <>
      {noise && <NoiseOverlay />}
      {vignette && <VignetteOverlay />}
      {scanlines && <ScanlineOverlay />}
    </>
  );
}
