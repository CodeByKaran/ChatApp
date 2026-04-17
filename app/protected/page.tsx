export default function ProtectedPage() {
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-8">
      <div className="text-center space-y-4">
        <h2 className="text-3xl font-bold text-foreground">Welcome to ChatSafe</h2>
        <p className="text-muted-foreground text-lg max-w-md">
          Select a group from the sidebar to start chatting, or create a new group to begin conversations with your friends.
        </p>
        <div className="pt-6">
          <p className="text-sm text-muted-foreground">Use the Create or Join buttons to get started.</p>
        </div>
      </div>
    </div>
  );
}
