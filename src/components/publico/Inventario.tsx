import { InventarioRow } from '../../types/database.types';

interface InventarioProps {
  inventario: InventarioRow[];
}

export default function Inventario({ inventario }: InventarioProps) {
  const categoriaTotales = inventario.reduce<Record<string, number>>((acc, item) => {
    acc[item.categoria] = (acc[item.categoria] ?? 0) + item.cantidad_actual;
    return acc;
  }, {});

  return (
    <section id="inventario" className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-sm">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Inventario activo</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Monitoreo de existencias</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          Revisa los productos disponibles, identifica lo urgente y observa cuántos artículos hay por categoría.
        </p>
      </div>

      <div className="mb-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {Object.entries(categoriaTotales).map(([categoria, total]) => (
          <div key={categoria} className="rounded-3xl border border-slate-200 bg-slate-50 p-5 shadow-sm">
            <p className="text-sm font-semibold uppercase tracking-[0.25em] text-slate-500">{categoria}</p>
            <p className="mt-3 text-3xl font-bold text-slate-900">{total}</p>
            <p className="mt-1 text-sm text-slate-600">items disponibles</p>
          </div>
        ))}
        {Object.keys(categoriaTotales).length === 0 ? (
          <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-5 text-slate-500">No hay categorías para mostrar.</div>
        ) : null}
      </div>

      <div className="overflow-x-auto rounded-3xl border border-slate-100 bg-slate-50">
        <table className="min-w-full border-separate border-spacing-0 text-left text-sm text-slate-700">
          <thead className="bg-slate-100 text-slate-900">
            <tr>
              <th className="px-6 py-4 font-medium">Producto</th>
              <th className="px-6 py-4 font-medium">Categoría</th>
              <th className="px-6 py-4 font-medium">Cantidad actual</th>
              <th className="px-6 py-4 font-medium">Cantidad mínima</th>
              <th className="px-6 py-4 font-medium">Meta campaña</th>
            </tr>
          </thead>
          <tbody>
            {inventario.map((item) => {
              const status =
                item.cantidad_actual === 0
                  ? 'empty'
                  : item.cantidad_actual > item.cantidad_minima
                  ? 'full'
                  : 'low';
              const rowClass =
                status === 'full'
                  ? 'bg-emerald-50'
                  : status === 'low'
                  ? 'bg-amber-50'
                  : 'bg-red-50';
              const textClass =
                status === 'full'
                  ? 'text-emerald-700'
                  : status === 'low'
                  ? 'text-amber-700'
                  : 'text-red-700';
              const statusLabel =
                status === 'full' ? 'OK' : status === 'low' ? 'Bajo' : 'Agotado';

              return (
                <tr key={item.id} className={`border-t border-slate-200 transition-colors duration-300 ${rowClass}`}>
                  <td className="px-6 py-4 font-semibold text-slate-900">{item.producto}</td>
                  <td className="px-6 py-4 text-slate-600">{item.categoria}</td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className={`font-semibold ${textClass}`}>{item.cantidad_actual}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-semibold ${status === 'full' ? 'bg-emerald-100 text-emerald-800' : status === 'low' ? 'bg-amber-100 text-amber-800' : 'bg-red-100 text-red-800'}`}>
                        {statusLabel}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-slate-700">{item.cantidad_minima}</td>
                  <td className="px-6 py-4 text-slate-700">{item.meta_campana}</td>
                </tr>
              );
            })}
            {inventario.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-8 text-center text-slate-500">
                  No hay registros de inventario disponibles en este momento.
                </td>
              </tr>
            ) : null}
          </tbody>
        </table>
      </div>
    </section>
  );
}
