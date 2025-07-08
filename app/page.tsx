import ChatWidget from "@/components/chat-widget"

export default function Home() {
  return (
    <div className="min-h-screen bg-gray-900">
      {/* Simple test page */}
      <div className="p-8">
        <h1 className="text-3xl text-gray-100 text-center mb-4">Qadri Group Chat Widget</h1>
        <p className="text-gray-400 text-center">
          The chat widget is active in the bottom-right corner. Click the Qadri Group logo to start chatting.
        </p>
      </div>

      {/* Demo content */}
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-5xl lg:text-6xl font-bold text-gray-100 mb-12 text-center">
          Qadri Group HR Assistant Demo
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-16">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
            <h2 className="text-3xl font-bold mb-6 text-gray-100">About the Assistant</h2>
            <p className="text-gray-300 text-lg leading-relaxed">
              This is a demo of the Qadri Group HR Assistant chat widget. The widget appears in the bottom-right corner
              with the official Qadri Group logo and can be clicked to open the chat interface. It features a fully
              black and gray theme optimized for large LCD screens.
            </p>
          </div>

          <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
            <h2 className="text-3xl font-bold mb-6 text-gray-100">Features</h2>
            <ul className="text-gray-300 space-y-3 text-lg">
              <li className="flex items-center">
                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-4"></span>
                Responsive design for all screen sizes
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-orange-500 rounded-full mr-4"></span>
                Real-time chat interface
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-red-500 rounded-full mr-4"></span>
                API integration with knowledge base
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-yellow-500 rounded-full mr-4"></span>
                Professional Qadri Group branding
              </li>
              <li className="flex items-center">
                <span className="w-3 h-3 bg-orange-500 rounded-full mr-4"></span>
                Full black and gray theme
              </li>
            </ul>
          </div>
        </div>

        <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
          <h2 className="text-3xl font-bold mb-8 text-gray-100">How to Embed</h2>

          <div className="space-y-8">
            <div>
              <h3 className="text-xl font-bold mb-4 text-yellow-400">Method 1: React/Next.js Integration</h3>
              <div className="bg-black p-6 rounded-xl border border-gray-600">
                <p className="mb-4 text-gray-300 text-lg">
                  Copy the <code className="bg-gray-700 px-3 py-1 rounded text-yellow-400">chat-widget.tsx</code>{" "}
                  component to your project:
                </p>
                <pre className="bg-gray-900 text-green-400 p-6 rounded-lg overflow-x-auto text-sm lg:text-base border border-gray-700">
                  {`import ChatWidget from './components/chat-widget'

export default function Layout({ children }) {
  return (
    <div className="bg-gray-900 min-h-screen">
      {children}
      <ChatWidget />
    </div>
  )
}`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-yellow-400">Method 2: Standalone HTML Integration</h3>
              <div className="bg-black p-6 rounded-xl border border-gray-600">
                <p className="mb-4 text-gray-300 text-lg">For non-React websites, include the compiled widget:</p>
                <pre className="bg-gray-900 text-green-400 p-6 rounded-lg overflow-x-auto text-sm lg:text-base border border-gray-700">
                  {`<!-- Add before closing </body> tag -->
<script src="https://your-domain.com/qadri-chat-widget.js"></script>
<div id="qadri-chat-widget"></div>

<script>
  // Initialize the widget
  window.initQadriChat();
</script>

<!-- Make sure your page has dark background -->
<style>
  body { background-color: #111827; }
</style>`}
                </pre>
              </div>
            </div>

            <div>
              <h3 className="text-xl font-bold mb-4 text-yellow-400">Configuration</h3>
              <div className="bg-black p-6 rounded-xl border border-gray-600">
                <p className="mb-4 text-gray-300 text-lg">Update the API endpoint:</p>
                <pre className="bg-gray-900 text-green-400 p-6 rounded-lg overflow-x-auto text-sm lg:text-base border border-gray-700">
                  {`// In chat-widget.tsx, update this line:
const response = await fetch('http://localhost:8000/ask', {
  // Change to your actual API endpoint
  // Example: 'https://api.qadrigroup.com/ask'
})`}
                </pre>
              </div>
            </div>
          </div>

          <div className="bg-gray-700 border-l-4 border-yellow-500 p-6 mt-8 rounded-r-xl">
            <h4 className="font-bold text-yellow-400 mb-3 text-lg">Important Notes:</h4>
            <ul className="text-gray-300 space-y-2">
              <li>• Widget is optimized for large LCD screens with responsive scaling</li>
              <li>• Full black and gray theme - no white colors used</li>
              <li>• Qadri Group logo integrated as chat button and bot avatar</li>
              <li>• Make sure your API endpoint supports CORS for web requests</li>
              <li>• Update the API URL from localhost to your production endpoint</li>
              <li>• The widget uses Tailwind CSS classes - ensure Tailwind is available</li>
            </ul>
          </div>
        </div>
      </div>

      {/* Chat Widget */}
      <ChatWidget />
    </div>
  )
}
