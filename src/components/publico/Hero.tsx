import React from 'react';

type Props = {
  frase_de_accion?: string;
};

export default function Hero({ frase_de_accion }: Props) {
  return (
    <section className="mx-auto w-full max-w-7xl rounded-3xl bg-gradient-to-r from-violet-800 to-purple-700 p-8 text-white shadow-lg">
      <div className="mx-auto max-w-4xl text-center">
        <p className="text-sm uppercase tracking-widest text-purple-200">Centro de acopio</p>
        <h1 className="mt-2 text-4xl font-extrabold">Plaza O`leary</h1>
        <p className="mt-4 text-lg text-purple-100/90">{frase_de_accion ?? 'Juntos llenamos la ciudad de esperanza y recursos'}</p>
      </div>
    </section>
  );
}
