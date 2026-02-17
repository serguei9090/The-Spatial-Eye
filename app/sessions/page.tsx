import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export default function SessionsPage() {
  return (
    <main className="mx-auto max-w-4xl p-6">
      <Card>
        <CardHeader>
          <CardTitle>Session History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Review and replay recent detection sessions.
          </p>
        </CardContent>
      </Card>
    </main>
  );
}
