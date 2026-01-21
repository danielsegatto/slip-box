import React from 'react';
import { X, Plus, Minus } from 'lucide-react';

const MapControls = ({ onClose, onIncreaseDepth, onDecreaseDepth, canIncrease, canDecrease }) => {
  return (
    <div className={STYLES.container}>
      <button onClick={onClose} className={STYLES.closeButton}>
        <X size={20} />
      </button>
      
      <div className={STYLES.spacer}></div>
      
      <button 
          onClick={onIncreaseDepth}
          disabled={!canIncrease}
          className={`${STYLES.zoomButton} ${!canIncrease ? STYLES.disabled : STYLES.active}`}
      >
        <Plus size={20} />
      </button>
      
      <button 
          onClick={onDecreaseDepth} 
          disabled={!canDecrease}
          className={`${STYLES.zoomButton} ${!canDecrease ? STYLES.disabled : STYLES.active}`}
      >
        <Minus size={20} />
      </button>
    </div>
  );
};

const STYLES = {
  container: "absolute top-4 right-4 flex flex-col gap-2 z-50 pointer-events-auto",
  closeButton: "p-2 bg-white border border-gray-200 shadow-sm rounded-full text-gray-500 hover:text-black transition-colors",
  spacer: "h-4",
  zoomButton: "p-2 bg-white border border-gray-200 shadow-sm rounded-full text-gray-500 transition-colors",
  active: "hover:text-black",
  disabled: "opacity-50 cursor-not-allowed"
};

export default MapControls;