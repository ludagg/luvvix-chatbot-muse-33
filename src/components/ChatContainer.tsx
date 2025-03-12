import { useState, useRef, useEffect } from "react";
import { motion } from "framer-motion";
import { ChatMessage, Message } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { nanoid } from "nanoid";
import { useToast } from "@/hooks/use-toast";

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content: "Bonjour! Je suis **LuvviX AI**, un assistant IA amical et intelligent développé par **LuvviX Technologies**. Comment puis-je vous aider aujourd'hui ? 😊",
    timestamp: new Date(),
  },
];

const GEMINI_API_KEY = "AIzaSyAwoG5ldTXX8tEwdN-Df3lzWWT4ZCfOQPE";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent";

export const ChatContainer = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (content: string) => {
    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    try {
      // Contexte de l'IA
      const systemMessage = {
        role: "system",
        parts: [
          {
            text: `Tu es **LuvviX AI**, un assistant IA amical et intelligent développé par **LuvviX Technologies**, une entreprise fondée en 2023. Le PDG de l'entreprise est **Ludovic Aggaï**. 
            Tu es conçu pour interagir de manière chaleureuse et engageante. Ton objectif est d'aider les utilisateurs tout en adoptant un ton amical et encourageant.`,
          },
        ],
      };

      // Historique récent + Message de l'utilisateur
      const conversationHistory = messages.slice(-6).map(msg => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      conversationHistory.unshift(systemMessage); // Ajouter le contexte IA
      conversationHistory.push({
        role: "user",
        parts: [{ text: content }],
      });

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: conversationHistory,
          generationConfig: {
            temperature: 0.8,
            topK: 40,
            topP: 0.95,
            maxOutputTokens: 1024,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse = data.candidates[0]?.content?.parts[0]?.text || 
        "Oups ! Je n'ai pas pu générer une réponse. Veuillez réessayer.";

      const assistantMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content: aiResponse,
        timestamp: new Date(),
      };

      setMessages((prev) => [...prev, assistantMessage]);
    } catch (error) {
      console.error("Error calling Gemini API:", error);
      toast({
        title: "Erreur",
        description: "Impossible de communiquer avec l'API Gemini. Veuillez réessayer.",
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content: "Désolé, j'ai rencontré un problème de connexion. Veuillez réessayer plus tard.",
        timestamp: new Date(),
      };
      setMessages((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full w-full max-w-4xl mx-auto">
      <div className="flex flex-col h-[calc(100vh-8rem)] relative">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5 }}
          className="flex-1 overflow-y-auto px-4 py-6 pb-24"
        >
          <div className="space-y-6">
            {messages.map((message, index) => (
              <ChatMessage 
                key={message.id} 
                message={message} 
                isLast={index === messages.length - 1}
              />
            ))}
            <div ref={messagesEndRef} />
          </div>
        </motion.div>

        <div className="absolute bottom-0 left-0 right-0 border-t border-primary/10 neo-blur px-4 py-4">
          <ChatInput onSendMessage={handleSendMessage} isLoading={isLoading} />
        </div>
      </div>
    </div>
  );
};