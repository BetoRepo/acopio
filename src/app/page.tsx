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
        supabaseClient.from('inventario').select('*'),
        supabaseClient.from('entregas_mapa').select('*'),
        supabaseClient.from('configuracion_home').select('*'),
      ]);

      setInventario((inventarioData ?? []) as InventarioRow[]);
      setEntregasMapa((entregasData ?? []) as EntregasMapaRow[]);
      setConfiguracion((configuracionData ?? [null])[0] as ConfiguracionHomeRow | null);
    }

    fetchData();

    const channel = supabaseClient
      .channel('public:inventario')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'inventario' }, (payload) => {
        if (!payload.new) return;
        const newRow = payload.new as InventarioRow;
        setInventario((current) => {
          const next = current.filter((item) => item.id !== newRow.id);
          return [...next, newRow].sort((a, b) => a.producto.localeCompare(b.producto));
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
    <main className="min-h-screen bg-gradient-to-br from-violet-950 via-violet-900 to-purple-950 px-4 py-8 sm:px-6 lg:px-8 text-slate-100">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10">
        <Hero frase_de_accion="Juntos llenamos la ciudad de esperanza y recursos" />
        <Termometro meta={meta} recaudado={recaudado} />
        <Inventario inventario={inventario} />
        <Emergencias />

        <section className="mx-auto w-full max-w-5xl rounded-3xl border border-purple-500/30 bg-white/95 p-8 shadow-xl shadow-purple-500/20 backdrop-blur-sm">
          <div className="space-y-6">
            <div className="rounded-3xl border border-purple-200 bg-violet-50 p-6">
              <p className="text-sm uppercase tracking-[0.35em] text-purple-600">Centro de acopio</p>
              <h2 className="mt-2 text-3xl font-semibold text-violet-950">Ubicación y horarios</h2>
              <p className="mt-3 text-sm leading-6 text-violet-700">
                Nuestro centro de acopio está ubicado en Plaza O&apos;Leary. Recibimos donaciones los sábados y domingos de 9:00 a.m. a 4:00 p.m.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-3xl border border-purple-300/60 bg-violet-100 p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-purple-700">Qué puedes donar</p>
                <ul className="mt-4 space-y-3 text-sm text-violet-800">
                  <li>Alimentos no perecederos</li>
                  <li>Higiene personal</li>
                  <li>Insumos médicos</li>
                  <li>Ropa</li>
                </ul>
              </div>
              <div className="rounded-3xl border border-purple-300/60 bg-violet-100 p-6">
                <p className="text-sm uppercase tracking-[0.35em] text-purple-700">Ejemplos de kits</p>
                <h3 className="mt-2 text-2xl font-semibold text-violet-950">Kits recomendados</h3>
                <ul className="mt-4 space-y-3 text-sm text-violet-800">
                  <li>
                    <strong>Kit A (Higiene Personal):</strong> 2 jabones en barra, 1 crema dental grande, 2 cepillos de dientes, 1 paquete de toallas sanitarias, 2 rollos de papel higiénico.
                  </li>
                  <li>
                    <strong>Kit B (Alimentos No Perecederos):</strong> 3 latas de proteína (atún/sardina), 2 kg de arroz/pasta, 1 kg de granos, 1 L de aceite, 1 kg de harina de maíz, 1 sobre de leche o café.
                  </li>
                  <li>
                    <strong>Kit C (Insumos Médicos):</strong> 1 alcohol o agua oxigenada, gasas, algodón, 1 adhesivo médico, 1 caja de curitas, 2 sueros orales, analgésicos vigentes (acetaminofén).
                  </li>
                  <li>
                    <strong>Kit D (Logística y Limpieza):</strong> 1 par de guantes resistentes, 1 paquete de bolsas de basura gruesas, 3 tapabocas, 1 cloro pequeño hermético, linterna LED con pilas.
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl rounded-3xl border border-purple-300/40 bg-white/90 p-8 shadow-xl shadow-purple-500/20 backdrop-blur-sm">
          <div className="mb-4">
            <p className="text-sm uppercase tracking-[0.3em] text-purple-600">Rutas y entregas</p>
            <h2 className="mt-2 text-3xl font-semibold text-violet-950">Próximas entregas en la ciudad</h2>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            {entregasMapa.length > 0 ? (
              entregasMapa.map((entrega) => (
                <div key={entrega.id} className="rounded-3xl border border-purple-200 bg-violet-50 p-6 shadow-sm">
                  <p className="text-sm font-semibold text-violet-950">{entrega.lugar_comunidad}</p>
                  <p className="mt-2 text-sm text-violet-800">{entrega.detalles_entrega}</p>
                  <div className="mt-4 flex flex-wrap gap-3 text-xs text-violet-600">
                    <span>Fecha: {entrega.fecha_entrega}</span>
                    <span>Lat: {entrega.latitud}</span>
                    <span>Lon: {entrega.longitud}</span>
                  </div>
                </div>
              ))
            ) : (
              <div className="rounded-3xl border border-dashed border-purple-300 bg-violet-50 p-6 text-violet-700">
                No hay entregas programadas por el momento.
              </div>
            )}
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl rounded-3xl border border-purple-500/40 bg-violet-950/95 p-8 text-white shadow-xl shadow-purple-950/40 backdrop-blur-sm">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row md:items-center">
            <div>
              <p className="text-sm uppercase tracking-[0.35em] text-purple-300">Acceso rápido</p>
              <h2 className="mt-2 text-3xl font-semibold">¿Necesitas cargar stock?</h2>
              <p className="mt-2 max-w-2xl text-sm text-purple-100/80">
                Ingresa al panel administrativo y registra los ingresos más recientes. El historial muestra qué se agregó y cuándo.
              </p>
            </div>
            <a
              href="/login"
              className="inline-flex items-center justify-center rounded-full bg-violet-500 px-8 py-4 text-sm font-semibold text-white shadow-lg shadow-violet-500/30 transition hover:bg-violet-600"
            >
              Ir a login administrativo
            </a>
          </div>
        </section>
      </div>
    </main>
  );
}
