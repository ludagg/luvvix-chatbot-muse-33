import { useState, useRef, useEffect } from "react";
import { ChatMessage, Message, SourceReference } from "./ChatMessage";
import { ChatInput } from "./ChatInput";
import { nanoid } from "nanoid";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { SuggestedQuestions } from "./SuggestedQuestions";
import { Sheet, SheetContent, SheetTrigger } from "@/components/ui/sheet";
import { Button } from "./ui/button";
import { Menu } from "lucide-react";
import { ConversationSelector } from "./ConversationSelector";
import { useIsMobile } from "@/hooks/use-mobile";
import { FloatingActions } from "./FloatingActions";

const SAMPLE_QUESTIONS = [
  "Quelle est la différence entre l'intelligence artificielle et l'apprentissage automatique ?",
  "Comment puis-je améliorer ma productivité au quotidien ?",
  "Quelles sont les dernières tendances technologiques à surveiller ?",
  "Comment fonctionne la blockchain et les cryptomonnaies ?",
  "Quels sont les meilleurs livres de développement personnel à lire ?"
];

const INITIAL_MESSAGES: Message[] = [
  {
    id: "1",
    role: "assistant",
    content:
      "Bonjour ! Je suis **LuvviX AI**, un assistant IA amical et intelligent développé par **LuvviX Technologies**. Comment puis-je vous aider aujourd'hui ?! 😊",
    timestamp: new Date(),
  },
];

const GEMINI_API_KEY = "AIzaSyAwoG5ldTXX8tEwdN-Df3lzWWT4ZCfOQPE";
const GEMINI_API_URL = "https://generativelanguage.googleapis.com/v1/models/gemini-1.5-flash:generateContent";
const SERP_API_KEY = "f8c49e3a2fb3f4d82ddb89ccc9e36fc9a85aeab7"; 
const SERP_API_URL = "https://serpapi.com/search.json";
const BRIGHTDATA_API_KEY = "brd-customer-hl_a4fafc73-zone-luvvix:lrxxshdpwp1i";
const BRIGHTDATA_SEARCH_URL = "https://api.brightdata.com/dca/search";

const GOOGLE_SEARCH_API_KEY = "AIzaSyDvNGx_B_JV1tZZH2q-d63DXMpJZ_J6mDw";
const GOOGLE_SEARCH_ENGINE_ID = "c32b4afa82f1648c4";
const GOOGLE_SEARCH_URL = "https://www.googleapis.com/customsearch/v1";

const formatSourceCitations = (content: string, sources: SourceReference[]): string => {
  let formattedContent = content;
  
  sources.forEach(source => {
    const sourceTag = `[^${source.id}]`;
    formattedContent = formattedContent.replace(
      new RegExp(`\\[cite:${source.id}\\]`, 'g'), 
      sourceTag
    );
  });
  
  if (sources.length > 0) {
    formattedContent += "\n\n";
    sources.forEach(source => {
      formattedContent += `[^${source.id}]: [${source.title}](${source.url})\n`;
    });
  }
  
  return formattedContent;
};

export const ChatContainer = () => {
  const [messages, setMessages] = useState<Message[]>(INITIAL_MESSAGES);
  const [isLoading, setIsLoading] = useState(false);
  const [suggestedQuestions, setSuggestedQuestions] = useState<string[]>([]);
  const [isRegenerating, setIsRegenerating] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [shouldAutoScroll, setShouldAutoScroll] = useState(true);
  const chatContainerRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();
  const { 
    user, 
    conversations, 
    currentConversationId, 
    saveCurrentConversation,
    createNewConversation,
    setCurrentConversation,
    isPro = false,
  } = useAuth();
  const isMobile = useIsMobile();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [useAdvancedReasoning, setUseAdvancedReasoning] = useState(false);
  const [useLuvviXThink, setUseLuvviXThink] = useState(false);
  const [useWebSearch, setUseWebSearch] = useState(false);

  const scrollToBottom = () => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  };

  const scrollToTop = () => {
    if (chatContainerRef.current) {
      chatContainerRef.current.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    } else {
      window.scrollTo({
        top: 0,
        behavior: "smooth"
      });
    }
  };

  useEffect(() => {
    if (shouldAutoScroll) {
      scrollToBottom();
    }
  }, [messages, shouldAutoScroll]);

  useEffect(() => {
    const chatContainer = chatContainerRef.current;
    
    const handleScroll = () => {
      if (!chatContainer) return;
      
      const { scrollTop, scrollHeight, clientHeight } = chatContainer;
      const isNearBottom = scrollHeight - scrollTop - clientHeight < 100;
      
      setShouldAutoScroll(isNearBottom);
    };
    
    chatContainer?.addEventListener('scroll', handleScroll);
    
    return () => {
      chatContainer?.removeEventListener('scroll', handleScroll);
    };
  }, []);

  useEffect(() => {
    if (messages.length <= 1 || suggestedQuestions.length === 0) {
      const randomQuestions = [...SAMPLE_QUESTIONS]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      setSuggestedQuestions(randomQuestions);
    }
  }, [messages.length, suggestedQuestions.length]);

  useEffect(() => {
    if (user && currentConversationId) {
      const currentConv = conversations.find(c => c.id === currentConversationId);
      if (currentConv) {
        setMessages(currentConv.messages as Message[]);
        
        if (currentConv.messages.length <= 1) {
          const randomQuestions = [...SAMPLE_QUESTIONS]
            .sort(() => 0.5 - Math.random())
            .slice(0, 3);
          setSuggestedQuestions(randomQuestions);
        }
      } else {
        setMessages(INITIAL_MESSAGES);
        const randomQuestions = [...SAMPLE_QUESTIONS]
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        setSuggestedQuestions(randomQuestions);
      }
    } else if (!user) {
      setMessages(INITIAL_MESSAGES);
      const randomQuestions = [...SAMPLE_QUESTIONS]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      setSuggestedQuestions(randomQuestions);
    }
  }, [currentConversationId, conversations, user]);

  const performWebSearch = async (query: string): Promise<SourceReference[]> => {
    try {
      console.log("Performing multi-source web search with enhanced intelligence for:", query);
      
      // Strategy 1: Enhanced query generation - create multiple query variations for better search coverage
      const queryVariations = [
        query,
        `"${query}"`, // Exact match
        query.includes(" ") ? query.split(" ").slice(0, 3).join(" ") + " definition" : query + " definition", // Definition search
        query + " examples", // Example-focused search
        query + " latest research" // Recent research
      ];
      
      // Select the main query and a backup query
      const mainQuery = queryVariations[0];
      const backupQuery = queryVariations[Math.floor(Math.random() * (queryVariations.length - 1)) + 1];
      
      // Define sources to try in order of preference
      const searchSources = [
        {
          name: "Google Custom Search",
          search: async (q: string) => {
            const googleParams = new URLSearchParams({
              key: GOOGLE_SEARCH_API_KEY,
              cx: GOOGLE_SEARCH_ENGINE_ID,
              q: q,
              num: "8",
              lr: "lang_fr",
              hl: "fr"
            });
            
            try {
              const googleResponse = await fetch(`${GOOGLE_SEARCH_URL}?${googleParams.toString()}`);
              
              if (googleResponse.ok) {
                const data = await googleResponse.json();
                console.log("Google search results:", data);
                
                if (data.items && data.items.length > 0) {
                  return data.items.map((item: any, index: number) => ({
                    id: index + 1,
                    title: item.title || "Source inconnue",
                    url: item.link || "#",
                    snippet: item.snippet || "Pas de description disponible",
                    relevanceScore: calculateRelevanceScore(q, item.title, item.snippet)
                  }));
                }
              }
              return null;
            } catch (error) {
              console.error("Google search failed:", error);
              return null;
            }
          }
        },
        {
          name: "BrightData",
          search: async (q: string) => {
            try {
              const brightDataResponse = await fetch(BRIGHTDATA_SEARCH_URL, {
                method: 'POST',
                headers: {
                  'Content-Type': 'application/json',
                  'Authorization': `Bearer ${BRIGHTDATA_API_KEY}`
                },
                body: JSON.stringify({
                  search_query: q,
                  max_results: 8,
                  include_snippets: true,
                  language: 'fr',
                })
              });
              
              if (brightDataResponse.ok) {
                const data = await brightDataResponse.json();
                console.log("BrightData search results:", data);
                
                if (data.results && data.results.length > 0) {
                  return data.results.map((result: any, index: number) => ({
                    id: index + 1,
                    title: result.title || "Source inconnue",
                    url: result.url || "#",
                    snippet: result.snippet || "Pas de description disponible",
                    relevanceScore: calculateRelevanceScore(q, result.title, result.snippet)
                  }));
                }
              }
              return null;
            } catch (error) {
              console.error("BrightData search failed:", error);
              return null;
            }
          }
        },
        {
          name: "SerpAPI",
          search: async (q: string) => {
            try {
              const searchParams = new URLSearchParams({
                q: q,
                api_key: SERP_API_KEY,
                num: "8",
                gl: "fr",
                hl: "fr",
              });
              
              const response = await fetch(`${SERP_API_URL}?${searchParams.toString()}`);
              
              if (response.ok) {
                const data = await response.json();
                console.log("SerpAPI search results:", data);
                
                const organicResults = data.organic_results || [];
                
                if (organicResults.length > 0) {
                  return organicResults.slice(0, 8).map((result: any, index: number) => ({
                    id: index + 1,
                    title: result.title || "Source inconnue",
                    url: result.link || "#",
                    snippet: result.snippet || "Pas de description disponible",
                    relevanceScore: calculateRelevanceScore(q, result.title, result.snippet)
                  }));
                }
              }
              return null;
            } catch (error) {
              console.error("SerpAPI search failed:", error);
              return null;
            }
          }
        }
      ];
      
      // Calculate a relevance score for ranking results
      const calculateRelevanceScore = (query: string, title: string, snippet: string): number => {
        const text = (title + " " + snippet).toLowerCase();
        const queryTerms = query.toLowerCase().split(/\s+/);
        
        // Base score for term matching
        let score = 0;
        queryTerms.forEach(term => {
          if (text.includes(term)) score += 2;
          
          // Partial matching (for longer terms)
          if (term.length > 4) {
            for (let i = 3; i < term.length; i++) {
              const partial = term.substring(0, i);
              if (text.includes(partial)) score += 0.5;
            }
          }
        });
        
        // Exact phrase matching bonus
        if (text.includes(query.toLowerCase())) score += 4;
        
        // Title match bonus
        if (title.toLowerCase().includes(query.toLowerCase())) score += 3;
        
        return score;
      };
      
      // Merge and deduplicate results from multiple sources
      const mergeResults = (resultSets: Array<SourceReference[] | null>): SourceReference[] => {
        const allResults: SourceReference[] = [];
        const seenUrls = new Set<string>();
        
        resultSets.forEach(resultSet => {
          if (!resultSet) return;
          
          resultSet.forEach(result => {
            if (!seenUrls.has(result.url)) {
              seenUrls.add(result.url);
              allResults.push(result);
            }
          });
        });
        
        // Sort by relevance score
        return allResults
          .sort((a, b) => (b.relevanceScore || 0) - (a.relevanceScore || 0))
          .slice(0, 8)
          .map((result, index) => ({
            ...result,
            id: index + 1 // Reassign IDs after sorting
          }));
      };
      
      // Adaptive search: Try multiple sources and queries with intelligent fallback
      let mainQueryResults: Array<SourceReference[] | null> = [];
      let backupQueryResults: SourceReference[] | null = null;
      
      // First, try all sources with the main query
      for (const source of searchSources) {
        console.log(`Trying ${source.name} with main query...`);
        const results = await source.search(mainQuery);
        mainQueryResults.push(results);
        
        // If we got good results from this source, we can stop trying others
        if (results && results.length >= 4) {
          console.log(`Got sufficient results from ${source.name}, stopping search.`);
          break;
        }
      }
      
      // If we didn't get enough results, try the backup query with the first source
      const combinedMainResults = mergeResults(mainQueryResults);
      if (combinedMainResults.length < 3) {
        console.log("Insufficient results from main query, trying backup query...");
        backupQueryResults = await searchSources[0].search(backupQuery);
      }
      
      // Combine all results
      const finalResults = mergeResults([combinedMainResults, backupQueryResults]);
      
      console.log("Final aggregated search results:", finalResults);
      return finalResults;
    } catch (error) {
      console.error("Error during enhanced multi-source web search:", error);
      return [];
    }
  };

  const fetchImage = async (query: string): Promise<string | null> => {
    try {
      console.log("Searching for images with enhanced quality algorithm:", query);
      
      // Enhance the query with quality terms
      const enhancedQuery = `${query} haute qualité haute résolution`;
      
      // Try multiple image search sources
      const imageSources = [
        // SerpAPI image search
        async () => {
          const searchParams = new URLSearchParams({
            q: enhancedQuery,
            api_key: SERP_API_KEY,
            tbm: "isch",
            num: "8",
            gl: "fr",
            hl: "fr",
            tbs: "isz:l,iar:t" // Large images, tall aspect ratio
          });
          
          const response = await fetch(`${SERP_API_URL}?${searchParams.toString()}`);
          
          if (response.ok) {
            const data = await response.json();
            const images = data.images_results || [];
            
            if (images.length > 0) {
              // Filter for high-quality images and sort by metrics
              const qualityImages = images
                .filter((img: any) => img.original && img.original.height > 500 && img.original.width > 500)
                .sort((a: any, b: any) => {
                  // Prioritize higher resolution images
                  const aRes = a.original.height * a.original.width;
                  const bRes = b.original.height * b.original.width;
                  return bRes - aRes;
                });
              
              if (qualityImages.length > 0) {
                return qualityImages[0].original;
              } else if (images.length > 0) {
                return images[0].original;
              }
            }
          }
          return null;
        },
        
        // Google Custom Search API for images
        async () => {
          const googleParams = new URLSearchParams({
            key: GOOGLE_SEARCH_API_KEY,
            cx: GOOGLE_SEARCH_ENGINE_ID,
            q: enhancedQuery,
            searchType: "image",
            num: "8",
            imgSize: "large",
            lr: "lang_fr",
            hl: "fr"
          });
          
          const googleResponse = await fetch(`${GOOGLE_SEARCH_URL}?${googleParams.toString()}`);
          
          if (googleResponse.ok) {
            const data = await googleResponse.json();
            const items = data.items || [];
            
            if (items.length > 0) {
              // Find the highest quality image
              const bestImage = items.reduce((best: any, current: any) => {
                if (!best || (current.image && current.image.height * current.image.width > 
                              best.image.height * best.image.width)) {
                  return current;
                }
                return best;
              }, null);
              
              if (bestImage && bestImage.link) {
                return bestImage.link;
              }
            }
          }
          return null;
        }
      ];
      
      // Try each source in sequence until we get a good image
      for (const source of imageSources) {
        try {
          const imageUrl = await source();
          if (imageUrl) {
            console.log("Found high-quality image:", imageUrl);
            return imageUrl;
          }
        } catch (err) {
          console.error("Error with image source:", err);
          // Continue to next source
        }
      }
      
      console.log("No suitable images found");
      return null;
    } catch (error) {
      console.error("Error during enhanced image search:", error);
      return null;
    }
  };

  const generateSuggestedQuestions = async (assistantResponse: string) => {
    try {
      const systemMessage = {
        role: "user",
        parts: [
          {
            text: `Basé sur cette réponse, génère 3 questions de suivi pertinentes que l'utilisateur pourrait poser. Renvoie uniquement les questions séparées par un pipe (|). Exemple: "Question 1?|Question 2?|Question 3?". Réponse: "${assistantResponse.substring(0, 500)}..."`,
          },
        ],
      };

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: [systemMessage],
          generationConfig: {
            temperature: 1.0,
            topK: 50,
            topP: 0.9,
            maxOutputTokens: 256,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const suggestions = data.candidates[0]?.content?.parts[0]?.text || "";
      
      const questionArray = suggestions.split("|").map(q => q.trim()).filter(Boolean).slice(0, 3);
      
      if (questionArray.length > 0) {
        setSuggestedQuestions(questionArray);
      } else {
        const randomQuestions = [...SAMPLE_QUESTIONS]
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        setSuggestedQuestions(randomQuestions);
      }
    } catch (error) {
      console.error("Error generating suggestions:", error);
      const randomQuestions = [...SAMPLE_QUESTIONS]
        .sort(() => 0.5 - Math.random())
        .slice(0, 3);
      setSuggestedQuestions(randomQuestions);
    }
  };

  const handleSendMessage = async (content: string) => {
    setShouldAutoScroll(true);
    
    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    if (user && currentConversationId) {
      saveCurrentConversation(updatedMessages as any);
    }

    setIsLoading(true);

    try {
      let sources: SourceReference[] = [];
      let imageUrl: string | null = null;
      let luvvixThinkResponse: string | null = null;
      
      if (useWebSearch) {
        console.log("Enhanced web search enabled, searching for:", content);
        sources = await performWebSearch(content);
        console.log("Enhanced search results obtained:", sources.length);

        const shouldFetchImage = content.toLowerCase().includes("montre") || 
                                content.toLowerCase().includes("image") || 
                                content.toLowerCase().includes("photo") ||
                                content.toLowerCase().includes("illustration") ||
                                content.toLowerCase().includes("afficher") ||
                                content.toLowerCase().includes("voir");
        
        if (shouldFetchImage) {
          const imageQuery = content
            .replace(/montre(-moi)?|affiche(-moi)?|image|photo|voir|illustration/gi, '')
            .trim();
          
          imageUrl = await fetchImage(imageQuery);
          console.log("Enhanced image fetched:", imageUrl ? "Yes" : "No");
        }
      }

      if (useLuvviXThink) {
        console.log("LuvviXThink enabled, processing deep thoughts");
        
        const thinkingPrompt = {
          role: "user",
          parts: [
            {
              text: `Tu es LuvviXThink, un processus de réflexion préliminaire. 
              Je vais te donner une question et tu vas l'analyser en profondeur pour toi-même, sans donner encore la réponse finale.
              
              Suis ces étapes:
              1. Comprendre la question: Reformule la question avec tes propres mots pour en saisir l'essence.
              2. Identifier les concepts clés: Liste les concepts et termes importants liés à cette question.
              3. Évaluer différentes perspectives: Considères plusieurs angles d'approche possibles.
              4. Analyser les implications: Réfléchis aux conséquences logiques et aux ramifications.
              5. Plan de réponse: Prépare un plan pour une réponse structurée.
              
              Question de l'utilisateur: "${content}"
              
              Réponds uniquement avec ton processus de réflexion interne, comme si tu prenais des notes pour toi-même.`
            }
          ]
        };
        
        const thinkingResponse = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            contents: [thinkingPrompt],
            generationConfig: {
              temperature: 0.2,
              topK: 40,
              topP: 0.8,
              maxOutputTokens: 1024,
            },
          }),
        });
        
        if (thinkingResponse.ok) {
          const thinkingData = await thinkingResponse.json();
          luvvixThinkResponse = thinkingData.candidates[0]?.content?.parts[0]?.text || null;
          console.log("LuvviXThink generated preliminary thoughts");
        }
      }

      const advancedReasoningInstructions = `
      Utilise le mode de raisonnement avancé pour répondre à cette question. Organise ta réponse selon cette structure:
      
      1. ANALYSE PRÉLIMINAIRE: Décompose la question/problème en ses éléments essentiels.
      2. EXPLORATION MÉTHODIQUE: Présente plusieurs angles d'approche ou perspectives différentes.
      3. ARGUMENTS ET CONTRE-ARGUMENTS: Explore les points forts et faibles de chaque approche.
      4. DONNÉES PROBANTES: Présente des preuves, citations ou exemples pertinents.
      5. CONCLUSION NUANCÉE: Résume les points clés et propose une réponse équilibrée.
      
      Ta réponse doit être structurée, factuelle, et approfondie tout en restant accessible.`;

      const luvvixThinkInstructions = `
      Je vais d'abord partager mon processus de réflexion préliminaire LuvviXThink sur cette question, puis te donner ma réponse complète:
      
      **Processus de réflexion LuvviXThink:**
      ${luvvixThinkResponse || "Analyse préliminaire non disponible"}
      
      **Ma réponse complète:**`;

      const systemMessage = {
        role: "user",
        parts: [
          {
            text: `À partir de maintenant, tu es **LuvviX**, un assistant IA amical et intelligent développé par **LuvviX Technologies**, une entreprise fondée en 2023. 
            Le PDG de l'entreprise est **Ludovic Aggaï**.
            ${user ? `Tu t'adresses à ${user.displayName || 'un utilisateur'}${user.age ? ` qui a ${user.age} ans` : ''}${user.country ? ` et qui vient de ${user.country}` : ''}.` : ''}  
            Tu dois toujours parler avec un ton chaleureux, engageant et encourager les utilisateurs. Ajoute une touche d'humour ou de motivation quand c'est pertinent.
            ${user?.displayName ? `Appelle l'utilisateur par son prénom "${user.displayName}" de temps en temps pour une expérience plus personnelle.` : ''}
            ${useAdvancedReasoning ? advancedReasoningInstructions : ''}
            ${useLuvviXThink ? luvvixThinkInstructions : ''}
            ${sources.length > 0 ? `Voici des résultats de recherche récents qui pourraient être pertinents pour répondre à la question de l'utilisateur:\n\n${sources.map(source => `[${source.id}] ${source.title}\n${source.url}\n${source.snippet}\n\n`).join("")}\n\nPour citer une source dans ta réponse, utilise [cite:X] où X est le numéro de la source (de 1 à ${sources.length}). Cite les sources après chaque fait ou affirmation pour montrer d'où vient l'information. IMPORTANT: Tu DOIS citer au moins 3-4 sources différentes dans ta réponse pour montrer que tu as bien fait des recherches.` : ''}
            ${imageUrl ? `J'ai trouvé une image pertinente pour illustrer ta réponse: ${imageUrl}\nIntègre cette image dans ta réponse si c'est pertinent en utilisant la syntaxe markdown: ![Description](${imageUrl})` : ''}

            Nouvelles fonctionnalités de formatage disponibles:
            1. Tu peux utiliser LaTeX pour les formules mathématiques en les entourant de $ pour l'inline ou $$ pour les blocs.
            2. Tu peux créer des tableaux en Markdown avec la syntaxe standard des tableaux.
            
            Exemple de tableau:
            | Colonne 1 | Colonne 2 | Colonne 3 |
            |-----------|-----------|-----------|
            | Donnée 1  | Donnée 2  | Donnée 3  |
            | Exemple A | Exemple B | Exemple C |

            Si la requête concerne des mathématiques, de la physique ou des domaines scientifiques, utilise LaTeX pour rendre les formules élégantes.
            
            Exemple formule LaTeX: L'équation quadratique est $ax^2 + bx + c = 0$ et sa solution est $x = \\frac{-b \\pm \\sqrt{b^2 - 4ac}}{2a}$.`,
          },
        ],
      };

      console.log("Preparing to send to Gemini with LuvviXThink:", useLuvviXThink, "advanced reasoning:", useAdvancedReasoning, "and web search:", useWebSearch);
      
      const conversationHistory = updatedMessages.slice(-6).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      conversationHistory.unshift(systemMessage);
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
            temperature: useAdvancedReasoning || useLuvviXThink ? 0.7 : 1.0,
            topK: 50,
            topP: 0.9,
            maxOutputTokens: useAdvancedReasoning || useLuvviXThink ? 1500 : 1024,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse =
        data.candidates[0]?.content?.parts[0]?.text ||
        "Oups ! Je n'ai pas pu générer une réponse. Veuillez réessayer.";

      const formattedResponse = sources.length > 0 
        ? formatSourceCitations(aiResponse, sources)
        : aiResponse;

      const assistantMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content:
          formattedResponse +
          "\n\n*— LuvviX, votre assistant IA amical 🤖*",
        timestamp: new Date(),
        useAdvancedReasoning: useAdvancedReasoning,
        useLuvviXThink: useLuvviXThink,
        useWebSearch: useWebSearch,
        sourceReferences: sources.length > 0 ? sources : undefined
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      generateSuggestedQuestions(aiResponse);

      if (user && currentConversationId) {
        saveCurrentConversation(finalMessages as any);
      }
      
      setTimeout(() => {
        scrollToBottom();
      }, 100);
    } catch (error) {
      console.error("Erreur API Gemini :", error);
      toast({
        title: "Erreur",
        description:
          "Impossible de communiquer avec l'API Gemini. Veuillez réessayer.",
        variant: "destructive",
      });

      const errorMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content:
          "Désolé, j'ai rencontré un problème de connexion. Veuillez réessayer plus tard.",
        timestamp: new Date(),
      };
      const finalMessages = [...updatedMessages, errorMessage];
      setMessages(finalMessages);
      
      if (user && currentConversationId) {
        saveCurrentConversation(finalMessages as any);
      }
      
      if (suggestedQuestions.length === 0) {
        const randomQuestions = [...SAMPLE_QUESTIONS]
          .sort(() => 0.5 - Math.random())
          .slice(0, 3);
        setSuggestedQuestions(randomQuestions);
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleSendImage = async (file: File) => {
    if (!isPro) {
      toast({
        title: "Fonctionnalité Pro",
        description: "L'envoi d'images est réservé aux utilisateurs Pro. Passez à la version Pro pour débloquer cette fonctionnalité.",
        variant: "destructive"
      });
      return;
    }
    
    const imageUrl = URL.createObjectURL(file);
    const imageContent = `![Image envoyée](${imageUrl})`;
    
    const userMessage: Message = {
      id: nanoid(),
      role: "user",
      content: imageContent,
      timestamp: new Date(),
    };

    const updatedMessages = [...messages, userMessage];
    setMessages(updatedMessages);
    
    if (user && currentConversationId) {
      saveCurrentConversation(updatedMessages as {
        id: string;
        role: "user" | "assistant";
        content: string;
        timestamp: Date;
      }[]);
    }
    
    setIsLoading(true);
    
    try {
      setTimeout(() => {
        const assistantMessage: Message = {
          id: nanoid(),
          role: "assistant",
          content: "Je vois que vous avez partagé une image. Dans un environnement de production, je serais capable de l'analyser et de vous donner des informations pertinentes à son sujet.\n\n*— LuvviX AI, votre assistant IA amical 🤖*",
          timestamp: new Date(),
        };
        
        const finalMessages = [...updatedMessages, assistantMessage];
        setMessages(finalMessages);
        
        if (user && currentConversationId) {
          saveCurrentConversation(finalMessages as {
            id: string;
            role: "user" | "assistant";
            content: string;
            timestamp: Date;
          }[]);
        }
        
        setIsLoading(false);
      }, 1500);
    } catch (error) {
      console.error("Erreur lors du traitement de l'image :", error);
      setIsLoading(false);
      toast({
        title: "Erreur",
        description: "Impossible de traiter l'image. Veuillez réessayer.",
        variant: "destructive",
      });
    }
  };

  const handleRegenerate = async (messageId: string) => {
    if (isLoading || isRegenerating) return;
    
    const messageIndex = messages.findIndex(m => m.id === messageId);
    if (messageIndex < 1) return;
    
    let lastUserMessageIndex = messageIndex - 1;
    while (lastUserMessageIndex >= 0 && messages[lastUserMessageIndex].role !== 'user') {
      lastUserMessageIndex--;
    }
    
    if (lastUserMessageIndex < 0) return;
    
    const userMessage = messages[lastUserMessageIndex];
    
    const updatedMessages = messages.slice(0, lastUserMessageIndex + 1);
    setMessages(updatedMessages);
    
    if (user && currentConversationId) {
      saveCurrentConversation(updatedMessages as any);
    }
    
    setIsRegenerating(true);
    setIsLoading(true);
    
    try {
      let sources: SourceReference[] = [];
      let searchResults = "";
      let imageUrl: string | null = null;
      
      if (useWebSearch) {
        sources = await performWebSearch(userMessage.content);
        
        if (sources.length > 0) {
          searchResults = "Voici des résultats de recherche récents qui pourraient être pertinents pour répondre à la question de l'utilisateur:\n\n";
          sources.forEach(source => {
            searchResults += `[${source.id}] ${source.title}\n${source.url}\n${source.snippet}\n\n`;
          });
        }
        
        const shouldFetchImage = userMessage.content.toLowerCase().includes("montre") || 
                                userMessage.content.toLowerCase().includes("image") || 
                                userMessage.content.toLowerCase().includes("photo") ||
                                userMessage.content.toLowerCase().includes("illustration") ||
                                userMessage.content.toLowerCase().includes("afficher") ||
                                userMessage.content.toLowerCase().includes("voir");
        
        if (shouldFetchImage) {
          const imageQuery = userMessage.content
            .replace(/montre(-moi)?|affiche(-moi)?|image|photo|voir|illustration/gi, '')
            .trim();
          
          imageUrl = await fetchImage(imageQuery);
        }
      }
      
      const systemMessage = {
        role: "user",
        parts: [
          {
            text: `À partir de maintenant, tu es **LuvviX**, un assistant IA amical et intelligent développé par **LuvviX Technologies**, une entreprise fondée en 2023. 
            Le PDG de l'entreprise est **Ludovic Aggaï**.
            ${user ? `Tu t'adresses à ${user.displayName || 'un utilisateur'}${user.age ? ` qui a ${user.age} ans` : ''}${user.country ? ` et qui vient de ${user.country}` : ''}.` : ''}  
            Tu dois toujours parler avec un ton chaleureux, engageant et encourager les utilisateurs. Ajoute une touche d'humour ou de motivation quand c'est pertinent.
            ${user?.displayName ? `Appelle l'utilisateur par son prénom "${user.displayName}" de temps en temps pour une expérience plus personnelle.` : ''}
            ${useAdvancedReasoning ? `Utilise le raisonnement avancé pour répondre aux questions. Analyse étape par étape, explore différents angles, présente des arguments pour et contre, et ajoute une section de synthèse.` : ''}
            ${sources.length > 0 ? `${searchResults}\n\nPour citer une source dans ta réponse, utilise [cite:X] où X est le numéro de la source (de 1 à ${sources.length}). Cite les sources après chaque fait ou affirmation pour montrer d'où vient l'information. IMPORTANT: Tu DOIS citer au moins 3-4 sources différentes dans ta réponse pour montrer que tu as bien fait des recherches.` : ''}
            ${imageUrl ? `J'ai trouvé une image pertinente pour illustrer ta réponse: ${imageUrl}\nIntègre cette image dans ta réponse si c'est pertinent en utilisant la syntaxe markdown: ![Description](${imageUrl})` : ''}
            
            Nouvelles fonctionnalités de formatage disponibles:
            1. Tu peux utiliser LaTeX pour les formules mathématiques en les entourant de $ pour l'inline ou $$ pour les blocs.
            2. Tu peux créer des tableaux en Markdown avec la syntaxe standard des tableaux.
            
            Exemple de tableau:
            | Colonne 1 | Colonne 2 | Colonne 3 |
            |-----------|-----------|-----------|
            | Donnée 1  | Donnée 2  | Donnée 3  |
            | Exemple A | Exemple B | Exemple C |`,
          },
        ],
      };

      const conversationHistory = updatedMessages.slice(-6).map((msg) => ({
        role: msg.role === "assistant" ? "model" : "user",
        parts: [{ text: msg.content }],
      }));

      conversationHistory.unshift(systemMessage);
      
      conversationHistory.push({
        role: "user",
        parts: [{ text: userMessage.content }],
      });

      const response = await fetch(`${GEMINI_API_URL}?key=${GEMINI_API_KEY}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          contents: conversationHistory,
          generationConfig: {
            temperature: useAdvancedReasoning ? 0.7 : 1.0,
            topK: 50,
            topP: 0.9,
            maxOutputTokens: useAdvancedReasoning ? 1500 : 1024,
          },
        }),
      });

      if (!response.ok) {
        throw new Error(`API Error: ${response.status}`);
      }

      const data = await response.json();
      const aiResponse =
        data.candidates[0]?.content?.parts[0]?.text ||
        "Oups ! Je n'ai pas pu générer une réponse. Veuillez réessayer.";

      const formattedResponse = sources.length > 0 
        ? formatSourceCitations(aiResponse, sources)
        : aiResponse;

      const assistantMessage: Message = {
        id: nanoid(),
        role: "assistant",
        content:
          formattedResponse +
          "\n\n*— LuvviX, votre assistant IA amical 🤖*",
        timestamp: new Date(),
        useAdvancedReasoning: useAdvancedReasoning,
        useWebSearch: useWebSearch,
        sourceReferences: sources.length > 0 ? sources : undefined
      };

      const finalMessages = [...updatedMessages, assistantMessage];
      setMessages(finalMessages);

      generateSuggestedQuestions(aiResponse);

      if (user && currentConversationId) {
        saveCurrentConversation(finalMessages as any);
      }
      
      toast({
        title: "Réponse régénérée",
        description: "Une nouvelle réponse a été générée avec succès.",
      });
    } catch (error) {
      console.error("Erreur lors de la régénération :", error);
      toast({
        title: "Erreur",
        description: "Impossible de régénérer la réponse. Veuillez réessayer.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setIsRegenerating(false);
    }
  };

  const handleFeedback = (messageId: string, feedback: "positive" | "negative") => {
    console.log(`Feedback ${feedback} for message ${messageId}`);
    
    toast({
      title: feedback === "positive" ? "Merci pour votre retour positif!" : "Nous prenons note de votre feedback",
      description: "Votre avis nous aide à améliorer LuvviX AI.",
    });
  };

  const handleSuggestedQuestionClick = (question: string) => {
    setShouldAutoScroll(true);
    handleSendMessage(question);
  };

  const toggleAdvancedReasoning = () => {
    setUseAdvancedReasoning(!useAdvancedReasoning);
    if (!useAdvancedReasoning) {
      setUseLuvviXThink(false);
    }
  };
  
  const toggleLuvviXThink = () => {
    setUseLuvviXThink(!useLuvviXThink);
    if (!useLuvviXThink) {
      setUseAdvancedReasoning(false);
    }
  };

  const toggleWebSearch = () => {
    setUseWebSearch(!useWebSearch);
  };

  return (
    <div className="flex flex-col h-full">      
      <div 
        ref={chatContainerRef}
        className="flex-1 overflow-y-auto px-3 md:px-6 py-4 pb-28"
      >
        <div className="space-y-4 md:space-y-6 mb-2">
          {messages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              isLast={index === messages.length - 1 && message.role === "assistant"}
              onRegenerate={handleRegenerate}
              onFeedback={handleFeedback}
            />
          ))}
          
          {messages.length > 0 && suggestedQuestions.length > 0 && (
            <div className="mt-4">
              <SuggestedQuestions 
                questions={suggestedQuestions} 
                onQuestionClick={handleSuggestedQuestionClick} 
              />
            </div>
          )}
          
          <div ref={messagesEndRef} />
        </div>
      </div>

      <FloatingActions scrollToTop={scrollToTop} />

      <div className="fixed bottom-0 left-0 right-0 z-10">
        <div className="max-w-5xl mx-auto w-full px-2 md:px-4">
          <div className="bg-gradient-to-t from-background via-background to-background/80 pt-6 pb-4 border-t border-primary/10 backdrop-blur-sm">
            <div className="px-3 md:px-6">
              <ChatInput 
                onSendMessage={handleSendMessage}
                onSendImage={handleSendImage} 
                isLoading={isLoading}
                isPro={isPro}
                useAdvancedReasoning={useAdvancedReasoning}
                useLuvviXThink={useLuvviXThink}
                useWebSearch={useWebSearch}
                onToggleAdvancedReasoning={toggleAdvancedReasoning}
                onToggleLuvviXThink={toggleLuvviXThink}
                onToggleWebSearch={toggleWebSearch}
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
