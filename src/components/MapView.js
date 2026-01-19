import React, { useEffect, useRef, useState } from 'react';
import { X, Plus, Minus } from 'lucide-react';

const NODE_WIDTH = 200;
const FONT_SIZE = 12;
const CHARS_PER_LINE = 25;

const MapView = ({ notes, onSelectNote, onClose, activeNoteId }) => {
  // State for Physics and View
  const [nodes, setNodes] = useState([]);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [viewDepth, setViewDepth] = useState(1); // Default to 1st degree connections
  
  // Dragging State
  const [isDraggingCanvas, setIsDraggingCanvas] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  const svgRef = useRef(null);
  const [dimensions] = useState({ width: window.innerWidth, height: window.innerHeight });

  // Helper: Estimate Note Height
  const getNoteHeight = (text) => {
    const lines = Math.ceil(text.length / CHARS_PER_LINE);
    const padding = 32; 
    return Math.max(100, (lines * FONT_SIZE * 1.5) + padding); 
  };

  // 1. Graph Calculation (BFS for Depth)
  useEffect(() => {
    if (!activeNoteId) return;

    // Breadth-First Search to find visible nodes
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
        // Create a map of existing nodes for position persistence
        const prevNodeMap = new Map(prevNodes.map(n => [n.id, n]));
        
        // Filter full notes list by visible IDs
        const visibleNotes = notes.filter(n => visibleIds.has(n.id));

        return visibleNotes.map(note => {
            // If node already exists, keep its physics state
            if (prevNodeMap.has(note.id)) {
                return prevNodeMap.get(note.id);
            }

            // If it's a NEW node, we need to spawn it intelligently.
            // Find a neighbor that is already in the graph to spawn near.
            let spawnX = Math.random() * dimensions.width;
            let spawnY = Math.random() * dimensions.height;
            
            // Try to find a parent/neighbor in the previous set
            const neighborId = [...note.links.anterior, ...note.links.posterior]
                .find(id => prevNodeMap.has(id));
            
            if (neighborId) {
                const neighbor = prevNodeMap.get(neighborId);
                // Spawn slightly offset from the neighbor
                spawnX = neighbor.x + (Math.random() - 0.5) * 100;
                spawnY = neighbor.y + (Math.random() - 0.5) * 100;
            } else if (note.id === activeNoteId) {
                // Center the active note
                spawnX = 0;
                spawnY = 0;
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

  }, [notes, activeNoteId, viewDepth, dimensions]); // Recalculate when depth changes

  // 2. Physics Engine (Identical to previous, but runs on `nodes` state)
  useEffect(() => {
    let animationFrameId;

    const runSimulation = () => {
      setNodes(prevNodes => {
        const newNodes = prevNodes.map(n => ({ ...n }));

        // Repulsion (All nodes push apart)
        for (let i = 0; i < newNodes.length; i++) {
          for (let j = i + 1; j < newNodes.length; j++) {
            const nodeA = newNodes[i];
            const nodeB = newNodes[j];
            
            const dx = nodeB.x - nodeA.x;
            const dy = nodeB.y - nodeA.y;
            const distSq = dx * dx + dy * dy || 1;
            const dist = Math.sqrt(distSq);

            const force = 600000 / distSq; 
            const fx = (dx / dist) * force;
            const fy = (dy / dist) * force;

            nodeA.vx -= fx;
            nodeA.vy -= fy;
            nodeB.vx += fx;
            nodeB.vy += fy;

            // Box Collision
            const overlapX = (nodeA.width / 2 + nodeB.width / 2 + 30) - Math.abs(dx);
            const overlapY = (nodeA.height / 2 + nodeB.height / 2 + 30) - Math.abs(dy);

            if (overlapX > 0 && overlapY > 0) {
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

        // Attraction (Only for visible links)
        newNodes.forEach(node => {
           // We must check if the target exists in the CURRENT visible set
           const neighbors = [...node.links.anterior, ...node.links.posterior];
           neighbors.forEach(targetId => {
               const target = newNodes.find(n => n.id === targetId);
               if (target) {
                 const dx = target.x - node.x;
                 const dy = target.y - node.y;
                 const dist = Math.sqrt(dx * dx + dy * dy) || 1;
                 
                 const targetDist = 350; 
                 const force = (dist - targetDist) * 0.003;
                 
                 const fx = (dx / dist) * force;
                 const fy = (dy / dist) * force;

                 node.vx += fx;
                 node.vy += fy;
               }
           });
        });

        // Center Gravity
        newNodes.forEach(node => {
          node.vx += (0 - node.x) * 0.0002;
          node.vy += (0 - node.y) * 0.0002;

          node.x += node.vx;
          node.y += node.vy;
          node.vx *= 0.85;
          node.vy *= 0.85;
        });

        return newNodes;
      });
      animationFrameId = requestAnimationFrame(runSimulation);
    };

    runSimulation();
    return () => cancelAnimationFrame(animationFrameId);
  }, [dimensions]); // Physics is independent of depth logic, just acts on `nodes`

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
      {/* Controls: Close, Zoom In, Zoom Out */}
      <div className="absolute top-4 right-4 flex flex-col gap-2 z-50">
        <button onClick={onClose} className="p-2 bg-white shadow-sm border border-gray-100 rounded-full">
          <X size={24} className="text-gray-500" />
        </button>
        <div className="h-4"></div>
        <button 
            onClick={() => setViewDepth(d => d + 1)} 
            className="p-2 bg-white shadow-sm border border-gray-100 rounded-full"
            title="Expand Connections"
        >
          <Plus size={24} className="text-gray-500" />
        </button>
        <button 
            onClick={() => setViewDepth(d => Math.max(1, d - 1))} 
            disabled={viewDepth <= 1}
            className={`p-2 bg-white shadow-sm border border-gray-100 rounded-full ${viewDepth <= 1 ? 'opacity-50' : ''}`}
            title="Collapse Connections"
        >
          <Minus size={24} className="text-gray-500" />
        </button>
      </div>

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
            
            {/* Draw Connections */}
            {nodes.map(node => (
            node.links.anterior.map(targetId => {
                const target = nodes.find(n => n.id === targetId);
                // Only draw link if BOTH nodes are visible
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

            {/* Draw Nodes */}
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
                            h-full w-full p-4 bg-white border cursor-pointer select-none
                            flex flex-col
                            ${isActive ? 'border-black shadow-lg z-10' : 'border-gray-200 shadow-sm'}
                        `}
                    >
                        {node.tags.length > 0 && (
                            <div className="flex flex-wrap gap-1 mb-2">
                                {node.tags.map(t => (
                                    <span key={t} className="text-[10px] text-gray-400">#{t}</span>
                                ))}
                            </div>
                        )}
                        
                        <p className="text-xs text-[#1a1a1a] leading-relaxed whitespace-pre-wrap">
                            {node.content}
                        </p>

                        <div className="mt-auto pt-2 text-[8px] text-gray-300 font-mono">
                            {new Date(node.timestamp).toLocaleDateString()}
                        </div>
                    </div>
                </foreignObject>
            );
            })}
        </g>
      </svg>
      
      <div className="absolute bottom-8 left-0 right-0 text-center pointer-events-none">
        <p className="text-xs text-gray-300 uppercase tracking-widest bg-white/50 inline-block px-2">
            Depth: {viewDepth}
        </p>
      </div>
    </div>
  );
};

export default MapView;