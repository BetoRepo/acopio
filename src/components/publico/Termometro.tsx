interface TermometroProps {
  meta: number;
  recaudado: number;
}

export default function Termometro({ meta, recaudado }: TermometroProps) {
  const porcentaje = meta > 0 ? Math.min(100, Math.round((recaudado / meta) * 100)) : recaudado > 0 ? 100 : 0;

  return (
    <section className="mx-auto w-full max-w-5xl rounded-3xl border border-emerald-200 bg-white/95 p-8 shadow-xl shadow-emerald-200/40 backdrop-blur-sm">
      <div className="flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-emerald-600">Termómetro de inventario</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Items recibidos hoy</h2>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
            Este termómetro muestra el avance de los artículos donados en el día frente a la meta de abastecimiento diario.
          </p>
        </div>
        <div className="rounded-3xl border border-emerald-100 bg-emerald-50 px-5 py-4 text-right">
          <p className="text-sm uppercase tracking-[0.2em] text-emerald-700">Recibidos</p>
          <p className="mt-2 text-3xl font-bold text-slate-950">{recaudado.toLocaleString('es-VE')}</p>
          <p className="text-sm text-slate-600">de {meta.toLocaleString('es-VE')} items</p>
        </div>
      </div>

      <div className="mt-8 space-y-3">
        <div className="flex items-center justify-between text-sm font-medium text-slate-700">
          <span>Progreso hacia la meta</span>
          <span>{porcentaje}%</span>
        </div>
        <div className="h-4 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-emerald-600 to-lime-500 transition-all duration-1000 ease-out"
            style={{ width: `${porcentaje}%` }}
          />
        </div>
        <p className="text-xs text-slate-500">Meta del día basada en artículos recibidos, no en monto de dinero.</p>
      </div>
    </section>
  );
}
