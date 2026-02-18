"use client";

import { useEffect, useMemo, useState } from "react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { listSessions } from "@/lib/firestore/sessionService";
import type { SessionRecord } from "@/lib/types";

function formatSessionDate(date?: Date): string {
  if (!date) {
    return "In progress";
  }

  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export default function SessionsPage() {
  const [sessions, setSessions] = useState<SessionRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const userId = useMemo(() => process.env.NEXT_PUBLIC_DEMO_USER_ID ?? "demo-user", []);

  useEffect(() => {
    let active = true;

    const loadSessions = async () => {
      try {
        const records = await listSessions(userId, 20);
        if (active) {
          setSessions(records);
          setError(null);
        }
      } catch (err) {
        if (active) {
          const message =
            err instanceof Error ? err.message : "Failed to load sessions from Firestore.";
          setError(message);
        }
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    void loadSessions();

    return () => {
      active = false;
    };
  }, [userId]);

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
          <CardDescription>Review and replay recent detection sessions.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          {loading ? (
            <>
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
              <Skeleton className="h-14 w-full" />
            </>
          ) : null}

          {!loading && error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}

          {!loading && !error && sessions.length === 0 ? (
            <p className="text-sm text-muted-foreground">No sessions found for this user yet.</p>
          ) : null}

          {!loading && !error
            ? sessions.map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between rounded-lg border p-3"
                >
                  <div>
                    <p className="text-sm font-medium">
                      Started: {formatSessionDate(session.startTime)}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Ended: {formatSessionDate(session.endTime)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge variant="outline">{session.objectsDetected} detections</Badge>
                    <Badge variant={session.isRecording ? "secondary" : "outline"}>
                      {session.isRecording ? "Recording" : "Complete"}
                    </Badge>
                  </div>
                </div>
              ))
            : null}
        </CardContent>
      </Card>
    </main>
  );
}
