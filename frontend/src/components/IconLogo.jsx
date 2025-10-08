import React from 'react'

export default function IconLogo({ size = 36 }){
  return (
    <svg width={size} height={size} viewBox="0 0 48 48" fill="none" xmlns="http://www.w3.org/2000/svg" aria-hidden>
      <rect x="2" y="2" width="44" height="44" rx="10" fill="rgba(255,255,255,0.02)" stroke="rgba(122,60,255,0.18)" strokeWidth="1"/>
      <g transform="translate(8,8) scale(0.75)">
        <path d="M8 4C12 2 20 2 24 4C28 6 32 10 32 14C32 18 28 22 24 24C20 26 12 26 8 24C4 22 2 18 2 14C2 10 4 6 8 4Z" fill="url(#g)"/>
        <defs>
          <linearGradient id="g" x1="0" x2="1">
            <stop offset="0%" stopColor="#7A3CFF" />
            <stop offset="100%" stopColor="#3BE7D3" />
          </linearGradient>
        </defs>
      </g>
    </svg>
  )
}
