"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Textarea } from "@/components/ui/textarea" // Import Textarea
import { ScrollArea } from "@/components/ui/scroll-area"
import { X, Send, Loader2, Clock, Wifi, WifiOff, FileText, Timer } from "lucide-react"
import Image from "next/image"

interface Message {
  id: string
  text: string
  sender: "user" | "bot"
  timestamp: Date
  responseTime?: number // in milliseconds
  sources?: string[]
  processingTime?: string
}

const parseMarkdown = (text: string): string => {
  if (!text) return text

  // Store code blocks to prevent their internal newlines from being processed
  const codeBlockMap = new Map<string, string>()
  let codeBlockCounter = 0
  let processedText = text.replace(/```([\s\S]*?)```/g, (match) => {
    const placeholder = `__CODE_BLOCK_${codeBlockCounter++}__`
    codeBlockMap.set(placeholder, match)
    return placeholder
  })

  // Process headers (adjusting margins for "less spaces" and smaller text)
  processedText = processedText
    .replace(/^#### (.*$)/gm, '<h3 class="text-base font-semibold text-neutral-200 mt-2 mb-1">$1</h3>')
    .replace(/^### (.*$)/gm, '<h2 class="text-lg font-semibold text-neutral-200 mt-3 mb-1">$1</h2>')
    .replace(/^## (.*$)/gm, '<h1 class="text-xl font-bold text-neutral-200 mt-4 mb-2">$1</h1>')

  // Process lists (adjusting margins for "less spaces" and smaller text)
  processedText = processedText
    .replace(/^- (.*$)/gm, '<li class="ml-4 mb-0.5 text-neutral-300">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 mb-0.5 text-neutral-300 list-decimal">$1</li>')

  // Process tables
  processedText = processedText.replace(
    /^\|(.+)\|\n\|(---[:| -]*)+\|\n((?:\|.*\|\n?)*)/gm,
    (match, headerLine, separatorLine, bodyLines) => {
      const headers = headerLine
        .split("|")
        .map((h: string) => h.trim())
        .filter(Boolean)
      const rows = bodyLines
        .split("\n")
        .filter(Boolean)
        .map((row: string) =>
          row
            .split("|")
            .map((cell: string) => cell.trim())
            .filter(Boolean),
        )

      let tableHtml = '<div class="overflow-x-auto my-4"><table class="w-full border-collapse text-neutral-300">'

      // Table Header
      tableHtml += '<thead><tr class="bg-neutral-800">'
      headers.forEach((header: string) => {
        tableHtml += `<th class="border border-neutral-700 px-4 py-2 text-left font-semibold">${header}</th>`
      })
      tableHtml += "</tr></thead>"

      // Table Body
      tableHtml += "<tbody>"
      rows.forEach((row: string[]) => {
        tableHtml += '<tr class="even:bg-neutral-900 odd:bg-neutral-950">'
        row.forEach((cell: string) => {
          tableHtml += `<td class="border border-neutral-800 px-4 py-2">${cell}</td>`
        })
        tableHtml += "</tr>"
      })
      tableHtml += "</tbody></table></div>"
      return tableHtml
    },
  )

  // Handle paragraphs and remaining line breaks
  const paragraphs = processedText.split(/\n{2,}/).filter((p) => p.trim().length > 0)

  processedText = paragraphs
    .map((paragraph) => {
      const cleanedParagraph = paragraph.replace(/\n/g, " ").trim()
      return cleanedParagraph ? `<p class="mb-2 text-neutral-300">${cleanedParagraph}</p>` : ""
    })
    .join("")

  // Process inline elements (smaller text for code)
  processedText = processedText
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-neutral-200">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-neutral-300">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-neutral-700 px-2 py-1 rounded text-green-400 text-xs">$1</code>')
    .replace(
      /\[([^\]]+)\]\$\$([^)]+)\$\$/g,
      '<a href="$2" class="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>',
    )

  // Restore code blocks
  codeBlockMap.forEach((originalCodeBlock, placeholder) => {
    processedText = processedText.replace(
      placeholder,
      originalCodeBlock.replace(
        /```([\s\S]*?)```/,
        `<pre class="bg-neutral-700 p-3 rounded-lg mt-2 mb-2 overflow-x-auto"><code class="text-green-400 text-xs">$1</code></pre>`,
      ),
    )
  })

  return processedText
}

export default function ChatWidget() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [showWelcome, setShowWelcome] = useState(true)
  const [inputValue, setInputValue] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<"connected" | "disconnected" | "checking">("disconnected")
  const [lastConnectionCheck, setLastConnectionCheck] = useState<Date | null>(null)
  const messagesEndRef = useRef<HTMLDivElement>(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  // Check backend connection on mount (non-blocking)
  useEffect(() => {
    // Don't block the UI, check connection in background
    setTimeout(() => {
      checkBackendConnection()
    }, 1000)
  }, [])

  const getApiEndpoints = () => {
    // Your specific backend endpoints
    return ["http://127.0.0.1:8000/ask", "http://localhost:8000/ask"]
  }

  const checkBackendConnection = async () => {
    setConnectionStatus("checking")
    setLastConnectionCheck(new Date())

    const endpoints = ["http://127.0.0.1:8000", "http://localhost:8000"]
    let connected = false

    for (const baseUrl of endpoints) {
      try {
        const controller = new AbortController()
        const timeoutId = setTimeout(() => controller.abort(), 5000) // 5 second timeout

        const response = await fetch(`${baseUrl}/health`, {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },
          signal: controller.signal,
          mode: "cors",
        })

        clearTimeout(timeoutId)

        if (response.ok || response.status === 200) {
          console.log(`✅ Backend connected via ${baseUrl}`)
          connected = true
          break
        }
      } catch (error) {
        console.log(`❌ Failed to connect to ${baseUrl}:`, error instanceof Error ? error.message : "Unknown error")
      }
    }

    setConnectionStatus(connected ? "connected" : "disconnected")
  }

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
    const startTime = performance.now()

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
      const endpoints = getApiEndpoints()
      let response = null
      let lastError = null
      let usedEndpoint = ""

      for (const baseUrl of endpoints) {
        const askEndpoint = `${baseUrl}`
        try {
          console.log(`🔄 Trying API endpoint: ${askEndpoint}`)
          usedEndpoint = askEndpoint

          const controller = new AbortController()
          // Set timeout to 60 seconds (60000 milliseconds)
          const timeoutId = setTimeout(() => controller.abort(), 60000)

          response = await fetch(askEndpoint, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              question: currentInput,
              timestamp: new Date().toISOString(),
            }),
            signal: controller.signal,
            mode: "cors",
          })

          clearTimeout(timeoutId)

          if (response.ok) {
            setConnectionStatus("connected")
            console.log(`✅ Successfully connected to ${askEndpoint}`)
            break // Success, exit the loop
          } else {
            throw new Error(`HTTP ${response.status}: ${response.statusText}`)
          }
        } catch (error) {
          lastError = error
          console.warn(
            `❌ Failed to connect to ${askEndpoint}:`,
            error instanceof Error ? error.message : "Unknown error",
          )
          continue // Try next endpoint
        }
      }

      if (!response || !response.ok) {
        setConnectionStatus("disconnected")
        throw lastError || new Error("All API endpoints failed")
      }

      const endTime = performance.now()
      const responseTime = Math.round(endTime - startTime)
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
            responseTime: responseTime,
            sources: data.sources || [],
            processingTime: data.processing_time || null,
          },
        ]
      })

      console.log(`✅ Response received in ${responseTime}ms from ${usedEndpoint}`)
    } catch (error) {
      console.error("Chat API Error:", error)
      setConnectionStatus("disconnected")

      const endTime = performance.now()
      const responseTime = Math.round(endTime - startTime)

      // Remove loading message and add error response
      setMessages((prev) => {
        const filtered = prev.filter((msg) => msg.id !== "loading")
        return [
          ...filtered,
          {
            id: Date.now().toString(),
            text: `❌ **Connection Error**

I'm unable to connect to the backend service to process your message: "${currentInput}"

**Error Details:**
- Response time: ${responseTime}ms
- Error: ${error instanceof Error && error.name === "AbortError" ? "Request timed out after 60 seconds." : error instanceof Error ? error.message : "Unknown error"}
- Endpoints tried: http://127.0.0.1:8000/ask, http://localhost:8000/ask

**Please ensure:**
1. Backend server is running at http://127.0.0.1:8000
2. The /ask endpoint is available and responding
3. CORS is properly configured on the backend
4. No firewall is blocking the connection

Please try again once the backend service is available.`,
            sender: "bot",
            timestamp: new Date(),
            responseTime: responseTime,
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

  const formatResponseTime = (ms: number) => {
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  const getConnectionStatusColor = () => {
    switch (connectionStatus) {
      case "connected":
        return "text-green-400"
      case "disconnected":
        return "text-red-400"
      case "checking":
        return "text-yellow-400"
      default:
        return "text-neutral-400"
    }
  }

  const getConnectionStatusText = () => {
    switch (connectionStatus) {
      case "connected":
        return "🟢 Connected"
      case "disconnected":
        return "🔴 Disconnected"
      case "checking":
        return "🔄 Checking..."
      default:
        return "⚪ Unknown"
    }
  }

  const getConnectionIcon = () => {
    switch (connectionStatus) {
      case "connected":
        return <Wifi className="h-4 w-4" />
      case "disconnected":
        return <WifiOff className="h-4 w-4" />
      case "checking":
        return <Loader2 className="h-4 w-4 animate-spin" />
      default:
        return <Clock className="h-4 w-4" />
    }
  }

  const renderSources = (sources: string[]) => {
    if (!sources || sources.length === 0) return null

    // Remove duplicates and filter out empty sources
    const uniqueSources = [...new Set(sources.filter((source) => source && source.trim()))]

    if (uniqueSources.length === 0) return null

    return (
      <div className="mt-3 p-3 bg-neutral-800 rounded-lg border-l-4 border-blue-500">
        <div className="flex items-center space-x-2 mb-2">
          <FileText className="h-4 w-4 text-blue-400" />
          <span className="text-xs font-medium text-blue-400">Sources Referenced:</span>
        </div>
        <div className="space-y-1">
          {uniqueSources.map((source, index) => (
            <div key={index} className="text-xs text-neutral-300 flex items-center space-x-2">
              <span className="w-1 h-1 bg-blue-400 rounded-full"></span>
              <span>{source}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Chat Button with Real Qadri Logo */}
      {!isOpen && (
        <Button
          onClick={() => setIsOpen(true)}
          className="h-16 w-16 lg:h-20 lg:w-20 rounded-full bg-neutral-900 hover:bg-neutral-800 shadow-2xl transition-all duration-300 hover:scale-105 p-2 relative"
          size="icon"
        >
          <div className="w-full h-full relative">
            <Image src="/qadri-logo.png" alt="Qadri Group" fill className="object-contain rounded-full" />
          </div>
          {/* Connection status indicator */}
          <div
            className={`absolute -top-1 -right-1 w-4 h-4 rounded-full ${
              connectionStatus === "connected"
                ? "bg-green-500"
                : connectionStatus === "disconnected"
                  ? "bg-red-500"
                  : "bg-yellow-500"
            }`}
          />
        </Button>
      )}

      {/* Chat Window */}
      {isOpen && (
        <div className="bg-neutral-950 rounded-2xl shadow-2xl border border-neutral-800 w-80 sm:w-[400px] lg:w-[500px] xl:w-[600px] h-[450px] sm:h-[600px] lg:h-[700px] xl:h-[800px] flex flex-col animate-in slide-in-from-bottom-2 duration-300">
          {/* Header */}
          <div className="bg-neutral-900 text-neutral-100 p-3 rounded-t-2xl flex items-center justify-between border-b border-neutral-800">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 lg:w-9 lg:h-9 relative">
                <Image src="/qadri-logo.png" alt="Qadri Group" fill className="object-contain rounded-full" />
              </div>
              <div>
                <h3 className="font-bold text-sm lg:text-base">Qadri Group</h3>
                <p className="text-xs text-neutral-400">HR Assistant</p>
                <div className={`text-xs ${getConnectionStatusColor()} flex items-center space-x-1`}>
                  {getConnectionIcon()}
                  <span>Status: {getConnectionStatusText()}</span>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Button
                onClick={checkBackendConnection}
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-full"
                title="Refresh connection"
                disabled={connectionStatus === "checking"}
              >
                {connectionStatus === "checking" ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Clock className="h-4 w-4" />
                )}
              </Button>
              <Button
                onClick={() => setIsOpen(false)}
                variant="ghost"
                size="icon"
                className="h-8 w-8 lg:h-9 lg:w-9 text-neutral-400 hover:text-neutral-100 hover:bg-neutral-800 rounded-full"
              >
                <X className="h-4 w-4 lg:h-5 lg:w-5" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4 bg-neutral-900">
            {showWelcome && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-xs lg:text-sm mb-3 px-3 py-1.5 bg-neutral-800 rounded-lg border border-yellow-500/50 text-yellow-400">
                  Please ask questions in detail to get relevant answers.
                </p>
                <div className="w-16 h-16 lg:w-20 lg:h-20 bg-neutral-900 rounded-full flex items-center justify-center mb-4 p-2">
                  <div className="w-full h-full relative">
                    <Image src="/qadri-logo.png" alt="Qadri Group" fill className="object-contain" />
                  </div>
                </div>
                <h3 className="text-lg lg:text-xl font-bold text-neutral-100 mb-2">Start a conversation</h3>
                <p className="text-sm lg:text-base text-neutral-400 max-w-xs mb-3">
                  Ask me anything about HR policies, procedures, or general inquiries.
                </p>
                <div className={`text-xs ${getConnectionStatusColor()} flex items-center space-x-2`}>
                  {getConnectionIcon()}
                  <span>Status: {getConnectionStatusText()}</span>
                </div>
                {connectionStatus === "disconnected" && (
                  <p className="text-xs text-neutral-500 mt-2 max-w-xs">
                    Backend service is not available. Please ensure your server is running at http://127.0.0.1:8000
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex ${message.sender === "user" ? "justify-end" : "justify-start"}`}
                  >
                    <div
                      className={`flex items-start space-x-2 max-w-[85%] ${message.sender === "user" ? "flex-row-reverse space-x-reverse" : ""}`}
                    >
                      {message.sender === "bot" && (
                        <div className="w-7 h-7 lg:w-8 lg:h-8 relative flex-shrink-0 mt-0.5">
                          <Image src="/qadri-logo.png" alt="Qadri Group" fill className="object-contain rounded-full" />
                        </div>
                      )}
                      <div className="flex flex-col">
                        <div
                          className={`px-4 py-3 lg:px-5 lg:py-4 rounded-xl text-sm lg:text-base whitespace-pre-line ${
                            message.sender === "user"
                              ? "bg-neutral-700 text-neutral-200" // User message background
                              : "bg-neutral-800 text-neutral-100 border border-neutral-700" // Bot message background with border
                          }`}
                        >
                          {message.id === "loading" ? (
                            <div className="flex items-center space-x-2">
                              <Loader2 className="h-4 w-4 lg:h-5 lg:w-5 animate-spin text-yellow-500" />
                              <span>{message.text}</span>
                            </div>
                          ) : message.sender === "bot" ? (
                            <div
                              className="prose prose-invert max-w-none"
                              dangerouslySetInnerHTML={{
                                __html: parseMarkdown(message.text),
                              }}
                            />
                          ) : (
                            message.text
                          )}
                        </div>

                        {/* Sources section */}
                        {message.sender === "bot" && message.sources && renderSources(message.sources)}

                        {/* Response time and processing time indicators */}
                        {message.sender === "bot" && (message.responseTime || message.processingTime) && (
                          <div className="text-xs text-neutral-500 mt-1.5 flex items-center space-x-3">
                            {message.responseTime && (
                              <div className="flex items-center space-x-0.5">
                                <Clock className="h-3 w-3" />
                                <span>Network: {formatResponseTime(message.responseTime)}</span>
                              </div>
                            )}
                            {message.processingTime && (
                              <div className="flex items-center space-x-0.5">
                                <Timer className="h-3 w-3" />
                                <span>Processing: {message.processingTime}</span>
                              </div>
                            )}
                          </div>
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
          <div className="p-4 border-t border-neutral-800 bg-neutral-900">
            <div className="flex space-x-3 items-end">
              <Textarea
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isLoading}
                className="flex-1 text-sm lg:text-base py-2.5 px-4 rounded-xl border-2 border-neutral-700 bg-neutral-800 text-neutral-100 placeholder-neutral-400 focus:border-yellow-500 focus:ring-0 h-24" // Fixed height, no resize, no overflow-y-auto
              />
              <Button
                onClick={sendMessage}
                disabled={!inputValue.trim() || isLoading}
                size="icon"
                className="bg-neutral-700 hover:bg-neutral-600 text-neutral-100 hover:scale-105 h-16 w-16 lg:h-18 lg:w-18 rounded-full transition-all duration-200 flex-shrink-0" // Gray button
              >
                <Send className="h-6 w-6 lg:h-7 lg:w-7 text-neutral-100" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
