import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, MapPin, Users, Clock } from "lucide-react";
import { Link } from "react-router-dom";

interface Tournament {
  tournament_id: string;
  name: string;
  starts_at?: string;
  tournament_type?: string;
  tournament_format?: string;
  created_at: string;
}

interface TournamentCardProps {
  tournament: Tournament;
}

const tournamentTypeLabels: Record<string, string> = {
  fast_tournament: "Torneo Rápido",
  reg_tournament: "Torneo Regular", 
  finals: "Finales"
};

const tournamentFormatLabels: Record<string, string> = {
  round_robin_per_pairs: "Round Robin",
  swiss_system: "Sistema Suizo",
  single_elimination: "Eliminación Directa",
  double_elimination: "Doble Eliminación"
};

export function TournamentCard({ tournament }: TournamentCardProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <Card className="hover:shadow-lg transition-shadow">
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between">
          <CardTitle className="text-xl">{tournament.name}</CardTitle>
          <div className="flex flex-col gap-2">
            {tournament.tournament_type && (
              <Badge variant="secondary">
                {tournamentTypeLabels[tournament.tournament_type]}
              </Badge>
            )}
            {tournament.tournament_format && (
              <Badge variant="outline">
                {tournamentFormatLabels[tournament.tournament_format]}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 text-sm text-muted-foreground">
          {tournament.starts_at && (
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formatDate(tournament.starts_at)}</span>
            </div>
          )}
          <div className="flex items-center gap-2">
            <Clock className="h-4 w-4" />
            <span>Creado: {formatDate(tournament.created_at)}</span>
          </div>
        </div>
        <div className="flex gap-2 pt-2">
          <Button asChild size="sm" className="flex-1">
            <Link to={`/events/${tournament.tournament_id}`}>
              Ver Detalles
            </Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link to={`/tournaments/${tournament.tournament_id}/manage`}>
              Gestionar
            </Link>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}