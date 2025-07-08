"use client"

import { useEffect } from "react"

// This component can be used to create a standalone embeddable script
export default function EmbedScript() {
  useEffect(() => {
    // This would be the logic for the embeddable script
    const initChatWidget = () => {
      const container = document.getElementById("qadri-chat-widget")
      if (container) {
        // Mount the chat widget here
        console.log("Chat widget initialized")
      }
    }

    // Make it globally available
    ;(window as any).initQadriChat = initChatWidget
  }, [])

  return null
}
