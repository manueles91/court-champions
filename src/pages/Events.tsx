import React from "react";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

export type EventoListItem = {
  id: string;
  nombre: string;
  inicio: string; // ISO string
  jugadoresInscritos: number;
  estado: "programado" | "en_curso" | "finalizado";
};

const mockEvents: EventoListItem[] = [
  { id: "t1", nombre: "Apertura 2025", inicio: new Date().toISOString(), jugadoresInscritos: 16, estado: "finalizado" },
  { id: "t2", nombre: "Clausura 2025", inicio: new Date(Date.now() + 86400000).toISOString(), jugadoresInscritos: 12, estado: "programado" },
];

function EstadoBadge({ estado }: { estado: EventoListItem["estado"] }) {
  const variants: Record<EventoListItem["estado"], { label: string; variant?: "secondary" | "default" | "destructive" | "outline" }> = {
    programado: { label: "Programado", variant: "secondary" },
    en_curso: { label: "En curso", variant: "default" },
    finalizado: { label: "Finalizado", variant: "outline" },
  };
  const cfg = variants[estado];
  return <Badge variant={cfg.variant}>{cfg.label}</Badge>;
}

export default function EventsPage() {
  return (
    <main className="container py-8 space-y-6">
      <Seo title="Eventos - Court Champions" description="Lista de pozos y torneos de pádel." canonicalPath="/events" />

      <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight">Eventos</h1>
          <p className="text-muted-foreground">Consulta y gestiona pozos y torneos.</p>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild>
            <Link to="/dashboard">Crear nuevo</Link>
          </Button>
        </div>
      </header>

      <Card>
        <CardHeader>
          <CardTitle>Listado</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Evento</TableHead>
                <TableHead>Inicio</TableHead>
                <TableHead>Inscritos</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead className="text-right">Acciones</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {mockEvents.map((e) => (
                <TableRow key={e.id}>
                  <TableCell className="font-medium"><Link to={`/events/${e.id}`} className="hover:underline">{e.nombre}</Link></TableCell>
                  <TableCell>{new Date(e.inicio).toLocaleString()}</TableCell>
                  <TableCell>{e.jugadoresInscritos}</TableCell>
                  <TableCell>
                    <EstadoBadge estado={e.estado} />
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="outline" size="sm" asChild>
                      <Link to={`/events/${e.id}`}>Ver detalle</Link>
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {mockEvents.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-muted-foreground">
                    No hay eventos. Crea uno desde "Crear nuevo".
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </main>
  );
}