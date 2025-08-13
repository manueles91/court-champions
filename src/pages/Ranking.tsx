import React, { useMemo } from "react";
import Seo from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableCaption,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

// MVP: datos de ejemplo. Luego conectaremos a Supabase (players, matches) y calcularemos el ranking.
type PlayerStats = {
  id: string;
  name: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  gamesFor: number;
  gamesAgainst: number;
};

const sampleStats: PlayerStats[] = [
  { id: "1", name: "Ana López", matches: 8, wins: 5, draws: 1, losses: 2, gamesFor: 52, gamesAgainst: 39 },
  { id: "2", name: "Carlos Pérez", matches: 8, wins: 5, draws: 0, losses: 3, gamesFor: 49, gamesAgainst: 41 },
  { id: "3", name: "María Gómez", matches: 8, wins: 4, draws: 2, losses: 2, gamesFor: 50, gamesAgainst: 44 },
  { id: "4", name: "Jorge Ruiz", matches: 8, wins: 4, draws: 1, losses: 3, gamesFor: 47, gamesAgainst: 45 },
];

const pointsFor = (s: PlayerStats) => s.wins * 1 + s.draws * 0.5;

const Ranking = () => {
  const ranking = useMemo(() => {
    return sampleStats
      .map((s) => ({ ...s, points: pointsFor(s), diff: s.gamesFor - s.gamesAgainst }))
      .sort((a, b) => {
        if (b.points !== a.points) return b.points - a.points; // 1) Puntos
        if (b.diff !== a.diff) return b.diff - a.diff; // 2) Dif. de games
        if (b.gamesFor !== a.gamesFor) return b.gamesFor - a.gamesFor; // 3) Games a favor
        return a.name.localeCompare(b.name); // 4) Nombre (placeholder; h2h cuando tengamos partidos)
      })
      .map((s, idx) => ({ position: idx + 1, ...s }));
  }, []);

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title="Ranking Pádel - Court Champions"
        description="Ranking de jugadores de pádel con puntos, victorias, empates, derrotas y diferencia de games."
        canonicalPath="/ranking"
      />
      <main className="container mx-auto px-4 py-10">
        <h1 className="text-3xl font-bold tracking-tight mb-6">Ranking de Jugadores de Pádel</h1>
        <Card>
          <CardHeader>
            <CardTitle className="text-xl">Clasificación actual</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableCaption>1 punto por victoria, 0.5 por empate, 0 por derrota</TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-[60px]">Pos</TableHead>
                  <TableHead>Jugador</TableHead>
                  <TableHead className="text-right">PJ</TableHead>
                  <TableHead className="text-right">V</TableHead>
                  <TableHead className="text-right">E</TableHead>
                  <TableHead className="text-right">D</TableHead>
                  <TableHead className="text-right">GF</TableHead>
                  <TableHead className="text-right">GC</TableHead>
                  <TableHead className="text-right">Dif</TableHead>
                  <TableHead className="text-right">Pts</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {ranking.map((row) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{row.position}</TableCell>
                    <TableCell>{row.name}</TableCell>
                    <TableCell className="text-right">{row.matches}</TableCell>
                    <TableCell className="text-right">{row.wins}</TableCell>
                    <TableCell className="text-right">{row.draws}</TableCell>
                    <TableCell className="text-right">{row.losses}</TableCell>
                    <TableCell className="text-right">{row.gamesFor}</TableCell>
                    <TableCell className="text-right">{row.gamesAgainst}</TableCell>
                    <TableCell className="text-right">{row.diff}</TableCell>
                    <TableCell className="text-right">{row.points}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Ranking;
