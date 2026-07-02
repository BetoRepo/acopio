import { InventarioRow } from '../../types/database.types';

interface InventarioProps {
  inventario: InventarioRow[];
}

export default function Inventario({ inventario }: InventarioProps) {
  return (
    <section id="inventario" className="mx-auto w-full max-w-6xl rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-xl shadow-slate-200/40 backdrop-blur-sm">
      <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
        <div>
          <p className="text-sm uppercase tracking-[0.3em] text-slate-500">Inventario activo</p>
          <h2 className="mt-2 text-3xl font-semibold text-slate-900">Monitoreo de existencias</h2>
        </div>
        <p className="max-w-xl text-sm leading-6 text-slate-600">
          Revisa los productos disponibles, identifica lo urgente y organiza la distribución a las comunidades en Caracas.
        </p>
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
              const urgent = item.cantidad_actual <= item.cantidad_minima;
              return (
                <tr
                  key={item.id}
                  className={`border-t border-slate-200 transition-colors duration-300 ${urgent ? 'bg-red-50' : 'bg-white'}`}
                >
                  <td className="px-6 py-4 font-semibold text-slate-900">{item.producto}</td>
                  <td className="px-6 py-4 text-slate-600">{item.categoria}</td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1">
                      <span className={`font-semibold ${urgent ? 'text-red-700' : 'text-slate-900'}`}>{item.cantidad_actual}</span>
                      {urgent ? <span className="text-xs font-semibold text-red-600">⚠️ ¡Urge!</span> : null}
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
