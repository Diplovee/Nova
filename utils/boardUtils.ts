import { Shape, Point, Side } from '../types';

export const getAnchorPoint = (shape: Shape, side: Side): Point => {
  const halfW = shape.width / 2;
  const halfH = shape.height / 2;
  const cx = shape.x + halfW;
  const cy = shape.y + halfH;

  switch (side) {
    case 'top': return { x: cx, y: shape.y };
    case 'bottom': return { x: cx, y: shape.y + shape.height };
    case 'left': return { x: shape.x, y: cy };
    case 'right': return { x: shape.x + shape.width, y: cy };
  }
};

export const getNearestSide = (rect: {x: number, y: number, width: number, height: number}, point: Point): Side => {
    const cx = rect.x + rect.width / 2;
    const cy = rect.y + rect.height / 2;
    
    // Calculate angle to determine side
    const distLeft = Math.abs(point.x - rect.x);
    const distRight = Math.abs(point.x - (rect.x + rect.width));
    const distTop = Math.abs(point.y - rect.y);
    const distBottom = Math.abs(point.y - (rect.y + rect.height));
    
    const min = Math.min(distLeft, distRight, distTop, distBottom);
    if (min === distTop) return 'top';
    if (min === distBottom) return 'bottom';
    if (min === distLeft) return 'left';
    return 'right';
};

export const getSmartPath = (source: Shape, target: Shape | Point, preferredSourceSide?: Side, preferredTargetSide?: Side) => {
    let targetCenter: Point;
    let isTargetPoint = false;

    if ('type' in target) {
        targetCenter = { x: target.x + target.width/2, y: target.y + target.height/2 };
    } else {
        targetCenter = target;
        isTargetPoint = true;
    }
    
    const sourceCenter = { x: source.x + source.width/2, y: source.y + source.height/2 };
    const dx = targetCenter.x - sourceCenter.x;
    const dy = targetCenter.y - sourceCenter.y;
    
    let startSide: Side = preferredSourceSide || 'right';
    let endSide: Side = preferredTargetSide || 'left';

    if (!preferredSourceSide || !preferredTargetSide) {
        let heuristicStart: Side = 'right';
        let heuristicEnd: Side = 'left';

        if (Math.abs(dx) > Math.abs(dy)) {
            heuristicStart = dx > 0 ? 'right' : 'left';
            heuristicEnd = dx > 0 ? 'left' : 'right';
        } else {
            heuristicStart = dy > 0 ? 'bottom' : 'top';
            heuristicEnd = dy > 0 ? 'top' : 'bottom';
        }
        
        if (!preferredSourceSide) startSide = heuristicStart;
        if (!preferredTargetSide) endSide = heuristicEnd;
    }

    const p1 = getAnchorPoint(source, startSide);
    const p2 = isTargetPoint ? (target as Point) : getAnchorPoint(target as Shape, endSide);
    const distance = Math.sqrt(dx*dx + dy*dy);
    const curvePower = Math.min(Math.max(distance * 0.4, 50), 200); 
    
    const getControlOffset = (side: Side) => {
        switch(side) {
            case 'top': return { x: 0, y: -curvePower };
            case 'bottom': return { x: 0, y: curvePower };
            case 'left': return { x: -curvePower, y: 0 };
            case 'right': return { x: curvePower, y: 0 };
        }
    };

    const cp1Offset = getControlOffset(startSide);
    let cp2Offset = { x: 0, y: 0 };

    if (!isTargetPoint) {
        cp2Offset = getControlOffset(endSide);
    } else {
        cp2Offset = { x: -cp1Offset.x, y: -cp1Offset.y };
    }

    const cp1 = { x: p1.x + cp1Offset.x, y: p1.y + cp1Offset.y };
    const cp2 = { x: p2.x + cp2Offset.x, y: p2.y + cp2Offset.y };

    return {
        path: `M ${p1.x} ${p1.y} C ${cp1.x} ${cp1.y}, ${cp2.x} ${cp2.y}, ${p2.x} ${p2.y}`,
        startSide,
        endSide,
        points: { p1, cp1, cp2, p2 }
    };
};

// Calculate midpoint for bezier curve (t=0.5)
export const getBezierMidpoint = (p0: Point, p1: Point, p2: Point, p3: Point) => {
    const t = 0.5;
    const cX = 3 * (p1.x - p0.x);
    const bX = 3 * (p2.x - p1.x) - cX;
    const aX = p3.x - p0.x - cX - bX;

    const cY = 3 * (p1.y - p0.y);
    const bY = 3 * (p2.y - p1.y) - cY;
    const aY = p3.y - p0.y - cY - bY;

    const x = aX * t * t * t + bX * t * t + cX * t + p0.x;
    const y = aY * t * t * t + bY * t * t + cY * t + p0.y;

    return { x, y };
};

export const autoSizeShape = (shape: Shape): Shape => {
    // Constants for padding and element heights
    const HEADER_HEIGHT = 50; 
    const FOOTER_PADDING = 30;
    const SUBTASK_HEIGHT = 28;
    const ATTACHMENT_HEIGHT = 90; 
    const MIN_HEIGHT = 100;
    
    // Estimate Text Height
    const text = shape.text || '';
    const lineCount = text.split('\n').length;
    // Rough estimation: 20px per line + wrap estimation (very basic)
    const wrapEstimate = Math.ceil(text.length / 35); // Assuming ~35 chars per line width
    const textHeight = Math.max(40, (Math.max(lineCount, wrapEstimate) * 20));

    let requiredHeight = HEADER_HEIGHT + textHeight + FOOTER_PADDING;

    if (shape.attachments && shape.attachments.length > 0) {
        requiredHeight += ATTACHMENT_HEIGHT;
    }

    if (shape.subtasks && shape.subtasks.length > 0 && !shape.hideSubtasks) {
        requiredHeight += (shape.subtasks.length * SUBTASK_HEIGHT) + 20; // +20 for spacing
    }

    // Ensure we don't shrink below a usable minimum, but grow as needed
    const finalHeight = Math.max(MIN_HEIGHT, requiredHeight);

    // Only update if difference is significant to prevent jitter
    if (Math.abs(finalHeight - shape.height) > 10) {
        return { ...shape, height: finalHeight };
    }
    return shape;
};