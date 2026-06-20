"use client";

import { useState } from "react";
import Link from "next/link";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Feather, Loader2, Mail } from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import { toast } from "sonner";

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

const formSchema = z.object({
  email: z.string().email("Correo electrónico inválido"),
});

type FormValues = z.infer<typeof formSchema>;

export default function RecoveryPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      email: "",
    },
  });

  const onSubmit = async (values: FormValues) => {
    setIsLoading(true);
    const supabase = createClient();

    const { error } = await supabase.auth.resetPasswordForEmail(values.email, {
      redirectTo: `${window.location.origin}/settings`,
    });

    setIsLoading(false);

    if (error) {
      toast.error(error.message);
      return;
    }

    setIsSuccess(true);
  };

  if (isSuccess) {
    return (
      <div className="flex flex-col items-center gap-8">
        <Link href="/" className="flex flex-col items-center gap-3">
          <span className="flex h-12 w-12 items-center justify-center rounded-full bg-primary text-primary-foreground shadow-soft">
            <Feather className="h-6 w-6" strokeWidth={2.4} />
          </span>
          <span className="font-serif text-2xl text-foreground">Nectary</span>
        </Link>

        <div className="w-full rounded-[2rem] border border-card/80 p-8 shadow-lift glass-strong text-center flex flex-col items-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-primary mb-6">
            <Mail className="h-8 w-8" />
          </div>
          <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground mb-3">
            Correo enviado
          </h1>
          <p className="text-muted-foreground mb-8">
            Si la dirección <strong className="text-foreground">{form.getValues("email")}</strong> está registrada,
            recibirás un enlace para restablecer tu contraseña en unos minutos.
          </p>
          <Button asChild className="w-full rounded-full h-11 shadow-soft">
            <Link href="/login">Volver al inicio de sesión</Link>
          </Button>
        </div>
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
        <div className="mb-8 text-center">
          <h1 className="font-serif text-3xl font-medium tracking-tight text-foreground">
            Recupera tu contraseña
          </h1>
          <p className="mt-2 text-sm text-muted-foreground">
            Te enviaremos un enlace para restablecerla
          </p>
        </div>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-5">
            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-foreground/80">Correo electrónico</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="tucorreo@ejemplo.com"
                      type="email"
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
                  Enviando enlace...
                </>
              ) : (
                "Enviar enlace"
              )}
            </Button>
          </form>
        </Form>

        <p className="mt-6 text-center text-sm text-muted-foreground">
          <Link href="/login" className="font-medium text-primary hover:underline">
            Volver a iniciar sesión
          </Link>
        </p>
      </div>
    </div>
  );
}
