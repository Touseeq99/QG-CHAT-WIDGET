"use client"

import type React from "react"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
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

  // Process headers (adjusting margins for "less spaces")
  processedText = processedText
    .replace(/^#### (.*$)/gm, '<h3 class="text-lg font-semibold text-gray-100 mt-2 mb-1">$1</h3>')
    .replace(/^### (.*$)/gm, '<h2 class="text-xl font-semibold text-gray-100 mt-3 mb-1">$1</h2>')
    .replace(/^## (.*$)/gm, '<h1 class="text-2xl font-bold text-gray-100 mt-4 mb-2">$1</h1>')

  // Process lists (adjusting margins for "less spaces")
  processedText = processedText
    .replace(/^- (.*$)/gm, '<li class="ml-4 mb-0.5 text-gray-200">$1</li>')
    .replace(/^\d+\. (.*$)/gm, '<li class="ml-4 mb-0.5 text-gray-200 list-decimal">$1</li>')

  // Process tables
  // This regex looks for a header row, a separator row, and then subsequent data rows.
  // It's a simplified regex and might not catch all edge cases of markdown tables.
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

      let tableHtml = '<div class="overflow-x-auto my-4"><table class="w-full border-collapse text-gray-200">'

      // Table Header
      tableHtml += '<thead><tr class="bg-gray-700">'
      headers.forEach((header: string) => {
        tableHtml += `<th class="border border-gray-600 px-4 py-2 text-left font-semibold">${header}</th>`
      })
      tableHtml += "</tr></thead>"

      // Table Body
      tableHtml += "<tbody>"
      rows.forEach((row: string[]) => {
        tableHtml += '<tr class="even:bg-gray-800 odd:bg-gray-900">'
        row.forEach((cell: string) => {
          tableHtml += `<td class="border border-gray-700 px-4 py-2">${cell}</td>`
        })
        tableHtml += "</tr>"
      })
      tableHtml += "</tbody></table></div>"
      return tableHtml
    },
  )

  // Handle paragraphs and remaining line breaks
  // Split by two or more newlines to identify distinct paragraphs.
  // Filter out empty strings that might result from splitting.
  const paragraphs = processedText.split(/\n{2,}/).filter((p) => p.trim().length > 0)

  // For each paragraph, replace single newlines with a space (soft break)
  // Then wrap in <p> tags with a reduced bottom margin.
  processedText = paragraphs
    .map((paragraph) => {
      // Replace single newlines within a paragraph with a space
      const cleanedParagraph = paragraph.replace(/\n/g, " ").trim()
      // Only wrap if there's actual content
      return cleanedParagraph ? `<p class="mb-2">${cleanedParagraph}</p>` : ""
    })
    .join("")

  // Process inline elements
  processedText = processedText
    .replace(/\*\*(.*?)\*\*/g, '<strong class="font-semibold text-gray-100">$1</strong>')
    .replace(/\*(.*?)\*/g, '<em class="italic text-gray-200">$1</em>')
    .replace(/`([^`]+)`/g, '<code class="bg-gray-700 px-2 py-1 rounded text-green-400 text-sm">$1</code>')
    .replace(
      /\[([^\]]+)\]\$\$([^)]+)\$\$/g,
      '<a href="$2" class="text-blue-400 hover:text-blue-300 underline" target="_blank" rel="noopener noreferrer">$1</a>',
    )

  // Restore code blocks
  codeBlockMap.forEach((originalCodeBlock, placeholder) => {
    // Restore the original code block content, including its backticks
    processedText = processedText.replace(
      placeholder,
      originalCodeBlock.replace(
        /```([\s\S]*?)```/,
        `<pre class="bg-gray-700 p-3 rounded-lg mt-2 mb-2 overflow-x-auto"><code class="text-green-400 text-sm">$1</code></pre>`,
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
          const timeoutId = setTimeout(() => controller.abort(), 30000) // 30 second timeout for processing

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
- Error: ${error instanceof Error ? error.message : "Unknown error"}
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
        return "text-gray-400"
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
      <div className="mt-3 p-3 bg-gray-700 rounded-lg border-l-4 border-blue-500">
        <div className="flex items-center space-x-2 mb-2">
          <FileText className="h-4 w-4 text-blue-400" />
          <span className="text-sm font-medium text-blue-400">Sources Referenced:</span>
        </div>
        <div className="space-y-1">
          {uniqueSources.map((source, index) => (
            <div key={index} className="text-xs text-gray-300 flex items-center space-x-2">
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
          className="h-16 w-16 lg:h-20 lg:w-20 rounded-full bg-black hover:bg-gray-800 shadow-2xl transition-all duration-300 hover:scale-105 p-2 relative"
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
                className="h-8 w-8 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-full"
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
                className="h-10 w-10 lg:h-12 lg:w-12 text-gray-400 hover:text-gray-100 hover:bg-gray-800 rounded-full"
              >
                <X className="h-5 w-5 lg:h-6 lg:w-6" />
              </Button>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-6 bg-gray-900">
            {showWelcome && messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <p className="text-yellow-400 text-sm lg:text-base mb-4 px-4 py-2 bg-gray-800 rounded-lg border border-yellow-500/50">
                  Please ask questions in detail to get relevant answers.
                </p>
                <div className="w-20 h-20 lg:w-24 lg:h-24 bg-black rounded-full flex items-center justify-center mb-6 p-3">
                  <div className="w-full h-full relative">
                    <Image src="/qadri-logo.png" alt="Qadri Group" fill className="object-contain" />
                  </div>
                </div>
                <h3 className="text-xl lg:text-2xl font-bold text-gray-100 mb-3">Start a conversation</h3>
                <p className="text-gray-400 text-base lg:text-lg max-w-md mb-4">
                  Ask me anything about HR policies, procedures, or general inquiries.
                </p>
                <div className={`text-sm ${getConnectionStatusColor()} flex items-center space-x-2`}>
                  {getConnectionIcon()}
                  <span>Status: {getConnectionStatusText()}</span>
                </div>
                {connectionStatus === "disconnected" && (
                  <p className="text-xs text-gray-500 mt-2 max-w-sm">
                    Backend service is not available. Please ensure your server is running at http://127.0.0.1:8000
                  </p>
                )}
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
                      <div className="flex flex-col">
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
                          <div className="text-xs text-gray-500 mt-2 flex items-center space-x-4">
                            {message.responseTime && (
                              <div className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>Network: {formatResponseTime(message.responseTime)}</span>
                              </div>
                            )}
                            {message.processingTime && (
                              <div className="flex items-center space-x-1">
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
