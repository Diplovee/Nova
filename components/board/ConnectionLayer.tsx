import React from 'react';
import { Shape, ConnectionStyle, Point, Side } from '../../types';
import { getSmartPath, getBezierMidpoint } from '../../utils/boardUtils';

interface ConnectionLayerProps {
  shapes: Shape[];
  selectedConnection: { from: string, to: string, midPoint?: Point } | null;
  connectionDraft: { sourceId: string, sourceSide?: Side } | null;
  mousePos: Point;
  onSelectConnection: (connection: { from: string, to: string, midPoint?: Point }) => void;
  onClearSelection: () => void;
}

export const ConnectionLayer: React.FC<ConnectionLayerProps> = ({
  shapes,
  selectedConnection,
  connectionDraft,
  mousePos,
  onSelectConnection,
  onClearSelection
}) => {
  return (
    <svg className="absolute inset-0 w-full h-full pointer-events-none overflow-visible">
      <defs>
        <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#64748b" />
        </marker>
        <marker id="arrowhead-selected" markerWidth="10" markerHeight="7" refX="9" refY="3.5" orient="auto">
          <polygon points="0 0, 10 3.5, 0 7" fill="#22d3ee" />
        </marker>
      </defs>
      {shapes.map(shape =>
        shape.connections.map((conn, idx) => {
          const target = shapes.find(s => s.id === conn.targetId);
          if (!target) return null;

          const { path, points } = getSmartPath(shape, target, conn.sourceSide, conn.targetSide);
          const isSelected = selectedConnection && selectedConnection.from === shape.id && selectedConnection.to === conn.targetId;
          const style = conn.style || 'solid';

          let strokeDasharray = 'none';
          if (style === 'dashed') strokeDasharray = '8,8';
          if (style === 'dotted') strokeDasharray = '3,3';

          return (
            <g
              key={`${shape.id}-${conn.targetId}-${idx}`}
              className="group pointer-events-auto cursor-pointer"
              onClick={(e) => {
                e.stopPropagation();
                // Calculate midpoint for popup
                const mid = getBezierMidpoint(points.p1, points.cp1, points.cp2, points.p2);
                onSelectConnection({
                  from: shape.id,
                  to: conn.targetId,
                  midPoint: mid
                });
              }}
            >
              {/* Invisible Hit Area */}
              <path d={path} stroke="transparent" strokeWidth={20} fill="none" />

              {/* Visual Path */}
              {style === 'double' ? (
                <>
                  <path
                    d={path}
                    stroke={isSelected ? '#22d3ee' : '#64748b'}
                    strokeWidth={6}
                    fill="none"
                  />
                  <path
                    d={path}
                    stroke="#181820"
                    strokeWidth={2}
                    fill="none"
                  />
                  <path
                    d={path}
                    stroke="transparent"
                    markerEnd={`url(#${isSelected ? 'arrowhead-selected' : 'arrowhead'})`}
                    fill="none"
                  />
                </>
              ) : (
                <path
                  d={path}
                  stroke={isSelected ? '#22d3ee' : '#64748b'}
                  strokeWidth={isSelected ? 3 : 2}
                  fill="none"
                  strokeDasharray={strokeDasharray}
                  markerEnd={`url(#${isSelected ? 'arrowhead-selected' : 'arrowhead'})`}
                  className="transition-all duration-300"
                />
              )}
            </g>
          );
        })
      )}
      {connectionDraft && mousePos && (
        <path
          d={getSmartPath(shapes.find(s => s.id === connectionDraft.sourceId)!, mousePos, connectionDraft.sourceSide).path}
          stroke="#22d3ee"
          strokeWidth={2}
          strokeDasharray="5,5"
          fill="none"
          className="animate-pulse"
        />
      )}
    </svg>
  );
};