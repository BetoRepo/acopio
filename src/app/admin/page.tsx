'use client';

import { FormEvent, useEffect, useState } from 'react';
import { supabaseClient } from '../../lib/supabaseClient';
import { InventarioHistorialRow, InventarioRow } from '../../types/database.types';

function formatRelativeTime(createdAt: string) {
  const now = new Date();
  const created = new Date(createdAt);
  const diff = Math.max(0, now.getTime() - created.getTime());
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (days > 0) {
    return `hace ${days} día${days > 1 ? 's' : ''}`;
  }
  if (hours > 0) {
    return `hace ${hours} hora${hours > 1 ? 's' : ''}`;
  }
  if (minutes > 0) {
    return `hace ${minutes} minuto${minutes > 1 ? 's' : ''}`;
  }
  return 'hace unos segundos';
}

export default function AdminPage() {
  const [productoId, setProductoId] = useState('');
  const [productoName, setProductoName] = useState('');
  const [categoria, setCategoria] = useState('Alimentos');
  const [nuevaCantidad, setNuevaCantidad] = useState('');
  const [mensaje, setMensaje] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [historial, setHistorial] = useState<InventarioHistorialRow[]>([]);
  const [productos, setProductos] = useState<InventarioRow[]>([]);
  const [selectedProductoId, setSelectedProductoId] = useState('');
  const [donationQuantity, setDonationQuantity] = useState('');
  const [donationDestination, setDonationDestination] = useState('');
  const [donationRecipient, setDonationRecipient] = useState('');

  async function refreshHistorial() {
    const { data, error } = await supabaseClient
      .from('inventario_historial')
      .select('*')
      .order('creado_en', { ascending: false })
      .limit(20);

    if (!error && data) {
      setHistorial(data as InventarioHistorialRow[]);
    }
  }

  useEffect(() => {
    refreshHistorial();
    loadProductos();
  }, []);

  const totalItems = productos.length;
  const totalCantidad = productos.reduce((sum, producto) => sum + (producto.cantidad_actual ?? 0), 0);

  async function loadProductos() {
    const { data } = await supabaseClient.from('inventario').select('*').order('producto', { ascending: true });
    const typed = (data ?? []) as InventarioRow[];
    setProductos(typed);
    if (typed.length > 0) setSelectedProductoId(typed[0].id);
  }

  const handleActualizarStock = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMensaje(null);
    setLoading(true);

    const cantidad = Number(nuevaCantidad);
    if (!productoName || Number.isNaN(cantidad)) {
      setMensaje('Ingresa un nombre de producto y una cantidad numérica.');
      setLoading(false);
      return;
    }

    // Buscar producto existente por nombre + categoría
    const selectResult = await supabaseClient
      .from('inventario')
      .select('*')
      .eq('producto', productoName)
      .eq('categoria', categoria)
      .maybeSingle();

    const existing = selectResult.data ?? null;
    const cantidadAntes = existing?.cantidad_actual ?? 0;
    const idToUse = existing?.id ?? (typeof crypto !== 'undefined' && 'randomUUID' in crypto ? (crypto as any).randomUUID() : `${Date.now()}`);

    const { error } = await supabaseClient.from('inventario').upsert(
      {
        id: idToUse,
        producto: productoName,
        categoria,
        cantidad_actual: cantidad,
        cantidad_minima: existing?.cantidad_minima ?? 1,
        meta_campana: existing?.meta_campana ?? cantidad,
      },
      { onConflict: 'id' }
    );

    if (error) {
      setMensaje(`Error al actualizar stock: ${error.message}`);
      setLoading(false);
      return;
    }

    const historialError = await supabaseClient.from('inventario_historial').insert([
      {
        inventario_id: idToUse,
        producto: productoName,
        categoria,
        cantidad_antes: cantidadAntes,
        cantidad_despues: cantidad,
        operacion: existing ? 'actualización' : 'creación',
        nota: existing ? 'Stock actualizado desde el panel.' : 'Producto creado desde el panel.',
      },
    ]);

    setLoading(false);

    if (historialError.error) {
      setMensaje(`Stock actualizado, pero no se pudo guardar el historial: ${historialError.error.message}`);
      return;
    }

    setMensaje('Stock actualizado correctamente.');
    setProductoId('');
    setProductoName('');
    setNuevaCantidad('');
    await refreshHistorial();
    await loadProductos();
  };

  const handleEnviarDonativo = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMensaje(null);
    setLoading(true);

    const qty = Number(donationQuantity);
    if (!selectedProductoId || Number.isNaN(qty) || qty <= 0 || !donationRecipient) {
      setMensaje('Selecciona un producto, una cantidad válida y el nombre de la persona destinataria.');
      setLoading(false);
      return;
    }

    const sel = await supabaseClient.from('inventario').select('*').eq('id', selectedProductoId).single();
    const existing = sel.data;
    if (!existing) {
      setMensaje('Producto no encontrado.');
      setLoading(false);
      return;
    }

    const antes = existing.cantidad_actual ?? 0;
    const despues = Math.max(0, antes - qty);

    const { error: updErr } = await supabaseClient.from('inventario').update({ cantidad_actual: despues }).eq('id', selectedProductoId);
    if (updErr) {
      setMensaje(`Error al actualizar inventario: ${updErr.message}`);
      setLoading(false);
      return;
    }

    const hist = await supabaseClient.from('inventario_historial').insert([
      {
        inventario_id: selectedProductoId,
        producto: existing.producto,
        categoria: existing.categoria,
        cantidad_antes: antes,
        cantidad_despues: despues,
        operacion: 'donación',
        nota: `Donado a: ${donationDestination} — Recibido por: ${donationRecipient}`,
      },
    ]);

    if (hist.error) {
      setMensaje(`Donación procesada, pero no se guardó historial: ${hist.error.message}`);
      setLoading(false);
      await loadProductos();
      await refreshHistorial();
      return;
    }

    // Intentar registrar en entregas_mapa (opcional, no bloquear si falla)
    try {
      await supabaseClient.from('entregas_mapa').insert([
        {
          lugar_comunidad: donationDestination,
          latitud: 0,
          longitud: 0,
          detalles_entrega: `Donación de ${qty} ${existing.producto} — Recibido por: ${donationRecipient}`,
          fecha_entrega: new Date().toISOString().split('T')[0],
        },
      ]);
    } catch (e) {
      // ignorar
    }

    setLoading(false);
    setDonationQuantity('');
    setDonationDestination('');
    setDonationRecipient('');
    setMensaje('Donación registrada y stock actualizado.');
    await loadProductos();
    await refreshHistorial();
  };

  return (
    <main className="min-h-screen bg-gradient-to-br from-violet-950 via-violet-900 to-purple-950 px-4 py-10 sm:px-6 lg:px-8 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8">
        <div className="rounded-[2rem] border border-purple-500/30 bg-white/5 p-8 shadow-xl shadow-purple-950/30 backdrop-blur-sm">
          <h1 className="text-3xl font-semibold text-white">Panel de administración</h1>
          <p className="mt-2 text-sm text-purple-200/90">Desde aquí puedes actualizar el inventario y gestionar donativos de forma sencilla.</p>
        </div>

        <div className="grid gap-8">
          <section className="rounded-[2rem] border border-purple-500/30 bg-white/10 p-8 shadow-xl shadow-purple-950/20 backdrop-blur-sm">
            <h2 className="text-2xl font-semibold text-white">Resumen de inventario</h2>
            <p className="mt-2 text-sm text-purple-200/90">Aquí puedes ver rápidamente cuántos productos tienes registrados y la cantidad total disponible.</p>
            <div className="mt-6 grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-purple-400/20 bg-slate-950/70 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-purple-400">Items registrados</p>
                <p className="mt-3 text-3xl font-semibold text-white">{totalItems}</p>
              </div>
              <div className="rounded-3xl border border-purple-400/20 bg-slate-950/70 p-5">
                <p className="text-sm uppercase tracking-[0.3em] text-purple-400">Cantidad total</p>
                <p className="mt-3 text-3xl font-semibold text-white">{totalCantidad}</p>
              </div>
            </div>
            <div className="mt-6 rounded-3xl border border-white/10 bg-slate-950/80 p-5">
              <p className="text-sm font-semibold text-purple-300">Detalle por producto</p>
              <div className="mt-4 grid gap-3 md:grid-cols-2">
                {productos.length > 0 ? (
                  productos.map((producto) => (
                    <div key={producto.id} className="rounded-2xl border border-purple-400/20 bg-white/5 p-4">
                      <p className="font-semibold text-white">{producto.producto}</p>
                      <p className="mt-1 text-sm text-purple-300">{producto.categoria}</p>
                      <p className="mt-2 text-sm text-purple-200">Cantidad: {producto.cantidad_actual}</p>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-purple-200/90">Todavía no hay productos registrados.</p>
                )}
              </div>
            </div>
          </section>

          <div className="rounded-[2rem] border border-purple-500/30 bg-white/10 p-8 shadow-xl shadow-purple-950/20 backdrop-blur-sm">
            <h2 className="text-2xl font-semibold text-white">Actualizar stock</h2>
            <p className="mt-2 text-sm text-purple-200/90">Ingresa el nombre del producto y la cantidad actualizada. Si el producto no existe, se creará con valores básicos.</p>
            <form className="mt-6 space-y-5" onSubmit={handleActualizarStock}>
              <label className="block">
                <span className="text-sm font-medium text-purple-200/90">Categoría</span>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
                >
                  <option>Alimentos</option>
                  <option>Higiene personal</option>
                  <option>Insumos medicos</option>
                  <option>Ropa</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-purple-200/90">Nombre del producto</span>
                <input
                  value={productoName}
                  onChange={(event) => setProductoName(event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
                  placeholder="Ej. Harina, Jabon, Venda..."
                  required
                />
              </label>
              <label className="block">
                <span className="text-sm font-medium text-purple-200/90">Nueva cantidad</span>
                <input
                  type="number"
                  value={nuevaCantidad}
                  onChange={(event) => setNuevaCantidad(event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
                  min="0"
                  required
                />
              </label>
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-3xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Procesando...' : 'Actualizar stock'}
              </button>
            </form>
          </div>

        </div>

        {mensaje ? (
          <div className="rounded-3xl border border-purple-500/30 bg-white/5 px-6 py-4 text-sm text-purple-200 shadow-sm backdrop-blur-sm">
            {mensaje}
          </div>
        ) : null}

        <section className="rounded-[2rem] border border-purple-500/30 bg-white/10 p-8 shadow-xl shadow-purple-950/20 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-white">Enviar donativo</h2>
          <p className="mt-2 text-sm text-purple-200/90">Registra una donación, resta el stock y anota a dónde fue donada.</p>
          <form className="mt-6 grid gap-4 md:grid-cols-4" onSubmit={handleEnviarDonativo}>
            <label className="block">
              <span className="text-sm font-medium text-purple-200/90">Producto</span>
              <select
                value={selectedProductoId}
                onChange={(e) => setSelectedProductoId(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
              >
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.producto} — {p.categoria} (stock: {p.cantidad_actual})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-purple-200/90">Cantidad a enviar</span>
              <input
                type="number"
                value={donationQuantity}
                onChange={(e) => setDonationQuantity(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
                min="1"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-purple-200/90">Destino / Comunidad</span>
              <input
                value={donationDestination}
                onChange={(e) => setDonationDestination(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
                placeholder="Nombre del lugar o comunidad"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-purple-200/90">Persona destinataria</span>
              <input
                value={donationRecipient}
                onChange={(e) => setDonationRecipient(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-700 bg-slate-950/90 px-4 py-3 text-sm text-white outline-none focus:border-violet-400 focus:ring-2 focus:ring-violet-400/30"
                placeholder="Nombre de la persona que recibe"
                required
              />
            </label>

            <div className="md:col-span-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-3xl bg-violet-500 px-5 py-3 text-sm font-semibold text-white transition hover:bg-violet-600 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Procesando...' : 'Registrar donativo'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-[2rem] border border-purple-500/30 bg-white/10 p-8 shadow-xl shadow-purple-950/20 backdrop-blur-sm">
          <h2 className="text-2xl font-semibold text-white">Historial de stock</h2>
          <p className="mt-2 text-sm text-purple-200/90">Registros recientes de actualizaciones y creaciones de inventario.</p>
          <div className="mt-6 overflow-x-auto rounded-3xl border border-white/10 bg-slate-950/80">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-purple-200">
              <thead className="bg-slate-900 text-purple-200/90">
                <tr>
                  <th className="px-5 py-4 font-medium">Producto</th>
                  <th className="px-5 py-4 font-medium">Operación</th>
                  <th className="px-5 py-4 font-medium">Antes</th>
                  <th className="px-5 py-4 font-medium">Después</th>
                  <th className="px-5 py-4 font-medium">Hace cuánto</th>
                </tr>
              </thead>
              <tbody>
                {historial.length > 0 ? (
                  historial.map((item) => (
                    <tr key={item.id} className="border-t border-slate-200 bg-white">
                      <td className="px-5 py-4 font-semibold text-white">{item.producto}</td>
                      <td className="px-5 py-4 text-purple-200 capitalize">{item.operacion}</td>
                      <td className="px-5 py-4 text-purple-200">{item.cantidad_antes}</td>
                      <td className="px-5 py-4 text-purple-200">{item.cantidad_despues}</td>
                      <td className="px-5 py-4 text-purple-300">{formatRelativeTime(item.creado_en)}</td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5} className="px-5 py-8 text-center text-slate-500">
                      No se han registrado cambios en el historial aún.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </main>
  );
}
