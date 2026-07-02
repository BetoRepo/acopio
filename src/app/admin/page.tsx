'use client';

import { useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';

export default function AdminPage() {
  const [productoId, setProductoId] = useState('');
  const [nuevaCantidad, setNuevaCantidad] = useState('');
  const [tareaDelDia, setTareaDelDia] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const handleActualizarStock = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMensaje(null);
    setLoading(true);

    const cantidad = Number(nuevaCantidad);
    if (!productoId || Number.isNaN(cantidad)) {
      setMensaje('Ingresa un ID válido y una cantidad numérica.');
      setLoading(false);
      return;
    }

    const { data, error } = await supabaseClient
      .from('inventario')
      .update({ cantidad_actual: cantidad })
      .eq('id', productoId);

    setLoading(false);
    if (error) {
      setMensaje(`Error al actualizar stock: ${error.message}`);
      return;
    }

    if (data?.length) {
      setMensaje('Stock actualizado correctamente.');
      return;
    }

    const { error: insertError } = await supabaseClient.from('inventario').insert([
      {
        id: productoId,
        producto: 'Producto nuevo',
        categoria: 'Sin categoría',
        cantidad_actual: cantidad,
        cantidad_minima: cantidad,
        meta_campana: cantidad,
      },
    ]);

    if (insertError) {
      setMensaje(`Error creando nuevo producto: ${insertError.message}`);
      return;
    }

    setMensaje('Producto creado y stock registrado con éxito.');
  };

  const handleActualizarTarea = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMensaje(null);
    setLoading(true);

    if (!tareaDelDia) {
      setMensaje('Escribe la tarea del día antes de guardar.');
      setLoading(false);
      return;
    }

    const { error } = await supabaseClient
      .from('configuracion_home')
      .update({ tarea_del_dia: tareaDelDia })
      .eq('id_tipo', 'principal');

    setLoading(false);

    if (error) {
      setMensaje(`Error al actualizar la tarea: ${error.message}`);
      return;
    }

    setMensaje('Tarea del día actualizada con éxito.');
    setTareaDelDia('');
  };

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-10 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
          <h1 className="text-3xl font-semibold text-slate-900">Panel de administración</h1>
          <p className="mt-2 text-sm text-slate-600">Desde aquí puedes actualizar el inventario y cambiar la tarea del día que aparece en el home.</p>
        </div>

        <div className="grid gap-8 lg:grid-cols-2">
          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
            <h2 className="text-2xl font-semibold text-slate-900">Actualizar stock</h2>
            <p className="mt-2 text-sm text-slate-600">Ingresa el ID del producto y la cantidad actualizada. Si el producto no existe, se creará con valores básicos.</p>
            <form className="mt-6 space-y-5" onSubmit={handleActualizarStock}>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">ID del producto</span>
                <input
                  value={productoId}
                  onChange={(event) => setProductoId(event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  placeholder="uuid-del-producto"
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Nueva cantidad</span>
                <input
                  type="number"
                  value={nuevaCantidad}
                  onChange={(event) => setNuevaCantidad(event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  min="0"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-3xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Procesando...' : 'Actualizar stock'}
              </button>
            </form>
          </div>

          <div className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
            <h2 className="text-2xl font-semibold text-slate-900">Tarea del día</h2>
            <p className="mt-2 text-sm text-slate-600">Actualiza el mensaje principal que la página de inicio mostrará a voluntarios y donantes.</p>
            <form className="mt-6 space-y-5" onSubmit={handleActualizarTarea}>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Descripción</span>
                <textarea
                  value={tareaDelDia}
                  onChange={(event) => setTareaDelDia(event.target.value)}
                  rows={6}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  placeholder="Escribe la tarea del día..."
                  required
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-3xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Guardando...' : 'Actualizar tarea'}
              </button>
            </form>
          </div>
        </div>

        {mensaje ? (
          <div className="rounded-3xl border border-slate-200 bg-slate-50 px-6 py-4 text-sm text-slate-700 shadow-sm">
            {mensaje}
          </div>
        ) : null}
      </div>
    </main>
  );
}
