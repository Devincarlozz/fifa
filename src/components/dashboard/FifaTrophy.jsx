import React from 'react';

export default function FifaTrophy({ width = '170px', height = '230px', style = {} }) {
  return (
    <div 
      className="w-full h-full flex items-center justify-center relative select-none"
      style={{
        '--logo-w': typeof width === 'number' ? `${width}px` : width,
        '--logo-h': typeof height === 'number' ? `${height}px` : height,
        ...style
      }}
    >
      <style>{`
        @keyframes floatTrophy {
          0%, 100% { transform: translateY(0px); }
          50% { transform: translateY(calc(var(--logo-h) * -0.025)); }
        }
        @keyframes goldPulse {
          0%, 100% { filter: drop-shadow(0 0 calc(var(--logo-w) * 0.08) rgba(245,197,24,0.35)) drop-shadow(0 0 calc(var(--logo-w) * 0.02) rgba(245,197,24,0.15)); }
          50% { filter: drop-shadow(0 0 calc(var(--logo-w) * 0.16) rgba(245,197,24,0.55)) drop-shadow(0 0 calc(var(--logo-w) * 0.05) rgba(245,197,24,0.25)); }
        }
        .logo-container {
          position: relative;
          width: var(--logo-w);
          height: var(--logo-h);
          background: #EAEAEA;
          border-radius: calc(var(--logo-w) * 0.12);
          box-shadow: 0 calc(var(--logo-h) * 0.04) calc(var(--logo-h) * 0.12) rgba(0,0,0,0.55), inset 0 0 calc(var(--logo-w) * 0.1) rgba(255,255,255,0.25);
          overflow: hidden;
          display: flex;
          flex-direction: column;
          align-items: center;
          justify-content: space-between;
          padding: calc(var(--logo-h) * 0.06) 0 calc(var(--logo-h) * 0.04) 0;
          transition: transform 0.3s ease, box-shadow 0.3s ease;
          border: 1px solid rgba(255,255,255,0.08);
          box-sizing: border-box;
        }
        .logo-container:hover {
          transform: translateY(calc(var(--logo-h) * -0.02)) scale(1.04);
          box-shadow: 0 calc(var(--logo-h) * 0.06) calc(var(--logo-h) * 0.15) rgba(245,197,24,0.25), 0 calc(var(--logo-h) * 0.02) calc(var(--logo-h) * 0.06) rgba(0,0,0,0.4);
        }
        .numbers-bg {
          position: absolute;
          inset: 0;
          display: flex;
          flex-direction: column;
          justify-content: space-between;
          font-family: 'Outfit', 'Arial Black', sans-serif;
          font-weight: 900;
          line-height: 0.85;
          letter-spacing: -0.05em;
          text-align: center;
          pointer-events: none;
          color: #000000;
          user-select: none;
          padding: calc(var(--logo-h) * 0.04) 0;
          box-sizing: border-box;
        }
        .number-2 {
          font-size: calc(var(--logo-h) * 0.65);
          transform: translateY(calc(var(--logo-h) * -0.04));
        }
        .number-6 {
          font-size: calc(var(--logo-h) * 0.65);
          transform: translateY(calc(var(--logo-h) * 0.04));
          position: relative;
        }
        /* Overlaid white cuts */
        .white-cut-1 {
          position: absolute;
          top: calc(var(--logo-h) * 0.28);
          left: 0;
          width: 70%;
          height: calc(var(--logo-h) * 0.06);
          background: #EAEAEA;
        }
        .white-cut-2 {
          position: absolute;
          top: calc(var(--logo-h) * 0.48);
          right: 0;
          width: 70%;
          height: calc(var(--logo-h) * 0.06);
          background: #EAEAEA;
        }
        .white-cut-3 {
          position: absolute;
          top: calc(var(--logo-h) * 0.70);
          left: 0;
          width: 65%;
          height: calc(var(--logo-h) * 0.06);
          background: #EAEAEA;
        }
        .trophy-overlay-img {
          position: relative;
          z-index: 10;
          height: calc(var(--logo-h) * 0.76);
          width: auto;
          object-fit: contain;
          margin-top: calc(var(--logo-h) * 0.02);
          animation: floatTrophy 4s ease-in-out infinite, goldPulse 4s ease-in-out infinite;
        }
        .fifa-brand-text {
          position: relative;
          z-index: 20;
          font-family: 'Outfit', 'Inter', sans-serif;
          font-weight: 900;
          font-size: calc(var(--logo-w) * 0.15);
          color: #FFFFFF;
          letter-spacing: 0.05em;
          text-transform: uppercase;
          line-height: 1;
          margin-top: calc(var(--logo-h) * -0.13);
          pointer-events: none;
          text-shadow: 0 2px 4px rgba(0,0,0,0.5);
        }
        .logo-tm {
          position: absolute;
          bottom: calc(var(--logo-h) * 0.02);
          right: calc(var(--logo-w) * 0.04);
          font-family: 'Inter', sans-serif;
          font-size: calc(var(--logo-w) * 0.035);
          font-weight: 700;
          color: #555555;
        }
      `}</style>
      
      <div className="logo-container">
        {/* Background numbers 2 and 6 with cutouts */}
        <div className="numbers-bg">
          <div className="number-2">2</div>
          <div className="number-6">6</div>
          
          <div className="white-cut-1" />
          <div className="white-cut-2" />
          <div className="white-cut-3" />
        </div>
        
        {/* Overlaid Trophy */}
        <img
          src="/trophy.png"
          alt="FIFA World Cup Trophy"
          className="trophy-overlay-img"
        />
        
        {/* FIFA Text at the bottom */}
        <div className="fifa-brand-text">FIFA</div>
        
        {/* TM Label */}
        <div className="logo-tm">TM</div>
      </div>
    </div>
  );
}
