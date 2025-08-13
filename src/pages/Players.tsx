import React from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Form, FormField, FormItem, FormLabel, FormControl, FormMessage } from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import Seo from "@/components/Seo";
import { toast } from "@/components/ui/use-toast";

const schema = z.object({
  nombre: z.string().min(2, "Ingresa un nombre"),
  email: z.string().email("Email inválido").optional().or(z.literal("")).transform(v => v || undefined),
  telefono: z.string().optional(),
});

type FormValues = z.infer<typeof schema>;

async function fetchUsuarios() {
  const { data, error } = await supabase.from("usuarios").select("*").order("created_at", { ascending: false });
  if (error) throw error;
  return data as { id: string; nombre: string; email: string | null; telefono: string | null; created_at: string }[];
}

export default function PlayersPage() {
  const qc = useQueryClient();
  const form = useForm<FormValues>({ resolver: zodResolver(schema), defaultValues: { nombre: "", email: "", telefono: "" } });

  const { data, isLoading, error } = useQuery({ queryKey: ["usuarios"], queryFn: fetchUsuarios });

  const addPlayer = useMutation({
    mutationFn: async (values: FormValues) => {
      const { error } = await supabase.from("usuarios").insert({ nombre: values.nombre, email: values.email, telefono: values.telefono });
      if (error) throw error;
    },
    onSuccess: () => {
      form.reset({ nombre: "", email: "", telefono: "" });
      qc.invalidateQueries({ queryKey: ["usuarios"] });
      toast({ title: "Jugador agregado" });
    },
    onError: (e: any) => {
      toast({ title: "Error al guardar", description: e?.message ?? "Verifica la migración de BD" });
    }
  });

  return (
    <main className="container py-8 space-y-6">
      <Seo title="Jugadores - Gestión Pádel" description="Administra jugadores para torneos de pádel." canonicalPath="/players" />

      <header className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight">Jugadores</h1>
        <p className="text-muted-foreground">Crea y gestiona jugadores.</p>
      </header>

      <section>
        <Card>
          <CardHeader>
            <CardTitle>Agregar jugador</CardTitle>
          </CardHeader>
          <CardContent>
            <Form {...form}>
              <form onSubmit={form.handleSubmit((v) => addPlayer.mutate(v))} className="grid md:grid-cols-3 gap-4">
                <FormField control={form.control} name="nombre" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre</FormLabel>
                    <FormControl>
                      <Input placeholder="Juan Pérez" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="email" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Email</FormLabel>
                    <FormControl>
                      <Input placeholder="juan@correo.com" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <FormField control={form.control} name="telefono" render={({ field }) => (
                  <FormItem>
                    <FormLabel>Teléfono</FormLabel>
                    <FormControl>
                      <Input placeholder="+52 55 0000 0000" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )} />
                <div className="md:col-span-3">
                  <Button type="submit" disabled={addPlayer.isPending}>Agregar</Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-3">
        <h2 className="text-xl font-medium">Listado</h2>
        {isLoading && <p className="text-muted-foreground">Cargando...</p>}
        {error && <p className="text-destructive">Error: {(error as any).message}</p>}
        <div className="grid gap-3">
          {data?.map((u) => (
            <div key={u.id} className="flex items-center justify-between rounded-md border p-4">
              <div>
                <p className="font-medium">{u.nombre}</p>
                <p className="text-sm text-muted-foreground">{u.email || "Sin email"} · {u.telefono || "Sin teléfono"}</p>
              </div>
              <span className="text-xs text-muted-foreground">{new Date(u.created_at).toLocaleString()}</span>
            </div>
          ))}
        </div>
      </section>
    </main>
  );
}
