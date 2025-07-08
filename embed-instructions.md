# Qadri Group Chat Widget - Embedding Instructions

## Files You Need

1. `components/chat-widget.tsx` - The main widget component
2. `public/qadri-logo.png` - Your logo file
3. Required dependencies: `lucide-react`, `@/components/ui/*`

## Method 1: React/Next.js Project

### Step 1: Copy Files
\`\`\`bash
# Copy the chat widget component
cp components/chat-widget.tsx your-project/components/

# Copy the logo
cp public/qadri-logo.png your-project/public/
\`\`\`

### Step 2: Install Dependencies
\`\`\`bash
npm install lucide-react
# Make sure you have shadcn/ui components installed
\`\`\`

### Step 3: Import and Use
\`\`\`jsx
// In your layout.tsx or main component
import ChatWidget from './components/chat-widget'

export default function Layout({ children }) {
  return (
    <div className="min-h-screen bg-gray-900">
      {children}
      <ChatWidget />
    </div>
  )
}
\`\`\`

## Method 2: Any Website (HTML/JavaScript)

### Step 1: Build Standalone Version
\`\`\`bash
# Build the widget as a standalone script
npm run build-widget
\`\`\`

### Step 2: Include in HTML
\`\`\`html
<!DOCTYPE html>
<html>
<head>
    <title>Your Website</title>
    <style>
        body { background-color: #111827; }
    </style>
</head>
<body>
    <!-- Your website content -->
    
    <!-- Chat Widget -->
    <script src="path/to/qadri-chat-widget.js"></script>
    <div id="qadri-chat-widget"></div>
    
    <script>
        // Initialize the widget
        if (window.initQadriChat) {
            window.initQadriChat();
        }
    </script>
</body>
</html>
\`\`\`

## Method 3: WordPress/Other CMS

### For WordPress:
1. Upload `qadri-logo.png` to your media library
2. Add the widget script to your theme's footer.php
3. Or use a plugin like "Insert Headers and Footers"

\`\`\`html
<!-- Add before </body> tag -->
<script src="https://your-domain.com/qadri-chat-widget.js"></script>
<div id="qadri-chat-widget"></div>
<script>window.initQadriChat && window.initQadriChat();</script>
\`\`\`

## Configuration

### Update API Endpoint
In `chat-widget.tsx`, the API is set to:
\`\`\`javascript
const response = await fetch("http://127.0.0.1:8000/ask", {
\`\`\`

For production, change to your domain:
\`\`\`javascript
const response = await fetch("https://your-domain.com/ask", {
\`\`\`

### CORS Setup
Make sure your backend at 127.0.0.1:8000 allows CORS:
```python
# If using FastAPI
from fastapi.middleware.cors import CORSMiddleware

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Configure for your domains
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
