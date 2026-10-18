import { Icon } from "@/components/ui/icon";
import { getLocale, getTranslations } from "@/i18n/server";

const symbols = ["leaf", "flower", "cherry", "gem"] as const;
const reels = {
  hero: [
    ["cherry", "gem", "leaf"],
    ["leaf", "gem", "flower"],
    ["flower", "gem", "cherry"],
  ],
  detail: [
    ["gem", "flower", "cherry"],
    ["cherry", "flower", "leaf"],
    ["leaf", "flower", "gem"],
  ],
} as const;

export async function GamePreview({
  variant,
}: {
  variant: keyof typeof reels;
}) {
  const t = await getTranslations();
  const locale = await getLocale();
  const format = new Intl.NumberFormat(locale);

  return (
    <figure className={`game-preview game-preview-${variant}`}>
      <div className="preview-card" aria-hidden="true">
        <div className="preview-topline" />
        <div className="preview-heading">
          {variant === "hero" ? (
            <>
              <span className="preview-wordmark">{t("landing.game.name")}</span>
              <span className="preview-edition">
                {t("landing.preview.edition")}
              </span>
            </>
          ) : (
            <>
              <span className="preview-balance">
                <span>{t("landing.preview.balance")}</span>
                <strong>
                  {format.format(1040)}{" "}
                  <small>{t("landing.preview.credits")}</small>
                </strong>
              </span>
              <span className="preview-badge">
                {t("landing.preview.badge")}
              </span>
            </>
          )}
        </div>
        <div className="preview-machine">
          <div className="preview-reels">
            {reels[variant].map((reel, reelIndex) => (
              <div className="preview-reel" key={reelIndex}>
                {reel.map((symbol, rowIndex) => (
                  <span
                    key={symbol}
                    className={`preview-cell symbol-${symbol}${rowIndex === 1 ? " preview-cell-selected" : ""}`}
                  >
                    <Icon name={symbol} />
                  </span>
                ))}
              </div>
            ))}
          </div>
        </div>
        {variant === "hero" ? (
          <div className="preview-summary">
            <span>
              <span className="preview-label">
                {t("landing.preview.balance")}
              </span>{" "}
              <strong>{format.format(1000)}</strong>{" "}
              {t("landing.preview.credits")}
            </span>
            <span className="text-highlight">
              {t("landing.preview.combination", {
                credits: format.format(375),
              })}
            </span>
          </div>
        ) : (
          <>
            <div className="preview-controls">
              <span className="preview-bets">
                {[10, 25, 50].map((bet) => (
                  <span key={bet}>{format.format(bet)}</span>
                ))}
              </span>
              <span className="preview-spin">{t("landing.preview.spin")}</span>
            </div>
            <div className="preview-result">
              <Icon name="flower" />
              {t("landing.preview.result", { credits: format.format(50) })}
            </div>
          </>
        )}
      </div>
      <figcaption className="preview-caption">
        <p>
          {t(
            variant === "hero"
              ? "landing.preview.heroCaption"
              : "landing.preview.detailCaption",
          )}
        </p>
        {variant === "hero" && (
          <ul className="preview-legend">
            {symbols.map((symbol) => (
              <li key={symbol}>
                <Icon name={symbol} className={`symbol-${symbol}`} />
                {t(`landing.preview.symbols.${symbol}`)}
              </li>
            ))}
          </ul>
        )}
      </figcaption>
    </figure>
  );
}
