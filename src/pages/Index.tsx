import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo";

const Index = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <Seo title="Court Champions - Gestión de Pádel" description="Crea pozos, registra partidos y jugadores de pádel." canonicalPath="/" />
      <div className="text-center space-y-6">
        <h1 className="text-4xl font-bold">Court Champions</h1>
        <p className="text-xl text-muted-foreground">Gestiona pozos, torneos y jugadores de pádel.</p>
        <div className="flex items-center justify-center gap-3">
          <Button asChild>
            <Link to="/dashboard">Ir al Dashboard</Link>
          </Button>
          <Button variant="secondary" asChild>
            <Link to="/players">Gestionar Jugadores</Link>
          </Button>
        </div>
      </div>
    </div>
  );
};

export default Index;
