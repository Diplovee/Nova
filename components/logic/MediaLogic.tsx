import React from 'react';
import { Attachment, Shape, ShapeType } from '../../types';

interface MediaLogicProps {
  generateId: () => string;
  shapes: Shape[];
  selectedIds: Set<string>;
  onUpdateShapes: (shapes: Shape[], saveHistory?: boolean) => void;
  containerRef: React.RefObject<HTMLDivElement>;
  setShapesDirectly: (shapes: Shape[]) => void;
  autoSizeShape: (shape: Shape) => Shape;
  toCanvasCoordinates: (clientX: number, clientY: number) => any;
  scale: number;
  pan: { x: number; y: number };
  activeTool: string;
  setActiveTool: (tool: string) => void;
}

export class MediaLogic {
  private generateId: () => string;
  private shapes: Shape[];
  private selectedIds: Set<string>;
  private onUpdateShapes: (shapes: Shape[], saveHistory?: boolean) => void;
  private containerRef: React.RefObject<HTMLDivElement>;
  private setShapesDirectly: (shapes: Shape[]) => void;
  private autoSizeShape: (shape: Shape) => Shape;
  private toCanvasCoordinates: (clientX: number, clientY: number) => any;
  private scale: number;
  private pan: { x: number; y: number };
  private activeTool: string;
  private setActiveTool: (tool: string) => void;

  private mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  private audioChunksRef: React.MutableRefObject<Blob[]>;
  private isRecording: boolean;
  private recordingPos: { x: number; y: number } | null;
  private setIsRecording: (recording: boolean) => void;
  private setRecordingPos: (pos: { x: number; y: number } | null) => void;

  constructor(props: MediaLogicProps & {
    mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
    audioChunksRef: React.MutableRefObject<Blob[]>;
    isRecording: boolean;
    recordingPos: { x: number; y: number } | null;
    setIsRecording: (recording: boolean) => void;
    setRecordingPos: (pos: { x: number; y: number } | null) => void;
  }) {
    this.generateId = props.generateId;
    this.shapes = props.shapes;
    this.selectedIds = props.selectedIds;
    this.onUpdateShapes = props.onUpdateShapes;
    this.containerRef = props.containerRef;
    this.setShapesDirectly = props.setShapesDirectly;
    this.autoSizeShape = props.autoSizeShape;
    this.toCanvasCoordinates = props.toCanvasCoordinates;
    this.scale = props.scale;
    this.pan = props.pan;
    this.activeTool = props.activeTool;
    this.setActiveTool = props.setActiveTool;

    this.mediaRecorderRef = props.mediaRecorderRef;
    this.audioChunksRef = props.audioChunksRef;
    this.isRecording = props.isRecording;
    this.recordingPos = props.recordingPos;
    this.setIsRecording = props.setIsRecording;
    this.setRecordingPos = props.setRecordingPos;
  }

  updateProps(props: Partial<MediaLogicProps & {
    isRecording?: boolean;
    recordingPos?: { x: number; y: number } | null;
  }>) {
    if (props.shapes) this.shapes = props.shapes;
    if (props.selectedIds) this.selectedIds = props.selectedIds;
    if (props.onUpdateShapes) this.onUpdateShapes = props.onUpdateShapes;
    if (props.toCanvasCoordinates) this.toCanvasCoordinates = props.toCanvasCoordinates;
    if (props.scale) this.scale = props.scale;
    if (props.pan) this.pan = props.pan;
    if (props.activeTool) this.activeTool = props.activeTool;
    if (props.setActiveTool) this.setActiveTool = props.setActiveTool;
    if (props.isRecording !== undefined) this.isRecording = props.isRecording;
    if (props.recordingPos) this.recordingPos = props.recordingPos;
  }

  handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file || this.selectedIds.size !== 1) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          const url = ev.target?.result as string;
          const shapeId = Array.from(this.selectedIds)[0];
          const shape = this.shapes.find(s => s.id === shapeId);
          if (shape) {
              const newAttachment: Attachment = {
                  id: this.generateId(),
                  type: 'image',
                  url,
                  mimeType: file.type,
                  name: file.name
              };
              let updatedShape: Shape = { ...shape, attachments: [...(shape.attachments || []), newAttachment] };
              updatedShape = this.autoSizeShape(updatedShape);
              this.onUpdateShapes(this.shapes.map(s => s.id === shapeId ? updatedShape : s));
          }
      };
      reader.readAsDataURL(file);
  };

  handleImageToolUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (ev) => {
          const url = ev.target?.result as string;
          let x = 0, y = 0;
          if (this.containerRef.current) {
                const rect = this.containerRef.current.getBoundingClientRect();
                x = (-this.pan.x + rect.width / 2) / this.scale - 150;
                y = (-this.pan.y + rect.height / 2) / this.scale - 150;
          }

          const newShape: Shape = {
              id: this.generateId(),
              type: ShapeType.IMAGE,
              x,
              y,
              width: 300,
              height: 300,
              text: file.name,
              connections: [],
              attachments: [{
                  id: this.generateId(),
                  type: 'image',
                  url,
                  mimeType: file.type,
                  name: file.name
              }]
          };
          this.onUpdateShapes([...this.shapes, newShape]);
          this.setActiveTool('SELECT');
      };
      reader.readAsDataURL(file);
  };

  playAudio = (url: string) => {
      const audio = new Audio(url);
      audio.play().catch(e => console.error("Audio play failed", e));
  };

  startRecording = async (e?: React.MouseEvent, pos?: { x: number; y: number }) => {
    try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const mediaRecorder = new MediaRecorder(stream);
        this.mediaRecorderRef.current = mediaRecorder;
        this.audioChunksRef.current = [];

        mediaRecorder.ondataavailable = (e) => {
            if (e.data.size > 0) this.audioChunksRef.current.push(e.data);
        };

        // Two modes: Recording attached to shape OR Recording new Voice Tool
        if (pos) {
            this.setRecordingPos(pos); // Mode: New Voice Tool
        }

        mediaRecorder.onstop = () => {
            const audioBlob = new Blob(this.audioChunksRef.current, { type: 'audio/webm' });
            const reader = new FileReader();
            reader.readAsDataURL(audioBlob);
            reader.onloadend = () => {
                const base64data = reader.result as string;

                if (pos) {
                    // Create new Voice Shape
                    const newShape: Shape = {
                        id: this.generateId(),
                        type: ShapeType.VOICE,
                        x: pos!.x,
                        y: pos!.y,
                        width: 200,
                        height: 100,
                        text: `Voice Note ${new Date().toLocaleTimeString()}`,
                        connections: [],
                        attachments: [{
                            id: this.generateId(),
                            type: 'audio',
                            url: base64data,
                            mimeType: 'audio/webm',
                            name: `Audio ${new Date().toLocaleTimeString()}`
                        }]
                    };
                    this.onUpdateShapes([...this.shapes, newShape]);
                    this.setRecordingPos(null);
                    this.setActiveTool('SELECT');
                } else if (this.selectedIds.size === 1) {
                    // Attach to existing
                    const shapeId = Array.from(this.selectedIds)[0];
                    const shape = this.shapes.find(s => s.id === shapeId);
                    if (shape) {
                        const newAttachment: Attachment = {
                            id: this.generateId(),
                            type: 'audio',
                            url: base64data,
                            mimeType: 'audio/webm',
                            name: 'Voice Note'
                        };
                        let updatedShape: Shape = { ...shape, attachments: [...(shape.attachments || []), newAttachment] };
                        updatedShape = this.autoSizeShape(updatedShape);
                        this.onUpdateShapes(this.shapes.map(s => s.id === shapeId ? updatedShape : s));
                    }
                }
            };
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorder.start();
        this.setIsRecording(true);
    } catch (err) {
        console.error("Mic access denied", err);
        alert("Microphone permission is needed to record voice notes.");
    }
  };

  stopRecording = () => {
      if (this.mediaRecorderRef.current && this.isRecording) {
          this.mediaRecorderRef.current.stop();
          this.setIsRecording(false);
      }
  };
}

export const createMediaLogic = (props: MediaLogicProps & {
  mediaRecorderRef: React.MutableRefObject<MediaRecorder | null>;
  audioChunksRef: React.MutableRefObject<Blob[]>;
  isRecording: boolean;
  recordingPos: { x: number; y: number } | null;
  setIsRecording: (recording: boolean) => void;
  setRecordingPos: (pos: { x: number; y: number } | null) => void;
}) => {
  return new MediaLogic(props);
};
