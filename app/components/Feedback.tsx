"use client";
import { useEffect, useRef, useState } from "react";
import { useEngine } from "../lib/engine";
import { useLang } from "../lib/i18n";
import { SB_URL, sbHeaders } from "../lib/tournament";

const MAX = 600;
const Star = ({ on }: { on: boolean }) => (
  <svg width="30" height="30" viewBox="0 0 24 24" aria-hidden="true" focusable="false" fill={on ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.7" strokeLinejoin="round"><path d="m12 3.6 2.6 5.3 5.8.8-4.2 4.1 1 5.8L12 16.9l-5.2 2.7 1-5.8-4.2-4.1 5.8-.8L12 3.6Z" /></svg>
);

/** Valoración del torneo (1–5 estrellas) y comentario anónimo para mejorar próximas ediciones. */
export function Feedback() {
  const { tn } = useEngine(), { t, lang } = useLang();
  const KEY = "derio-cup-feedback-" + tn.id;
  const [sent, setSent] = useState<number | null>(null), [rating, setRating] = useState(0), [comment, setComment] = useState(""), [busy, setBusy] = useState(false), [err, setErr] = useState(false);
  useEffect(() => { try { const v = Number(localStorage.getItem(KEY)); setSent(v >= 1 && v <= 5 ? v : null); } catch { setSent(null); } }, [KEY]);
  const shown = sent ?? rating;
  const labels = [1, 2, 3, 4, 5].map(n => t(`${n} de 5 estrellas`, `${n}/5 izar`, `${n} étoile${n > 1 ? "s" : ""} sur 5`));

  async function submit() {
    if (!rating || busy) return;
    setBusy(true); setErr(false);
    try {
      const r = await fetch(SB_URL + "/rest/v1/derio_cup_feedback", { method: "POST", headers: { ...sbHeaders, "Content-Type": "application/json", Prefer: "return=minimal" }, body: JSON.stringify({ tournament_id: tn.id, rating, comment: comment.trim() || null, lang }) });
      if (!r.ok) throw new Error(String(r.status));
      try { localStorage.setItem(KEY, String(rating)); } catch { /* sin almacenamiento: se muestra igualmente el agradecimiento */ }
      setSent(rating);
    } catch { setErr(true); } finally { setBusy(false); }
  }

  const open = sent === null && rating > 0;
  const card = useRef<HTMLElement>(null);
  // al puntuar, el comentario se despliega; se lleva a la vista para que no quede tapado por la barra inferior
  useEffect(() => { if (!open) return; const id = window.setTimeout(() => card.current?.scrollIntoView({ behavior: "smooth", block: "nearest" }), 340); return () => window.clearTimeout(id); }, [open]);

  return (
    <section ref={card} className="feedback" aria-labelledby="fb-title">
      <h3 id="fb-title">{t("Tu opinión nos importa", "Zure iritzia garrantzitsua da", "Votre avis compte pour nous")}</h3>
      <div className="fb-stars" role="radiogroup" aria-label={t("Tu valoración", "Zure balorazioa", "Votre note")}>
        {[1, 2, 3, 4, 5].map(n => (
          <button key={n} type="button" role="radio" aria-checked={shown === n} aria-label={labels[n - 1]} title={labels[n - 1]} disabled={sent !== null} className={n <= shown ? "on" : ""} onClick={() => setRating(n)}><Star on={n <= shown} /></button>
        ))}
      </div>
      <div className={"fb-more" + (open ? " open" : "")}>
        <div className="fb-more-in">
          <label className="fb-field"><span>{t("Comentario (opcional)", "Iruzkina (aukerakoa)", "Commentaire (facultatif)")}</span>
            <textarea rows={3} maxLength={MAX} value={comment} onChange={e => setComment(e.currentTarget.value)} placeholder={t("¿Qué te ha gustado? ¿Qué podemos mejorar?", "Zer gustatu zaizu? Zer hobetu dezakegu?", "Qu’avez-vous aimé ? Que pouvons-nous améliorer ?")} />
          </label>
          <p className="fb-note">{t("Tu opinión nos ayuda a mejorar en próximas ediciones. Los comentarios son anónimos.", "Zure iritziak hurrengo edizioetan hobetzen laguntzen digu. Iruzkinak anonimoak dira.", "Votre avis nous aide à nous améliorer lors des prochaines éditions. Les commentaires sont anonymes.")}</p>
          {err && <p className="form-error" role="alert">{t("No se pudo enviar. Comprueba la conexión e inténtalo de nuevo.", "Ezin izan da bidali. Egiaztatu konexioa eta saiatu berriro.", "Envoi impossible. Vérifiez la connexion et réessayez.")}</p>}
          <button type="button" className="btn btn-primary block" disabled={!rating || busy} onClick={submit}>{busy ? t("Enviando…", "Bidaltzen…", "Envoi…") : t("Enviar valoración", "Bidali balorazioa", "Envoyer mon avis")}</button>
        </div>
      </div>
      {sent !== null && <p className="fb-thanks" role="status">{t("¡Gracias! Tu opinión nos ayuda a mejorar.", "Eskerrik asko! Zure iritziak hobetzen laguntzen digu.", "Merci ! Votre avis nous aide à nous améliorer.")}</p>}
    </section>
  );
}
