import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Seo from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Check, X } from "lucide-react";

// --- Tipos ---
export type Usuario = { id: string; nombre: string; email?: string | null; telefono?: string | null };
export type Pareja = { id: string; jugador1Id: string; jugador2Id: string };
export type EventoDetalle = { id: string; nombre: string; categoria: string };

// Resultado: 1 gana pareja1, 2 gana pareja2, 0 empate, undefined = partido futuro
export type Partido = {
  id: string;
  eventoId: string;
  pareja1Id: string;
  pareja2Id: string;
  ronda: number;
  fechaISO?: string; // para "próximos" partidos
  gamesPareja1?: number;
  gamesPareja2?: number;
  resultado?: 1 | 2 | 0;
  pista?: string; // Ej: "6", "9"
};

// --- Mock data ---
const mockEventos: EventoDetalle[] = [
  { id: "t1", nombre: "Apertura 2025", categoria: "Intermedio" },
  { id: "t2", nombre: "Clausura 2025", categoria: "Avanzado" },
];

const mockUsuarios: Usuario[] = [
  { id: "1", nombre: "Ana López" },
  { id: "2", nombre: "Carlos Pérez" },
  { id: "3", nombre: "María Gómez" },
  { id: "4", nombre: "Jorge Ruiz" },
  { id: "5", nombre: "Lucía Díaz" },
  { id: "6", nombre: "Pedro Ortiz" },
];

const mockParejas: Pareja[] = [
  { id: "p1", jugador1Id: "1", jugador2Id: "2" },
  { id: "p2", jugador1Id: "3", jugador2Id: "4" },
  { id: "p3", jugador1Id: "5", jugador2Id: "6" },
];

const now = Date.now();
const in1h = new Date(now + 60 * 60 * 1000).toISOString();
const in2h = new Date(now + 2 * 60 * 60 * 1000).toISOString();

const mockPartidos: Partido[] = [
  // Ronda 1: jugados
  { id: "m1", eventoId: "t1", pareja1Id: "p1", pareja2Id: "p2", ronda: 1, gamesPareja1: 6, gamesPareja2: 4, resultado: 1, pista: "6" },
  { id: "m2", eventoId: "t1", pareja1Id: "p3", pareja2Id: "p2", ronda: 1, gamesPareja1: 5, gamesPareja2: 5, resultado: 0, pista: "9" },
  // Ronda 2: uno jugado, uno próximo
  { id: "m3", eventoId: "t1", pareja1Id: "p1", pareja2Id: "p3", ronda: 2, gamesPareja1: 2, gamesPareja2: 6, resultado: 2, pista: "6" },
  { id: "m4", eventoId: "t1", pareja1Id: "p2", pareja2Id: "p1", ronda: 2, fechaISO: in1h, pista: "9" },
  // Ronda 3: próximos
  { id: "m5", eventoId: "t1", pareja1Id: "p2", pareja2Id: "p3", ronda: 3, fechaISO: in2h, pista: "6" },
];

function nombreJugador(id: string) {
  return mockUsuarios.find((u) => u.id === id)?.nombre ?? "";
}

function nombrePareja(pareja: Pareja) {
  return `${nombreJugador(pareja.jugador1Id)} / ${nombreJugador(pareja.jugador2Id)}`;
}

function useEventoData(eventoId: string) {
  const evento = mockEventos.find((e) => e.id === eventoId) ?? { id: eventoId, nombre: `Evento ${eventoId}`, categoria: "General" };
  const parejas = mockParejas;
  const partidos = mockPartidos.filter((m) => m.eventoId === eventoId);
  const rondas = Array.from(new Set(partidos.map((p) => p.ronda))).sort((a, b) => a - b);
  return { evento, parejas, partidos, rondas };
}

// --- Cálculos ---
export type PosicionPareja = {
  parejaId: string;
  puntos: number; // 1 por victoria, 0.5 por empate
  partidosJugados: number;
  partidosGanados: number;
  partidosEmpatados: number;
  partidosPerdidos: number;
  porcentajePartidosGanados: number; // 0-100
  gamesJugados: number;
  gamesGanados: number;
  gamesPerdidos: number;
  porcentajeGamesGanados: number; // 0-100
};

function computeAggregatesPorPareja(partidos: Partido[], parejas: Pareja[]): PosicionPareja[] {
  const finalizados = partidos.filter((p) => p.resultado !== undefined && p.gamesPareja1 !== undefined && p.gamesPareja2 !== undefined);
  const acumulado = new Map<string, { puntos: number; pj: number; pg: number; pe: number; pp: number; gj: number; gf: number; gc: number }>();

  function ensure(pairId: string) {
    if (!acumulado.has(pairId)) {
      acumulado.set(pairId, { puntos: 0, pj: 0, pg: 0, pe: 0, pp: 0, gj: 0, gf: 0, gc: 0 });
    }
    return acumulado.get(pairId)!;
  }

  for (const p of finalizados) {
    const pareja1 = ensure(p.pareja1Id);
    const pareja2 = ensure(p.pareja2Id);

    const games1 = p.gamesPareja1!;
    const games2 = p.gamesPareja2!;

    pareja1.pj += 1;
    pareja2.pj += 1;

    pareja1.gj += games1 + games2;
    pareja2.gj += games1 + games2;

    pareja1.gf += games1;
    pareja2.gf += games2;
    pareja1.gc += games2;
    pareja2.gc += games1;

    if (p.resultado === 1) {
      pareja1.pg += 1;
      pareja2.pp += 1;
      pareja1.puntos += 1;
    } else if (p.resultado === 2) {
      pareja2.pg += 1;
      pareja1.pp += 1;
      pareja2.puntos += 1;
    } else if (p.resultado === 0) {
      pareja1.pe += 1;
      pareja2.pe += 1;
      pareja1.puntos += 0.5;
      pareja2.puntos += 0.5;
    }
  }

  const rows: PosicionPareja[] = parejas.map((pareja) => {
    const acc = acumulado.get(pareja.id) ?? { puntos: 0, pj: 0, pg: 0, pe: 0, pp: 0, gj: 0, gf: 0, gc: 0 };
    const porcentajePartidosGanados = acc.pj > 0 ? (acc.pg / acc.pj) * 100 : 0;
    const porcentajeGamesGanados = acc.gj > 0 ? (acc.gf / acc.gj) * 100 : 0;
    return {
      parejaId: pareja.id,
      puntos: acc.puntos,
      partidosJugados: acc.pj,
      partidosGanados: acc.pg,
      partidosEmpatados: acc.pe,
      partidosPerdidos: acc.pp,
      porcentajePartidosGanados,
      gamesJugados: acc.gj,
      gamesGanados: acc.gf,
      gamesPerdidos: acc.gc,
      porcentajeGamesGanados,
    };
  });

  return rows.sort((a, b) => {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    if (b.porcentajePartidosGanados !== a.porcentajePartidosGanados) return b.porcentajePartidosGanados - a.porcentajePartidosGanados;
    return b.porcentajeGamesGanados - a.porcentajeGamesGanados;
  });
}

function groupByPista(partidos: Partido[]) {
  const by: Record<string, Partido[]> = {};
  for (const p of partidos) {
    const key = p.pista ?? "-";
    by[key] = by[key] ?? [];
    by[key].push(p);
  }
  return Object.entries(by)
    .sort(([a], [b]) => `${a}`.localeCompare(`${b}`))
    .map(([pista, lista]) => ({ pista, lista }));
}

export default function EventDetailPage() {
  const { id = "t1" } = useParams();
  const { evento, parejas, partidos, rondas } = useEventoData(id);

  const [rondaSeleccionada, setRondaSeleccionada] = useState<number | undefined>(rondas[0]);
  const [metricView, setMetricView] = useState<"partidos" | "games">("partidos");

  const posiciones = useMemo(() => computeAggregatesPorPareja(partidos, parejas), [partidos, parejas]);

  const partidosDeRonda = useMemo(() => {
    if (!rondaSeleccionada) return [] as Partido[];
    return partidos.filter((p) => p.ronda === rondaSeleccionada);
  }, [partidos, rondaSeleccionada]);

  const parejasEnBye = useMemo(() => {
    if (!rondaSeleccionada) return [] as Pareja[];
    const presentes = new Set<string>();
    for (const p of partidosDeRonda) {
      presentes.add(p.pareja1Id);
      presentes.add(p.pareja2Id);
    }
    return parejas.filter((pa) => !presentes.has(pa.id));
  }, [parejas, partidosDeRonda, rondaSeleccionada]);

  function goPrevRound() {
    if (!rondaSeleccionada) return;
    const idx = rondas.indexOf(rondaSeleccionada);
    if (idx > 0) setRondaSeleccionada(rondas[idx - 1]);
  }
  function goNextRound() {
    if (!rondaSeleccionada) return;
    const idx = rondas.indexOf(rondaSeleccionada);
    if (idx < rondas.length - 1) setRondaSeleccionada(rondas[idx + 1]);
  }

  return (
    <main className="container py-8 space-y-6">
      <Seo title={`${evento.nombre} - Court Champions`} description={`Detalle del pozo: ${evento.nombre}`} canonicalPath={`/events/${id}`} />

      <header className="space-y-2">
        <div className="flex items-center gap-2">
          <h1 className="text-3xl font-semibold tracking-tight">{evento.nombre}</h1>
          <Badge variant="outline">Finalizado</Badge>
        </div>
        <p className="text-muted-foreground">Formato: Todos contra todos, pareja fija</p>
        <p className="text-sm text-muted-foreground">Sábado 24 May 2025, 9:00 AM</p>
      </header>

      <Tabs defaultValue="players" className="w-full">
        <TabsList>
          <TabsTrigger value="players">Jugadores</TabsTrigger>
          <TabsTrigger value="rounds">Rondas</TabsTrigger>
          <TabsTrigger value="positions">Posiciones</TabsTrigger>
        </TabsList>

        {/* PAREJAS */}
        <TabsContent value="players" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Parejas inscriptas</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {parejas.map((p) => (
                  <li key={p.id} className="rounded-md border p-3">
                    <p className="font-medium">{nombrePareja(p)}</p>
                    <p className="text-sm text-muted-foreground">ID: {p.id}</p>
                  </li>
                ))}
                {parejas.length === 0 && <li className="text-sm text-muted-foreground">Sin parejas inscriptas</li>}
              </ul>
              <p className="text-xs mt-4 text-muted-foreground">Pago aprobado</p>
            </CardContent>
          </Card>
        </TabsContent>

        {/* RONDAS */}
        <TabsContent value="rounds" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <Button variant="ghost" size="icon" onClick={goPrevRound} aria-label="Ronda anterior">
                  <ChevronLeft className="h-5 w-5" />
                </Button>
                <CardTitle>
                  Ronda {rondaSeleccionada ?? "-"} / {rondas.length}
                </CardTitle>
                <Button variant="ghost" size="icon" onClick={goNextRound} aria-label="Ronda siguiente">
                  <ChevronRight className="h-5 w-5" />
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              {groupByPista(partidosDeRonda).map(({ pista, lista }) => (
                <div key={pista} className="mb-6">
                  <h3 className="text-sm font-semibold text-muted-foreground mb-3">Pista {pista}</h3>
                  <div className="space-y-4">
                    {lista.map((p) => {
                      const p1 = parejas.find((pp) => pp.id === p.pareja1Id)!;
                      const p2 = parejas.find((pp) => pp.id === p.pareja2Id)!;
                      const score1 = p.gamesPareja1;
                      const score2 = p.gamesPareja2;
                      const isPlayed = p.resultado !== undefined && score1 !== undefined && score2 !== undefined;
                      const p1Wins = p.resultado === 1;
                      const p2Wins = p.resultado === 2;

                      return (
                        <div key={p.id} className="grid grid-cols-12 gap-3 items-center">
                          <div className="col-span-8">
                            <div className="flex flex-col gap-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">vs</span>
                              </div>
                              <div className="space-y-3">
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{nombrePareja(p1)}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-md border flex items-center justify-center text-lg font-medium">
                                      {score1 ?? "-"}
                                    </div>
                                    {isPlayed ? (
                                      p1Wins ? <Check className="text-emerald-600" /> : <X className="text-destructive" />
                                    ) : null}
                                  </div>
                                </div>
                                <div className="flex items-center justify-between">
                                  <span className="font-medium">{nombrePareja(p2)}</span>
                                  <div className="flex items-center gap-2">
                                    <div className="w-10 h-10 rounded-md border flex items-center justify-center text-lg font-medium">
                                      {score2 ?? "-"}
                                    </div>
                                    {isPlayed ? (
                                      p2Wins ? <Check className="text-emerald-600" /> : <X className="text-destructive" />
                                    ) : null}
                                  </div>
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              ))}

              {parejasEnBye.length > 0 && (
                <p className="text-sm text-destructive mt-6">Pareja en bye</p>
              )}
            </CardContent>
          </Card>

          {/* Filtro alternativo: selector de ronda para accesibilidad */}
          <Card>
            <CardHeader>
              <CardTitle>Ir a ronda específica</CardTitle>
            </CardHeader>
            <CardContent className="flex items-center gap-3">
              <Select
                value={rondaSeleccionada?.toString()}
                onValueChange={(v) => setRondaSeleccionada(Number(v))}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Ronda" />
                </SelectTrigger>
                <SelectContent>
                  {rondas.map((r) => (
                    <SelectItem key={r} value={r.toString()}>
                      Ronda {r}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </CardContent>
          </Card>
        </TabsContent>

        {/* POSICIONES */}
        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Podio</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-3 gap-3">
                {posiciones.slice(0, 3).map((row, idx) => {
                  const pareja = parejas.find((p) => p.id === row.parejaId)!;
                  const label = idx === 0 ? "1er lugar: +50pts" : idx === 1 ? "2do lugar: +25pts" : "3er lugar: +10pts";
                  return (
                    <div key={row.parejaId} className={`rounded-md border p-3 ${idx === 0 ? "bg-muted" : ""}`}>
                      <div className="text-sm text-muted-foreground mb-1">{label}</div>
                      <div className="font-medium">{nombrePareja(pareja)}</div>
                    </div>
                  );
                })}
                {posiciones.length === 0 && <div className="text-sm text-muted-foreground col-span-3">Sin datos</div>}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center gap-3">
                <Tabs value={metricView} onValueChange={(v) => setMetricView(v as "partidos" | "games")}> 
                  <TabsList>
                    <TabsTrigger value="partidos">Partidos</TabsTrigger>
                    <TabsTrigger value="games">Games</TabsTrigger>
                  </TabsList>
                </Tabs>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>#</TableHead>
                    <TableHead>Parejas</TableHead>
                    <TableHead className="text-right">✓</TableHead>
                    <TableHead className="text-right">✗</TableHead>
                    <TableHead className="text-right">Dif</TableHead>
                    <TableHead className="text-right">%</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posiciones.map((row, idx) => {
                    const pareja = parejas.find((p) => p.id === row.parejaId)!;
                    const wins = metricView === "partidos" ? row.partidosGanados : row.gamesGanados;
                    const losses = metricView === "partidos" ? row.partidosPerdidos : row.gamesPerdidos;
                    const total = metricView === "partidos" ? row.partidosJugados : row.gamesJugados;
                    const diff = wins - losses;
                    const percent = total > 0 ? Math.round((wins / total) * 100) : 0;
                    return (
                      <TableRow key={row.parejaId}>
                        <TableCell className="font-medium">{idx + 1}</TableCell>
                        <TableCell>{nombrePareja(pareja)}</TableCell>
                        <TableCell className="text-right">{wins}</TableCell>
                        <TableCell className="text-right">{losses}</TableCell>
                        <TableCell className="text-right">{diff >= 0 ? "+" : ""}{diff}</TableCell>
                        <TableCell className="text-right">{percent}%</TableCell>
                      </TableRow>
                    );
                  })}
                  {posiciones.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center text-muted-foreground">
                        Sin datos de posiciones
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </main>
  );
}