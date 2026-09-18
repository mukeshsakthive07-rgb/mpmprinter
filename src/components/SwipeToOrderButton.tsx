import React, { useState, useRef, useEffect } from 'react';
import { Rocket, Check, Loader2 } from 'lucide-react';

interface SwipeToOrderProps {
  onConfirm: () => void;
  disabled?: boolean;
  isLoading?: boolean;
  onDisabledAttempt?: () => void;
}

export const SwipeToOrderButton: React.FC<SwipeToOrderProps> = ({
  onConfirm,
  disabled = false,
  isLoading = false,
  onDisabledAttempt,
}) => {
  const [dragX, setDragX] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const wasLoading = useRef(isLoading);

  useEffect(() => {
    // If it was loading and now it's not, and the order wasn't completed successfully 
    // (the parent didn't unmount this component), reset the slider so the user can try again.
    if (wasLoading.current && !isLoading) {
      setDragX(0);
      setIsDragging(false);
      setIsCompleted(false);
    }
    wasLoading.current = isLoading;
  }, [isLoading]);

  const trackRef = useRef<HTMLDivElement>(null);
  const startClientX = useRef<number>(0);

  const getMaxDrag = () => {
    if (!trackRef.current) return 200;
    return Math.max(0, trackRef.current.clientWidth - 56);
  };

  const handlePointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (isLoading || isCompleted) return;
    if (disabled) {
      if (onDisabledAttempt) onDisabledAttempt();
      return;
    }

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch (err) {}
    setIsDragging(true);
    startClientX.current = e.clientX - dragX;
  };

  const handlePointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    const maxDrag = getMaxDrag();
    let newX = e.clientX - startClientX.current;
    if (newX < 0) newX = 0;
    if (newX > maxDrag) newX = maxDrag;
    setDragX(newX);

    if (newX >= maxDrag * 0.88) {
      setIsDragging(false);
      setDragX(maxDrag);
      setIsCompleted(true);
      try {
        e.currentTarget.releasePointerCapture(e.pointerId);
      } catch (err) {}
      onConfirm();
    }
  };

  const handlePointerUp = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!isDragging) return;
    setIsDragging(false);
    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch (err) {}
    if (dragX < getMaxDrag() * 0.88) {
      setDragX(0);
    }
  };

  return (
    <div
      ref={trackRef}
      className={`relative h-14 w-full rounded-2xl p-1.5 flex items-center select-none overflow-hidden transition-all duration-300 ${
        disabled
          ? 'bg-slate-800/40 border border-slate-700/50 opacity-60 cursor-not-allowed'
          : 'bg-slate-900/60 border border-cyan-500/40 shadow-[0_0_25px_rgba(0,240,255,0.15)]'
      }`}
    >
      {/* Sliding Progress Fill */}
      <div
        className="absolute left-0 top-0 bottom-0 bg-gradient-to-r from-blue-600/60 to-cyan-500/60 rounded-2xl pointer-events-none transition-all"
        style={{ width: `${dragX + 54}px`, transition: isDragging ? 'none' : 'width 0.25s ease-out' }}
      />

      {/* Shimmering Center Text */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
        <span className="text-xs font-black tracking-widest text-slate-300 uppercase flex items-center gap-1.5 drop-shadow">
          {isLoading ? (
            'Processing Print Order...'
          ) : isCompleted ? (
            'Order Confirmed! 🚀'
          ) : (
            <>
              <span>Swipe to Place Order</span>
              <span className="text-cyan-400 animate-pulse font-mono">❯❯❯</span>
            </>
          )}
        </span>
      </div>

      {/* Draggable Knob */}
      <div
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        style={{
          transform: `translateX(${dragX}px)`,
          transition: isDragging ? 'none' : 'transform 0.25s cubic-bezier(0.25, 1, 0.5, 1)',
          touchAction: 'none' // Crucial for preventing scrolling while swiping on mobile
        }}
        className={`relative z-10 w-11 h-11 rounded-xl bg-gradient-to-r from-cyan-400 to-blue-600 flex items-center justify-center text-white shadow-lg shadow-cyan-500/30 cursor-grab active:cursor-grabbing transition-shadow ${
          isDragging ? 'scale-105 shadow-cyan-400/50' : ''
        }`}
      >
        {isLoading ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : isCompleted ? (
          <Check className="w-5 h-5" />
        ) : (
          <Rocket className="w-5 h-5" />
        )}
      </div>
    </div>
  );
};
