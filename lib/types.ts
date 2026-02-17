export interface Highlight {
  id: string;
  objectName: string;
  ymin: number;
  xmin: number;
  ymax: number;
  xmax: number;
  timestamp: number;
  confidence?: number;
}

export interface SessionRecord {
  id: string;
  userId: string;
  startTime: Date;
  endTime?: Date;
  objectsDetected: number;
  isRecording: boolean;
}

export interface DetectionRecord {
  id: string;
  objectName: string;
  coordinates: [number, number, number, number];
  timestamp: Date;
  userCommand: string;
  confidence?: number;
}

export interface UIState {
  isListening: boolean;
  isConnected: boolean;
  error: string | null;
}
