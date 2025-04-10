
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Header } from "@/components/Header";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Volume2, VolumeX, Info, Sparkles } from "lucide-react";
import { CentralPlanet } from "@/components/world/CentralPlanet";
import { KnowledgeTree } from "@/components/world/KnowledgeTree";
import { SoulMirror } from "@/components/world/SoulMirror";
import { ConcentrationTower } from "@/components/world/ConcentrationTower";
import { DreamPortal } from "@/components/world/DreamPortal";
import { WorldTooltip } from "@/components/world/WorldTooltip";
import { useLocalStorage } from "@/hooks/use-local-storage";
import { useAuth } from "@/contexts/AuthContext";
import { useIsMobile } from "@/hooks/use-mobile";

export interface WorldState {
  knowledge: number; // 0-100
  emotionalState: number; // 0-100
  concentration: number; // 0-100
  goalsAchieved: number; // 0-100
  interactions: number;
  lastVisit: string;
}

const LuvviXWorld = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [showTooltip, setShowTooltip] = useState<string | null>(null);
  const [worldState, setWorldState] = useLocalStorage<WorldState>("luvvix-world-state", {
    knowledge: 20,
    emotionalState: 50,
    concentration: 30,
    goalsAchieved: 10,
    interactions: 0,
    lastVisit: new Date().toISOString(),
  });
  
  const audioRef = useRef<HTMLAudioElement>(null);
  const isMobile = useIsMobile();
  
  // Calculate days since last visit
  useEffect(() => {
    const lastVisit = new Date(worldState.lastVisit);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - lastVisit.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    
    // If it's a new visit, update interaction count and last visit date
    if (diffDays >= 1) {
      setWorldState({
        ...worldState,
        interactions: worldState.interactions + 1,
        concentration: Math.min(100, worldState.concentration + 5),
        lastVisit: today.toISOString(),
      });
    }
  }, []);
  
  // Handle audio
  useEffect(() => {
    if (audioRef.current) {
      if (isMuted) {
        audioRef.current.pause();
      } else {
        audioRef.current.volume = 0.3;
        audioRef.current.play().catch(e => console.log("Audio play prevented:", e));
      }
    }
    
    return () => {
      if (audioRef.current) {
        audioRef.current.pause();
      }
    };
  }, [isMuted]);
  
  const incrementKnowledge = () => {
    setWorldState({
      ...worldState,
      knowledge: Math.min(100, worldState.knowledge + 5),
    });
  };
  
  const changeEmotionalState = (delta: number) => {
    setWorldState({
      ...worldState,
      emotionalState: Math.max(0, Math.min(100, worldState.emotionalState + delta)),
    });
  };
  
  const incrementGoals = () => {
    setWorldState({
      ...worldState,
      goalsAchieved: Math.min(100, worldState.goalsAchieved + 10),
    });
  };
  
  const handleOpenAuth = (mode: "login" | "register") => {
    // Navigate back to main page for auth
    navigate("/", { state: { openAuth: mode } });
  };
  
  const handleOpenProfile = () => {
    // Navigate back to main page for profile
    navigate("/", { state: { openProfile: true } });
  };

  return (
    <div className="flex flex-col min-h-screen h-screen bg-gradient-to-b from-[#F2FCE2] via-[#E5DEFF] to-[#D3E4FD] dark:from-[#0A1F2C] dark:via-[#1A1B3C] dark:to-[#121842] overflow-hidden">
      <audio
        ref={audioRef}
        src="https://freesound.org/data/previews/612/612095_5674468-lq.mp3"
        loop
      />
      
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -inset-[10%] opacity-50">
          <div className="absolute top-1/4 left-1/4 w-72 h-72 md:w-96 md:h-96 bg-blue-300/20 dark:bg-blue-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob"></div>
          <div className="absolute top-1/3 right-1/4 w-72 h-72 md:w-96 md:h-96 bg-purple-300/20 dark:bg-indigo-500/10 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-2000"></div>
          <div className="absolute bottom-1/3 left-1/3 w-72 h-72 md:w-96 md:h-96 bg-pink-300/20 dark:bg-primary/5 rounded-full mix-blend-multiply filter blur-3xl animate-blob animation-delay-4000"></div>
        </div>
        
        {/* Floating particles */}
        <div className="absolute inset-0">
          {Array.from({ length: isMobile ? 15 : 30 }).map((_, i) => (
            <motion.div
              key={`particle-${i}`}
              className="absolute rounded-full bg-white/60 dark:bg-white/30"
              style={{
                width: Math.random() * 3 + 1,
                height: Math.random() * 3 + 1,
                top: `${Math.random() * 100}%`,
                left: `${Math.random() * 100}%`,
              }}
              animate={{
                y: [0, -30, 0],
                x: [0, Math.random() * 10 - 5, 0],
                opacity: [0.2, 0.7, 0.2],
              }}
              transition={{
                duration: Math.random() * 10 + 10,
                repeat: Infinity,
                delay: Math.random() * 5,
              }}
            />
          ))}
        </div>
      </div>
      
      <Header
        onOpenAuth={handleOpenAuth}
        onOpenProfile={handleOpenProfile}
        isSidebarOpen={isSidebarOpen}
        setIsSidebarOpen={setIsSidebarOpen}
      />
      
      <div className="absolute top-20 left-4 z-10 flex gap-2">
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => navigate("/")}
          className="bg-white/20 backdrop-blur-sm dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-full"
        >
          <ArrowLeft className="h-4 w-4" />
        </Button>
        
        <Button 
          variant="ghost" 
          size="icon" 
          onClick={() => setIsMuted(!isMuted)}
          className="bg-white/20 backdrop-blur-sm dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-full"
        >
          {isMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
        </Button>
      </div>
      
      <main className="flex-grow relative pt-16 overflow-hidden">
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 1.5 }}
          className="h-full w-full"
        >
          {/* Grid Layout Container */}
          <div className="grid grid-cols-2 md:grid-cols-3 h-full w-full">
            
            {/* Knowledge Tree - Top Left */}
            <div className="flex items-center justify-center">
              <KnowledgeTree 
                growth={worldState.knowledge} 
                onClick={() => {
                  incrementKnowledge();
                  setShowTooltip("tree");
                }}
              />
            </div>
            
            {/* Soul Mirror - Top Right */}
            <div className="flex items-center justify-center">
              <SoulMirror 
                emotionalState={worldState.emotionalState} 
                onClick={() => {
                  changeEmotionalState(Math.random() > 0.5 ? 5 : -5);
                  setShowTooltip("mirror");
                }}
              />
            </div>
            
            {/* Central Planet - Middle (spans multiple columns on desktop) */}
            <div className={`${isMobile ? "col-span-2" : "col-span-1"} flex items-center justify-center`}>
              <CentralPlanet 
                progress={worldState.interactions / 100} 
                onClick={() => setShowTooltip("planet")}
              />
            </div>
            
            {/* Concentration Tower - Bottom Left */}
            <div className="flex items-center justify-center">
              <ConcentrationTower 
                height={worldState.concentration} 
                onClick={() => {
                  setWorldState({...worldState, concentration: Math.min(100, worldState.concentration + 3)});
                  setShowTooltip("tower");
                }}
              />
            </div>
            
            {/* Dream Portal - Bottom Right */}
            <div className="flex items-center justify-center">
              <DreamPortal 
                openness={worldState.goalsAchieved} 
                onClick={() => {
                  incrementGoals();
                  setShowTooltip("portal");
                }}
              />
            </div>
          </div>
        </motion.div>
        
        {/* Info button */}
        <Button 
          variant="ghost" 
          size="icon" 
          className="absolute bottom-4 right-4 bg-white/20 backdrop-blur-sm dark:bg-white/10 hover:bg-white/30 dark:hover:bg-white/20 rounded-full"
          onClick={() => setShowTooltip("info")}
        >
          <Info className="h-4 w-4" />
        </Button>
        
        {/* Tooltip */}
        <AnimatePresence>
          {showTooltip && (
            <WorldTooltip 
              type={showTooltip} 
              worldState={worldState}
              onClose={() => setShowTooltip(null)}
            />
          )}
        </AnimatePresence>
      </main>
      
      <footer className="text-center py-2 text-sm text-foreground/50">
        <span>LuvviX World • Votre univers mental</span>
      </footer>
    </div>
  );
};

export default LuvviXWorld;
