"use client";

import type { LiveServerMessage } from "@google/genai";
import { useEffect, useMemo, useState } from "react";

import {
  SPATIAL_SYSTEM_INSTRUCTION,
  STORYTELLER_SYSTEM_INSTRUCTION,
} from "@/lib/api/gemini_websocket";
import { handleSpatialToolCall } from "@/lib/gemini/handlers";
import {
  IT_ARCHITECTURE_SYSTEM_INSTRUCTION,
  IT_ARCHITECTURE_TOOLS,
  handleArchitectureToolCall,
} from "@/lib/gemini/it-architecture-handlers";
import { handleDirectorToolCall } from "@/lib/gemini/storyteller-handlers";
import { DIRECTOR_TOOLS, SPATIAL_TOOLS } from "@/lib/gemini/tools/definitions";
import { useGeminiCore } from "@/lib/hooks/useGeminiCore";
import { useSettings } from "@/lib/store/settings-context";
import type { Highlight, StoryItem } from "@/lib/types";
import type { Edge, Node } from "@xyflow/react";

export type GeminiMode = "spatial" | "storyteller" | "it-architecture";

export interface UseGeminiLiveProps {
  mode?: GeminiMode; // default "spatial"
}

export function useGeminiLive({ mode = "spatial" }: UseGeminiLiveProps = {}) {
  const [activeHighlights, setActiveHighlights] = useState<Highlight[]>([]);
  const [storyStream, setStoryStream] = useState<StoryItem[]>([]);
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);
  const [latestTranscript, setLatestTranscript] = useState<string>("");

  // Determine configuration based on mode
  let systemInstruction = SPATIAL_SYSTEM_INSTRUCTION;
  if (mode === "storyteller") systemInstruction = STORYTELLER_SYSTEM_INSTRUCTION;
  if (mode === "it-architecture") systemInstruction = IT_ARCHITECTURE_SYSTEM_INSTRUCTION;

  const { highlightDuration } = useSettings();

  // Highlight Pruning Logic
  useEffect(() => {
    if (highlightDuration === "always") return;
    const durationCount = Number(highlightDuration);

    const interval = setInterval(() => {
      setActiveHighlights((prev) => {
        const now = Date.now();
        const filtered = prev.filter((h) => now - h.timestamp < durationCount);
        if (filtered.length !== prev.length) {
          console.debug(`[GeminiLive] Pruned ${prev.length - filtered.length} highlights.`);
        }
        return filtered;
      });
    }, 500);

    return () => clearInterval(interval);
  }, [highlightDuration]);

  // biome-ignore lint/correctness/useExhaustiveDependencies: Reset state when mode changes
  useEffect(() => {
    setActiveHighlights([]);
    setStoryStream([]);
    setNodes([]);
    setEdges([]);
    setLatestTranscript("");
  }, [mode]);

  // Tools configuration
  const tools = useMemo(() => {
    if (mode === "storyteller") {
      return [{ functionDeclarations: DIRECTOR_TOOLS }];
    }
    if (mode === "it-architecture") {
      return IT_ARCHITECTURE_TOOLS; // Already wrapped in object
    }
    return [{ functionDeclarations: SPATIAL_TOOLS }];
  }, [mode]);

  // Handler for tool calls
  const handleToolCall = (
    toolCall: LiveServerMessage["toolCall"],
    metadata: { invocationId?: string },
  ) => {
    if (mode === "spatial") {
      handleSpatialToolCall(toolCall, setActiveHighlights);
    } else if (mode === "storyteller") {
      handleDirectorToolCall(toolCall, setStoryStream, metadata);
    } else if (mode === "it-architecture") {
      handleArchitectureToolCall(toolCall, setNodes, setEdges);
    }
  };

  const handleTranscript = (
    text: string,
    metadata: { invocationId?: string; finished?: boolean },
  ) => {
    const { invocationId, finished } = metadata;
    // For IT Architecture mode, skip raw tool call strings from transcript
    const isToolCallText =
      mode === "it-architecture" && /call:\s*\w+|add_node|add_edge|clear_diagram/.test(text);
    if (!isToolCallText) {
      // Strip out any partial tool call artifacts that may bleed through
      const cleanText = text
        .replaceAll(/call:\s*(add_node|add_edge|clear_diagram)[\s\S]*/g, "")
        .trimEnd();
      if (cleanText) setLatestTranscript((prev) => prev + cleanText);
    }

    if (mode !== "storyteller") return;

    // ── FINISHED TRANSCRIPT: Retroactive Title Extraction ────────────────────
    // The model always places the title as the first [NARRATIVE] sentence.
    // We wait for the complete final transcript to extract it reliably,
    // then backfill the placeholder segment that was injected at turn start.
    if (finished) {
      const narrativeMatch = /\[NARRATIVE\]\s*([^\n.!?]+[.!?]?)/i.exec(text);
      if (narrativeMatch) {
        const extractedTitle = narrativeMatch[1]
          .replaceAll(/(?:^[*_]+|[*_]+$)/g, "") // strip markdown bold/italic
          .trim();
        if (extractedTitle) {
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
      return; // finished events are only for title extraction, not text rendering
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
      const lastSegmentIdx = prev.findLastIndex((i) => i.type === "story_segment");
      const lastNarrativeTextIdx = prev.findLastIndex((i) => i.type === "text" && i.isStory);
      const hasNarrativeTag = text.includes("[NARRATIVE]");

      // A segment is "stale/used" if we've already written narrative text after it.
      // If we have no segment (-1) or the last one is stale, we need a new one.
      const needsSegment = lastSegmentIdx === -1 || lastNarrativeTextIdx > lastSegmentIdx;
      const isNewStoryTransition = hasNarrativeTag && !currentIsNarrative && needsSegment;

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
            !alreadyHasStart && target.content.length > 0 && !target.content.endsWith(" ");
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

  let resumePrompt =
    "The connection to the server was briefly interrupted. Please resume what you were doing exactly where you left off.";
  if (mode === "it-architecture") {
    // Cap context to avoid buffer overflow on WebSocket reconnect handshake.
    // Sending all node labels as a large string on reconnect is a primary cause
    // of "deadline exceeded" / 1006 drops, especially on Hackintosh systems.
    const MAX_RESUME_NODES = 8;
    const nodeNames = nodes
      .slice(0, MAX_RESUME_NODES)
      .map((n) => n.data.label)
      .join(", ");
    const moreNodes =
      nodes.length > MAX_RESUME_NODES ? ` (and ${nodes.length - MAX_RESUME_NODES} more)` : "";
    const edgeCount = edges.length;
    resumePrompt += ` We are building an architecture diagram with ${nodes.length} nodes (e.g., ${nodeNames}${moreNodes}) and ${edgeCount} connections. Please continue the design.`;
  } else if (mode === "storyteller") {
    resumePrompt += " Please continue the story or narrative from where it stopped.";
  } else if (mode === "spatial") {
    resumePrompt +=
      " I am back online. Await my specific instructions before highlighting any objects.";
  }

  const core = useGeminiCore({
    systemInstruction,
    tools,
    mode,
    onToolCall: handleToolCall,
    onTranscript: handleTranscript,
    onTurnComplete: () => {
      if (mode !== "storyteller") return;
      setStoryStream((prev) => {
        let updated = [...prev];

        // 1. Resolve any unfinished placeholder title
        const placeholderIdx = updated.findLastIndex(
          (i) => i.type === "story_segment" && i.isPlaceholder,
        );
        if (placeholderIdx !== -1) {
          // Try to read the title from the first narrative sentence still in the stream
          const firstNarrative = updated.find((i) => i.type === "text" && i.isStory);
          const fallbackTitle = firstNarrative
            ? (/^([^.!?\n]+[.!?]?)/.exec(firstNarrative.content)?.[1]?.trim() ?? "A Story")
            : "A Story";
          updated[placeholderIdx] = {
            ...updated[placeholderIdx],
            content: fallbackTitle,
            isPlaceholder: false,
          };
        }

        // 2. Inject a director_prompt only if THIS turn told a story
        //    Check for narrative text AFTER the last director_prompt (not from a previous story)
        const lastPromptIdx = updated.findLastIndex((i) => i.type === "director_prompt");
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
              content: "The tale is told. Shall we craft another?",
              timestamp: Date.now(),
            },
          ];
        }

        return updated;
      });
    },
    resumePrompt,
  });

  return {
    ...core,
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
