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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  { id: "m1", eventoId: "t1", pareja1Id: "p1", pareja2Id: "p2", ronda: 1, gamesPareja1: 6, gamesPareja2: 4, resultado: 1 },
  { id: "m2", eventoId: "t1", pareja1Id: "p3", pareja2Id: "p2", ronda: 1, gamesPareja1: 5, gamesPareja2: 5, resultado: 0 },
  // Ronda 2: uno jugado, uno próximo
  { id: "m3", eventoId: "t1", pareja1Id: "p1", pareja2Id: "p3", ronda: 2, gamesPareja1: 3, gamesPareja2: 6, resultado: 2 },
  { id: "m4", eventoId: "t1", pareja1Id: "p2", pareja2Id: "p1", ronda: 2, fechaISO: in1h },
  // Ronda 3: próximos
  { id: "m5", eventoId: "t1", pareja1Id: "p2", pareja2Id: "p3", ronda: 3, fechaISO: in2h },
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

// --- Cálculos de posiciones por pareja ---
export type PosicionPareja = {
  parejaId: string;
  puntos: number; // 1 por victoria, 0.5 por empate
  partidosJugados: number;
  partidosGanados: number;
  porcentajePartidosGanados: number; // 0-100
  gamesJugados: number;
  gamesGanados: number;
  porcentajeGamesGanados: number; // 0-100
};

function computeTablaPosicionesPorPareja(partidos: Partido[], parejas: Pareja[]): PosicionPareja[] {
  const finalizados = partidos.filter((p) => p.resultado !== undefined && p.gamesPareja1 !== undefined && p.gamesPareja2 !== undefined);
  const acumulado = new Map<string, { puntos: number; pj: number; pg: number; gj: number; gg: number }>();

  function ensure(pairId: string) {
    if (!acumulado.has(pairId)) {
      acumulado.set(pairId, { puntos: 0, pj: 0, pg: 0, gj: 0, gg: 0 });
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

    pareja1.gg += games1;
    pareja2.gg += games2;

    if (p.resultado === 1) {
      pareja1.pg += 1;
      pareja1.puntos += 1;
    } else if (p.resultado === 2) {
      pareja2.pg += 1;
      pareja2.puntos += 1;
    } else if (p.resultado === 0) {
      pareja1.puntos += 0.5;
      pareja2.puntos += 0.5;
    }
  }

  const rows: PosicionPareja[] = parejas.map((pareja) => {
    const acc = acumulado.get(pareja.id) ?? { puntos: 0, pj: 0, pg: 0, gj: 0, gg: 0 };
    const porcentajePartidosGanados = acc.pj > 0 ? (acc.pg / acc.pj) * 100 : 0;
    const porcentajeGamesGanados = acc.gj > 0 ? (acc.gg / acc.gj) * 100 : 0;
    return {
      parejaId: pareja.id,
      puntos: acc.puntos,
      partidosJugados: acc.pj,
      partidosGanados: acc.pg,
      porcentajePartidosGanados,
      gamesJugados: acc.gj,
      gamesGanados: acc.gg,
      porcentajeGamesGanados,
    };
  });

  return rows.sort((a, b) => {
    if (b.puntos !== a.puntos) return b.puntos - a.puntos;
    if (b.porcentajePartidosGanados !== a.porcentajePartidosGanados) return b.porcentajePartidosGanados - a.porcentajePartidosGanados;
    return b.porcentajeGamesGanados - a.porcentajeGamesGanados;
  });
}

export default function EventDetailPage() {
  const { id = "t1" } = useParams();
  const { evento, parejas, partidos, rondas } = useEventoData(id);

  const [rondaSeleccionada, setRondaSeleccionada] = useState<number | undefined>(rondas[0]);

  const posiciones = useMemo(() => computeTablaPosicionesPorPareja(partidos, parejas), [partidos, parejas]);

  const partidosProximos = useMemo(() => {
    if (!rondaSeleccionada) return [] as Partido[];
    return partidos.filter((p) => p.ronda === rondaSeleccionada && p.resultado === undefined);
  }, [partidos, rondaSeleccionada]);

  return (
    <main className="container py-8 space-y-6">
      <Seo title={`${evento.nombre} - Court Champions`} description={`Detalle del pozo: ${evento.nombre}`} canonicalPath={`/events/${id}`} />

      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">{evento.nombre}</h1>
        <p className="text-muted-foreground">Categoría: {evento.categoria}</p>
      </header>

      <Tabs defaultValue="pairs" className="w-full">
        <TabsList>
          <TabsTrigger value="pairs">Parejas</TabsTrigger>
          <TabsTrigger value="rounds">Rondas</TabsTrigger>
          <TabsTrigger value="positions">Posiciones</TabsTrigger>
        </TabsList>

        <TabsContent value="pairs" className="space-y-4">
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
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="rounds" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Seleccionar ronda</CardTitle>
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

          <Card>
            <CardHeader>
              <CardTitle>Próximos partidos</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Fecha</TableHead>
                    <TableHead>Pareja 1</TableHead>
                    <TableHead>Pareja 2</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {partidosProximos.map((p) => {
                    const p1 = parejas.find((pp) => pp.id === p.pareja1Id)!;
                    const p2 = parejas.find((pp) => pp.id === p.pareja2Id)!;
                    return (
                      <TableRow key={p.id}>
                        <TableCell className="font-medium">{p.fechaISO ? new Date(p.fechaISO).toLocaleString() : "-"}</TableCell>
                        <TableCell>{nombrePareja(p1)}</TableCell>
                        <TableCell>{nombrePareja(p2)}</TableCell>
                      </TableRow>
                    );
                  })}
                  {partidosProximos.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-muted-foreground">
                        No hay partidos próximos para la ronda seleccionada
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="positions" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tabla de posiciones</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Puntos</TableHead>
                    <TableHead>Pareja</TableHead>
                    <TableHead className="text-right">Partidos jugados</TableHead>
                    <TableHead className="text-right">Partidos ganados</TableHead>
                    <TableHead className="text-right">% partidos ganados</TableHead>
                    <TableHead className="text-right">Games jugados</TableHead>
                    <TableHead className="text-right">Games ganados</TableHead>
                    <TableHead className="text-right">% games ganados</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {posiciones.map((row) => {
                    const pareja = parejas.find((p) => p.id === row.parejaId)!;
                    return (
                      <TableRow key={row.parejaId}>
                        <TableCell className="font-medium">{row.puntos}</TableCell>
                        <TableCell>{nombrePareja(pareja)}</TableCell>
                        <TableCell className="text-right">{row.partidosJugados}</TableCell>
                        <TableCell className="text-right">{row.partidosGanados}</TableCell>
                        <TableCell className="text-right">{row.porcentajePartidosGanados.toFixed(0)}%</TableCell>
                        <TableCell className="text-right">{row.gamesJugados}</TableCell>
                        <TableCell className="text-right">{row.gamesGanados}</TableCell>
                        <TableCell className="text-right">{row.porcentajeGamesGanados.toFixed(0)}%</TableCell>
                      </TableRow>
                    );
                  })}
                  {posiciones.length === 0 && (
                    <TableRow>
                      <TableCell colSpan={8} className="text-center text-muted-foreground">
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