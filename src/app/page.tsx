import StacksRollGame from '@/components/game/stacks-roll-game';

export default function Home() {
  return (
    <main className="relative flex min-h-screen w-full flex-col items-center justify-center p-4 overflow-hidden">
      <div className="absolute inset-0 z-0 bg-background">
        <div className="absolute bottom-0 left-0 right-0 top-0 bg-[linear-gradient(to_right,#4f4f4f2e_1px,transparent_1px),linear-gradient(to_bottom,#4f4f4f2e_1px,transparent_1px)] bg-[size:14px_24px] animate-grid-pan [mask-image:radial-gradient(ellipse_80%_50%_at_50%_0%,#000_70%,transparent_110%)]"></div>
      </div>
      <div className="z-10 flex flex-col items-center text-center">
        <h1 className="font-headline text-5xl md:text-7xl font-bold text-primary tracking-tighter animate-fade-in-down">
          Stacks Roll
        </h1>
        <p className="mt-4 max-w-xl text-muted-foreground animate-fade-in-up">
          Navigate the glowing orb, collect coins, and survive as long as you can. Difficulty adapts to your skill.
        </p>
      </div>
      <StacksRollGame />
    </main>
  );
}
