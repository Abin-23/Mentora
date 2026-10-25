import React, { useState, useEffect, useMemo } from 'react';

export interface GraphNode {
  id: number;
  title: string;
  sequenceNumber: number;
  difficulty: string;
  proficiency: string;
  score: number | null;
  status: 'MASTERED' | 'PROFICIENT' | 'DEVELOPING' | 'READY' | 'LOCKED';
  prerequisites: number[];
  unlocks: number[];
}

export interface GraphLink {
  source: number;
  target: number;
  type: string;
}

export interface PrerequisiteGraphData {
  courseId: number;
  nodes: GraphNode[];
  links: GraphLink[];
  stats: {
    total: number;
    mastered: number;
    proficient: number;
    developing: number;
    ready: number;
    locked: number;
  };
}

interface PrerequisiteGraphModalProps {
  courseId: number;
  studentId: number;
  activeTopicId: number | null;
  token: string | null;
  onClose: () => void;
  onSelectTopic: (topicId: number) => void;
}

export const PrerequisiteGraphModal: React.FC<PrerequisiteGraphModalProps> = ({
  courseId,
  studentId,
  activeTopicId,
  token,
  onClose,
  onSelectTopic,
}) => {
  const [data, setData] = useState<PrerequisiteGraphData | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedNodeId, setSelectedNodeId] = useState<number | null>(activeTopicId);
  const [filter, setFilter] = useState<'ALL' | 'READY' | 'MASTERED' | 'LOCKED'>('ALL');
  const [zoom, setZoom] = useState<number>(1);
  const [pan, setPan] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState<boolean>(false);
  const [dragStart, setDragStart] = useState<{ x: number; y: number }>({ x: 0, y: 0 });

  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000/api';

  useEffect(() => {
    if (!token || !courseId || !studentId) return;
    setLoading(true);
    fetch(`${API_URL}/adaptive-learning/students/${studentId}/courses/${courseId}/prerequisites-graph`, {
      headers: { Authorization: `Bearer ${token}` }
    })
      .then((res) => {
        if (!res.ok) throw new Error('Failed to load prerequisite graph');
        return res.json();
      })
      .then((resData: PrerequisiteGraphData) => {
        setData(resData);
        if (activeTopicId && resData.nodes.some(n => n.id === activeTopicId)) {
          setSelectedNodeId(activeTopicId);
        } else if (resData.nodes.length > 0) {
          setSelectedNodeId(resData.nodes[0].id);
        }
      })
      .catch((err) => {
        console.error('Error fetching prerequisite graph:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, [API_URL, courseId, studentId, token, activeTopicId]);

  // Handle ESC key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onClose]);

  // Topological / Level-based Graph Layout Calculation
  const layout = useMemo(() => {
    if (!data || !data.nodes.length) return { nodePositions: new Map(), width: 1000, height: 600 };

    const nodes = data.nodes;
    const links = data.links;

    // 1. Calculate in-degrees and depths (levels)
    const depths = new Map<number, number>();
    const inDegree = new Map<number, number>();
    nodes.forEach((n) => {
      inDegree.set(n.id, n.prerequisites.length);
      depths.set(n.id, 0);
    });

    // Topological order calculation
    let queue: number[] = nodes.filter((n) => n.prerequisites.length === 0).map((n) => n.id);
    if (queue.length === 0) queue = [nodes[0].id];

    const visited = new Set<number>();
    while (queue.length > 0) {
      const currId = queue.shift()!;
      visited.add(currId);
      const currDepth = depths.get(currId) || 0;
      const outgoing = links.filter((l) => l.source === currId).map((l) => l.target);

      for (const targetId of outgoing) {
        const nextDepth = Math.max(depths.get(targetId) || 0, currDepth + 1);
        depths.set(targetId, nextDepth);
        if (!visited.has(targetId) && !queue.includes(targetId)) {
          queue.push(targetId);
        }
      }
    }

    // Fallback for unvisited disconnected nodes: assign based on sequence
    nodes.forEach((n) => {
      if (!visited.has(n.id)) {
        depths.set(n.id, n.sequenceNumber > 1 ? Math.floor(n.sequenceNumber / 2) : 0);
      }
    });

    // Group nodes by depth column
    const columns = new Map<number, GraphNode[]>();
    nodes.forEach((n) => {
      const d = depths.get(n.id) || 0;
      if (!columns.has(d)) columns.set(d, []);
      columns.get(d)!.push(n);
    });

    const sortedColKeys = Array.from(columns.keys()).sort((a, b) => a - b);
    const colWidth = 260;
    const rowHeight = 140;
    const paddingX = 120;
    const paddingY = 100;

    const maxRows = Math.max(...Array.from(columns.values()).map((c) => c.length), 1);
    const canvasWidth = Math.max(1000, sortedColKeys.length * colWidth + paddingX * 2);
    const canvasHeight = Math.max(560, maxRows * rowHeight + paddingY * 2);

    const nodePositions = new Map<number, { x: number; y: number; level: number }>();

    sortedColKeys.forEach((colIndex, cIdx) => {
      const colNodes = columns.get(colIndex)!;
      const x = paddingX + cIdx * colWidth;
      const totalColHeight = colNodes.length * rowHeight;
      const startY = (canvasHeight - totalColHeight) / 2 + rowHeight / 2;

      colNodes.forEach((node, rIdx) => {
        const y = startY + rIdx * rowHeight;
        nodePositions.set(node.id, { x, y, level: colIndex });
      });
    });

    return { nodePositions, width: canvasWidth, height: canvasHeight };
  }, [data]);

  // Selected node details
  const selectedNode = useMemo(() => {
    if (!data || !selectedNodeId) return null;
    return data.nodes.find((n) => n.id === selectedNodeId) || null;
  }, [data, selectedNodeId]);

  // Connected links for highlighting
  const connectedNodeIds = useMemo(() => {
    if (!selectedNodeId || !data) return new Set<number>();
    const set = new Set<number>([selectedNodeId]);
    data.links.forEach((l) => {
      if (l.source === selectedNodeId) set.add(l.target);
      if (l.target === selectedNodeId) set.add(l.source);
    });
    return set;
  }, [selectedNodeId, data]);

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setIsDragging(true);
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPan({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Status color helpers
  const getStatusDetails = (status: GraphNode['status']) => {
    switch (status) {
      case 'MASTERED':
        return {
          label: 'Mastered',
          border: 'border-emerald-500 shadow-emerald-500/20 shadow-lg',
          bg: 'bg-emerald-500/10',
          text: 'text-emerald-400',
          badgeBg: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30',
          icon: 'verified',
        };
      case 'PROFICIENT':
        return {
          label: 'Proficient',
          border: 'border-teal-400 shadow-teal-500/20 shadow-md',
          bg: 'bg-teal-500/10',
          text: 'text-teal-400',
          badgeBg: 'bg-teal-500/20 text-teal-300 border-teal-500/30',
          icon: 'check_circle',
        };
      case 'DEVELOPING':
        return {
          label: 'Developing',
          border: 'border-amber-400 shadow-amber-500/20 shadow-md',
          bg: 'bg-amber-500/10',
          text: 'text-amber-400',
          badgeBg: 'bg-amber-500/20 text-amber-300 border-amber-500/30',
          icon: 'trending_up',
        };
      case 'READY':
        return {
          label: 'Ready to Learn',
          border: 'border-blue-400 shadow-blue-500/20 shadow-md animate-pulse',
          bg: 'bg-blue-500/10',
          text: 'text-blue-400',
          badgeBg: 'bg-blue-500/20 text-blue-300 border-blue-500/30',
          icon: 'play_circle',
        };
      case 'LOCKED':
      default:
        return {
          label: 'Prerequisite Required',
          border: 'border-outline-variant/30 opacity-60',
          bg: 'bg-surface-container-highest/20',
          text: 'text-text-secondary',
          badgeBg: 'bg-surface-container-highest text-text-secondary border-outline-variant/20',
          icon: 'lock',
        };
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="relative w-full max-w-6xl h-[92vh] max-h-[880px] bg-[#0d121c] border border-outline-variant/30 rounded-3xl shadow-2xl flex flex-col overflow-hidden text-white">
        
        {/* Top Header */}
        <div className="p-5 sm:px-8 border-b border-outline-variant/20 flex flex-wrap items-center justify-between gap-4 bg-surface-container-lowest/80 backdrop-blur-md">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-primary/20 text-primary border border-primary/30 flex items-center justify-center shadow-inner">
              <span className="material-symbols-outlined text-2xl">hub</span>
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg sm:text-xl font-bold tracking-tight">Interactive Knowledge & Prerequisite Graph</h2>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-accent-neon/20 text-accent-neon border border-accent-neon/40">
                  Neo4j Powered
                </span>
              </div>
              <p className="text-xs text-text-secondary mt-0.5">
                Topic dependencies, learning progression paths, and personalized mastery states.
              </p>
            </div>
          </div>

          {/* Quick Stats Pills */}
          {data && (
            <div className="flex items-center gap-2 text-xs font-semibold overflow-x-auto py-1">
              <span className="px-3 py-1 rounded-xl bg-surface-container-highest/60 border border-outline-variant/30 text-white">
                Total: {data.stats.total}
              </span>
              <span className="px-3 py-1 rounded-xl bg-emerald-500/15 border border-emerald-500/30 text-emerald-400">
                Mastered: {data.stats.mastered + data.stats.proficient}
              </span>
              <span className="px-3 py-1 rounded-xl bg-blue-500/15 border border-blue-500/30 text-blue-400">
                Ready: {data.stats.ready}
              </span>
              {data.stats.locked > 0 && (
                <span className="px-3 py-1 rounded-xl bg-slate-500/15 border border-slate-500/30 text-slate-400">
                  Locked: {data.stats.locked}
                </span>
              )}
            </div>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-9 h-9 rounded-xl bg-surface-container-highest hover:bg-surface-container-highest/80 border border-outline-variant/30 flex items-center justify-center text-text-secondary hover:text-white transition-colors"
            title="Close (Esc)"
          >
            <span className="material-symbols-outlined text-[20px]">close</span>
          </button>
        </div>

        {/* Controls Toolbar */}
        <div className="px-6 py-2.5 bg-[#090d15] border-b border-outline-variant/15 flex flex-wrap items-center justify-between gap-3 text-xs">
          {/* Status Filter Tabs */}
          <div className="flex items-center gap-1.5 p-1 bg-surface-container-lowest rounded-xl border border-outline-variant/20">
            {(['ALL', 'READY', 'MASTERED', 'LOCKED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setFilter(tab)}
                className={`px-3 py-1 rounded-lg font-bold transition-all ${
                  filter === tab
                    ? 'bg-primary text-white shadow-sm'
                    : 'text-text-secondary hover:text-white'
                }`}
              >
                {tab === 'ALL' ? 'All Topics' : tab === 'READY' ? 'Ready' : tab === 'MASTERED' ? 'Mastered' : 'Locked'}
              </button>
            ))}
          </div>

          {/* Zoom & Canvas controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setZoom((z) => Math.min(1.8, z + 0.15))}
              className="w-7 h-7 rounded-lg bg-surface-container-highest/60 hover:bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center font-bold"
              title="Zoom In"
            >
              +
            </button>
            <span className="font-mono text-[11px] text-text-secondary w-12 text-center">
              {Math.round(zoom * 100)}%
            </span>
            <button
              onClick={() => setZoom((z) => Math.max(0.6, z - 0.15))}
              className="w-7 h-7 rounded-lg bg-surface-container-highest/60 hover:bg-surface-container-highest border border-outline-variant/20 flex items-center justify-center font-bold"
              title="Zoom Out"
            >
              -
            </button>
            <button
              onClick={() => {
                setZoom(1);
                setPan({ x: 0, y: 0 });
              }}
              className="px-2.5 py-1 rounded-lg bg-surface-container-highest/60 hover:bg-surface-container-highest border border-outline-variant/20 text-[11px] font-semibold text-text-secondary hover:text-white"
            >
              Reset View
            </button>
          </div>
        </div>

        {/* Main Canvas Area */}
        <div
          className={`flex-1 relative overflow-hidden select-none bg-[radial-gradient(#1f293d_1px,transparent_1px)] [background-size:24px_24px] ${
            isDragging ? 'cursor-grabbing' : 'cursor-grab'
          }`}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          {loading && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[#0d121c]/70 backdrop-blur-sm z-20">
              <div className="w-10 h-10 border-4 border-primary/20 border-t-primary rounded-full animate-spin"></div>
              <p className="text-sm font-semibold text-text-secondary">Querying Neo4j Knowledge Graph...</p>
            </div>
          )}

          {error && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center z-20">
              <span className="material-symbols-outlined text-4xl text-rose-400">error</span>
              <p className="text-base font-bold text-white">Failed to load graph</p>
              <p className="text-xs text-text-secondary max-w-md">{error}</p>
            </div>
          )}

          {data && !loading && (
            <div
              className="absolute transition-transform duration-75 origin-top-left"
              style={{
                transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
                width: layout.width,
                height: layout.height,
              }}
            >
              <svg className="absolute inset-0 w-full h-full pointer-events-none">
                <defs>
                  <marker
                    id="arrow-default"
                    viewBox="0 0 10 10"
                    refX="26"
                    refY="5"
                    markerWidth="6"
                    markerHeight="6"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#4b5563" />
                  </marker>
                  <marker
                    id="arrow-active"
                    viewBox="0 0 10 10"
                    refX="26"
                    refY="5"
                    markerWidth="7"
                    markerHeight="7"
                    orient="auto-start-reverse"
                  >
                    <path d="M 0 1 L 10 5 L 0 9 z" fill="#10b981" />
                  </marker>
                  <linearGradient id="link-gradient" x1="0%" y1="0%" x2="100%" y2="0%">
                    <stop offset="0%" stopColor="#3b82f6" stopOpacity="0.6" />
                    <stop offset="100%" stopColor="#10b981" stopOpacity="0.8" />
                  </linearGradient>
                </defs>

                {/* Graph Edges */}
                {data.links.map((link, idx) => {
                  const sourcePos = layout.nodePositions.get(link.source);
                  const targetPos = layout.nodePositions.get(link.target);
                  if (!sourcePos || !targetPos) return null;

                  const isConnected =
                    selectedNodeId &&
                    (link.source === selectedNodeId || link.target === selectedNodeId);

                  const deltaX = targetPos.x - sourcePos.x;
                  const cp1x = sourcePos.x + deltaX * 0.5;
                  const cp1y = sourcePos.y;
                  const cp2x = sourcePos.x + deltaX * 0.5;
                  const cp2y = targetPos.y;

                  const pathD = `M ${sourcePos.x + 90} ${sourcePos.y} C ${cp1x} ${cp1y}, ${cp2x} ${cp2y}, ${targetPos.x - 90} ${targetPos.y}`;

                  return (
                    <g key={idx}>
                      <path
                        d={pathD}
                        fill="none"
                        stroke={isConnected ? '#10b981' : '#334155'}
                        strokeWidth={isConnected ? 3 : 1.5}
                        strokeDasharray={isConnected ? 'none' : '4,4'}
                        markerEnd={isConnected ? 'url(#arrow-active)' : 'url(#arrow-default)'}
                        className="transition-all duration-300"
                      />
                    </g>
                  );
                })}
              </svg>

              {/* Graph Nodes */}
              {data.nodes.map((node) => {
                const pos = layout.nodePositions.get(node.id);
                if (!pos) return null;

                const isSelected = selectedNodeId === node.id;
                const isCurrentTopic = activeTopicId === node.id;
                const isConnected = connectedNodeIds.has(node.id);
                const statusDetails = getStatusDetails(node.status);

                const matchesFilter =
                  filter === 'ALL' ||
                  (filter === 'READY' && node.status === 'READY') ||
                  (filter === 'MASTERED' && (node.status === 'MASTERED' || node.status === 'PROFICIENT')) ||
                  (filter === 'LOCKED' && node.status === 'LOCKED');

                return (
                  <div
                    key={node.id}
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelectedNodeId(node.id);
                    }}
                    style={{
                      left: pos.x,
                      top: pos.y,
                      transform: 'translate(-50%, -50%)',
                    }}
                    className={`absolute w-52 p-3.5 rounded-2xl border-2 transition-all cursor-pointer backdrop-blur-md ${
                      statusDetails.border
                    } ${
                      isSelected
                        ? 'ring-4 ring-primary ring-offset-2 ring-offset-[#0d121c] scale-105 z-30 bg-[#162032]'
                        : isConnected
                        ? 'z-20 bg-[#121927] hover:scale-102'
                        : matchesFilter
                        ? 'z-10 bg-[#0f1624] hover:scale-102 opacity-100'
                        : 'opacity-30 bg-[#0f1624]'
                    }`}
                  >
                    {/* Active "You are here" halo badge */}
                    {isCurrentTopic && (
                      <div className="absolute -top-3 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-primary text-white shadow-md flex items-center gap-1">
                        <span className="w-1.5 h-1.5 rounded-full bg-accent-neon animate-ping"></span>
                        <span>Current Topic</span>
                      </div>
                    )}

                    <div className="flex items-start justify-between gap-2 mb-2">
                      <span className="text-[11px] font-mono font-bold text-text-secondary bg-surface-container-highest/80 px-2 py-0.5 rounded-md">
                        #{node.sequenceNumber}
                      </span>
                      <div className={`px-2 py-0.5 rounded-md text-[10px] font-bold border flex items-center gap-1 ${statusDetails.badgeBg}`}>
                        <span className="material-symbols-outlined text-[13px]">{statusDetails.icon}</span>
                        <span>{statusDetails.label}</span>
                      </div>
                    </div>

                    <h4 className="font-bold text-xs sm:text-sm text-white line-clamp-2 leading-snug mb-2">
                      {node.title}
                    </h4>

                    <div className="flex items-center justify-between text-[11px] text-text-secondary pt-2 border-t border-outline-variant/15">
                      <span className="capitalize">{node.difficulty.toLowerCase()}</span>
                      {node.score !== null ? (
                        <span className="font-bold text-emerald-400">{node.score}%</span>
                      ) : (
                        <span className="text-text-secondary/70">Unassessed</span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Floating Instructions Pill */}
          <div className="absolute bottom-4 left-6 pointer-events-none px-3.5 py-1.5 rounded-full bg-[#0d121c]/80 border border-outline-variant/30 text-[11px] text-text-secondary flex items-center gap-2 backdrop-blur-md">
            <span className="material-symbols-outlined text-[15px] text-primary">drag_pan</span>
            <span>Click & drag to pan • Scroll or buttons to zoom • Click node to inspect</span>
          </div>
        </div>

        {/* Bottom Selected Node Inspector Drawer */}
        {selectedNode && (
          <div className="p-5 border-t border-outline-variant/20 bg-[#090d15] flex flex-wrap items-center justify-between gap-4 animate-fade-in-up">
            <div className="flex items-start gap-4 max-w-2xl">
              <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl border ${getStatusDetails(selectedNode.status).badgeBg}`}>
                <span className="material-symbols-outlined text-2xl">{getStatusDetails(selectedNode.status).icon}</span>
              </div>
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-xs font-mono font-bold text-text-secondary">Topic #{selectedNode.sequenceNumber}</span>
                  <span className="text-xs font-bold text-primary">• {selectedNode.difficulty}</span>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${getStatusDetails(selectedNode.status).badgeBg}`}>
                    {getStatusDetails(selectedNode.status).label}
                  </span>
                </div>
                <h3 className="font-bold text-base text-white">{selectedNode.title}</h3>
                <div className="text-xs text-text-secondary mt-1 flex flex-wrap gap-x-4 gap-y-1">
                  <span>Prerequisites: {selectedNode.prerequisites.length ? `${selectedNode.prerequisites.length} required` : 'None (Foundational)'}</span>
                  <span>Unlocks: {selectedNode.unlocks.length} downstream topics</span>
                  {selectedNode.score !== null && <span>Knowledge Score: <strong className="text-emerald-400">{selectedNode.score}%</strong></span>}
                </div>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                onClick={() => {
                  onSelectTopic(selectedNode.id);
                  onClose();
                }}
                className="px-6 py-2.5 rounded-xl bg-primary text-white font-bold text-sm hover:bg-primary/90 transition-all flex items-center gap-2 shadow-lg shadow-primary/20 active:scale-95"
              >
                <span className="material-symbols-outlined text-[18px]">play_arrow</span>
                <span>Open in Course Player</span>
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PrerequisiteGraphModal;
