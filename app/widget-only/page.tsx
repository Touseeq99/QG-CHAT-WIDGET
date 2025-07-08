import ChatWidget from "@/components/chat-widget"

export default function WidgetOnly() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Just the widget - no demo content */}
      <div className="p-8">
        <h1 className="text-2xl text-gray-100 text-center">Chat Widget Only - Ready for Embedding</h1>
        <p className="text-gray-400 text-center mt-4">
          This page contains only the chat widget component for testing and embedding.
        </p>
      </div>

      <ChatWidget />
    </div>
  )
}
