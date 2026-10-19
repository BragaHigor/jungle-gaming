import { roundFlow } from "@/content/project";
import { getTranslations } from "@/i18n/server";

export async function RoundFlow() {
  const t = await getTranslations();
  return (
    <figure className="project-flow">
      <ol>
        {roundFlow.map((step, index) => (
          <li key={step}>
            <span className="project-number" aria-hidden="true">
              {String(index + 1).padStart(2, "0")}
            </span>
            <h3>{t(`project.flow.steps.${step}.title`)}</h3>
            <p>{t(`project.flow.steps.${step}.body`)}</p>
          </li>
        ))}
      </ol>
      <figcaption>{t("project.flow.caption")}</figcaption>
    </figure>
  );
}
