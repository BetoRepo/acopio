interface HeroProps {
  frase_de_accion: string;
}

export default function Hero({ frase_de_accion }: HeroProps) {
  return (
    <section className="relative overflow-hidden rounded-[2.5rem] bg-gradient-to-br from-rose-600 via-red-600 to-slate-950 px-6 py-20 text-white shadow-2xl shadow-rose-500/30 sm:px-10 lg:px-14">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.18),_transparent_35%)]" />
      <div className="relative mx-auto flex max-w-6xl flex-col gap-10 lg:flex-row lg:items-center lg:justify-between">
        <div className="max-w-3xl space-y-6">
          <p className="text-sm uppercase tracking-[0.35em] text-rose-100/80">Solidaridad en Caracas</p>
          <h1 className="text-5xl font-black leading-[1.03] tracking-[-0.03em] sm:text-6xl">
            {frase_de_accion}
          </h1>
          <p className="max-w-2xl text-base leading-8 text-rose-100/90 sm:text-lg">
            Una plataforma diseñada para coordinar donaciones, monitorear el inventario y activar rutas de entrega a las comunidades más necesitadas.
          </p>
          <a
            href="#inventario"
            className="inline-flex w-full max-w-max items-center justify-center rounded-full bg-white px-8 py-4 text-sm font-semibold text-rose-700 shadow-xl shadow-rose-700/20 transition hover:bg-rose-50 focus:outline-none focus:ring-4 focus:ring-white/50 sm:text-base"
          >
            Quiero Donar
          </a>
        </div>
        <div className="rounded-[2rem] border border-white/20 bg-white/10 p-8 backdrop-blur-xl sm:p-10">
          <div className="space-y-4">
            <p className="text-sm uppercase tracking-[0.35em] text-rose-100/80">Impacto inmediato</p>
            <div className="grid gap-4 sm:grid-cols-2">
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-3xl font-bold">12+</p>
                <p className="mt-2 text-sm text-rose-100/80">Comunidades apoyadas</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-3xl font-bold">24/7</p>
                <p className="mt-2 text-sm text-rose-100/80">Monitoreo de inventario</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-3xl font-bold">80%</p>
                <p className="mt-2 text-sm text-rose-100/80">Aumento en donaciones</p>
              </div>
              <div className="rounded-3xl bg-white/10 p-5">
                <p className="text-3xl font-bold">100%</p>
                <p className="mt-2 text-sm text-rose-100/80">Visibilidad transparente</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
