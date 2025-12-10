import React from 'react';
import { Shape, ShapeType, Point } from '../../types';

interface ShapeCreationLogicProps {
  generateId: () => string;
  toCanvasCoordinates: (clientX: number, clientY: number) => Point;
  containerRef: React.RefObject<HTMLDivElement>;
}

export class ShapeCreationLogic {
  private generateId: () => string;
  private toCanvasCoordinates: (clientX: number, clientY: number) => Point;
  private containerRef: React.RefObject<HTMLDivElement>;

  constructor(props: ShapeCreationLogicProps) {
    this.generateId = props.generateId;
    this.toCanvasCoordinates = props.toCanvasCoordinates;
    this.containerRef = props.containerRef;
  }

  addShape = (type: ShapeType, clientX?: number, clientY?: number): string => {
    const isText = type === ShapeType.TEXT;
    const isCircle = type === ShapeType.CIRCLE;
    const isNote = type === ShapeType.NOTE;
    const isRect = type === ShapeType.RECTANGLE;

    let x = 0, y = 0;
    if (clientX && clientY) {
      const coords = this.toCanvasCoordinates(clientX, clientY);
      x = coords.x - (isText ? 100 : 90);
      y = coords.y - (isText ? 30 : 50);
    } else if (this.containerRef.current) {
      const rect = this.containerRef.current.getBoundingClientRect();
      x = (-Math.random() * 200 - 100); // Random position
      y = (-Math.random() * 200 - 100);
    }

    const id = this.generateId();
    return id;
  };
}

export const createShapeCreationLogic = (props: ShapeCreationLogicProps) => {
  return new ShapeCreationLogic(props);
};
