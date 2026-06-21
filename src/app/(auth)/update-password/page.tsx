"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Feather, Loader2, KeyRound } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";
import { useAuth } from "@/hooks";

import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";

const formSchema = z
  .object({
    password: z.string().min(8, "La contraseña debe tener al menos 8 caracteres"),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Las contraseñas no coinciden",
    path: ["confirmPassword"],
  });

type FormValues = z.infer<typeof formSchema>;

export default function UpdatePasswordPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [isLoading, setIsLoading] = useState(false);

  // If user is not authenticated and auth has loaded, redirect to login
  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [user, authLoading, router]);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      password: "",
      confirmPassword: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.updateUser({
      password: values.password,
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    toast.success("Contraseña actualizada exitosamente");
    router.push("/feed");
  };

  if (authLoading || !user) {
    return (
      <div className="flex h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-8">
      <Link href="/" className="flex flex-col items-center gap-3">
        <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
          <Feather className="h-6 w-6" strokeWidth={2.4} />
        </span>
        <span className="font-serif text-2xl text-foreground">Nectary</span>
      </Link>

      <div className="w-full rounded-[2rem] border border-card/80 p-8 shadow-lift glass-strong">
        <div className="mb-8 text-center flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
            <KeyRound className="h-8 w-8" />
          </div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground mb-2">
            Nueva contraseña
          </h1>
          <p className="text-sm text-muted-foreground">
            Escribe tu nueva contraseña a continuación.
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80">Nueva contraseña</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="••••••••"
                      type="password"
                      className="rounded-xl border-card/80 bg-card/40 focus:bg-card/80 transition-colors"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="confirmPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80">Confirmar nueva contraseña</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="••••••••"
                      type="password"
                      className="rounded-xl border-card/80 bg-card/40 focus:bg-card/80 transition-colors"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button
              type="submit"
              className="w-full rounded-full h-11 shadow-soft"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Actualizando...
                </>
              ) : (
                "Guardar y entrar"
              )}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}
