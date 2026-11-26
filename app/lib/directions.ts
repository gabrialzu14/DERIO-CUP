import { detectPlatform } from "./platform";

/** Destinos con coordenadas exactas (la ruta llega al punto, no a una búsqueda por nombre). */
export const PLACES = {
  ibaiondo: { lat: 43.2963447, lng: -2.8804612, name: "Campo de fútbol Ibaiondo, Derio" },      // ficha de Google Maps del campo
  seminario: { lat: 43.2927, lng: -2.8782, name: "Aparcamiento del Seminario, Derio" },        // aparcamiento de Larrauri kalea (OpenStreetMap)
} as const;
export type PlaceKey = keyof typeof PLACES;

/** Enlace de «Cómo llegar»: Apple Maps en iPhone/iPad, Google Maps en el resto; en coche salvo que se pida a pie. */
export function directionsUrl(key: PlaceKey, walk = false): string {
  const p = PLACES[key], ll = p.lat + "," + p.lng;
  if (detectPlatform() === "ios") return `https://maps.apple.com/?daddr=${ll}&q=${encodeURIComponent(p.name)}&dirflg=${walk ? "w" : "d"}`;
  return `https://www.google.com/maps/dir/?api=1&destination=${ll}&travelmode=${walk ? "walking" : "driving"}`;
}
