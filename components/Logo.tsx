import React from 'react'

interface LogoProps {
  size?: number
  className?: string
  variant?: 'full' | 'simple' | 'icon'
}

export const Logo: React.FC<LogoProps> = ({ 
  size = 40, 
  className = '', 
  variant = 'simple' 
}) => {
  const logoContent = {
    full: (
      <svg width={size} height={size} viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="bgGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#3B82F6', stopOpacity:0.1}} />
            <stop offset="100%" style={{stopColor:'#8B5CF6', stopOpacity:0.1}} />
          </linearGradient>
          <linearGradient id="cartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#3B82F6'}} />
            <stop offset="100%" style={{stopColor:'#8B5CF6'}} />
          </linearGradient>
          <linearGradient id="cursorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#10B981'}} />
            <stop offset="100%" style={{stopColor:'#059669'}} />
          </linearGradient>
        </defs>
        
        <circle cx="60" cy="60" r="55" fill="url(#bgGradient)" stroke="url(#cartGradient)" strokeWidth="2"/>
        <path d="M35 45 L35 75 C35 80 39 85 44 85 L76 85 C81 85 85 80 85 75 L85 45" 
              fill="none" 
              stroke="url(#cartGradient)" 
              strokeWidth="3" 
              strokeLinecap="round"/>
        <path d="M35 45 L30 40 L30 35 L40 35" 
              fill="none" 
              stroke="url(#cartGradient)" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round"/>
        <circle cx="45" cy="85" r="4" fill="url(#cartGradient)"/>
        <circle cx="75" cy="85" r="4" fill="url(#cartGradient)"/>
        <text x="60" y="65" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="16" fontWeight="bold" fill="url(#cartGradient)">$</text>
        
        <g transform="translate(75, 50)">
          <path d="M0 0 L0 12 L8 8 L6 6 L12 6 L6 0 Z" 
                fill="url(#cursorGradient)" 
                stroke="white" 
                strokeWidth="0.5"/>
          <g transform="translate(6, 6)">
            <circle cx="8" cy="-2" r="1.5" fill="#F59E0B" opacity="0.8"/>
            <circle cx="12" cy="2" r="1.5" fill="#F59E0B" opacity="0.8"/>
            <circle cx="6" cy="6" r="1.5" fill="#F59E0B" opacity="0.8"/>
            <circle cx="-2" cy="8" r="1.5" fill="#F59E0B" opacity="0.8"/>
            <circle cx="-6" cy="4" r="1.5" fill="#F59E0B" opacity="0.8"/>
            <circle cx="-4" cy="-4" r="1.5" fill="#F59E0B" opacity="0.8"/>
          </g>
        </g>
        
        <text x="60" y="105" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="url(#cartGradient)">$pendr</text>
      </svg>
    ),
    
    simple: (
      <svg width={size} height={size} viewBox="0 0 80 80" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="cartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#3B82F6'}} />
            <stop offset="100%" style={{stopColor:'#8B5CF6'}} />
          </linearGradient>
          <linearGradient id="cursorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#10B981'}} />
            <stop offset="100%" style={{stopColor:'#059669'}} />
          </linearGradient>
        </defs>
        
        <g transform="translate(20, 20)">
          <rect x="5" y="15" width="30" height="20" rx="3" fill="none" stroke="url(#cartGradient)" strokeWidth="2.5"/>
          <path d="M5 15 L2 12 L2 8 L8 8" fill="none" stroke="url(#cartGradient)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="12" cy="37" r="3" fill="url(#cartGradient)"/>
          <circle cx="28" cy="37" r="3" fill="url(#cartGradient)"/>
          <text x="20" y="28" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="12" fontWeight="bold" fill="url(#cartGradient)">$</text>
        </g>
        
        <g transform="translate(50, 15)">
          <path d="M0 0 L0 10 L6 7 L4.5 5.5 L9 5.5 L4.5 0 Z" fill="url(#cursorGradient)" stroke="white" strokeWidth="0.5"/>
          <g opacity="0.8">
            <circle cx="4.5" cy="5.5" r="1" fill="#F59E0B" opacity="0.6"/>
            <circle cx="8" cy="3" r="0.8" fill="#F59E0B" opacity="0.4"/>
            <circle cx="6" cy="8" r="0.6" fill="#F59E0B" opacity="0.5"/>
            <circle cx="2" cy="6" r="0.7" fill="#F59E0B" opacity="0.3"/>
          </g>
        </g>
        
        <g opacity="0.6">
          <path d="M15 10 L17 12 L15 14 L13 12 Z" fill="#3B82F6"/>
          <path d="M65 25 L67 27 L65 29 L63 27 Z" fill="#8B5CF6"/>
          <path d="M10 50 L12 52 L10 54 L8 52 Z" fill="#10B981"/>
        </g>
      </svg>
    ),
    
    icon: (
      <svg width={size} height={size} viewBox="0 0 60 60" fill="none" xmlns="http://www.w3.org/2000/svg" className={className}>
        <defs>
          <linearGradient id="cartGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#3B82F6'}} />
            <stop offset="100%" style={{stopColor:'#8B5CF6'}} />
          </linearGradient>
          <linearGradient id="cursorGradient" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" style={{stopColor:'#10B981'}} />
            <stop offset="100%" style={{stopColor:'#059669'}} />
          </linearGradient>
        </defs>
        
        <g transform="translate(15, 15)">
          <rect x="3" y="10" width="24" height="16" rx="2" fill="none" stroke="url(#cartGradient)" strokeWidth="2"/>
          <path d="M3 10 L1 8 L1 5 L6 5" fill="none" stroke="url(#cartGradient)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
          <circle cx="9" cy="28" r="2" fill="url(#cartGradient)"/>
          <circle cx="21" cy="28" r="2" fill="url(#cartGradient)"/>
          <text x="15" y="20" textAnchor="middle" fontFamily="Arial, sans-serif" fontSize="10" fontWeight="bold" fill="url(#cartGradient)">$</text>
        </g>
        
        <g transform="translate(35, 10)">
          <path d="M0 0 L0 8 L5 6 L3.5 4.5 L7 4.5 L3.5 0 Z" fill="url(#cursorGradient)" stroke="white" strokeWidth="0.5"/>
          <circle cx="3.5" cy="4.5" r="0.8" fill="#F59E0B" opacity="0.6"/>
        </g>
      </svg>
    )
  }

  return logoContent[variant]
}

export default Logo
