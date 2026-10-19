import Link from "next/link";

import { Icon } from "@/components/ui/icon";
import { getTranslations } from "@/i18n/server";

const states = ["ready", "checking", "result"] as const;

export async function ProjectDecisions() {
  const t = await getTranslations();
  const decisions = ["interface", "data", "motion"] as const;

  return (
    <section className="landing-section" aria-labelledby="decisions-title">
      <div className="site-container landing-section-inner">
        <div className="decisions-heading">
          <div>
            <p className="landing-eyebrow text-highlight">
              {t("landing.decisions.eyebrow")}
            </p>
            <h2 id="decisions-title" className="landing-section-title">
              {t("landing.decisions.title")}
            </h2>
          </div>
          <Link href="/project" className="landing-text-link">
            {t("landing.decisions.link")}
            <Icon name="arrow" />
          </Link>
        </div>
        <ol className="decisions-list">
          {decisions.map((decision, index) => (
            <li key={decision} className="decision-row">
              <span className="decision-index">
                {["I", "II", "III"][index]}
              </span>
              <div>
                <h3 className="text-[28px] leading-tight">
                  {t(`landing.decisions.${decision}.title`)}
                </h3>
                <p className="mt-2 leading-relaxed text-muted-foreground">
                  {t(`landing.decisions.${decision}.description`)}
                </p>
              </div>
              <div className="decision-illustration" aria-hidden="true">
                {decision === "interface" ? (
                  <div className="device-studies">
                    {[390, 768, 1440].map((width, i) => (
                      <div key={width}>
                        <span className={`device-study device-study-${i}`}>
                          <span />
                          <span />
                        </span>
                        <span>{width}</span>
                      </div>
                    ))}
                  </div>
                ) : decision === "data" ? (
                  <div className="flow-study">
                    {states.map((state) => (
                      <span key={state}>
                        {t(`landing.decisions.states.${state}`)}
                      </span>
                    ))}
                  </div>
                ) : (
                  <div className="motion-study">
                    {[1, 2, 3].map((reel, i) => (
                      <div key={reel}>
                        <span>
                          {t("landing.decisions.reel", { number: reel })}
                        </span>
                        <span className="motion-track">
                          <span style={{ width: `${40 + i * 20}%` }} />
                        </span>
                        <span>
                          {t("landing.decisions.delay", { delay: i * 260 })}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}
