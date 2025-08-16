import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import { toast } from "@/components/ui/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TournamentList } from "@/components/TournamentList";

const tournamentFormats = [
  { value: 'round_robin_per_pairs', label: 'Round Robin por Parejas', description: 'Cada pareja juega contra todas las demás parejas' },
  { value: 'swiss_system', label: 'Sistema Suizo', description: 'Parejas con puntuación similar se enfrentan' },
  { value: 'single_elimination', label: 'Eliminación Directa', description: 'Sistema de eliminación directa' },
  { value: 'double_elimination', label: 'Doble Eliminación', description: 'Dos derrotas para ser eliminado' }
];

const tournamentTypes = [
  { value: 'fast_tournament', label: 'Torneo Rápido', description: 'Partidos cortos y dinámicos' },
  { value: 'reg_tournament', label: 'Torneo Regular', description: 'Torneo estándar con tiempo normal' },
  { value: 'finals', label: 'Finales', description: 'Fase final del torneo' }
];

const schema = z.object({
  name: z.string().min(2, "Ingresa un nombre del torneo"),
  starts_at: z.string().min(1, "Selecciona fecha y hora"),
  tournament_type: z.enum(['fast_tournament', 'reg_tournament', 'finals'], {
    required_error: "Selecciona un tipo de torneo"
  }),
  tournament_format: z.enum(['round_robin_per_pairs', 'swiss_system', 'single_elimination', 'double_elimination'], {
    required_error: "Selecciona un formato de torneo"
  }),
  match_duration_min: z.coerce.number().int().min(5).max(180),
  total_rounds: z.coerce.number().int().min(1).max(20),
  max_pairs: z.coerce.number().int().min(2).max(32),
  venue: z.string().min(2, "Ingresa la sede del torneo"),
});

type FormValues = z.infer<typeof schema>;

export default function Dashboard() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      name: "",
      starts_at: "",
      tournament_type: undefined,
      tournament_format: undefined,
      match_duration_min: 20,
      total_rounds: 5,
      max_pairs: 8,
      venue: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    try {
      const { data, error } = await supabase
        .from('tournaments')
        .insert([{
          name: values.name,
          starts_at: values.starts_at,
          tournament_type: values.tournament_type,
          tournament_format: values.tournament_format,
        }])
        .select()
        .single();

      if (error) throw error;

      toast({
        title: "¡Torneo creado!",
        description: `El torneo "${values.name}" ha sido creado exitosamente.`,
      });

      // Reset form after successful creation
      form.reset();
      
      console.log("Torneo creado:", data);
      
    } catch (error) {
      console.error("Error al crear torneo:", error);
      toast({
        title: "Error al crear torneo",
        description: "Hubo un problema al crear el torneo. Inténtalo de nuevo.",
        variant: "destructive",
      });
    }
  };

  return (
    <main className="container py-8 space-y-6">
      <Seo
        title="Dashboard Pádel - Gestión de Pozos"
        description="Crea y gestiona pozos de pádel: tiempos, rondas y resultados."
        canonicalPath="/dashboard"
      />

      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Gestión de Pozos</h1>
        <p className="text-muted-foreground">Configura un nuevo pozo y registra resultados.</p>
      </header>

      <div className="grid gap-8 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Crear nuevo torneo</CardTitle>
            </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="space-y-6">
                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Nombre del Torneo</FormLabel>
                        <FormControl>
                          <Input placeholder="Pozo Viernes Noche" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="starts_at"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Fecha y hora de inicio</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-2">
                  <FormField
                    control={form.control}
                    name="tournament_type"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Tipo de Torneo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona tipo de torneo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tournamentTypes.map((type) => (
                              <SelectItem key={type.value} value={type.value}>
                                <div>
                                  <div className="font-medium">{type.label}</div>
                                  <div className="text-sm text-muted-foreground">{type.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="tournament_format"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Formato del Torneo</FormLabel>
                        <Select onValueChange={field.onChange} defaultValue={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Selecciona formato de torneo" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {tournamentFormats.map((format) => (
                              <SelectItem key={format.value} value={format.value}>
                                <div>
                                  <div className="font-medium">{format.label}</div>
                                  <div className="text-sm text-muted-foreground">{format.description}</div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <div className="grid gap-6 md:grid-cols-3">
                  <FormField
                    control={form.control}
                    name="match_duration_min"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duración por partido (min)</FormLabel>
                        <FormControl>
                          <Input type="number" min={5} max={180} step={5} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="total_rounds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad de rondas</FormLabel>
                        <FormControl>
                          <Input type="number" min={1} max={20} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={form.control}
                    name="max_pairs"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cantidad de parejas</FormLabel>
                        <FormControl>
                          <Input type="number" min={2} max={32} {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                <FormField
                  control={form.control}
                  name="venue"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Sede</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Dirección completa de la sede del torneo" 
                          className="min-h-[100px]"
                          {...field} 
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </CardContent>
              <CardFooter className="flex items-center gap-3">
                <Button type="submit">Guardar configuración</Button>
                <Button variant="secondary" asChild>
                  <Link to="/players">Gestionar jugadores</Link>
                </Button>
              </CardFooter>
            </form>
          </Form>
        </Card>
        </div>
        
        <div>
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Información</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div>
                <h4 className="font-medium mb-2">Formatos de Torneo:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li><strong>Round Robin:</strong> Cada pareja juega contra todas las demás</li>
                  <li><strong>Sistema Suizo:</strong> Parejas con puntuación similar se enfrentan</li>
                  <li><strong>Eliminación Directa:</strong> Una derrota elimina del torneo</li>
                  <li><strong>Doble Eliminación:</strong> Dos derrotas para ser eliminado</li>
                </ul>
              </div>
              <div>
                <h4 className="font-medium mb-2">Tipos de Torneo:</h4>
                <ul className="space-y-2 text-muted-foreground">
                  <li><strong>Rápido:</strong> Partidos cortos y dinámicos</li>
                  <li><strong>Regular:</strong> Duración estándar</li>
                  <li><strong>Finales:</strong> Fase final del torneo</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      <section>
        <div className="mb-4">
          <h2 className="text-2xl font-semibold">Torneos Recientes</h2>
          <p className="text-muted-foreground">Gestiona tus torneos existentes</p>
        </div>
        <TournamentList />
      </section>
    </main>
  );
}
