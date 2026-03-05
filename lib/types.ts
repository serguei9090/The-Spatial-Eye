export interface Highlight {
  readonly id: string;
  readonly objectName: string;
  readonly ymin: number;
  readonly xmin: number;
  readonly ymax: number;
  readonly xmax: number;
  readonly timestamp: number;
  readonly confidence?: number;
}

export interface SessionRecord {
  readonly id: string;
  readonly userId: string;
  readonly startTime: Date;
  readonly endTime?: Date;
  readonly objectsDetected: number;
  readonly isRecording: boolean;
}

export interface DetectionRecord {
  readonly id: string;
  readonly objectName: string;
  readonly coordinates: readonly [number, number, number, number];
  readonly timestamp: Date;
  readonly userCommand: string;
  readonly confidence?: number;
}

export interface UIState {
  readonly isListening: boolean;
  readonly isConnected: boolean;
  readonly error: string | null;
}

export interface StoryWorldRule {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly consequence: string;
  readonly active: boolean;
}

export type StoryItemType =
  | "text"
  | "image"
  | "audio_event"
  | "rule_event"
  | "story_segment"
  | "director_prompt";

export interface StoryItem {
  readonly id: string;
  readonly type: StoryItemType;
  readonly content: string; // URL for image, Text for text, Description for audio
  readonly metadata?: Readonly<
    Record<string, string | number | boolean | undefined>
  >; // Extra data like rule details
  readonly isGenerating?: boolean; // For loading states
  readonly timestamp: number;
  readonly isStory?: boolean; // True if it's actual narrative content
  readonly invocationId?: string; // Links items to the same turn/beat
  readonly isPlaceholder?: boolean; // True for auto-created separators awaiting the real segment_story title
}
