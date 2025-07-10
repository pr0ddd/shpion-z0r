import { Box } from '@mui/material';
import { useAppStore } from '@stores/useAppStore';
import { useEffect, useState } from 'react';

export const Logo2D = () => {
  const isRedEyes = useAppStore((s) => s.isRedEyes);
  const MAX_RADIUS = 50;

  const [offset, setOffset] = useState<{ x: number; y: number }>({
    x: 0,
    y: 0,
  });

  useEffect(() => {
    const handleMove = (e: MouseEvent) => {
      const { innerWidth, innerHeight } = window;

      const dxNorm = (e.clientX - innerWidth / 2) / (innerWidth / 2);
      const dyNorm = (e.clientY - innerHeight / 2) / (innerHeight / 2);

      const length = Math.sqrt(dxNorm * dxNorm + dyNorm * dyNorm) || 1;
      const clampedLength = Math.min(length, 1);

      const angle = Math.atan2(dyNorm, dxNorm);
      const r = clampedLength * MAX_RADIUS;

      setOffset({ x: Math.cos(angle) * r, y: -Math.sin(angle) * r });
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  return (
    <Box
      sx={{
        width: 100,
        height: 100,
        backgroundColor: 'transparent',
      }}
    >
      <svg
        version="1.0"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 612 612"
        preserveAspectRatio="xMidYMid meet"
      >
        <g
          transform="translate(0.000000,612.000000) scale(0.100000,-0.100000)"
          fill="currentColor"
          stroke="none"
        >
          <path
            d="M2309 4686 c-123 -44 -166 -101 -267 -358 -44 -112 -101 -263 -126
-335 -43 -126 -116 -397 -116 -432 0 -33 -19 -42 -132 -61 -490 -82 -788 -212
-788 -344 0 -205 682 -384 1665 -436 244 -13 776 -13 1020 0 766 41 1365 156
1582 306 251 173 -13 354 -692 474 -66 12 -121 23 -123 25 -2 1 -15 54 -29
116 -33 149 -90 332 -162 527 -133 354 -172 428 -259 483 -118 75 -246 67
-492 -30 -264 -104 -386 -105 -650 -3 -80 30 -170 61 -200 69 -70 16 -184 16
-231 -1z"
          />
          <path
            d="M1702 2293 c4 -313 5 -319 31 -399 90 -272 336 -456 629 -471 168 -9
281 19 438 110 130 75 174 90 260 90 84 0 144 -20 245 -81 143 -87 257 -122
401 -122 140 0 233 23 359 88 99 51 227 181 278 282 67 133 69 150 74 503 l5
317 -26 0 c-14 0 -70 -6 -124 -14 -132 -20 -369 -43 -592 -58 -239 -16 -1010
-15 -1250 1 -198 13 -517 45 -615 61 -33 5 -73 10 -88 10 l-29 0 4 -317z m821
-32 c41 -11 93 -31 115 -44 39 -26 92 -81 92 -98 0 -23 -75 -89 -128 -112
-166 -75 -402 -47 -509 59 -23 24 -43 48 -43 53 0 21 65 83 112 107 107 54
235 67 361 35z m1298 -25 c36 -8 86 -24 110 -35 54 -26 119 -86 119 -112 0
-10 -15 -34 -34 -53 -80 -79 -238 -120 -383 -98 -128 20 -253 95 -253 152 0
26 58 83 113 109 96 47 217 60 328 37z"
          />

          {/* Left eye */}
          <circle
            cx="2392"
            cy="2121"
            r="100"
            fill={isRedEyes ? 'red' : 'currentColor'}
            strokeWidth="10"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px)`,
            }}
          />

          {/* Right eye */}
          <circle
            cx="3714"
            cy="2090"
            r="100"
            fill={isRedEyes ? 'red' : 'currentColor'}
            strokeWidth="10"
            style={{
              transform: `translate(${offset.x}px, ${offset.y}px)`,
            }}
          />
        </g>
      </svg>
    </Box>
  );
};
