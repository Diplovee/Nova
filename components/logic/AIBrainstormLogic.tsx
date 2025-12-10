import { Shape, ShapeType, ConnectionStyle } from '../../types';
import { Attachment } from '../../types';
import { generateSubtasks, refineText, generateProjectNote, generateSheetData } from '../../services/geminiService';

interface AIBrainstormLogicProps {
  shapes: Shape[];
  selectedIds: Set<string>;
  loadingIds: Set<string>;
  setLoadingIds: (ids: Set<string>) => void;
  setShowAiModal: (show: boolean) => void;
  onUpdateShapes: (shapes: Shape[], saveHistory?: boolean) => void;
  generateId: () => string;
  defaultConnectionStyle: ConnectionStyle;
}

export class AIBrainstormLogic {
  private shapes: Shape[];
  private selectedIds: Set<string>;
  private loadingIds: Set<string>;
  private setLoadingIds: (ids: Set<string>) => void;
  private setShowAiModal: (show: boolean) => void;
  private onUpdateShapes: (shapes: Shape[], saveHistory?: boolean) => void;
  private generateId: () => string;
  private defaultConnectionStyle: ConnectionStyle;

  constructor(props: AIBrainstormLogicProps) {
    this.shapes = props.shapes;
    this.selectedIds = props.selectedIds;
    this.loadingIds = props.loadingIds;
    this.setLoadingIds = props.setLoadingIds;
    this.setShowAiModal = props.setShowAiModal;
    this.onUpdateShapes = props.onUpdateShapes;
    this.generateId = props.generateId;
    this.defaultConnectionStyle = props.defaultConnectionStyle;
  }

  updateProps(props: Partial<AIBrainstormLogicProps>) {
    if (props.shapes) this.shapes = props.shapes;
    if (props.selectedIds) this.selectedIds = props.selectedIds;
    if (props.loadingIds) this.loadingIds = props.loadingIds;
    if (props.setLoadingIds) this.setLoadingIds = props.setLoadingIds;
    if (props.setShowAiModal) this.setShowAiModal = props.setShowAiModal;
    if (props.onUpdateShapes) this.onUpdateShapes = props.onUpdateShapes;
    if (props.generateId) this.generateId = props.generateId;
    if (props.defaultConnectionStyle) this.defaultConnectionStyle = props.defaultConnectionStyle;
  }

  handleAIBrainstorm = async (mode: 'subtasks' | 'nodes' | 'refine' | 'custom' | 'note' | 'sheet', customPrompt?: string) => {
    if (this.selectedIds.size === 0) return;

    const processingIds = new Set(this.loadingIds);
    this.selectedIds.forEach(id => processingIds.add(id));
    this.setLoadingIds(processingIds);
    this.setShowAiModal(false);

    try {
         for (const id of Array.from(this.selectedIds)) {
            const shape = this.shapes.find(s => s.id === id);
            if (!shape) continue;

            const context = customPrompt || shape.text || 'Project Task';

            if (mode === 'subtasks' && (shape.type === ShapeType.TASK || shape.type === ShapeType.IDEA || shape.type === ShapeType.VOICE)) {
                const suggestions = await generateSubtasks(context, shape.attachments || []);
                const newSubtasks = suggestions.map(s => ({
                    id: this.generateId(),
                    title: s,
                    completed: false
                }));
                let updatedShape: Shape = {
                    ...shape,
                    subtasks: [...(shape.subtasks || []), ...newSubtasks],
                    hideSubtasks: false
                };
                this.onUpdateShapes(this.shapes.map(s => s.id === id ? updatedShape : s));
            } else if (mode === 'refine') {
                const newText = await refineText(shape.text, customPrompt || "Improve clarity");
                this.onUpdateShapes(this.shapes.map(s => s.id === id ? { ...s, text: newText } : s));
            } else if (mode === 'note') {
                const noteContent = await generateProjectNote(context);
                const newNote: Shape = {
                    id: this.generateId(),
                    type: ShapeType.NOTE,
                    x: shape.x + shape.width + 50,
                    y: shape.y,
                    width: 200,
                    height: 240,
                    text: noteContent,
                    connections: [],
                    status: 'TODO',
                    subtasks: []
                };
                const updatedParent = {
                    ...shape,
                    connections: [...shape.connections, { targetId: newNote.id, style: this.defaultConnectionStyle }]
                };
                this.onUpdateShapes([...this.shapes.filter(s => s.id !== id), updatedParent, newNote]);
            } else if (mode === 'sheet') {
                const sheetData = await generateSheetData(`Create a sheet for: ${context}`);
                const newSheet: Shape = {
                    id: this.generateId(),
                    type: ShapeType.SHEET,
                    x: shape.x + shape.width + 50,
                    y: shape.y,
                    width: 200,
                    height: 240,
                    text: `Sheet: ${context}`,
                    content: { cells: sheetData },
                    connections: [],
                    status: 'TODO',
                    subtasks: []
                };
                 const updatedParent = {
                    ...shape,
                    connections: [...shape.connections, { targetId: newSheet.id, style: this.defaultConnectionStyle }]
                };
                this.onUpdateShapes([...this.shapes.filter(s => s.id !== id), updatedParent, newSheet]);
            } else {
                // 'nodes' mode - create AI-generated idea nodes with skeleton loading
                // Pre-create placeholder shapes with skeleton loading
                const placeholderIds: string[] = [];
                const placeholders: Shape[] = [];
                const startY = shape.y + shape.height + 100;

                // Create placeholders (we'll assume 3-5 suggestions, but will adjust after AI response)
                for (let idx = 0; idx < 4; idx++) {
                    const placeholderId = this.generateId();
                    placeholderIds.push(placeholderId);
                    placeholders.push({
                        id: placeholderId,
                        type: ShapeType.IDEA,
                        x: shape.x + (idx * 220),
                        y: startY,
                        width: 180,
                        height: 120,
                        text: '',
                        connections: []
                    });
                }

                // Add placeholder IDs to loading state for skeleton animation
                const loadingWithPlaceholders = new Set([...this.loadingIds, ...placeholderIds]);
                this.setLoadingIds(loadingWithPlaceholders);

                // Add placeholders to board (showing skeletons)
                const updatedParentWithPlaceholders = {
                    ...shape,
                    connections: [...shape.connections, ...placeholders.map(n => ({ targetId: n.id, style: this.defaultConnectionStyle }))]
                };
                this.onUpdateShapes([...this.shapes.filter(s => s.id !== id), updatedParentWithPlaceholders, ...placeholders]);

                // Now call AI to generate content
                const suggestions = await generateSubtasks(context, shape.attachments || []);

                // Update placeholders with actual AI-generated content
                const newShapesWithContent = placeholders.slice(0, suggestions.length).map((placeholder, idx) => ({
                    ...placeholder,
                    text: suggestions[idx]
                }));

                // Update board with content
                this.onUpdateShapes([
                    ...this.shapes.filter(s => s.id !== id),
                    updatedParentWithPlaceholders,
                    ...newShapesWithContent
                ]);
            }
         }
    } catch (e) {
        console.error("AI Error", e);
    } finally {
        this.setLoadingIds(new Set());
    }
  };
}

export const createAIBrainstormLogic = (props: AIBrainstormLogicProps) => {
  return new AIBrainstormLogic(props);
};
