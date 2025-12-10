import { Shape } from '../../types';

interface ShapeManipulationLogicProps {
  shapes: Shape[];
  selectedIds: Set<string>;
  onUpdateShapes: (shapes: Shape[], saveHistory?: boolean) => void;
  generateId: () => string;
  setSelectedIds: (ids: Set<string>) => void;
}

export class ShapeManipulationLogic {
  private shapes: Shape[];
  private selectedIds: Set<string>;
  private onUpdateShapes: (shapes: Shape[], saveHistory?: boolean) => void;
  private generateId: () => string;
  private setSelectedIds: (ids: Set<string>) => void;

  constructor(props: ShapeManipulationLogicProps) {
    this.shapes = props.shapes;
    this.selectedIds = props.selectedIds;
    this.onUpdateShapes = props.onUpdateShapes;
    this.generateId = props.generateId;
    this.setSelectedIds = props.setSelectedIds;

    this.refreshProps = this.refreshProps.bind(this);
  }

  refreshProps(props: ShapeManipulationLogicProps) {
    this.shapes = props.shapes;
    this.selectedIds = props.selectedIds;
    this.onUpdateShapes = props.onUpdateShapes;
    this.generateId = props.generateId;
    this.setSelectedIds = props.setSelectedIds;
  }

  duplicateShape = () => {
    if (this.selectedIds.size === 0) return;
    const newShapes = [...this.shapes];
    const newSelected = new Set<string>();

    this.selectedIds.forEach(id => {
      const original = this.shapes.find(s => s.id === id);
      if (original) {
        const newId = this.generateId();
        const copy = {
          ...original,
          id: newId,
          x: original.x + 20,
          y: original.y + 20,
          connections: [] // Don't copy connections for now
        };
        newShapes.push(copy);
        newSelected.add(newId);
      }
    });
    this.onUpdateShapes(newShapes);
    this.setSelectedIds(newSelected);
  };

  toggleLock = () => {
    const newShapes = this.shapes.map(s => this.selectedIds.has(s.id) ? { ...s, locked: !s.locked } : s);
    this.onUpdateShapes(newShapes);
  };

  bringToFront = () => {
    const selected = this.shapes.filter(s => this.selectedIds.has(s.id));
    const unselected = this.shapes.filter(s => !this.selectedIds.has(s.id));
    this.onUpdateShapes([...unselected, ...selected]);
  };

  sendToBack = () => {
    const selected = this.shapes.filter(s => this.selectedIds.has(s.id));
    const unselected = this.shapes.filter(s => !this.selectedIds.has(s.id));
    this.onUpdateShapes([...selected, ...unselected]);
  };

  deleteSelected = () => {
    this.onUpdateShapes(this.shapes.filter(s => !this.selectedIds.has(s.id)));
    this.setSelectedIds(new Set());
  };

  handleGroup = () => {
    if (this.selectedIds.size < 2) return;
    const groupId = this.generateId();
    const newShapes = this.shapes.map(s => this.selectedIds.has(s.id) ? { ...s, groupId } : s);
    this.onUpdateShapes(newShapes);
  };

  handleUngroup = () => {
    const newShapes = this.shapes.map(s => this.selectedIds.has(s.id) ? { ...s, groupId: undefined } : s);
    this.onUpdateShapes(newShapes);
  };
}

export const createShapeManipulationLogic = (props: ShapeManipulationLogicProps) => {
  return new ShapeManipulationLogic(props);
};
