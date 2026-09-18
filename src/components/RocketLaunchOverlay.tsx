import React, { useEffect, useState } from 'react';

export const RocketLaunchOverlay: React.FC<{ onComplete: () => void }> = ({ onComplete }) => {
  const [launched, setLaunched] = useState(false);

  useEffect(() => {
    // Start CSS transition shortly after mount
    const timer = setTimeout(() => {
      setLaunched(true);
    }, 50);

    const completeTimer = setTimeout(() => {
      onComplete();
    }, 2200);

    return () => {
      clearTimeout(timer);
      clearTimeout(completeTimer);
    };
  }, [onComplete]);

  return (
    <div className="fixed inset-0 z-[99999] pointer-events-none bg-slate-950/70 backdrop-blur-md flex flex-col items-center justify-center overflow-hidden">
      <div className="absolute top-1/4 text-center z-10">
        <h2 className="text-3xl font-black text-white tracking-wider drop-shadow-md">
          🚀 Order Confirmed! Launching print job...
        </h2>
      </div>

      {/* Rocket Container */}
      <div 
        className="absolute left-1/2 -translate-x-1/2 flex flex-col items-center justify-center"
        style={{
          transform: `translate(-50%, ${launched ? '-120vh' : '100vh'})`,
          transition: 'transform 2s cubic-bezier(0.5, 0, 0.2, 1)',
        }}
      >
        {/* Rocket Emoji */}
        <div className="text-7xl drop-shadow-[0_0_20px_rgba(255,255,255,0.5)] z-20">🚀</div>
        
        {/* Smoke Puffs */}
        <div className="relative w-32 h-32 -mt-4 flex items-center justify-center">
          <div className="absolute w-16 h-16 rounded-full bg-white/70 blur-md animate-ping [animation-duration:1s]"></div>
          <div className="absolute w-20 h-20 rounded-full bg-white/50 blur-lg animate-ping [animation-duration:1.2s] [animation-delay:0.2s]"></div>
          <div className="absolute w-12 h-12 rounded-full bg-white/90 blur-sm animate-ping [animation-duration:0.8s] [animation-delay:0.4s]"></div>
          
          {/* Flame Core */}
          <div className="absolute w-8 h-12 rounded-full bg-gradient-to-t from-yellow-500 to-orange-600 blur-sm animate-pulse"></div>
        </div>
      </div>
    </div>
  );
};
