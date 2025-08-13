import React from "react";
import { z } from "zod";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent, CardFooter } from "@/components/ui/card";
import { Link } from "react-router-dom";
import Seo from "@/components/Seo";
import { toast } from "@/components/ui/use-toast";
import { isSupabaseConnected } from "@/lib/supabaseOptional";

const schema = z.object({
  nombre: z.string().min(2, "Ingresa un nombre"),
  inicio: z.string().min(1, "Selecciona fecha y hora"),
  duracionPartidoMin: z.coerce.number().int().min(5).max(180),
  duracionPozoMin: z.coerce.number().int().min(10).max(600),
});

type FormValues = z.infer<typeof schema>;

export default function Dashboard() {
  const form = useForm<FormValues>({
    resolver: zodResolver(schema),
    defaultValues: {
      nombre: "",
      inicio: "",
      duracionPartidoMin: 20,
      duracionPozoMin: 120,
    },
  });

  const onSubmit = async (values: FormValues) => {
    if (!isSupabaseConnected) {
      toast({
        title: "Conecta Supabase",
        description: "Para guardar el pozo, conecta la integración de Supabase (botón verde arriba).",
      });
      console.log("Pozo (pendiente de guardar en Supabase):", values);
      return;
    }
    // Cuando Supabase esté disponible, insertaremos el registro aquí.
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

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Crear nuevo pozo</CardTitle>
          </CardHeader>
          <Form {...form}>
            <form onSubmit={form.handleSubmit(onSubmit)}>
              <CardContent className="grid gap-6 md:grid-cols-2">
                <FormField
                  control={form.control}
                  name="nombre"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nombre del evento</FormLabel>
                      <FormControl>
                        <Input placeholder="Pozo Viernes Noche" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="inicio"
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
                <FormField
                  control={form.control}
                  name="duracionPartidoMin"
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
                  name="duracionPozoMin"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Duración total del pozo (min)</FormLabel>
                      <FormControl>
                        <Input type="number" min={10} max={600} step={10} {...field} />
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
      </section>
    </main>
  );
}
