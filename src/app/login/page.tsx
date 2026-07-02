'use client';

import { FormEvent, useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseClient } from '../../lib/supabaseClient';

export default function LoginPage() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const router = useRouter();

  const handleLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    const { error: authError } = await supabaseClient.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);

    if (authError) {
      setError(authError.message);
      return;
    }

    router.push('/admin');
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-rose-950 px-4 py-16 text-white">
      <div className="mx-auto w-full max-w-md rounded-[2rem] border border-white/10 bg-slate-900/90 p-10 shadow-2xl shadow-rose-900/30">
        <h1 className="text-4xl font-bold">Ingreso Administrador</h1>
        <p className="mt-3 text-sm text-slate-300">Accede al panel para actualizar inventario y la tarea del día.</p>

        <form className="mt-8 space-y-6" onSubmit={handleLogin}>
          <label className="block">
            <span className="text-sm font-medium text-slate-200">Correo electrónico</span>
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              required
              className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-slate-200">Contraseña</span>
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              required
              className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/80 px-4 py-3 text-sm text-white outline-none transition focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
            />
          </label>

          {error ? <p className="rounded-2xl bg-red-600/10 px-4 py-3 text-sm text-red-200">{error}</p> : null}

          <button
            type="submit"
            disabled={loading}
            className="inline-flex w-full items-center justify-center rounded-3xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Ingresando...' : 'Iniciar sesión'}
          </button>
        </form>
      </div>
    </main>
  );
}
