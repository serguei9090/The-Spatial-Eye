"use client";

import type { LiveServerMessage } from "@google/genai";
import { useEffect, useRef, useState } from "react";

import {
  SPATIAL_SYSTEM_INSTRUCTION,
  STORYTELLER_SYSTEM_INSTRUCTION,
} from "@/lib/api/gemini_websocket";

import { IT_ARCHITECTURE_SYSTEM_INSTRUCTION } from "@/lib/gemini/it-architecture-handlers";
import {
  handleDirectorToolCall,
  triggerStoryVisual,
} from "@/lib/gemini/storyteller-handlers";
import { useArchitectureMode } from "@/lib/hooks/useArchitectureMode";
import { useGeminiCore } from "@/lib/hooks/useGeminiCore";
import { useSpatialMode } from "@/lib/hooks/useSpatialMode";
import { useSettings } from "@/lib/store/settings-context";
import type { Highlight, StoryItem } from "@/lib/types";
import type { Edge, Node } from "@xyflow/react";

export type GeminiMode = "spatial" | "storyteller" | "it-architecture";

export interface UseGeminiLiveProps {
  mode?: GeminiMode; // default "spatial"
  onTurnComplete?: (invocationId?: string) => void;
  getToken?: () => Promise<string | null>;
}

export function useGeminiLive({
  mode = "spatial",
  onTurnComplete,
  getToken,
}: UseGeminiLiveProps = {}) {
  const { activeHighlights, setActiveHighlights, handleSpatialToolCall } =
    useSpatialMode();

  const { nodes, edges, setNodes, setEdges, handleArchitectureToolCall } =
    useArchitectureMode();
  const { t } = useSettings();

  const [storyStream, setStoryStream] = useState<StoryItem[]>([]);
  const [latestTranscript, setLatestTranscript] = useState<string>("");
  const triggeredVisualsRef = useRef<Set<string>>(new Set());
  const cumulativeTranscriptRef = useRef<string>("");

  // Determine configuration based on mode
  let systemInstruction = SPATIAL_SYSTEM_INSTRUCTION;
  if (mode === "storyteller")
    systemInstruction = STORYTELLER_SYSTEM_INSTRUCTION;
  if (mode === "it-architecture")
    systemInstruction = IT_ARCHITECTURE_SYSTEM_INSTRUCTION;

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset state when mode changes
  useEffect(() => {
    setActiveHighlights([]);
    setStoryStream([]);
    setNodes([]);
    setEdges([]);
    setLatestTranscript("");
    cumulativeTranscriptRef.current = "";
    triggeredVisualsRef.current.clear();
  }, [mode]);

  // Handler for tool calls
  const handleToolCall = (
    toolCall: LiveServerMessage["toolCall"],
    metadata: { invocationId?: string },
  ) => {
    if (mode === "spatial") {
      handleSpatialToolCall(toolCall, metadata.invocationId);
    } else if (mode === "storyteller") {
      handleDirectorToolCall(toolCall, setStoryStream, metadata);
    } else if (mode === "it-architecture") {
      handleArchitectureToolCall(toolCall);
    }
  };

  const handleTranscript = (
    text: string,
    metadata: {
      invocationId?: string;
      finished?: boolean;
      isPartial?: boolean;
    },
  ) => {
    const { invocationId, finished, isPartial } = metadata;
    // For IT Architecture mode, skip raw tool call strings from transcript
    const isToolCallText =
      mode === "it-architecture" &&
      /call:\s*\w+|add_node|add_edge|clear_diagram|delete_node|remove_edge|update_node/.test(
        text,
      );
    if (!isToolCallText) {
      // Strip out any partial tool call artifacts that may bleed through
      // and replace with localized descriptions from t.settings.tools
      let cleanText = text
        .replaceAll(/call:\s*(add_node|add_edge|clear_diagram)[\s\S]*/g, "")
        .trimEnd();

      if (cleanText.includes("call:")) {
        for (const [key, value] of Object.entries(t.settings.tools || {})) {
          if (cleanText.includes(key)) {
            const pattern = `call:\\s*${key}.*`;
            cleanText = cleanText.replaceAll(
              new RegExp(pattern, "g"),
              `[${value}]`,
            );
          }
        }
      }

      // The Gemini API sends incremental chunks with partial=true,
      // and then sends the FULL assembled string with partial=false.
      // To avoid duplicating the sentence, we only append the partial chunks.
      if (cleanText && isPartial !== false) {
        setLatestTranscript((prev) => prev + cleanText);
      }
    }

    if (mode !== "storyteller") return;

    // Accumulate the text purely for regex matching across chunk boundaries
    cumulativeTranscriptRef.current += text;
    const fullText = cumulativeTranscriptRef.current;

    // ── STREAMING RETROACTIVE TITLE EXTRACTION ────────────────────────────────
    // We scan the cumulative full text. If we see a complete first sentence,
    // we extract it and backfill the placeholder segment immediately!
    // Added safety: The title can end with punctuation (.!?) OR a new line (\n)
    const narrativeMatch = /\[NARRATIVE\]\s*([^\n.!?]+(?:[.!?]|\n))/i.exec(
      fullText,
    );
    if (narrativeMatch) {
      const extractedTitle = narrativeMatch[1]
        .replaceAll(/(?:^[*_]+|[*_]+$)/g, "") // strip markdown bold/italic
        .trim();
      if (extractedTitle) {
        // Manually trigger the visual API to start loading the image parallel to the TTS stream!
        // (Ensuring we only fire it once per unique title segment per session turn)
        if (invocationId && !triggeredVisualsRef.current.has(invocationId)) {
          triggeredVisualsRef.current.add(invocationId);
          console.log(
            `[GeminiLive] Native text intercept -> Generating Visual for: ${extractedTitle}`,
          );
          triggerStoryVisual(
            extractedTitle,
            `Dynamic highly detailed digital illustration of: ${extractedTitle}, cinematic lighting`,
            invocationId,
            setStoryStream,
          );
        }

        setStoryStream((prev) => {
          const placeholderIdx = prev.findLastIndex(
            (i) => i.type === "story_segment" && i.isPlaceholder === true,
          );
          if (placeholderIdx === -1) return prev;
          const updated = [...prev];
          updated[placeholderIdx] = {
            ...updated[placeholderIdx],
            content: extractedTitle,
            isPlaceholder: false,
            timestamp: Date.now(),
          };
          return updated;
        });
      }
    }

    if (finished) {
      cumulativeTranscriptRef.current = ""; // Reset for next turn
      return;
    }

    // ── PARTIAL TRANSCRIPT: Stream text and inject placeholder ────────────────
    setStoryStream((prev) => {
      // ── SPLIT CHUNK AT TAG BOUNDARIES ───────────────────────────────────
      // A single chunk can contain multiple tagged segments, e.g.:
      //   "[NARRATIVE] The End. [DIRECTOR] Shall we craft another?"
      // We split on ANY tag marker and process each segment independently.
      const TAG_SPLIT_RE = /(?=\[NARRATIVE\]|\[DIRECTOR\])/gi;
      const tagSegments = text.split(TAG_SPLIT_RE).filter(Boolean);

      // If no splits occurred (tagless chunk), treat as a single segment
      const segments = tagSegments.length > 0 ? tagSegments : [text];

      // Determine the initial isNarrative state from the last text item in stream
      const lastTextItem = prev.findLast((i) => i.type === "text");
      let currentIsNarrative = lastTextItem?.isStory ?? false;

      // Detect new story transition: [NARRATIVE] starts when we're NOT in narrative mode.
      // Usually, the `begin_story` tool call creates the `story_segment` slightly before
      // the `[NARRATIVE]` text arrives. BUT due to async streaming, the text might arrive first.
      // We only inject a placeholder if we are starting narrative text AND we don't have a
      // fresh `story_segment` waiting for us.
      const lastSegmentIdx = prev.findLastIndex(
        (i) => i.type === "story_segment",
      );
      const lastNarrativeTextIdx = prev.findLastIndex(
        (i) => i.type === "text" && i.isStory,
      );
      const hasNarrativeTag = text.includes("[NARRATIVE]");

      // A segment is "stale/used" if we've already written narrative text after it.
      // If we have no segment (-1) or the last one is stale, we need a new one.
      const needsSegment =
        lastSegmentIdx === -1 || lastNarrativeTextIdx > lastSegmentIdx;
      const isNewStoryTransition =
        hasNarrativeTag && !currentIsNarrative && needsSegment;

      let workingStream = prev;
      let effectiveSegmentIdx = lastSegmentIdx;

      if (isNewStoryTransition) {
        const placeholder = {
          id: crypto.randomUUID(),
          type: "story_segment" as const,
          content: "", // backfilled on finished:true
          timestamp: Date.now(),
          invocationId,
          isPlaceholder: true,
        };
        workingStream = [...prev, placeholder];
        effectiveSegmentIdx = workingStream.length - 1;
      }

      // ── PROCESS EACH TAG SEGMENT ─────────────────────────────────────────
      for (const segment of segments) {
        // Determine this segment's type
        if (/^\[NARRATIVE\]/i.test(segment)) currentIsNarrative = true;
        if (/^\[DIRECTOR\]/i.test(segment)) currentIsNarrative = false;

        // Strip the tag prefix from this segment's text
        const cleanSegment = segment
          .replace(/^\[NARRATIVE\]\s*/i, "")
          .replace(/^\[DIRECTOR\]\s*/i, "")
          .trim();

        if (!cleanSegment) continue;

        const isNarrativeSegment = currentIsNarrative;

        // Find existing block to merge into
        const targetIndex = workingStream.findLastIndex(
          (i) =>
            i.type === "text" &&
            i.invocationId === invocationId &&
            !!i.isStory === isNarrativeSegment,
        );

        // Crucial fix: NO text (neither narrative nor director) should merge backwards
        // across a story_segment boundary. If targetIndex points to a block BEFORE
        // the effective segment, it is invalid. (e.g. Director talk after a story
        // should separate from Director talk before the story).
        const afterSegment = targetIndex > effectiveSegmentIdx;
        const isValidMerge = targetIndex !== -1 && afterSegment;

        if (isValidMerge) {
          const target = workingStream[targetIndex];
          const alreadyHasStart = cleanSegment
            .toLowerCase()
            .startsWith(target.content.toLowerCase().trim());
          const needsSpace =
            !alreadyHasStart &&
            target.content.length > 0 &&
            !target.content.endsWith(" ");
          const updatedContent = alreadyHasStart
            ? cleanSegment
            : target.content + (needsSpace ? " " : "") + cleanSegment;
          workingStream = [...workingStream];
          workingStream[targetIndex] = {
            ...target,
            content: updatedContent,
            timestamp: Date.now(),
          };
        } else {
          workingStream = [
            ...workingStream,
            {
              id: crypto.randomUUID(),
              type: "text",
              content: cleanSegment,
              timestamp: Date.now(),
              isStory: isNarrativeSegment,
              invocationId,
            },
          ];
        }
      }

      return workingStream;
    });
  };

  let resumePrompt = t.system.resumeAction;
  if (mode === "it-architecture") {
    const MAX_RESUME_NODES = 8;
    const nodeNames = nodes
      .slice(0, MAX_RESUME_NODES)
      .map((n: Node) => n.data.label)
      .join(", ");
    const moreNodes =
      nodes.length > MAX_RESUME_NODES
        ? ` (and ${nodes.length - MAX_RESUME_NODES} more)`
        : "";
    const edgeCount = edges.length;
    resumePrompt += ` ${t.system.resumeArchitecture.replace(". ", "")} (${nodes.length} nodes: ${nodeNames}${moreNodes}, ${edgeCount} connections).`;
  } else if (mode === "storyteller") {
    resumePrompt += ` ${t.system.resumeStory}`;
  } else if (mode === "spatial") {
    resumePrompt += ` ${t.system.resumeWaiting}`;
  }

  const core = useGeminiCore({
    systemInstruction,
    mode,
    onToolCall: handleToolCall,
    onTranscript: handleTranscript,
    getToken,
    onTurnComplete: (invocationId) => {
      if (mode !== "storyteller") return;
      setStoryStream((prev) => {
        let updated = [...prev];

        // 1. Resolve any unfinished placeholder title
        const placeholderIdx = updated.findLastIndex(
          (i) => i.type === "story_segment" && i.isPlaceholder,
        );
        if (placeholderIdx !== -1) {
          const firstNarrative = updated.find(
            (i) => i.type === "text" && i.isStory,
          );
          const isEn = t.modes.storyteller === "Storyteller";
          let fallbackTitle = isEn ? "A Story" : "Una Historia";
          if (firstNarrative) {
            const match = /^([^.!?\n]+[.!?]?)/.exec(firstNarrative.content);
            if (match?.[1]) fallbackTitle = match[1].trim();
          }

          updated[placeholderIdx] = {
            ...updated[placeholderIdx],
            content: fallbackTitle,
            isPlaceholder: false,
          };
        }

        // 2. Inject a director_prompt only if THIS turn told a story
        //    Check for narrative text AFTER the last director_prompt (not from a previous story)
        const lastPromptIdx = updated.findLastIndex(
          (i) => i.type === "director_prompt",
        );
        const narrativeAfterLastPrompt = updated.some(
          (i, idx) => i.type === "text" && i.isStory && idx > lastPromptIdx,
        );
        const alreadyHasPrompt = updated.at(-1)?.type === "director_prompt";

        if (narrativeAfterLastPrompt && !alreadyHasPrompt) {
          updated = [
            ...updated,
            {
              id: crypto.randomUUID(),
              type: "director_prompt",
              content: "[DIRECTOR] The tale is told. Shall we craft another?",
              timestamp: Date.now(),
            },
          ];
        }

        return updated;
      });
      // Call external handler if provided
      onTurnComplete?.(invocationId);
    },
    resumePrompt,
  });

  return {
    ...core,
    connect: (isAutoReconnect?: boolean, token?: string | null) =>
      core.connect(isAutoReconnect, token),
    activeHighlights,
    storyStream,
    nodes,
    edges,
    setNodes,
    setEdges,
    latestTranscript,
    mode,
  };
}
