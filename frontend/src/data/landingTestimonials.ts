/** Comentarios ficticios coherentes con la categoría seleccionada en el hero (landing). */

export type LandingTestimonial = {
  quote: string;
  author: string;
  detail: string;
};

const ELECTRICA: LandingTestimonial[] = [
  {
    quote:
      "La asistencia al pedaleo cambió mis subidas: llego al trabajo sin llegar empapado y la batería me dura toda la semana con cargas cortas.",
    author: "Marcos R.",
    detail: "E-bike urbana · compra en Tucson",
  },
  {
    quote:
      "Dudaba del motor, pero es silencioso y el modo eco para el paseo y el sport para el viento en contra funcionan de diez.",
    author: "Lucía F.",
    detail: "Bicicleta eléctrica · Tucumán",
  },
  {
    quote:
      "El taller me explicó bien el cuidado de la batería. Después de seis meses sigue con autonomía parecida al primer día.",
    author: "Diego P.",
    detail: "E-bike · cliente verificado",
  },
  {
    quote:
      "La uso para llevar a los chicos al cole y hacer mandados: el portaequipajes aguanta bien y el motor no falla en los semáforos.",
    author: "Carla M.",
    detail: "E-bike familiar",
  },
];

const CIUDAD: LandingTestimonial[] = [
  {
    quote:
      "Buscaba algo liviano para el centro y los baches: la posición es cómoda y los guardabarros me salvaron de los charcos.",
    author: "Sofía G.",
    detail: "Bici urbana · commuting diario",
  },
  {
    quote:
      "La uso todos los días de lunes a viernes; el cambio es suave y el cuadro se siente sólido en las esquinas.",
    author: "Nicolás A.",
    detail: "Ciudad · San Miguel de Tucumán",
  },
  {
    quote:
      "Me la recomendaron para trayectos cortos y terminé dejando el auto para el finde. Muy conforme con el asesoramiento en la tienda.",
    author: "Valentina L.",
    detail: "Bicicleta urbana",
  },
  {
    quote:
      "Quería algo fácil de subir a la vereda y guardar en el depto: el tamaño de rueda y el manillar fueron clave en la elección.",
    author: "Javier T.",
    detail: "Urbana · compra local",
  },
];

const MONTANA: LandingTestimonial[] = [
  {
    quote:
      "Salgo a los senderos de los cerros los fines de semana: la geometría se nota estable en las bajadas y el cuadro aguanta bien los golpes.",
    author: "Federico B.",
    detail: "MTB · uso en sendero",
  },
  {
    quote:
      "Pasé de una rígida a esta y la diferencia en comodidad en piedra suelta es enorme; los frenos responden cuando hace falta.",
    author: "Paula E.",
    detail: "Montaña · aficionada",
  },
  {
    quote:
      "El equipo en el taller me ayudó a regular suspensiones y presión según mi peso. Después de un año sigue firme.",
    author: "Gustavo H.",
    detail: "Bici de montaña",
  },
  {
    quote:
      "Uso barro, polvo y algún salto chico: los componentes aguantaron sin dramas y el servicio postventa fue claro.",
    author: "Andrés C.",
    detail: "MTB trail",
  },
];

export const LANDING_TESTIMONIALS_BY_CATEGORY: Record<string, LandingTestimonial[]> = {
  electrica: ELECTRICA,
  ciudad: CIUDAD,
  montana: MONTANA,
};

export function getLandingTestimonials(categorySlug: string): LandingTestimonial[] {
  return LANDING_TESTIMONIALS_BY_CATEGORY[categorySlug] ?? ELECTRICA;
}
