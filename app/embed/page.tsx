import ChatWidget from "@/components/chat-widget"

export default function EmbedPage() {
  return (
    <div className="min-h-screen w-full bg-transparent">
      {/* Completely transparent page - only chat widget visible */}
      <ChatWidget />
    </div>
  )
}
