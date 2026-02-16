// page.tsx
import { Suspense } from "react";
import ClientRoomChat from "@/components/client-room-chat";

export default async function Page({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <Suspense fallback={<div>Loading chat...</div>}>
      <RoomPage params={params} />
    </Suspense>
  );
}

async function RoomPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ClientRoomChat roomId={id} />;
}
