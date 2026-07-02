interface TermometroProps {
  meta: number;
  recaudado: number;
}

export default function Termometro({ meta, recaudado }: TermometroProps) {
  const porcentaje = meta > 0 ? Math.min(100, Math.round((recaudado / meta) * 100)) : 0;

  return (
    <section className="mx-auto w-full max-w-5xl rounded-3xl border border-red-200 bg-white/95 p-8 shadow-xl shadow-red-200/40 backdrop-blur-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-red-600">Termómetro de donaciones</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Avance de la meta global</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Seguimos recogiendo donaciones para abastecer las comunidades más vulnerables de Caracas. Cada aporte nos acerca al objetivo.
          </p>
        </div>
        <div className="rounded-3xl border border-red-100 bg-red-50 px-5 py-4 text-right">
          <p className="text-sm uppercase tracking-[0.2em] text-red-700">Recaudado</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{recaudado.toLocaleString('es-VE')} Bs.</p>
          <p className="text-sm text-slate-600">de {meta.toLocaleString('es-VE')} Bs.</p>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between text-sm font-medium text-slate-700">
          <span>Progreso</span>
          <span>{porcentaje}%</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-red-600 to-rose-500 transition-all duration-1000 ease-out"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <p className="text-xs text-slate-500">Meta actualizada en tiempo real con cada donación registrada.</p>
      </div>
    </section>
  );
}
