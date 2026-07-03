'use client';

import { useEffect, useState } from 'react';
import { supabaseClient } from '../lib/supabaseClient';
import { ConfiguracionHomeRow, EntregasMapaRow, InventarioRow } from '../types/database.types';
import Hero from 'src/components/publico/Hero';
import Termometro from 'src/components/publico/Termometro';
import Inventario from 'src/components/publico/Inventario';
import Emergencias from 'src/components/publico/Emergencias';

export default function HomePage() {
  const [inventario, setInventario] = useState<InventarioRow[]>([]);
  const [entregasMapa, setEntregasMapa] = useState<EntregasMapaRow[]>([]);
  const [configuracion, setConfiguracion] = useState<ConfiguracionHomeRow | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);

  const carouselImages = [
    '/images/carousel-1.jpg',
    '/images/carousel-2.jpg',
    '/images/carousel-3.jpg',
  ];

  const carouselCaptions = [
    'Scouts y voluntarios organizando la recepción de donaciones.',
    'Nuestra carpa oficial con la flor de lis, diagonal al Teatro Junín.',
    'Entregas en curso: apoyando a las comunidades cercanas.',
  ];

  const prevCarousel = () => setCarouselIndex((current) => (current - 1 + carouselImages.length) % carouselImages.length);
  const nextCarousel = () => setCarouselIndex((current) => (current + 1) % carouselImages.length);

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

        <section className="mx-auto w-full max-w-5xl rounded-3xl border border-purple-500/30 bg-white/95 p-8 shadow-xl shadow-purple-500/20 backdrop-blur-sm">
          <div className="space-y-6">
            <div className="rounded-3xl border border-purple-200 bg-violet-50 p-6">
              <p className="text-sm uppercase tracking-[0.35em] text-purple-600">Inventario activo</p>
              <h2 className="mt-2 text-3xl font-semibold text-violet-950">Monitoreo de existencias</h2>
              <p className="mt-3 text-sm leading-6 text-violet-700">
                Aquí compartimos solo el estado general de la campaña. No mostramos al público las cantidades exactas de cada producto.
              </p>
            </div>
            <div className="rounded-3xl border border-dashed border-purple-300 bg-violet-50/80 p-6 text-violet-800">
              <p className="text-sm uppercase tracking-[0.35em] text-purple-700">Estado actual</p>
              <p className="mt-3 text-sm leading-6">
                Tenemos apoyo activo y seguimos recibiendo donaciones. Si quieres colaborar, trae insumos para bebés, alimentos, higiene o ropa.
              </p>
              <p className="mt-4 rounded-3xl border border-purple-200 bg-white/90 p-4 text-sm text-violet-900">
                No hay categorías detalladas para mostrar en esta vista pública.
              </p>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl rounded-3xl border border-purple-500/30 bg-white/95 p-8 shadow-xl shadow-purple-500/20 backdrop-blur-sm">
          <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
            <div className="space-y-6 rounded-3xl border border-purple-200 bg-violet-50 p-6">
              <p className="text-sm uppercase tracking-[0.35em] text-purple-600">Centro de acopio</p>
              <h2 className="text-3xl font-semibold text-violet-950">Ubicación y horarios</h2>
              <p className="mt-3 text-sm leading-6 text-violet-700">
                Estamos en Plaza O&apos;Leary. Busca a los scouts diagonal al Teatro Junín: nuestra carpa es el punto oficial de los scouts, no la carpa gigante blanca.
              </p>
              <p className="text-sm leading-6 text-violet-700">
                Recibimos donaciones los sábados y domingos de 9:00 a.m. a 4:00 p.m. El equipo de Scouts está listo para recibir lo que puedas aportar.
              </p>
              <div className="rounded-3xl border border-purple-300 bg-violet-100 p-4 text-violet-900">
                <p className="text-sm font-semibold">Consejo rápido</p>
                <p className="mt-2 text-sm leading-6">
                  Si no sabes dónde parar, pregunta por los de verde o por la flor de lis: ese es nuestro punto de encuentro.
                </p>
              </div>
            </div>
            <div className="rounded-3xl border border-purple-200 bg-violet-100 p-6">
              <p className="text-sm uppercase tracking-[0.35em] text-purple-700">Donaciones urgentes</p>
              <ul className="mt-4 space-y-3 text-sm text-violet-800">
                <li>Insumos para bebés (pañales, leche, artículos de cuidado)</li>
                <li>Alimentos no perecederos</li>
                <li>Higiene personal</li>
                <li>Ropa en buen estado</li>
              </ul>
              <p className="mt-4 text-sm leading-6 text-violet-700">
                Estamos recibiendo donaciones de forma espontánea; esta campaña nació del trabajo hecho el domingo y aún seguimos apoyando en la zona.
              </p>
              <div className="mt-6 rounded-3xl bg-gradient-to-r from-violet-700 to-purple-700 p-4 text-white">
                <p className="text-sm uppercase tracking-[0.35em] text-purple-200">Lleva esto si puedes</p>
                <p className="mt-2 text-sm leading-6 text-white/90">Busca a los de verde y dona lo que tengas: cada aporte suma.</p>
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl overflow-hidden rounded-[2.5rem] border border-purple-400/30 bg-gradient-to-br from-violet-900 via-purple-950 to-fuchsia-950 p-8 text-white shadow-2xl shadow-purple-900/40">
          <div className="mb-6 flex flex-col gap-4 text-center">
            <p className="text-sm uppercase tracking-[0.35em] text-purple-200">Trabajo scout</p>
            <h2 className="text-3xl font-semibold">Fotos del trabajo realizado</h2>
            <p className="mx-auto max-w-2xl text-sm text-purple-100/80">
              Compartimos el avance de la campaña con fotos del día a día. Pronto subiremos más contenido a Instagram para que puedas ver cómo apoyamos a las comunidades.
            </p>
          </div>

          <div className="relative flex items-center justify-center overflow-hidden rounded-3xl border border-white/10 bg-white/10 p-6 shadow-xl shadow-purple-900/20 backdrop-blur-sm">
            <button
              type="button"
              onClick={prevCarousel}
              className="absolute left-4 z-10 rounded-full border border-white/20 bg-black/20 px-3 py-2 text-2xl font-semibold text-white transition hover:bg-black/30"
              aria-label="Anterior foto"
            >
              ‹
            </button>

            <div className="mx-auto flex w-full max-w-4xl items-center justify-center">
              <div className="relative h-[320px] w-full overflow-hidden rounded-3xl bg-slate-900 sm:h-[420px]">
                <img
                  src={carouselImages[carouselIndex]}
                  alt={`Foto ${carouselIndex + 1} del trabajo scout`}
                  className="h-full w-full object-cover"
                />
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-slate-950/90 to-transparent px-6 py-4">
                  <p className="text-sm text-purple-100/90">{carouselCaptions[carouselIndex]}</p>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={nextCarousel}
              className="absolute right-4 z-10 rounded-full border border-white/20 bg-black/20 px-3 py-2 text-2xl font-semibold text-white transition hover:bg-black/30"
              aria-label="Siguiente foto"
            >
              ›
            </button>
          </div>

          <div className="mt-5 flex items-center justify-center gap-3">
            {carouselImages.map((_, index) => (
              <button
                key={index}
                type="button"
                onClick={() => setCarouselIndex(index)}
                className={`h-3 w-3 rounded-full transition ${
                  index === carouselIndex ? 'bg-purple-300' : 'bg-white/30'
                }`}
              />
            ))}
          </div>
        </section>

        <section className="mx-auto w-full max-w-5xl rounded-3xl border border-purple-300/40 bg-white/90 p-8 shadow-xl shadow-purple-500/20 backdrop-blur-sm">
          <div className="mb-4">
            <p className="text-sm uppercase tracking-[0.3em] text-purple-600">Donaciones</p>
            <h2 className="mt-2 text-3xl font-semibold text-violet-950">Donativos Realizados</h2>
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
                No hay donaciones registradas por el momento.
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
