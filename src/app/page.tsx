'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '../lib/supabaseClient';
import { ConfiguracionHomeRow, EntregasMapaRow, InventarioRow } from '../types/database.types';
import Hero from '../components/publico/Hero';
import Termometro from '../components/publico/Termometro';
import Inventario from '../components/publico/Inventario';
import Emergencias from '../components/publico/Emergencias';

export default function HomePage() {
  const [inventario, setInventario] = useState<InventarioRow[]>([]);
  const [entregasMapa, setEntregasMapa] = useState<EntregasMapaRow[]>([]);
  const [configuracion, setConfiguracion] = useState<ConfiguracionHomeRow | null>(null);

  useEffect(() => {
    async function fetchData() {
      const [{ data: inventarioData }, { data: entregasData }, { data: configuracionData }] = await Promise.all([
        supabaseClient.from<InventarioRow>('inventario').select('*'),
        supabaseClient.from<EntregasMapaRow>('entregas_mapa').select('*'),
        supabaseClient.from<ConfiguracionHomeRow>('configuracion_home').select('*'),
      ]);

      setInventario(inventarioData ?? []);
      setEntregasMapa(entregasData ?? []);
      setConfiguracion(configuracionData?.[0] ?? null);
    }

    fetchData();

    const channel = supabaseClient
      .channel('public:inventario')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, (payload) => {
        if (!payload.new) return;
        setInventario((current) => {
          const next = current.filter((item) => item.id !== payload.new.id);
          return [...next, payload.new].sort((a, b) => a.producto.localeCompare(b.producto));
        });
      })
      .subscribe();

    return () => {
      supabaseClient.removeChannel(channel);
    };
  }, []);

  const meta = configuracion?.meta_termometro_global ?? 0;
  const recaudado = configuracion?.recaudado_termometro_global ?? 0;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-8 sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        <Hero frase_de_accion="Juntos llenamos la ciudad de esperanza y recursos" />
        <Termometro meta={meta} recaudado={recaudado} />
        <Inventario inventario={inventario} />
        <Emergencias />
        <section className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-xl shadow-slate-200/40 backdrop-blur-sm">
          <div className="mb-4">
            <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Rutas y entregas</p>
            <h2 className="mt-2 text-3xl font-semibold text-slate-900">Próximas entregas en la ciudad</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {entregasMapa.length > 0 ? (
              entregasMapa.map((entrega) => (
                <div key={entrega.id} className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{entrega.lugar_comunidad}</p>
                  <p className="mt-2 text-sm text-slate-600">{entrega.detalles_entrega}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-slate-500">
                    <span>Fecha: {entrega.fecha_entrega}</span>
                    <span>Lat: {entrega.latitud}</span>
                    <span>Lon: {entrega.longitud}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-6 text-slate-500">
                No hay entregas programadas por el momento.
              </div>
            )}
          </div>
        </section>
      </div>
    </main>
  );
}
