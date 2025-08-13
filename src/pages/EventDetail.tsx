import React, { useMemo, useState } from "react";
import { useParams } from "react-router-dom";
import Seo from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Separator } from "@/components/ui/separator";

// --- Types aligned with PRD ---
export type Usuario = { id: string; nombre: string; email?: string | null; telefono?: string | null };
export type Pareja = { id: string; jugador1Id: string; jugador2Id: string };
export type Partido = {
  id: string;
  eventoId: string;
  pareja1Id: string;
  pareja2Id: string;
  gamesPareja1: number;
  gamesPareja2: number;
  ganador: 1 | 2;
};
export type EstadisticaPartidoJugador = {
  partidoId: string;
  jugadorId: string;
  gamesGanados: number;
  gamesJugados: number;
  resultado: 0 | 1;
};
export type ResultadoTorneoJugador = {
  eventoId: string;
  jugadorId: string;
  puntos: number;
  posicion: number;
};

// --- Mock data ---
const mockUsuarios: Usuario[] = [
  { id: "1", nombre: "Ana López" },
  { id: "2", nombre: "Carlos Pérez" },
  { id: "3", nombre: "María Gómez" },
  { id: "4", nombre: "Jorge Ruiz" },
];

const mockParejas: Pareja[] = [
  { id: "p1", jugador1Id: "1", jugador2Id: "2" },
  { id: "p2", jugador1Id: "3", jugador2Id: "4" },
];

const mockPartidos: Partido[] = [
  { id: "m1", eventoId: "t1", pareja1Id: "p1", pareja2Id: "p2", gamesPareja1: 6, gamesPareja2: 0, ganador: 1 },
];

function useEventoData(eventoId: string) {
  // In a real app, fetch by eventoId
  const jugadores = mockUsuarios;
  const parejas = mockParejas;
  const partidos = mockPartidos.filter((m) => m.eventoId === eventoId);
  return { jugadores, parejas, partidos };
}

function nombreJugador(id: string) {
  return mockUsuarios.find((u) => u.id === id)?.nombre ?? "";
}

function nombrePareja(pareja: Pareja) {
  return `${nombreJugador(pareja.jugador1Id)} / ${nombreJugador(pareja.jugador2Id)}`;
}

function computeEstadisticasPorJugador(partidos: Partido[], parejas: Pareja[]): EstadisticaPartidoJugador[] {
  const parejaById = new Map(parejas.map((p) => [p.id, p] as const));
  const stats: EstadisticaPartidoJugador[] = [];

  for (const partido of partidos) {
    const p1 = parejaById.get(partido.pareja1Id)!;
    const p2 = parejaById.get(partido.pareja2Id)!;

    const ganadorPareja = partido.ganador === 1 ? p1 : p2;
    const perdedorPareja = partido.ganador === 1 ? p2 : p1;
    const gamesGanador = Math.max(partido.gamesPareja1, partido.gamesPareja2);
    const gamesPerdedor = Math.min(partido.gamesPareja1, partido.gamesPareja2);

    for (const jugadorId of [ganadorPareja.jugador1Id, ganadorPareja.jugador2Id]) {
      stats.push({
        partidoId: partido.id,
        jugadorId,
        gamesGanados: gamesGanador,
        gamesJugados: gamesGanador,
        resultado: 1,
      });
    }
    for (const jugadorId of [perdedorPareja.jugador1Id, perdedorPareja.jugador2Id]) {
      stats.push({
        partidoId: partido.id,
        jugadorId,
        gamesGanados: gamesPerdedor,
        gamesJugados: gamesGanador,
        resultado: 0,
      });
    }
  }

  return stats;
}

function computeResultadosFinales(partidos: Partido[], parejas: Pareja[]): ResultadoTorneoJugador[] {
  const stats = computeEstadisticasPorJugador(partidos, parejas);
  const byJugador = new Map<string, { puntos: number }>();

  for (const row of stats) {
    const current = byJugador.get(row.jugadorId) ?? { puntos: 0 };
    current.puntos += row.resultado === 1 ? 1 : 0; // 1 punto por victoria
    byJugador.set(row.jugadorId, current);
  }

  const resultados = Array.from(byJugador.entries())
    .map(([jugadorId, { puntos }]) => ({ eventoId: "", jugadorId, puntos, posicion: 0 }))
    .sort((a, b) => b.puntos - a.puntos)
    .map((r, idx) => ({ ...r, posicion: idx + 1 }));

  return resultados;
}

export default function EventDetailPage() {
  const { id = "t1" } = useParams();
  const { jugadores, parejas, partidos } = useEventoData(id);
  const [nuevoResultado, setNuevoResultado] = useState({ pareja1Id: parejas[0]?.id ?? "", pareja2Id: parejas[1]?.id ?? "", games1: 6, games2: 0 });

  const statsPorJugador = useMemo(() => computeEstadisticasPorJugador(partidos, parejas), [partidos, parejas]);
  const resultadosFinales = useMemo(() => computeResultadosFinales(partidos, parejas), [partidos, parejas]);

  const onAgregarResultado = (e: React.FormEvent) => {
    e.preventDefault();
    // En MVP, no persistimos. Mostraría cómo se guardaría.
    // Aquí podríamos hacer un toast indicando que se requiere backend.
    // deliberately no-op
  };

  return (
    <main className="container py-8 space-y-6">
      <Seo title={`Evento ${id} - Court Champions`} description="Detalle de jugadores, partidos y resultados del evento." canonicalPath={`/events/${id}`} />

      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Detalle del Evento</h1>
        <p className="text-muted-foreground">Jugadores, partidos y resultados.</p>
      </header>

      <Tabs defaultValue="players" className="w-full">
        <TabsList>
          <TabsTrigger value="players">Jugadores</TabsTrigger>
          <TabsTrigger value="matches">Partidos</TabsTrigger>
          <TabsTrigger value="results">Resultados</TabsTrigger>
        </TabsList>

        <TabsContent value="players" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Inscritos</CardTitle>
            </CardHeader>
            <CardContent>
              <ul className="grid md:grid-cols-2 lg:grid-cols-3 gap-3">
                {jugadores.map((j) => (
                  <li key={j.id} className="rounded-md border p-3">
                    <p className="font-medium">{j.nombre}</p>
                    <p className="text-sm text-muted-foreground">ID: {j.id}</p>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="matches" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Registrar resultado</CardTitle>
            </CardHeader>
            <CardContent>
              <form onSubmit={onAgregarResultado} className="grid md:grid-cols-4 gap-3">
                <div className="space-y-2">
                  <Label>Pareja 1</Label>
                  <Input value={nuevoResultado.pareja1Id} onChange={(e) => setNuevoResultado({ ...nuevoResultado, pareja1Id: e.target.value })} placeholder="p1" />
                </div>
                <div className="space-y-2">
                  <Label>Pareja 2</Label>
                  <Input value={nuevoResultado.pareja2Id} onChange={(e) => setNuevoResultado({ ...nuevoResultado, pareja2Id: e.target.value })} placeholder="p2" />
                </div>
                <div className="space-y-2">
                  <Label>Games P1</Label>
                  <Input type="number" min={0} max={7} value={nuevoResultado.games1} onChange={(e) => setNuevoResultado({ ...nuevoResultado, games1: Number(e.target.value) })} />
                </div>
                <div className="space-y-2">
                  <Label>Games P2</Label>
                  <Input type="number" min={0} max={7} value={nuevoResultado.games2} onChange={(e) => setNuevoResultado({ ...nuevoResultado, games2: Number(e.target.value) })} />
                </div>
                <div className="md:col-span-4">
                  <Button type="submit">Guardar resultado</Button>
                </div>
              </form>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Partidos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>ID</TableHead>
                    <TableHead>Pareja 1</TableHead>
                    <TableHead>Pareja 2</TableHead>
                    <TableHead className="text-right">Marcador</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partidos.map((p) => {
                    const p1 = mockParejas.find((pp) => pp.id === p.pareja1Id)!;
                    const p2 = mockParejas.find((pp) => pp.id === p.pareja2Id)!;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.id}</TableCell>
                        <TableCell>{nombrePareja(p1)}</TableCell>
                        <TableCell>{nombrePareja(p2)}</TableCell>
                        <TableCell className="text-right">{p.gamesPareja1} - {p.gamesPareja2}</TableCell>
                      </TableRow>
                    );
                  })}
                  {partidos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">Sin partidos</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="results" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Estadísticas por jugador (partidos)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Jugador</TableHead>
                    <TableHead className="text-right">Games ganados</TableHead>
                    <TableHead className="text-right">Games jugados</TableHead>
                    <TableHead className="text-right">Resultado</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {statsPorJugador.map((s) => (
                    <TableRow key={`${s.partidoId}-${s.jugadorId}`}>
                      <TableCell>{nombreJugador(s.jugadorId)}</TableCell>
                      <TableCell className="text-right">{s.gamesGanados}</TableCell>
                      <TableCell className="text-right">{s.gamesJugados}</TableCell>
                      <TableCell className="text-right">{s.resultado === 1 ? "Ganó" : "Perdió"}</TableCell>
                    </TableRow>
                  ))}
                  {statsPorJugador.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center text-muted-foreground">Sin estadísticas registradas</TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Separator />

          <Card>
            <CardHeader>
              <CardTitle>Resultados finales (por jugador)</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pos</TableHead>
                    <TableHead>Jugador</TableHead>
                    <TableHead className="text-right">Puntos</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {resultadosFinales.map((r, idx) => (
                    <TableRow key={r.jugadorId}>
                      <TableCell className="font-medium">{idx + 1}</TableCell>
                      <TableCell>{nombreJugador(r.jugadorId)}</TableCell>
                      <TableCell className="text-right">{r.puntos}</TableCell>
                    </TableRow>
                  ))}
                  {resultadosFinales.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">Sin resultados</TableCell>
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