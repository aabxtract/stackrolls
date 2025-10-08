import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy } from "lucide-react";

const leaderboardData = [
  { rank: 1, name: "Satoshi", distance: 98765, score: 125000 },
  { rank: 2, name: "Muneeb", distance: 87654, score: 110250 },
  { rank: 3, name: "Vitalik", distance: 76543, score: 98700 },
  { rank: 4, name: "Hal", distance: 65432, score: 85400 },
  { rank: 5, name: "Player1", distance: 54321, score: 72300 },
];

type LeaderboardProps = {
  currentDistance?: number;
};

export function Leaderboard({ currentDistance = 0 }: LeaderboardProps) {
  const isTopPlayer = currentDistance > leaderboardData[leaderboardData.length - 1].distance;

  return (
    <Card className="w-full max-w-md bg-card/50 backdrop-blur-sm mt-4">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 font-headline text-2xl text-primary">
          <Trophy className="h-6 w-6" />
          Top Rollers
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[50px]">Rank</TableHead>
              <TableHead>Player</TableHead>
              <TableHead className="text-right">Distance</TableHead>
              <TableHead className="text-right">Score</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {leaderboardData.map((player) => (
              <TableRow key={player.rank} className="text-muted-foreground">
                <TableCell className="font-medium">{player.rank}</TableCell>
                <TableCell>{player.name}</TableCell>
                <TableCell className="text-right">{player.distance.toLocaleString()}m</TableCell>
                <TableCell className="text-right">{player.score.toLocaleString()}</TableCell>
              </TableRow>
            ))}
             {isTopPlayer && (
                <TableRow className="bg-primary/10 text-primary">
                    <TableCell className="font-medium">?</TableCell>
                    <TableCell>You</TableCell>
                    <TableCell className="text-right">{currentDistance.toLocaleString()}m</TableCell>
                    <TableCell className="text-right">...</TableCell>
                </TableRow>
             )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
