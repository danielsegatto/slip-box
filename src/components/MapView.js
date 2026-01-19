import React, { useEffect, useRef, useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';

const FONT_SIZE = 12;

// --- PHYSICS CONSTANTS (Adjusted for "Tighter Packing") ---
const REPULSION_FORCE = 150000; // Much lower to allow density
const SPRING_LENGTH = 180;      // Shorter connections
const FRICTION = 0.6;           // Keeps it stable
const WARMUP_ITERATIONS = 300;  // Ensure it settles before showing
const COLLISION_PADDING = 20;   // Minimum gap between cards

const MapView = ({ notes, onSelectNote, onClose, activeNoteId }) => {
  const [nodes, setNodes] = useState([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [viewDepth, setViewDepth] = useState(1);
  
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const svgRef = useRef(null);
  const [dimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // --- DIMENSION LOGIC ---
  const getNoteDimensions = (text) => {
    const minWidth = 180;
    const maxWidth = 340;
    const charCount = text.length;
    
    // Heuristic: Increase width as text gets longer
    let targetWidth = minWidth;
    if (charCount > 50) targetWidth = 240;
    if (charCount > 150) targetWidth = 300;
    if (charCount > 300) targetWidth = maxWidth;

    // Estimate Height
    const approxCharWidth = 7; 
    const charsPerLine = targetWidth / approxCharWidth;
    const lines = Math.ceil(charCount / charsPerLine);
    const lineHeight = FONT_SIZE * 1.4;
    const verticalPadding = 50; 
    const minHeight = 100;
    
    const targetHeight = Math.max(minHeight, (lines * lineHeight) + verticalPadding);
    
    return { width: targetWidth, height: targetHeight };
  };

  // --- THE PHYSICS ENGINE ---
  const runPhysicsStep = (currentNodes) => {
    // 1. Repulsion (Nodes push apart)
    for (let i = 0; i < currentNodes.length; i++) {
      for (let j = i + 1; j < currentNodes.length; j++) {
        const nodeA = currentNodes[i];
        const nodeB = currentNodes[j];
        
        const dx = nodeB.x - nodeA.x;
        const dy = nodeB.y - nodeA.y;
        const distSq = dx * dx + dy * dy || 1;
        const dist = Math.sqrt(distSq);

        // Repulsion is weaker now, allowing them to get closer
        const force = REPULSION_FORCE / distSq; 
        const fx = (dx / dist) * force;
        const fy = (dy / dist) * force;

        nodeA.vx -= fx;
        nodeA.vy -= fy;
        nodeB.vx += fx;
        nodeB.vy += fy;

        // 2. Strict Box Collision (Anti-Overlap)
        const overlapX = (nodeA.width / 2 + nodeB.width / 2 + COLLISION_PADDING) - Math.abs(dx);
        const overlapY = (nodeA.height / 2 + nodeB.height / 2 + COLLISION_PADDING) - Math.abs(dy);

        if (overlapX > 0 && overlapY > 0) {
          if (overlapX < overlapY) {
            const sign = dx > 0 ? -1 : 1;
            nodeA.vx += sign * overlapX * 0.2; 
            nodeB.vx -= sign * overlapX * 0.2; 
          } else {
            const sign = dy > 0 ? -1 : 1;
            nodeA.vx += sign * overlapY * 0.2;
            nodeB.vx -= sign * overlapY * 0.2;
          }
        }
      }
    }

    // 3. Attraction (Links pull together)
    currentNodes.forEach(node => {
        const neighbors = [...node.links.anterior, ...node.links.posterior];
        neighbors.forEach(targetId => {
            const target = currentNodes.find(n => n.id === targetId);
            if (target) {
              const dx = target.x - node.x;
              const dy = target.y - node.y;
              const dist = Math.sqrt(dx * dx + dy * dy) || 1;
              
              // Pulls them to the tighter SPRING_LENGTH
              const force = (dist - SPRING_LENGTH) * 0.005;
              const fx = (dx / dist) * force;
              const fy = (dy / dist) * force;

              node.vx += fx;
              node.vy += fy;
            }
        });

        // 4. Centering
        node.vx += (0 - node.x) * 0.0002;
        node.vy += (0 - node.y) * 0.0002;

        // 5. Apply Velocity & Friction
        node.x += node.vx;
        node.y += node.vy;
        node.vx *= FRICTION; 
        node.vy *= FRICTION;
    });

    return currentNodes;
  };

  // --- 1. Graph Calculation & WARM START ---
  useEffect(() => {
    if (!activeNoteId) return;

    // A. BFS to find visible nodes
    const getVisibleGraph = () => {
        const visited = new Set([activeNoteId]);
        let currentLayer = [activeNoteId];

        for (let d = 0; d < viewDepth; d++) {
            const nextLayer = [];
            currentLayer.forEach(id => {
                const note = notes.find(n => n.id === id);
                if (!note) return;
                [...note.links.anterior, ...note.links.posterior].forEach(linkId => {
                    if (!visited.has(linkId)) {
                        visited.add(linkId);
                        nextLayer.push(linkId);
                    }
                });
            });
            currentLayer = nextLayer;
        }
        return visited;
    };

    const visibleIds = getVisibleGraph();
    
    // B. Construct Nodes State
    setNodes(prevNodes => {
        const prevNodeMap = new Map(prevNodes.map(n => [n.id, n]));
        const visibleNotes = notes.filter(n => visibleIds.has(n.id));
        
        let newNodesList = visibleNotes.map(note => {
            // Recalculate dimensions in case content changed
            const dims = getNoteDimensions(note.content);

            if (prevNodeMap.has(note.id)) {
                const prev = prevNodeMap.get(note.id);
                return { ...prev, ...dims };
            }

            // Smart Spawn: Start closer (150px) to minimize travel time
            let spawnX = 0;
            let spawnY = 0;
            
            const neighborId = [...note.links.anterior, ...note.links.posterior]
                .find(id => prevNodeMap.has(id));
            
            if (neighborId) {
                const neighbor = prevNodeMap.get(neighborId);
                const angle = Math.random() * Math.PI * 2;
                const radius = 150; // Closer spawn
                spawnX = neighbor.x + Math.cos(angle) * radius;
                spawnY = neighbor.y + Math.sin(angle) * radius;
            }

            return {
                ...note,
                x: spawnX,
                y: spawnY,
                vx: 0,
                vy: 0,
                ...dims
            };
        });

        // C. WARM-UP (Silent Simulation)
        for (let k = 0; k < WARMUP_ITERATIONS; k++) {
            runPhysicsStep(newNodesList);
        }

        return newNodesList;
    });

  }, [notes, activeNoteId, viewDepth]); 

  // --- 2. Live Physics Loop ---
  useEffect(() => {
    let animationFrameId;
    const tick = () => {
      setNodes(prev => {
        const next = prev.map(n => ({ ...n })); 
        return runPhysicsStep(next);
      });
      animationFrameId = requestAnimationFrame(tick);
    };
    tick();
    return () => cancelAnimationFrame(animationFrameId);
  }, []);

  // --- 3. Interaction Logic ---
  const handlePointerDown = (e) => {
    if (e.target.tagName === 'svg') {
        setIsDraggingCanvas(true);
        setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
    }
  };

  const handlePointerMove = (e) => {
    if (isDraggingCanvas) {
      setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y });
    }
  };

  const handlePointerUp = () => setIsDraggingCanvas(false);

  return (
    <div className="fixed inset-0 z-50 bg-[#fafafa]">
      
      {/* Controls */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 z-50">
        <button onClick={onClose} className="p-3 bg-white shadow-sm border border-gray-200 rounded-full text-gray-500">
          <X size={20} />
        </button>
        <div className="h-4"></div>
        <button 
            onClick={() => setViewDepth(d => d + 1)} 
            className="p-3 bg-white shadow-sm border border-gray-200 rounded-full text-gray-500"
        >
          <Plus size={20} />
        </button>
        <button 
            onClick={() => setViewDepth(d => Math.max(1, d - 1))} 
            disabled={viewDepth <= 1}
            className={`p-3 bg-white shadow-sm border border-gray-200 rounded-full text-gray-500 ${viewDepth <= 1 ? 'opacity-50' : ''}`}
        >
          <Minus size={20} />
        </button>
      </div>

      {/* Canvas */}
      <svg 
        ref={svgRef}
        width="100%" 
        height="100%" 
        className="cursor-move touch-none"
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerLeave={handlePointerUp}
      >
        <g transform={`translate(${pan.x + dimensions.width/2}, ${pan.y + dimensions.height/2})`}>
            
            {/* Layer 1: Connections */}
            {nodes.map(node => (
            node.links.anterior.map(targetId => {
                const target = nodes.find(n => n.id === targetId);
                if (!target) return null;
                return (
                    <line 
                        key={`${node.id}-${target.id}`}
                        x1={node.x} y1={node.y}
                        x2={target.x} y2={target.y}
                        stroke="#e5e5e5" 
                        strokeWidth="2"
                    />
                );
            })
            ))}

            {/* Layer 2: Cards (Index Cards) */}
            {nodes.map(node => {
            const isActive = node.id === activeNoteId;
            return (
                <foreignObject
                    key={node.id}
                    x={node.x - node.width / 2}
                    y={node.y - node.height / 2}
                    width={node.width}
                    height={node.height}
                    className="overflow-visible" 
                >
                    <div 
                        onClick={(e) => {
                            e.stopPropagation();
                            onSelectNote(node.id);
                        }}
                        className={`
                            h-full w-full p-5 bg-white border flex flex-col select-none
                            ${isActive ? 'border-black shadow-xl z-20' : 'border-gray-200 shadow-sm z-10'}
                        `}
                    >
                        {node.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                                {node.tags.map(t => (
                                    <span key={t} className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                                        #{t}
                                    </span>
                                ))}
                            </div>
                        )}
                        
                        <p className="text-xs text-[#1a1a1a] leading-relaxed whitespace-pre-wrap font-mono">
                            {node.content}
                        </p>

                        <div className="mt-auto pt-3 text-[9px] text-gray-300 font-mono text-right">
                            {new Date(node.timestamp).toLocaleDateString()}
                        </div>
                    </div>
                </foreignObject>
            );
            })}
        </g>
      </svg>
      
      {/* Legend */}
      <div className="absolute bottom-6 left-0 right-0 flex justify-center pointer-events-none">
        <div className="bg-white/90 px-4 py-1 rounded-full border border-gray-100 shadow-sm backdrop-blur-sm">
            <p className="text-[10px] text-gray-400 uppercase tracking-widest font-medium">
                Depth: {viewDepth} &bull; Visible: {nodes.length}
            </p>
        </div>
      </div>
    </div>
  );
};

export default MapView;