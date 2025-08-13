import React, { useMemo, useState } from "react";
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
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type AggregateInput = {
  id: string;
  displayName: string;
  tournamentId: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  gamesFor: number;
  gamesAgainst: number;
};

type RankingRow = {
  id: string;
  displayName: string;
  matches: number;
  wins: number;
  draws: number;
  losses: number;
  gamesFor: number;
  gamesAgainst: number;
  points: number;
  diff: number;
};

const tournaments = [
  { id: "all", name: "Todos los torneos" },
  { id: "t1", name: "Apertura 2025" },
  { id: "t2", name: "Clausura 2025" },
];

const playerRows: AggregateInput[] = [
  { id: "1", displayName: "Ana López", tournamentId: "t1", matches: 4, wins: 3, draws: 0, losses: 1, gamesFor: 26, gamesAgainst: 18 },
  { id: "2", displayName: "Carlos Pérez", tournamentId: "t1", matches: 4, wins: 2, draws: 1, losses: 1, gamesFor: 24, gamesAgainst: 20 },
  { id: "3", displayName: "María Gómez", tournamentId: "t1", matches: 4, wins: 2, draws: 1, losses: 1, gamesFor: 25, gamesAgainst: 21 },
  { id: "4", displayName: "Jorge Ruiz", tournamentId: "t1", matches: 4, wins: 1, draws: 0, losses: 3, gamesFor: 20, gamesAgainst: 26 },
  { id: "1", displayName: "Ana López", tournamentId: "t2", matches: 4, wins: 2, draws: 1, losses: 1, gamesFor: 26, gamesAgainst: 22 },
  { id: "2", displayName: "Carlos Pérez", tournamentId: "t2", matches: 4, wins: 3, draws: 0, losses: 1, gamesFor: 27, gamesAgainst: 21 },
  { id: "3", displayName: "María Gómez", tournamentId: "t2", matches: 4, wins: 2, draws: 0, losses: 2, gamesFor: 24, gamesAgainst: 24 },
  { id: "4", displayName: "Jorge Ruiz", tournamentId: "t2", matches: 4, wins: 1, draws: 1, losses: 2, gamesFor: 22, gamesAgainst: 26 },
];

const pairRows: AggregateInput[] = [
  { id: "p1", displayName: "Ana / Carlos", tournamentId: "t1", matches: 3, wins: 2, draws: 0, losses: 1, gamesFor: 20, gamesAgainst: 14 },
  { id: "p2", displayName: "María / Jorge", tournamentId: "t1", matches: 3, wins: 1, draws: 1, losses: 1, gamesFor: 18, gamesAgainst: 17 },
  { id: "p3", displayName: "Ana / Jorge", tournamentId: "t1", matches: 2, wins: 1, draws: 0, losses: 1, gamesFor: 14, gamesAgainst: 12 },
  { id: "p1", displayName: "Ana / Carlos", tournamentId: "t2", matches: 3, wins: 2, draws: 1, losses: 0, gamesFor: 21, gamesAgainst: 15 },
  { id: "p2", displayName: "María / Jorge", tournamentId: "t2", matches: 3, wins: 1, draws: 0, losses: 2, gamesFor: 17, gamesAgainst: 20 },
  { id: "p3", displayName: "Ana / Jorge", tournamentId: "t2", matches: 2, wins: 0, draws: 1, losses: 1, gamesFor: 12, gamesAgainst: 14 },
];

function computePoints(wins: number, draws: number): number {
  return wins * 1 + draws * 0.5;
}

function aggregateRanking(rows: AggregateInput[], selectedTournamentId: string): RankingRow[] {
  const filtered = selectedTournamentId === "all" ? rows : rows.filter((r) => r.tournamentId === selectedTournamentId);
  const byId = new Map<string, RankingRow>();

  for (const r of filtered) {
    const current = byId.get(r.id);
    if (!current) {
      byId.set(r.id, {
        id: r.id,
        displayName: r.displayName,
        matches: r.matches,
        wins: r.wins,
        draws: r.draws,
        losses: r.losses,
        gamesFor: r.gamesFor,
        gamesAgainst: r.gamesAgainst,
        points: computePoints(r.wins, r.draws),
        diff: r.gamesFor - r.gamesAgainst,
      });
    } else {
      current.matches += r.matches;
      current.wins += r.wins;
      current.draws += r.draws;
      current.losses += r.losses;
      current.gamesFor += r.gamesFor;
      current.gamesAgainst += r.gamesAgainst;
      current.points = computePoints(current.wins, current.draws);
      current.diff = current.gamesFor - current.gamesAgainst;
    }
  }

  return Array.from(byId.values()).sort((a, b) => {
    if (b.points !== a.points) return b.points - a.points;
    if (b.diff !== a.diff) return b.diff - a.diff;
    if (b.gamesFor !== a.gamesFor) return b.gamesFor - a.gamesFor;
    return a.displayName.localeCompare(b.displayName);
  });
}

const Ranking = () => {
  const [mode, setMode] = useState<"players" | "pairs">("players");
  const [tournamentId, setTournamentId] = useState<string>("all");

  const ranking = useMemo(() => {
    return mode === "players"
      ? aggregateRanking(playerRows, tournamentId)
      : aggregateRanking(pairRows, tournamentId);
  }, [mode, tournamentId]);

  const nameColumnLabel = mode === "players" ? "Jugador" : "Pareja";
  const pageTitle = mode === "players" ? "Ranking de Jugadores de Pádel" : "Ranking de Parejas de Pádel";

  return (
    <div className="min-h-screen bg-background">
      <Seo
        title={`Ranking Pádel - Court Champions`}
        description={`${pageTitle} con puntos, victorias, empates, derrotas y diferencia de games.`}
        canonicalPath="/ranking"
      />
      <main className="container mx-auto px-4 py-10 space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <h1 className="text-3xl font-bold tracking-tight">{pageTitle}</h1>
          <div className="flex items-center gap-3">
            <Tabs value={mode} onValueChange={(v) => setMode(v as "players" | "pairs")}> 
              <TabsList>
                <TabsTrigger value="players">Jugadores</TabsTrigger>
                <TabsTrigger value="pairs">Parejas</TabsTrigger>
              </TabsList>
            </Tabs>
            <Select value={tournamentId} onValueChange={setTournamentId}>
              <SelectTrigger className="w-[240px]">
                <SelectValue placeholder="Selecciona torneo" />
              </SelectTrigger>
              <SelectContent>
                {tournaments.map((t) => (
                  <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

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
                  <TableHead>{nameColumnLabel}</TableHead>
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
                {ranking.map((row, idx) => (
                  <TableRow key={row.id}>
                    <TableCell className="font-medium">{idx + 1}</TableCell>
                    <TableCell>{row.displayName}</TableCell>
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
                {ranking.length === 0 && (
                  <TableRow>
                    <TableCell colSpan={10} className="text-center text-muted-foreground">Sin datos para el filtro seleccionado</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Ranking;
