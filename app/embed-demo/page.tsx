export default function EmbedDemo() {
  return (
    <div className="min-h-screen bg-gray-900">
      <div className="container mx-auto px-6 py-12">
        <h1 className="text-4xl lg:text-5xl font-bold text-gray-100 mb-8 text-center">Embedding Demo Page</h1>

        <div className="max-w-4xl mx-auto">
          <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700 mb-8">
            <h2 className="text-2xl font-bold text-gray-100 mb-6">Step-by-Step Embedding Guide</h2>

            <div className="space-y-6">
              <div className="border-l-4 border-yellow-500 pl-6">
                <h3 className="text-xl font-semibold text-yellow-400 mb-2">Step 1: Download Files</h3>
                <p className="text-gray-300">Download the chat-widget.tsx component and required dependencies.</p>
              </div>

              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-xl font-semibold text-orange-400 mb-2">Step 2: Install Dependencies</h3>
                <div className="bg-black p-4 rounded-lg mt-2">
                  <code className="text-green-400">npm install lucide-react</code>
                </div>
              </div>

              <div className="border-l-4 border-red-500 pl-6">
                <h3 className="text-xl font-semibold text-red-400 mb-2">Step 3: Import Component</h3>
                <div className="bg-black p-4 rounded-lg mt-2">
                  <code className="text-green-400">import ChatWidget from './components/chat-widget'</code>
                </div>
              </div>

              <div className="border-l-4 border-yellow-500 pl-6">
                <h3 className="text-xl font-semibold text-yellow-400 mb-2">Step 4: Add to Layout</h3>
                <div className="bg-black p-4 rounded-lg mt-2">
                  <code className="text-green-400">{"<ChatWidget />"}</code>
                </div>
              </div>

              <div className="border-l-4 border-orange-500 pl-6">
                <h3 className="text-xl font-semibold text-orange-400 mb-2">Step 5: Configure API</h3>
                <p className="text-gray-300">Update the API endpoint from localhost to your production URL.</p>
              </div>
            </div>
          </div>

          <div className="bg-gray-800 p-8 rounded-2xl shadow-xl border border-gray-700">
            <h2 className="text-2xl font-bold text-gray-100 mb-6">Live Demo</h2>
            <p className="text-gray-300 text-lg mb-4">
              The chat widget is currently active on this page. Look for the Qadri Group logo button in the bottom-right
              corner to test the functionality.
            </p>
            <div className="bg-gray-700 p-4 rounded-lg">
              <p className="text-yellow-400 font-semibold">
                ✨ The widget automatically scales for different screen sizes and maintains the black/gray theme
                throughout the interface.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
