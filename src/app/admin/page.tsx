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
  const [metaDonativos, setMetaDonativos] = useState('');
  const [tareaDelDia, setTareaDelDia] = useState('');
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

  const handleActualizarTarea = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setMensaje(null);
    setLoading(true);

    if (!tareaDelDia) {
      setMensaje('Escribe la tarea del día antes de guardar.');
      setLoading(false);
      return;
    }

    const updatePayload: any = { tarea_del_dia: tareaDelDia };
    if (metaDonativos && !Number.isNaN(Number(metaDonativos))) {
      updatePayload.meta_termometro_global = Number(metaDonativos);
    }

    const { error } = await supabaseClient
      .from('configuracion_home')
      .update(updatePayload)
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
                <span className="text-sm font-medium text-slate-700">Categoría</span>
                <select
                  value={categoria}
                  onChange={(e) => setCategoria(e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                >
                  <option>Alimentos</option>
                  <option>Higiene personal</option>
                  <option>Insumos medicos</option>
                  <option>Ropa</option>
                </select>
              </label>
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Nombre del producto</span>
                <input
                  value={productoName}
                  onChange={(event) => setProductoName(event.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  placeholder="Ej. Harina, Jabon, Venda..."
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
              <label className="block">
                <span className="text-sm font-medium text-slate-700">Meta de donativos</span>
                <input
                  type="number"
                  value={metaDonativos}
                  onChange={(e) => setMetaDonativos(e.target.value)}
                  className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                  min="0"
                  placeholder="Cantidad objetivo (ej. 10000)"
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

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
          <h2 className="text-2xl font-semibold text-slate-900">Enviar donativo</h2>
          <p className="mt-2 text-sm text-slate-600">Registra una donación, resta el stock y anota a dónde fue donada.</p>
          <form className="mt-6 grid gap-4 md:grid-cols-4" onSubmit={handleEnviarDonativo}>
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Producto</span>
              <select
                value={selectedProductoId}
                onChange={(e) => setSelectedProductoId(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
              >
                {productos.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.producto} — {p.categoria} (stock: {p.cantidad_actual})
                  </option>
                ))}
              </select>
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Cantidad a enviar</span>
              <input
                type="number"
                value={donationQuantity}
                onChange={(e) => setDonationQuantity(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                min="1"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Destino / Comunidad</span>
              <input
                value={donationDestination}
                onChange={(e) => setDonationDestination(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                placeholder="Nombre del lugar o comunidad"
                required
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Persona destinataria</span>
              <input
                value={donationRecipient}
                onChange={(e) => setDonationRecipient(e.target.value)}
                className="mt-2 w-full rounded-3xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900 outline-none focus:border-rose-500 focus:ring-2 focus:ring-rose-500/20"
                placeholder="Nombre de la persona que recibe"
                required
              />
            </label>

            <div className="md:col-span-4">
              <button
                type="submit"
                disabled={loading}
                className="inline-flex w-full items-center justify-center rounded-3xl bg-rose-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-rose-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {loading ? 'Procesando...' : 'Registrar donativo'}
              </button>
            </div>
          </form>
        </section>

        <section className="rounded-[2rem] border border-slate-200 bg-white p-8 shadow-xl shadow-slate-200/40">
          <h2 className="text-2xl font-semibold text-slate-900">Historial de stock</h2>
          <p className="mt-2 text-sm text-slate-600">Registros recientes de actualizaciones y creaciones de inventario.</p>
          <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-100 bg-slate-50">
            <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-700">
              <thead className="bg-slate-100 text-slate-900">
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
                      <td className="px-5 py-4 font-semibold text-slate-900">{item.producto}</td>
                      <td className="px-5 py-4 text-slate-700 capitalize">{item.operacion}</td>
                      <td className="px-5 py-4 text-slate-700">{item.cantidad_antes}</td>
                      <td className="px-5 py-4 text-slate-700">{item.cantidad_despues}</td>
                      <td className="px-5 py-4 text-slate-600">{formatRelativeTime(item.creado_en)}</td>
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
