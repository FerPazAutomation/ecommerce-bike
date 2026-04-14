/**
 * Visuales por categoría (slug alineado con seed del backend: montana, ciudad, electrica).
 * Imágenes desde `public/images/catalog/{slug}/{slug}-NN.png` (véase `catalogImages.ts` y `seed.py`).
 */
import { catalogImage } from "./catalogImages";
import { LANDING_HELMET_IMAGES } from "./cascosCatalog";
import { picsumSeed } from "../lib/imageFallback";

const landingHelmets: [string, string, string] = [...LANDING_HELMET_IMAGES];

export type CategorySlide = {
  src: string;
  hotspots: [string, string, string];
};

export type CategoryVisualPack = {
  /** Cuatro vistas: principal + tres miniaturas (índices 01–04 del catálogo). */
  slides: [CategorySlide, CategorySlide, CategorySlide, CategorySlide];
  helmets: [string, string, string];
};

/** Tres viñetas por cada una de las cuatro bicis mostradas en el carrusel. */
const CIUDAD_SLIDES: [CategorySlide, CategorySlide, CategorySlide, CategorySlide] = [
  {
    src: catalogImage("ciudad", 1),
    hotspots: ["Cuadro abierto estilo holandés", "Guardabarros y portaequipajes", "Sillín amplio, postura erguida"],
  },
  {
    src: catalogImage("ciudad", 2),
    hotspots: ["Línea clásica minimalista", "Detalles tipo cuero y cromados", "Ruedas finas para asfalto diario"],
  },
  {
    src: catalogImage("ciudad", 3),
    hotspots: ["Cuadro carbono alto rendimiento", "Transmisión electrónica 12v", "Frenos de disco y ruedas ligeras"],
  },
  {
    src: catalogImage("ciudad", 4),
    hotspots: ["Geometría cruiser retro", "Neumáticos anchos tipo balón", "Una velocidad, mantenimiento simple"],
  },
];

const MONTANA_SLIDES: [CategorySlide, CategorySlide, CategorySlide, CategorySlide] = [
  {
    src: catalogImage("montana", 1),
    hotspots: ["Doble suspensión trail", "Geometría estable en bajadas", "Frenos de disco para barro y pendiente"],
  },
  {
    src: catalogImage("montana", 2),
    hotspots: ["Cuadro resistente multiuso", "Ruedas pensadas para terreno mixto", "Control en curvas técnicas"],
  },
  {
    src: catalogImage("montana", 3),
    hotspots: ["Enfoque enduro ligero", "Buen compromiso subida–bajada", "Amortiguación progresiva"],
  },
  {
    src: catalogImage("montana", 4),
    hotspots: ["Montaje fiable para uso frecuente", "Tracción en roca y tierra", "Confort en pistas largas"],
  },
];

const ELECTRICA_SLIDES: [CategorySlide, CategorySlide, CategorySlide, CategorySlide] = [
  {
    src: catalogImage("electrica", 1),
    hotspots: ["Motor con asistencia al pedaleo", "Batería para ciudad y periurbano", "Autonomía pensada para el día a día"],
  },
  {
    src: catalogImage("electrica", 2),
    hotspots: ["Motor integrado silencioso", "Batería extraíble de uso diario", "Sube pendientes con menos esfuerzo"],
  },
  {
    src: catalogImage("electrica", 3),
    hotspots: ["Estilo trekking eléctrico", "Versatilidad en rutas largas", "Buena capacidad de carga"],
  },
  {
    src: catalogImage("electrica", 4),
    hotspots: ["Equilibrio peso–potencia", "Ideal para desplazamientos urbanos", "Asistencia progresiva y predecible"],
  },
];

export const CATEGORY_VISUALS: Record<string, CategoryVisualPack> = {
  montana: { slides: MONTANA_SLIDES, helmets: [...landingHelmets] },
  ciudad: { slides: CIUDAD_SLIDES, helmets: [...landingHelmets] },
  electrica: { slides: ELECTRICA_SLIDES, helmets: [...landingHelmets] },
};

export const DEFAULT_CATEGORY_SLUG = "electrica";

export const DEFAULT_PRODUCT_IMAGE = catalogImage("electrica", 1);

export function getVisualPackForCategory(slug: string): CategoryVisualPack {
  return CATEGORY_VISUALS[slug] ?? CATEGORY_VISUALS[DEFAULT_CATEGORY_SLUG];
}

/** Miniatura del bloque “Mira este video” (placeholder estable si no hay asset local). */
export const LANDING_VIDEO_THUMB = picsumSeed("ebike-landing-video-poster", 900, 506);
