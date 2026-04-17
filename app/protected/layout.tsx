import ChatLayout from "@/components/chat-layout";

export default function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <ChatLayout>
      {children}
    </ChatLayout>
  );
}
