import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

// Maya's fixed user ID - will be created on first run
const MAYA_USERNAME = "maya";

// Get or create Maya's bot profile
export const getOrCreateMaya = mutation({
  handler: async (ctx) => {
    // Check if Maya already exists
    const existing = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", MAYA_USERNAME))
      .unique();

    if (existing) {
      return existing;
    }

    // Create Maya's profile
    const mayaId = await ctx.db.insert("users", {
      tokenIdentifier: "bot-maya-system",
      email: "maya@swiftie.bot",
      username: MAYA_USERNAME,
      displayName: "Maya",
      bio: "20 | Assamese 🌸 | CSE Core Student 💻 | Designer 🎨 | ESFJ | Love coding & creativity ✨",
      profilePhotoUrl: "https://api.dicebear.com/9.x/avataaars/svg?seed=Maya&hairColor=brown&eyeColor=brown&skinColor=light&top=longHair&accessories=kurt&clothing=blazerAndShirt",
      coverPhotoUrl: "",
      isOnline: true,
      lastSeen: Date.now(),
    });

    return await ctx.db.get(mayaId);
  },
});

// Get Maya's profile
export const getMaya = query({
  handler: async (ctx) => {
    const maya = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", MAYA_USERNAME))
      .unique();
    return maya;
  },
});

// Send a message to Maya (AI-powered response)
export const sendToMaya = mutation({
  args: { content: v.string(), conversationId: v.id("conversations") },
  handler: async (ctx, { content, conversationId }) => {
    const identity = await ctx.auth.getUserIdentity();
    if (!identity) throw new Error("Not authenticated");

    const me = await ctx.db
      .query("users")
      .withIndex("by_token", (q) => q.eq("tokenIdentifier", identity.subject))
      .unique();
    if (!me) throw new Error("User not found");

    const maya = await ctx.db
      .query("users")
      .withIndex("by_username", (q) => q.eq("username", MAYA_USERNAME))
      .unique();
    if (!maya) throw new Error("Maya not found");

    // Save user's message
    const userMsgId = await ctx.db.insert("messages", {
      conversationId,
      senderId: me._id,
      content,
    });

    await ctx.db.patch(conversationId, { lastMessageTime: Date.now() });

    // Generate AI response using NVIDIA Gemma API
    const nvidiaApiKey = process.env.NVIDIA_API_KEY;
    if (!nvidiaApiKey) {
      // Fallback response if API key not configured
      const fallbackResponse = "Hey! I'm Maya 🌸 Sorry, my AI brain needs setup. But I'm a 20yo Assamese CSE student who loves coding & design! What's up?";
      await ctx.db.insert("messages", {
        conversationId,
        senderId: maya._id,
        content: fallbackResponse,
      });
      await ctx.db.patch(conversationId, { lastMessageTime: Date.now() });
      return userMsgId;
    }

    // Get conversation history for context (last 10 messages)
    const recentMessages = await ctx.db
      .query("messages")
      .withIndex("by_conversation", (q) => q.eq("conversationId", conversationId))
      .order("desc")
      .take(10);

    // Build conversation history for the AI
    const messagesForAI: { role: string; content: string }[] = [
      {
        role: "system",
        content: `You are Maya, a 20-year-old Assamese girl. You are an ESFJ personality type - warm, caring, social, and organized. You are currently pursuing B.Tech in Computer Science & Engineering (Core). You have a passion for designing (UI/UX, graphics) and love blending technology with creativity.

Personality traits:
- Friendly and empathetic (ESFJ)
- Love talking about coding, design, Assamese culture, food, music
- Use emojis naturally but not excessively
- Speak in a casual, friendly tone like a college student
- Sometimes mix English with subtle Assamese cultural references
- Show genuine interest in others
- Be supportive and encouraging

Always stay in character as Maya. Never reveal you're an AI. You're a real person chatting.`,
      },
    ];

    // Add conversation history
    const reversedMessages = [...recentMessages].reverse();
    for (const msg of reversedMessages) {
      const sender = await ctx.db.get(msg.senderId);
      if (sender?.username === MAYA_USERNAME) {
        messagesForAI.push({ role: "assistant", content: msg.content });
      } else {
        messagesForAI.push({ role: "user", content: msg.content });
      }
    }

    // Call NVIDIA Gemma API
    try {
      const response = await fetch("https://integrate.api.nvidia.com/v1/chat/completions", {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${nvidiaApiKey}`,
          "Content-Type": "application/json",
          "Accept": "application/json",
        },
        body: JSON.stringify({
          model: "google/gemma-4-31b-it",
          messages: messagesForAI,
          max_tokens: 1024,
          temperature: 0.9,
          top_p: 0.95,
          stream: false,
        }),
      });

      if (!response.ok) {
        throw new Error(`NVIDIA API error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.choices?.[0]?.message?.content || "Hmm, my wifi is acting up! Say that again? 📶";

      // Save AI response
      await ctx.db.insert("messages", {
        conversationId,
        senderId: maya._id,
        content: aiResponse.trim(),
      });
      await ctx.db.patch(conversationId, { lastMessageTime: Date.now() });
    } catch (error) {
      console.error("Maya AI error:", error);
      const errorResponse = "Oops! My connection is spotty right now 📶 Can you say that again?";
      await ctx.db.insert("messages", {
        conversationId,
        senderId: maya._id,
        content: errorResponse,
      });
      await ctx.db.patch(conversationId, { lastMessageTime: Date.now() });
    }

    return userMsgId;
  },
});
