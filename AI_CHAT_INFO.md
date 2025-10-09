# 🤖 AI Chat Interface - Claude/ChatGPT Style

## 🚀 Access the AI Chat
**URL:** http://localhost:3002/ai-chat

## ✨ Features Implemented

### 💬 Chat Interface
- **Clean, modern UI** similar to Claude/ChatGPT
- **Real-time streaming** responses from Claude AI
- **Markdown rendering** with syntax highlighting
- **Code blocks** with language-specific highlighting
- **Math equations** support with KaTeX

### 📝 Message Features
- **Copy messages** to clipboard
- **Regenerate responses** with one click
- **Message history** preserved during session
- **User/AI avatars** for visual distinction
- **Timestamp tracking** for all messages

### 💾 Conversation Management
- **Sidebar with conversation history**
- **Search conversations** functionality
- **Create new chats** with one click
- **Delete conversations** as needed
- **Auto-save** to browser localStorage
- **Load previous conversations** instantly

### 🎨 UI/UX Features
- **Collapsible sidebar** for more space
- **Auto-resizing textarea** for input
- **Enter to send** (Shift+Enter for new line)
- **Stop generation** button during streaming
- **Suggested prompts** when chat is empty
- **Loading indicators** and animations
- **Dark mode** support

### ⚙️ Technical Features
- **Streaming API** integration with Claude
- **Abort controller** for stopping requests
- **Error handling** with user feedback
- **Session persistence** with localStorage
- **Responsive design** for all screen sizes

## 🎯 How to Use

1. **Navigate to:** http://localhost:3002/ai-chat
2. **Type your message** in the input field
3. **Press Enter** to send (or click send button)
4. **Watch the response** stream in real-time
5. **Use sidebar** to manage conversations

## 💡 Example Prompts to Try

```
- "Explain quantum computing in simple terms"
- "Write a Python function to sort a list"
- "What are the latest AI trends in 2024?"
- "Create a React component for a todo list"
- "Explain the difference between TCP and UDP"
```

## 🔧 API Configuration

The chat uses the Claude API configured in your `.env.local`:
```
ANTHROPIC_API_KEY=your-anthropic-api-key
```

**Note:** You need a valid Anthropic API key for the chat to work properly.

## 📌 Key Files

- **Chat Page:** `/app/ai-chat/page.tsx`
- **Streaming API:** `/app/api/ai/stream/route.ts`
- **Claude Service:** `/lib/ai/claude.service.ts`

## 🎨 Customization Options

- Modify the UI theme in the page component
- Adjust streaming behavior in the API route
- Change the AI model in the Claude service
- Add more suggested prompts
- Customize the sidebar layout

---

The AI Chat interface provides a full-featured chat experience similar to Claude or ChatGPT, with all modern conveniences including streaming, markdown support, conversation management, and a beautiful UI!