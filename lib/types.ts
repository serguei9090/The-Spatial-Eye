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

export interface StoryWorldRule {
  id: string;
  name: string;
  description: string;
  consequence: string;
  active: boolean;
}

export type StoryItemType =
  | "text"
  | "image"
  | "audio_event"
  | "rule_event"
  | "story_segment"
  | "director_prompt";

export interface StoryItem {
  id: string;
  type: StoryItemType;
  content: string; // URL for image, Text for text, Description for audio
  metadata?: Record<string, string | number | boolean | undefined>; // Extra data like rule details
  isGenerating?: boolean; // For loading states
  timestamp: number;
  isStory?: boolean; // True if it's actual narrative content
  invocationId?: string; // Links items to the same turn/beat
  isPlaceholder?: boolean; // True for auto-created separators awaiting the real segment_story title
}
