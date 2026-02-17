import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SettingsPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Configure API keys, camera defaults, and privacy controls.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
