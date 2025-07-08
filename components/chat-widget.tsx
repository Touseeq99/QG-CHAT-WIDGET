"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Send, Loader2 } from "lucide-react"
import Image from "next/image"
import { AbortSignal } from "abort-controller"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [showWelcome, setShowWelcome] = useState(true)
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Post message to parent window when widget opens/closes
  useEffect(() => {
    if (typeof window !== "undefined" && window.parent !== window) {
      window.parent.postMessage(
        {
          type: "CHAT_WIDGET_STATE",
          isOpen: isOpen,
        },
        "*",
      )
    }
  }, [isOpen])

  const sendMessage = async () => {
    if (!inputValue.trim() || isLoading) return

    setShowWelcome(false)

    const userMessage: Message = {
      id: Date.now().toString(),
      text: inputValue,
      sender: "user",
      timestamp: new Date(),
    }

    setMessages((prev) => [...prev, userMessage])
    const currentInput = inputValue
    setInputValue("")
    setIsLoading(true)

    // Add loading message
    const loadingMessage: Message = {
      id: "loading",
      text: "Searching knowledge base...",
      sender: "bot",
      timestamp: new Date(),
    }
    setMessages((prev) => [...prev, loadingMessage])

    try {
      // Try multiple API endpoints
      const apiEndpoints = [
        "http://127.0.0.1:8000/ask",
        "http://localhost:8000/ask",
        "https://your-api-domain.com/ask", // Replace with your actual API domain
      ]

      let response = null
      let lastError = null

      for (const endpoint of apiEndpoints) {
        try {
          console.log(`Trying API endpoint: ${endpoint}`)

          response = await fetch(endpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify({ question: currentInput }),
            // Add timeout
            signal: AbortSignal.timeout(10000), // 10 second timeout
          })

          if (response.ok) {
            break // Success, exit the loop
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        } catch (error) {
          lastError = error
          console.warn(`Failed to connect to ${endpoint}:`, error)
          continue // Try next endpoint
        }
      }

      if (!response || !response.ok) {
        throw lastError || new Error("All API endpoints failed")
      }

      const data = await response.json()

      // Remove loading message and add actual response
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== "loading")
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            text: data.answer || data.response || "I received your message but couldn't generate a proper response.",
            sender: "bot",
            timestamp: new Date(),
          },
        ]
      })
    } catch (error) {
      console.error("Chat API Error:", error)

      // Remove loading message and add error response with helpful message
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== "loading")
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            text: `I'm currently unable to connect to the knowledge base. This might be because:

• The backend server at 127.0.0.1:8000 is not running
• There's a CORS (Cross-Origin) policy blocking the request
• Network connectivity issues

For now, I'm working in demo mode. Your message "${currentInput}" was received, but I can't provide AI-powered responses until the backend is properly configured.

Please check that your backend server is running and accessible.`,
            sender: "bot",
            timestamp: new Date(),
          },
        ]
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button with Real Qadri Logo */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 lg:h-20 lg:w-20 rounded-full bg-black hover:bg-gray-800 shadow-2xl transition-all duration-300 hover:scale-105 p-2"
          size="icon"
        >
          <div className="w-full h-full relative">
            <Image src="/qadri-logo.png" alt="Qadri Group" fill className="object-contain rounded-full" />
          </div>
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-gray-900 rounded-2xl shadow-2xl border border-gray-700 w-96 sm:w-[450px] lg:w-[550px] xl:w-[650px] h-[500px] sm:h-[650px] lg:h-[750px] xl:h-[850px] flex flex-col animate-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div className="bg-black text-gray-100 p-6 rounded-t-2xl flex items-center justify-between border-b border-gray-700">
            <div className="flex items-center space-x-4">
              <div className="w-10 h-10 lg:w-12 lg:h-12 relative">
                <Image src="/qadri-logo.png" alt="Qadri Group" fill className="object-contain rounded-full" />
              </div>
              <div>
                <h3 className="font-bold text-lg lg:text-xl">Qadri Group</h3>
                <p className="text-sm lg:text-base text-gray-400">HR Assistant</p>
              </div>
            </div>
            <Button
              onClick={() => setIsOpen(false)}
              variant="ghost"
              size="icon"
              className="h-10 w-10 lg:h-12 lg:w-12 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-full"
            >
              <X className="h-5 w-5 lg:h-6 lg:w-6" />
            </Button>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-6 bg-gray-900">
            {showWelcome && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-black rounded-full flex items-center justify-center mb-6 p-3">
                  <div className="w-full h-full relative">
                    <Image src="/qadri-logo.png" alt="Qadri Group" fill className="object-contain" />
                  </div>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-100 mb-3">Start a conversation</h3>
                <p className="text-gray-400 text-base lg:text-lg max-w-md">
                  Ask me anything about HR policies, procedures, or general inquiries.
                </p>
              </div>
            ) : (
              <div className="space-y-6">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex items-start space-x-3 max-w-[85%] ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                    >
                      {message.sender === "bot" && (
                        <div className="w-8 h-8 lg:w-10 lg:h-10 relative flex-shrink-0 mt-1">
                          <Image src="/qadri-logo.png" alt="Qadri Group" fill className="object-contain rounded-full" />
                        </div>
                      )}
                      <div
                        className={`px-5 py-4 lg:px-6 lg:py-5 rounded-2xl text-base lg:text-lg whitespace-pre-line ${
                          message.sender === "user"
                            ? "bg-gray-700 text-gray-100"
                            : "bg-gray-800 text-gray-200 border border-gray-700"
                        }`}
                      >
                        {message.id === "loading" ? (
                          <div className="flex items-center space-x-3">
                            <Loader2 className="h-5 w-5 lg:h-6 lg:w-6 animate-spin text-yellow-500" />
                            <span>{message.text}</span>
                          </div>
                        ) : (
                          message.text
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div ref={messagesEndRef} />
          </ScrollArea>

          {/* Input */}
          <div className="p-6 border-t border-gray-700 bg-gray-900">
            <div className="flex space-x-4">
              <Input
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 text-base lg:text-lg py-4 lg:py-5 px-6 lg:px-7 rounded-full border-2 border-gray-600 bg-gray-800 text-gray-100 placeholder-gray-400 focus:border-yellow-500 focus:ring-0 focus:bg-gray-700"
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="bg-gradient-to-br from-yellow-400 via-orange-500 to-red-500 hover:scale-105 h-14 w-14 lg:h-16 lg:w-16 rounded-full transition-all duration-200"
              >
                <Send className="h-6 w-6 lg:h-7 lg:w-7 text-black" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
