(function (root) {
  'use strict';

  const questions = [
    {
      title: '¿Qué plan preferís para una noche de fin de semana en Rosario?',
      answers: [
        'Ir a un recital multitudinario en un centro cultural lleno de gente bailando sin parar.',
        'Un show íntimo en un club nocturno con luces tenue y una atmósfera llena de beats y sintetizadores.',
        'Un encuentro tranqui con amigos, trago en mano y música chill de fondo.',
        'Un toque relámpago en un bar donde la gente explote desde el primer tema.',
        'Un show con un escenario lleno de músicos con puro sonido orgánico.',
      ],
    },
    {
      title: '¿Con qué sonido o instrumento te identificás más?',
      answers: [
        'Un bajo marcado que te obliga a mover los pies instantáneamente.',
        'Teclados atmosféricos, sintetizadores modernos y beats de neo soul.',
        'Una guitarra con un sonido diferente, suave y voces melódicas relajadas.',
        'Una batería directa y a tierra, bien marcada y sin ornamentos innecesarios.',
        'Una sección de vientos (saxos, trompetas, trombones) sonando al unísono con fuerza.',
      ],
    },
    {
      title: 'Si tu personalidad fuera un color o paleta cromática, ¿cuál sería?',
      answers: [
        'Luces de neón, violeta y verde eléctrico.',
        'Degradados pastel, rosa y violeta profundo.',
        'Tonos cálidos: terracota, naranja atardecer y beige.',
        'Colores primarios brillantes: rojo vivo y amarillo.',
        'Dorado, bronce y negro elegante.',
      ],
    },
    {
      title: '¿Qué sensación o vibra buscás cuando escuchás música?',
      answers: [
        'Desconexión total y ganas de bailar en multitud.',
        'Viajar con la cabeza, apreciar los detalles y las texturas sonoras.',
        'Entrar en un estado místico, buscando salir de la realidad.',
        'Una inyección de energía rápida y adrenalina sin vueltas.',
        'Sentir la potencia del sonido en vivo retumbando en el pecho.',
      ],
    },
    {
      title: 'Elegí una bebida para acompañar tu momento de groove:',
      answers: [
        'Una birra bien fría en una jarra compartida.',
        'Un gin tonic o trago de autor con ingredientes botánicos.',
        'Un vermut con soda y hielo para disfrutar sin apuro.',
        'Un aperitivo clásico y rápido listo para tomar.',
        'Un buen vino o cóctel clásico en vaso corto.',
      ],
    },
    {
      title: '¿Cómo describirías tu estilo de vestir o estética personal?',
      answers: [
        'Urbano, cómodo, con colores llamativos y listo para moverte.',
        'Moderno, detallista, con un toque futurista o retro-contemporáneo.',
        'Casual, suave, prendas holgadas y tonos neutros.',
        'Minimalista, relajado, sin demasiada elaboración pero con actitud.',
        'Clásico con estilo, impecable y bien arreglado para la ocasión.',
      ],
    },
    {
      title: '¿Qué lugar de Rosario sentís que va mejor con tu energía?',
      answers: [
        'El Distrito Siete o La Sala de las Artes en plena fiesta.',
        'Un espacio cultural independiente con propuestas alternativas.',
        'El Parque España al atardecer mirando el río.',
        'Un bar de pichincha con música sonando en el interior.',
        'Un anfiteatro o escenario grande al aire libre.',
      ],
    },
    {
      title: '¿Cuál es tu enfoque al momento de encarar un proyecto o idea?',
      answers: [
        'Sumar a mucha gente, armar movida y hacer ruido entre todos.',
        'Experimentar, buscar un toque distintivo y perfeccionar los detalles.',
        'Fluir a tu propio ritmo, disfrutando el proceso sin presiones.',
        'Ir directo al punto, resolver rápido y con efectividad.',
        'Coordinar cada elemento con precisión para que la estructura funcione perfecta.',
      ],
    },
    {
      title: '¿Qué textura visual o material asociás con tu ritmo de vida?',
      answers: [
        'Vinilo fluorescente y luces de escenario.',
        'Terciopelo, pantallas y luces LED suaves.',
        'Algodón cálido, madera y luz natural.',
        'Cuero, asfalto y metal brillante.',
        'Metal pulido, madera de instrumentos y cortinados de escenario.',
      ],
    },
    {
      title: 'Elegí una frase o lema con el que más te identifiques:',
      answers: [
        '“Si no se baila, no es fiesta.”',
        '“La magia está en los detalles y en el viaje.”',
        '“Tranquilo, que el ritmo llega solo.”',
        '“Corto, al pie y con toda la fuerza.”',
        '“La potencia del ensamble lo cambia todo.”',
      ],
    },
  ];

  const results = {
    A: { name: 'Groovin Bohemia', image: 'a.svg' },
    B: { name: 'Chokenbici', image: 'b.svg' },
    C: { name: 'Suave Lomito', image: 'c.svg' },
    D: { name: 'Cortito y Funky', image: 'd.svg' },
    E: { name: 'Latelonius', image: 'e.svg' },
  };

  function calculateResult(answers, random = Math.random) {
    if (!Array.isArray(answers) || answers.length !== questions.length || answers.some(answer => !Object.hasOwn(results, answer))) {
      throw new Error('Respondé las diez preguntas antes de ver tu resultado.');
    }
    const counts = { A: 0, B: 0, C: 0, D: 0, E: 0 };
    answers.forEach(answer => { counts[answer] += 1; });
    const maximum = Math.max(...Object.values(counts));
    const winners = Object.keys(counts).filter(key => counts[key] === maximum);
    return winners.length === 1 ? winners[0] : winners[Math.floor(random() * winners.length)];
  }

  const data = { questions, results, calculateResult };
  if (typeof module !== 'undefined' && module.exports) module.exports = data;
  else root.MusicQuizData = data;
})(typeof window !== 'undefined' ? window : globalThis);
