"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  adjustDifficulty,
  type AdjustDifficultyOutput,
} from "@/ai/flows/adaptive-difficulty-scaling";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { StacksCoinIcon, BitcoinGemIcon } from "@/components/game/icons";
import { Leaderboard } from "@/components/game/leaderboard";
import { useToast } from "@/hooks/use-toast";
import { cn } from "@/lib/utils";
import { Gamepad2, Play, Redo, Zap } from "lucide-react";

type GameState = "idle" | "countdown" | "playing" | "gameOver";
type Entity = {
  id: number;
  x: number; // %
  y: number; // %
  type: "pillar" | "bar" | "spike" | "coin" | "gem";
  rotation?: number;
};

const INITIAL_DIFFICULTY: AdjustDifficultyOutput = {
  gameSpeedMultiplier: 1.0,
  obstacleFrequency: 1.0,
  obstacleVelocityMultiplier: 1.0,
};

const GAME_WIDTH = 400;
const GAME_HEIGHT = 600;

export default function StacksRollGame() {
  const [gameState, setGameState] = useState<GameState>("idle");
  const [countdown, setCountdown] = useState(3);
  const [score, setScore] = useState(0);
  const [distance, setDistance] = useState(0);
  const [coinsCollected, setCoinsCollected] = useState(0);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [difficulty, setDifficulty] = useState<AdjustDifficultyOutput>(INITIAL_DIFFICULTY);

  const gameLoopRef = useRef<number>();
  const gameTimeRef = useRef(0);
  const lastDifficultyAdjustTimeRef = useRef(0);
  const playerPositionRef = useRef(50); // Player X position in %
  const gameAreaRef = useRef<HTMLDivElement>(null);

  const { toast } = useToast();

  const resetGame = useCallback(() => {
    setScore(0);
    setDistance(0);
    setCoinsCollected(0);
    setEntities([]);
    setDifficulty(INITIAL_DIFFICULTY);
    gameTimeRef.current = 0;
    lastDifficultyAdjustTimeRef.current = 0;
    playerPositionRef.current = 50;
  }, []);

  const startGame = () => {
    resetGame();
    setGameState("countdown");
  };

  const handleConvertToStx = () => {
    toast({
      title: "Simulation Successful!",
      description: `You converted your score to ${(score / 1000).toFixed(4)} STX.`,
    });
  };

  useEffect(() => {
    if (gameState === "countdown") {
      if (countdown > 0) {
        const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
        return () => clearTimeout(timer);
      } else {
        setGameState("playing");
        setCountdown(3);
      }
    }
  }, [gameState, countdown]);

  const gameLoop = useCallback(() => {
    if (gameState !== "playing") return;

    gameTimeRef.current += 1 / 60;
    const speed = difficulty.gameSpeedMultiplier;

    setDistance((prev) => prev + speed * 0.1);

    // Entity logic
    setEntities((prevEntities) => {
      let newEntities: Entity[] = [];

      // Update existing entities
      for (const entity of prevEntities) {
        const newY = entity.y + speed * 0.5 * difficulty.obstacleVelocityMultiplier;
        if (newY < 110) {
          newEntities.push({...entity, y: newY});
        }
      }

      // Add new entities
      const freq = difficulty.obstacleFrequency;
      if (Math.random() < 0.02 * freq) {
        const entityType = Math.random();
        if (entityType < 0.05) { // Gem
          newEntities.push({ id: Date.now(), x: Math.random() * 80 + 10, y: -10, type: "gem" });
        } else if (entityType < 0.25) { // Coin
          newEntities.push({ id: Date.now(), x: Math.random() * 80 + 10, y: -10, type: "coin" });
        } else if (entityType < 0.6) { // Pillar
          newEntities.push({ id: Date.now(), x: Math.random() * 80 + 10, y: -10, type: "pillar" });
        } else if (entityType < 0.8) { // Bar
          newEntities.push({ id: Date.now(), x: 50, y: -10, type: "bar", rotation: Math.random() * 180 });
        } else { // Spike
          newEntities.push({ id: Date.now(), x: Math.random() * 70 + 15, y: -10, type: "spike" });
        }
      }
      return newEntities;
    });

    // Collision detection
    const playerEl = document.getElementById("player-ball");
    if (playerEl) {
      const playerRect = playerEl.getBoundingClientRect();
      document.querySelectorAll(".entity").forEach((entityEl) => {
        const entityRect = entityEl.getBoundingClientRect();
        if (
          playerRect.left < entityRect.right &&
          playerRect.right > entityRect.left &&
          playerRect.top < entityRect.bottom &&
          playerRect.bottom > entityRect.top
        ) {
          const type = entityEl.getAttribute("data-type") as Entity["type"];
          const id = parseInt(entityEl.getAttribute("data-id")!, 10);
          if (["pillar", "bar", "spike"].includes(type)) {
            setGameState("gameOver");
          } else if (["coin", "gem"].includes(type)) {
            if(entities.find(e => e.id === id)) {
                setScore((s) => s + (type === "gem" ? 100 : 10));
                if(type === 'coin') setCoinsCollected(c => c + 1);
                setEntities(ents => ents.filter(e => e.id !== id));
            }
          }
        }
      });
    }

    // AI Difficulty adjustment
    if (gameTimeRef.current - lastDifficultyAdjustTimeRef.current > 10) {
      lastDifficultyAdjustTimeRef.current = gameTimeRef.current;
      adjustDifficulty({
        score,
        distanceTraveled: distance,
        coinsCollected,
        timeElapsed: gameTimeRef.current,
      }).then(setDifficulty);
    }
    
    gameLoopRef.current = requestAnimationFrame(gameLoop);
  }, [gameState, difficulty, score, distance, coinsCollected, entities]);

  useEffect(() => {
    if (gameState === "playing") {
      gameLoopRef.current = requestAnimationFrame(gameLoop);
    }
    return () => {
      if (gameLoopRef.current) {
        cancelAnimationFrame(gameLoopRef.current);
      }
    };
  }, [gameState, gameLoop]);
  
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (gameState !== "playing" || !gameAreaRef.current) return;
      const rect = gameAreaRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(100, ((e.clientX - rect.left) / rect.width) * 100));
      playerPositionRef.current = x;
      const playerEl = document.getElementById("player-ball");
      if(playerEl) {
        playerEl.style.left = `${x}%`;
      }
    };

    const gameAreaCurrent = gameAreaRef.current;
    gameAreaCurrent?.addEventListener("mousemove", handleMouseMove);
    
    return () => {
      gameAreaCurrent?.removeEventListener("mousemove", handleMouseMove);
    };
  }, [gameState]);


  return (
    <div className="z-10 mt-8 flex flex-col items-center">
      <Card
        ref={gameAreaRef}
        className="relative flex items-center justify-center overflow-hidden border-2 border-primary/50 bg-background/80 shadow-2xl shadow-primary/20"
        style={{ width: GAME_WIDTH, height: GAME_HEIGHT }}
      >
        <AnimatePresence>
          {gameState === "idle" && <StartScreen onStart={startGame} />}
          {gameState === "gameOver" && (
            <GameOverScreen
              score={score}
              distance={Math.floor(distance)}
              onRestart={startGame}
              onConvertToStx={handleConvertToStx}
            />
          )}
          {gameState === "countdown" && <CountdownScreen count={countdown} />}
        </AnimatePresence>
        
        {gameState !== "idle" && (
            <>
                <div 
                    className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-transparent z-10"
                    style={{pointerEvents: 'none'}}
                />
                <div 
                    className="absolute inset-0"
                    style={{
                        perspective: '400px',
                        pointerEvents: 'none'
                    }}
                >
                    <div 
                      className="absolute inset-0 track-lines" 
                      style={{ 
                        animationDuration: `${Math.max(0.2, 2 / difficulty.gameSpeedMultiplier)}s`,
                        animationPlayState: gameState === 'playing' ? 'running' : 'paused'
                      }} 
                    />
                </div>
                
                <HUD score={score} distance={Math.floor(distance)} />

                {/* Entities */}
                <AnimatePresence>
                  {entities.map(entity => (
                      <EntityComponent key={entity.id} {...entity} />
                  ))}
                </AnimatePresence>

                {/* Player */}
                <div
                    id="player-ball"
                    className="absolute w-8 h-8 bg-white rounded-full z-20 shadow-[0_0_20px_5px_rgba(255,255,255,0.7)]"
                    style={{
                      bottom: '10%',
                      left: '50%',
                      transform: 'translateX(-50%)',
                      transition: 'left 0.1s linear'
                    }}
                />
            </>
        )}
      </Card>
      {gameState === 'idle' && <Leaderboard />}
      {gameState === 'gameOver' && <div className="h-4" />}
    </div>
  );
}

const EntityComponent = ({ id, x, y, type, rotation }: Entity) => {
    const scale = y / 100;
    const opacity = (y > 0 && y < 100) ? 1 : 0;
    const isCollectible = type === 'coin' || type === 'gem';

    const Component = {
        pillar: () => <div className="w-10 h-32 bg-gradient-to-t from-accent/80 to-purple-500/80 border-2 border-accent rounded-md" />,
        bar: () => <div style={{transform: `rotate(${rotation}deg)`}} className="w-48 h-4 bg-gradient-to-r from-destructive to-red-400 border-2 border-destructive rounded-full" />,
        spike: () => <div className="w-8 h-8 bg-destructive" style={{clipPath: 'polygon(50% 0%, 0% 100%, 100% 100%)'}} />,
        coin: () => <StacksCoinIcon className="w-8 h-8 text-primary animate-pulse" style={{filter: 'drop-shadow(0 0 5px hsl(var(--primary)))'}}/>,
        gem: () => <BitcoinGemIcon className="w-8 h-8 text-accent animate-pulse" style={{filter: 'drop-shadow(0 0 8px hsl(var(--accent)))'}} />,
    }[type];

    return (
        <motion.div
            layout
            exit={{ opacity: 0, scale: isCollectible ? 2 : scale, transition: { duration: 0.3 } }}
            className="entity absolute"
            data-id={id}
            data-type={type}
            style={{
                left: `${x}%`,
                top: `${y}%`,
                transform: `translate(-50%, -50%) scale(${scale})`,
                opacity: opacity,
                transition: 'opacity 0.2s',
                zIndex: Math.floor(y),
            }}
        >
            <Component />
        </motion.div>
    )
}

const HUD = ({ score, distance }: { score: number; distance: number }) => (
  <div className="absolute top-4 left-4 right-4 z-30 flex justify-between text-white font-headline text-2xl">
    <div style={{ textShadow: "0 0 5px black" }}>{score.toLocaleString()}</div>
    <div style={{ textShadow: "0 0 5px black" }}>{distance.toLocaleString()}m</div>
  </div>
);

const StartScreen = ({ onStart }: { onStart: () => void }) => (
  <motion.div
    initial={{ opacity: 0, scale: 0.8 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.8 }}
    className="z-40 flex flex-col items-center justify-center text-center p-4 bg-background/50 backdrop-blur-sm rounded-lg"
  >
    <h2 className="font-headline text-4xl font-bold text-primary">Ready to Roll?</h2>
    <p className="mt-2 text-muted-foreground max-w-xs">
      Use your mouse to move left and right. Avoid obstacles and collect rewards.
    </p>
    <Button onClick={onStart} className="mt-6" size="lg">
      <Play className="mr-2 h-5 w-5" /> Start Game
    </Button>
  </motion.div>
);

const GameOverScreen = ({
  score,
  distance,
  onRestart,
  onConvertToStx,
}: {
  score: number;
  distance: number;
  onRestart: () => void;
  onConvertToStx: () => void;
}) => (
  <motion.div
    initial={{ opacity: 0, backdropFilter: 'blur(0px)' }}
    animate={{ opacity: 1, backdropFilter: 'blur(8px)' }}
    className="absolute inset-0 z-40 flex flex-col items-center justify-center p-4"
  >
    <Card className="w-full max-w-sm text-center bg-card/70">
        <CardHeader>
            <CardTitle className="font-headline text-4xl text-destructive">Game Over</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col items-center gap-4">
            <div>
                <p className="text-muted-foreground">Final Score</p>
                <p className="font-headline text-5xl text-primary">{score.toLocaleString()}</p>
            </div>
            <div>
                <p className="text-muted-foreground">Distance</p>
                <p className="font-headline text-3xl text-white">{distance.toLocaleString()}m</p>
            </div>
            <div className="flex gap-2 mt-4">
                <Button onClick={onRestart} variant="secondary">
                    <Redo className="mr-2 h-4 w-4"/> Play Again
                </Button>
                <Button onClick={onConvertToStx}>
                    <Zap className="mr-2 h-4 w-4"/> Convert to STX
                </Button>
            </div>
        </CardContent>
    </Card>
    <Leaderboard currentDistance={distance} />
  </motion.div>
);


const CountdownScreen = ({ count }: { count: number }) => (
  <motion.div
    key={count}
    initial={{ opacity: 0, scale: 1.5 }}
    animate={{ opacity: 1, scale: 1 }}
    exit={{ opacity: 0, scale: 0.5 }}
    transition={{ duration: 0.4 }}
    className="absolute z-40 font-headline text-9xl text-white"
    style={{textShadow: '0 0 20px black'}}
  >
    {count}
  </motion.div>
);
