export default function Emergencias() {
  return (
    <section className="mx-auto w-full max-w-5xl rounded-3xl border border-slate-200 bg-white/95 p-8 shadow-xl shadow-slate-200/40 backdrop-blur-sm">
      <div className="mb-8 space-y-4">
        <p className="text-sm uppercase tracking-[0.3em] text-rose-600">Líneas de emergencia</p>
        <h2 className="text-3xl font-semibold text-slate-900">Contacto inmediato en Caracas</h2>
        <p className="max-w-2xl text-sm leading-6 text-slate-600">
          Mantén a mano estos números críticos mientras coordinamos las entregas y apoyamos a las familias en situación de emergencia.
        </p>
      </div>

      <div className="grid gap-5 md:grid-cols-3">
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Bomberos</p>
          <p className="mt-4 text-3xl font-bold text-rose-600">171</p>
          <p className="mt-2 text-sm text-slate-600">Cuerpo de Bomberos de Caracas</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Cruz Roja</p>
          <p className="mt-4 text-3xl font-bold text-rose-600">141</p>
          <p className="mt-2 text-sm text-slate-600">Atención médica y logística en terreno</p>
        </div>
        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-6 shadow-sm">
          <p className="text-sm uppercase tracking-[0.2em] text-slate-500">Protección Civil</p>
          <p className="mt-4 text-3xl font-bold text-rose-600">171</p>
          <p className="mt-2 text-sm text-slate-600">Coordinación de rescate y seguridad comunitaria</p>
        </div>
      </div>

      <div className="mt-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-semibold text-slate-900">Guía de sismos</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Descarga el manual oficial de FUNVISIS para saber cómo actuar antes, durante y después de un sismo.
          </p>
        </div>
        <a
          href="/guia-sismo-funvisis.pdf"
          download
          className="inline-flex items-center justify-center rounded-3xl bg-rose-600 px-6 py-4 text-center text-sm font-semibold text-white shadow-lg shadow-rose-400/20 transition hover:bg-rose-700"
        >
          Descargar guía de sismos
        </a>
      </div>
    </section>
  );
}
