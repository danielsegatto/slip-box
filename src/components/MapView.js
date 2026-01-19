import React, { useEffect, useRef, useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';

const NODE_WIDTH = 240; // Fixed width for the "Index Cards"
const FONT_SIZE = 12;
const CHARS_PER_LINE = 28;

const MapView = ({ notes, onSelectNote, onClose, activeNoteId }) => {
  const [nodes, setNodes] = useState([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [viewDepth, setViewDepth] = useState(1); // 1 = Direct neighbors, 2 = Neighbors of neighbors
  
  // Dragging State
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const svgRef = useRef(null);
  const [dimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Helper: Calculate card height based on text content
  const getNoteHeight = (text) => {
    // Basic estimation: lines + padding + header/footer space
    const lines = Math.ceil(text.length / CHARS_PER_LINE);
    const padding = 40; 
    const minHeight = 120;
    return Math.max(minHeight, (lines * FONT_SIZE * 1.4) + padding); 
  };

  // 1. Graph Calculation (Breadth-First Search for Depth)
  useEffect(() => {
    if (!activeNoteId) return;

    const getVisibleGraph = () => {
        const visited = new Set([activeNoteId]);
        let currentLayer = [activeNoteId];

        for (let d = 0; d < viewDepth; d++) {
            const nextLayer = [];
            currentLayer.forEach(id => {
                const note = notes.find(n => n.id === id);
                if (!note) return;

                // Check Anterior
                note.links.anterior.forEach(linkId => {
                    if (!visited.has(linkId)) {
                        visited.add(linkId);
                        nextLayer.push(linkId);
                    }
                });

                // Check Posterior
                note.links.posterior.forEach(linkId => {
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

    setNodes(prevNodes => {
        // Persist positions of existing nodes to prevent "jumping"
        const prevNodeMap = new Map(prevNodes.map(n => [n.id, n]));
        const visibleNotes = notes.filter(n => visibleIds.has(n.id));

        return visibleNotes.map(note => {
            if (prevNodeMap.has(note.id)) {
                return prevNodeMap.get(note.id);
            }

            // Smart Spawning: Place new nodes near their "parent"
            let spawnX = 0;
            let spawnY = 0;
            
            // Find a connected node that is already visible
            const neighborId = [...note.links.anterior, ...note.links.posterior]
                .find(id => prevNodeMap.has(id));
            
            if (neighborId) {
                const neighbor = prevNodeMap.get(neighborId);
                spawnX = neighbor.x + (Math.random() - 0.5) * 100;
                spawnY = neighbor.y + (Math.random() - 0.5) * 100;
            }

            return {
                ...note,
                x: spawnX,
                y: spawnY,
                vx: 0,
                vy: 0,
                width: NODE_WIDTH,
                height: getNoteHeight(note.content)
            };
        });
    });

  }, [notes, activeNoteId, viewDepth]); // Re-run when depth changes

  // 2. Physics Engine (Rectangular Collision)
  useEffect(() => {
    let animationFrameId;

    const runSimulation = () => {
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(n => ({ ...n }));

        // A. Repulsion (Nodes push each other away)
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const nodeA = newNodes[i];
            const nodeB = newNodes[j];
            
            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const distSq = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(distSq);

            // General gravity repulsion
            const force = 800000 / distSq; 
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            nodeA.vx -= fx;
            nodeA.vy -= fy;
            nodeB.vx += fx;
            nodeB.vy += fy;

            // B. STRICT BOX COLLISION (Prevent Overlap)
            const padding = 40; // Extra space between cards
            const overlapX = (nodeA.width / 2 + nodeB.width / 2 + padding) - Math.abs(dx);
            const overlapY = (nodeA.height / 2 + nodeB.height / 2 + padding) - Math.abs(dy);

            if (overlapX > 0 && overlapY > 0) {
              // Resolve along the shallowest axis
              if (overlapX < overlapY) {
                const sign = dx > 0 ? -1 : 1;
                nodeA.vx += sign * overlapX * 0.1; 
                nodeB.vx -= sign * overlapX * 0.1; 
              } else {
                const sign = dy > 0 ? -1 : 1;
                nodeA.vx += sign * overlapY * 0.1;
                nodeB.vx -= sign * overlapY * 0.1;
              }
            }
          }
        }

        // C. Link Attraction (Pull connected notes together)
        newNodes.forEach(node => {
           const neighbors = [...node.links.anterior, ...node.links.posterior];
           neighbors.forEach(targetId => {
               const target = newNodes.find(n => n.id === targetId);
               if (target) {
                 const dx = target.x - node.x;
                 const dy = target.y - node.y;
                 const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                 
                 const targetDist = 400; // Optimal link length
                 const force = (dist - targetDist) * 0.005;
                 
                 const fx = (dx / dist) * force;
                 const fy = (dy / dist) * force;

                 node.vx += fx;
                 node.vy += fy;
               }
           });
        });

        // D. Centering Force
        newNodes.forEach(node => {
          node.vx += (0 - node.x) * 0.0002;
          node.vy += (0 - node.y) * 0.0002;

          node.x += node.vx;
          node.y += node.vy;
          node.vx *= 0.8; // High friction for stability
          node.vy *= 0.8;
        });

        return newNodes;
      });
      animationFrameId = requestAnimationFrame(runSimulation);
    };

    runSimulation();
    return () => cancelAnimationFrame(animationFrameId);
  }, []); 

  // 3. Canvas Dragging
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
      
      {/* --- Controls UI --- */}
      <div className="absolute top-4 right-4 flex flex-col gap-3 z-50">
        <button onClick={onClose} className="p-3 bg-white shadow-sm border border-gray-200 rounded-full text-gray-500">
          <X size={20} />
        </button>
        <div className="h-4"></div> {/* Spacer */}
        <button 
            onClick={() => setViewDepth(d => d + 1)} 
            className="p-3 bg-white shadow-sm border border-gray-200 rounded-full text-gray-500"
            title="Increase Connections Depth"
        >
          <Plus size={20} />
        </button>
        <button 
            onClick={() => setViewDepth(d => Math.max(1, d - 1))} 
            disabled={viewDepth <= 1}
            className={`p-3 bg-white shadow-sm border border-gray-200 rounded-full text-gray-500 ${viewDepth <= 1 ? 'opacity-50' : ''}`}
            title="Decrease Connections Depth"
        >
          <Minus size={20} />
        </button>
      </div>

      {/* --- The Canvas --- */}
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

            {/* Layer 2: Cards */}
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
                            ${isActive ? 'border-black shadow-xl z-20' : 'border-gray-200 shadow-sm hover:border-gray-300 z-10'}
                        `}
                    >
                        {/* Tags */}
                        {node.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-3">
                                {node.tags.map(t => (
                                    <span key={t} className="text-[10px] uppercase tracking-wider text-gray-400 font-medium">
                                        #{t}
                                    </span>
                                ))}
                            </div>
                        )}
                        
                        {/* Content */}
                        <p className="text-xs text-[#1a1a1a] leading-relaxed whitespace-pre-wrap font-mono">
                            {node.content}
                        </p>

                        {/* Footer */}
                        <div className="mt-auto pt-3 text-[9px] text-gray-300 font-mono text-right">
                            {new Date(node.timestamp).toLocaleDateString()}
                        </div>
                    </div>
                </foreignObject>
            );
            })}
        </g>
      </svg>
      
      {/* Status Bar */}
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