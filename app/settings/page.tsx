"use client";

import { type FormEvent, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { useAuth } from "@/lib/auth/auth-context";

export default function SettingsPage() {
  const { user, isLoading, signInWithGoogle, getIdToken } = useAuth();
  const [apiKey, setApiKey] = useState("");
  const [status, setStatus] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setStatus(null);
    setError(null);

    const idToken = await getIdToken();
    if (!idToken) {
      setError("Sign in is required before storing a key.");
      return;
    }

    try {
      setIsSaving(true);
      const response = await fetch("/api/gemini/key", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${idToken}`,
        },
        body: JSON.stringify({ apiKey }),
      });

      const payload = (await response.json()) as { error?: string };
      if (!response.ok) {
        throw new Error(payload.error ?? "Unable to store Gemini key.");
      }

      setStatus("Gemini API key saved for your user.");
      setApiKey("");
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "Save failed.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <main className="mx-auto max-w-4xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {!isLoading && !user ? (
            <div className="space-y-3">
              <p className="text-sm text-muted-foreground">
                Sign in with Google to configure your personal Gemini API key.
              </p>
              <Button onClick={() => void signInWithGoogle()}>Continue with Google</Button>
            </div>
          ) : null}

          {user ? (
            <form className="space-y-3" onSubmit={onSubmit}>
              <p className="text-sm text-muted-foreground">
                Your Gemini key is stored on the server for this Firebase user and used to mint
                short-lived Live API tokens.
              </p>
              <Input
                type="password"
                placeholder="AIza..."
                value={apiKey}
                onChange={(event) => setApiKey(event.target.value)}
                required
              />
              <Button type="submit" disabled={isSaving}>
                {isSaving ? "Saving..." : "Save Gemini Key"}
              </Button>
            </form>
          ) : null}

          {status ? <p className="text-sm text-emerald-600">{status}</p> : null}
          {error ? (
            <p className="rounded-md border border-destructive/30 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </p>
          ) : null}
        </CardContent>
      </Card>
    </main>
  );
}
