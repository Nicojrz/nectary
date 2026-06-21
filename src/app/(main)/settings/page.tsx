"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Loader2, LogOut } from "lucide-react";
import { toast } from "sonner";
import { createClient } from "@/lib/supabase/client";
import { useAuth } from "@/hooks";
import type { LiteraryCategory } from "@/types/index";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Separator } from "@/components/ui/separator";

const CATEGORIES: { id: LiteraryCategory; label: string; colorClass: string }[] = [
  { id: "cuento", label: "Cuento", colorClass: "bg-cuento" },
  { id: "poesia", label: "Poesía", colorClass: "bg-poesia" },
  { id: "novela", label: "Novela", colorClass: "bg-novela" },
  { id: "ensayo", label: "Ensayo", colorClass: "bg-ensayo" },
];

const formSchema = z.object({
  name: z.string().min(2, "El nombre debe tener al menos 2 caracteres"),
  bio: z.string().max(500, "La biografía no puede exceder los 500 caracteres").optional(),
  categories: z.array(z.string()).refine((value) => value.length > 0, {
    message: "Debes seleccionar al menos una categoría de interés",
  }),
});

type FormValues = z.infer<typeof formSchema>;

export default function SettingsPage() {
  const router = useRouter();
  const { user, signOut, loading: authLoading } = useAuth();
  const [isSaving, setIsSaving] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      bio: "",
      categories: [],
    },
  });

  // Pre-fill form when user data is loaded
  useEffect(() => {
    if (user) {
      const fetchProfile = async () => {
        const supabase = createClient();
        const { data } = await supabase.from('profiles').select('name, bio, categories').eq('id', user.id).single();
        if (data) {
          form.reset({
            name: data.name || user.user_metadata?.name || "",
            bio: data.bio || user.user_metadata?.bio || "",
            categories: data.categories || user.user_metadata?.categories || [],
          });
        }
      };
      fetchProfile();
    }
  }, [user, form]);

  const onSubmit = async (values: FormValues) => {
    setIsSaving(true);
    const supabase = createClient();

    // 1. Verificar si el nombre está ocupado por otro usuario
    const { data: existing } = await supabase
      .from('profiles')
      .select('id, name')
      .ilike('name', values.name.trim());

    const isTaken = existing && existing.some((p) => p.id !== user?.id);
    if (isTaken) {
      toast.error("Este nombre ya está en uso por otro escritor.");
      form.setError("name", { message: "Nombre no disponible" });
      setIsSaving(false);
      return;
    }

    // 2. Actualizamos tanto la tabla profiles como la metadata de Auth (para redundancia)
    const { error: profileError } = await supabase.from('profiles').update({
      name: values.name.trim(),
      bio: values.bio,
      categories: values.categories,
    }).eq('id', user?.id);

    const { error: authError } = await supabase.auth.updateUser({
      data: {
        name: values.name.trim(),
        bio: values.bio,
        categories: values.categories,
      },
    });

    setIsSaving(false);

    if (profileError || authError) {
      toast.error(profileError?.message || authError?.message);
      return;
    }

    toast.success("Perfil actualizado correctamente");
    router.refresh();
  };

  const handleSignOut = async () => {
    await signOut();
    router.push("/login");
  };

  if (authLoading) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-2xl py-8 space-y-8 px-4 sm:px-0">
      <div>
        <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">
          Configuración
        </h1>
        <p className="mt-2 text-muted-foreground">
          Personaliza tu perfil de escritor y tus preferencias
        </p>
      </div>

      <div className="rounded-[2rem] border border-card/60 p-8 shadow-glass glass-panel space-y-8">
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Sección: Información Personal */}
            <div className="space-y-6">
              <h2 className="text-xl font-medium text-foreground/90">Información personal</h2>
              
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nombre o seudónimo</FormLabel>
                    <FormControl>
                      <Input
                        placeholder="Tu nombre público"
                        className="rounded-xl bg-background/50 focus:bg-background/80"
                        {...field}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="bio"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Biografía</FormLabel>
                    <FormControl>
                      <Textarea
                        placeholder="Cuéntanos sobre ti y lo que escribes..."
                        className="min-h-[120px] resize-none rounded-xl bg-background/50 focus:bg-background/80"
                        {...field}
                      />
                    </FormControl>
                    <FormDescription>
                      Máximo 500 caracteres. Se mostrará en tu perfil público.
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Separator className="bg-border/60" />

            {/* Sección: Intereses Literarios */}
            <div className="space-y-6">
              <div>
                <h2 className="text-xl font-medium text-foreground/90">Intereses literarios</h2>
                <p className="text-sm text-muted-foreground mt-1">
                  Selecciona las categorías en las que escribes o te interesa leer
                </p>
              </div>

              <FormField
                control={form.control}
                name="categories"
                render={() => (
                  <FormItem>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      {CATEGORIES.map((category) => (
                        <FormField
                          key={category.id}
                          control={form.control}
                          name="categories"
                          render={({ field }) => {
                            return (
                              <FormItem
                                key={category.id}
                                className="flex flex-row items-start space-x-3 space-y-0 rounded-xl border border-border/50 bg-background/30 p-4 shadow-sm hover:bg-background/50 transition-colors"
                              >
                                <FormControl>
                                  <Checkbox
                                    checked={field.value?.includes(category.id)}
                                    onCheckedChange={(checked) => {
                                      return checked
                                        ? field.onChange([...field.value, category.id])
                                        : field.onChange(
                                            field.value?.filter((value) => value !== category.id)
                                          );
                                    }}
                                  />
                                </FormControl>
                                <div className="flex items-center gap-2 font-normal">
                                  <span className={`h-2.5 w-2.5 rounded-full ${category.colorClass}`} />
                                  <FormLabel className="cursor-pointer">{category.label}</FormLabel>
                                </div>
                              </FormItem>
                            );
                          }}
                        />
                      ))}
                    </div>
                    <FormMessage className="mt-2" />
                  </FormItem>
                )}
              />
            </div>

            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                className="rounded-full px-8 shadow-soft"
                disabled={isSaving}
              >
                {isSaving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Guardando...
                  </>
                ) : (
                  "Guardar cambios"
                )}
              </Button>
            </div>
          </form>
        </Form>
      </div>

      {/* Sección: Cuenta (Peligro) */}
      <div className="rounded-[2rem] border border-destructive/20 bg-destructive/5 p-8 space-y-4">
        <div>
          <h2 className="text-xl font-medium text-destructive">Cuenta</h2>
          <p className="text-sm text-destructive/80 mt-1">
            Cierra tu sesión en este dispositivo
          </p>
        </div>
        <Button
          variant="destructive"
          className="rounded-full"
          onClick={handleSignOut}
        >
          <LogOut className="mr-2 h-4 w-4" />
          Cerrar sesión
        </Button>
      </div>
    </div>
  );
}
