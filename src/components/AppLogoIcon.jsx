import React from 'react';

export default function AppLogoIcon({ size = 28, color = '#ffffff' }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 32 32"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ display: 'block' }}
    >
      <defs>
        <linearGradient id="logoGrad" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stopColor="#f59e0b" />
          <stop offset="100%" stopColor="#e11d48" />
        </linearGradient>
      </defs>

      {/* Outer rounded frame strip */}
      <rect x="2" y="2" width="28" height="28" rx="8" fill="url(#logoGrad)" fillOpacity="0.2" stroke="url(#logoGrad)" strokeWidth="2" />

      {/* Film perforations */}
      <rect x="5" y="5" width="2" height="3" rx="0.5" fill="#ffffff" opacity="0.8" />
      <rect x="25" y="5" width="2" height="3" rx="0.5" fill="#ffffff" opacity="0.8" />
      <rect x="5" y="24" width="2" height="3" rx="0.5" fill="#ffffff" opacity="0.8" />
      <rect x="25" y="24" width="2" height="3" rx="0.5" fill="#ffffff" opacity="0.8" />

      {/* Shutter Circle */}
      <circle cx="16" cy="16" r="7" stroke="#ffffff" strokeWidth="2.2" />

      {/* Camera Lens Blades */}
      <path d="M16 9 L19 16" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M22 13 L16 19" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M20 22 L13 16" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M10 19 L16 13" stroke="#ffffff" strokeWidth="1.8" strokeLinecap="round" />

      {/* Center Reflection Dot */}
      <circle cx="16" cy="16" r="2" fill="#ffffff" />
    </svg>
  );
}
