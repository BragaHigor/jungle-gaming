import type { Metadata } from "next";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Icon } from "@/components/ui/icon";
import {
  projectRepository,
  projectSections,
  projectStack,
} from "@/content/project";
import { Architecture } from "@/features/project/components/architecture";
import { RoundFlow } from "@/features/project/components/round-flow";
import { getTranslations } from "@/i18n/server";
import "@/features/project/project.css";

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations();
  return {
    title: t("project.metadata.title"),
    description: t("project.metadata.description"),
  };
}

export default async function ProjectPage() {
  const t = await getTranslations();
  const facts = ["reels", "credits", "history"] as const;
  const decisions = ["presentation", "routing", "recovery"] as const;
  const limits = ["events", "scale", "hosting"] as const;
  return (
    <main
      id="main-content"
      tabIndex={-1}
      className="site-container project-page"
    >
      <header className="project-heading">
        <p className="project-eyebrow">{t("project.eyebrow")}</p>
        <h1>{t("project.title")}</h1>
        <p className="project-intro">{t("project.intro")}</p>
        <div className="project-actions">
          <Button asChild>
            <Link href="/play">
              {t("project.demo")}
              <Icon name="arrow" />
            </Link>
          </Button>
          <a
            className="project-text-link"
            href={projectRepository}
            target="_blank"
            rel="noopener noreferrer"
          >
            <Icon name="github" />
            {t("project.code")}
          </a>
        </div>
      </header>
      <div className="project-layout">
        <aside className="project-index">
          <nav aria-label={t("project.index")}>
            <p className="project-eyebrow">{t("project.index")}</p>
            <ol>
              {projectSections.map((section, index) => (
                <li key={section}>
                  <a href={`#${section}`}>
                    <span aria-hidden="true">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    {t(`project.sections.${section}`)}
                  </a>
                </li>
              ))}
            </ol>
          </nav>
        </aside>
        <div className="project-content">
          <section id="purpose" aria-labelledby="purpose-title">
            <p className="project-eyebrow">
              {t("project.sectionLabel", {
                number: "01",
                label: t("project.sections.purpose"),
              })}
            </p>
            <h2 id="purpose-title">{t("project.purpose.title")}</h2>
            <p>{t("project.purpose.body")}</p>
            <dl className="project-facts">
              {facts.map((fact) => (
                <div key={fact}>
                  <dt>{t(`project.purpose.facts.${fact}.label`)}</dt>
                  <dd>{t(`project.purpose.facts.${fact}.value`)}</dd>
                </div>
              ))}
            </dl>
            <p className="project-note">{t("project.purpose.scope")}</p>
          </section>
          <section id="stack" aria-labelledby="stack-title">
            <p className="project-eyebrow">
              {t("project.sectionLabel", {
                number: "02",
                label: t("project.sections.stack"),
              })}
            </p>
            <h2 id="stack-title">{t("project.stack.title")}</h2>
            <table className="project-stack">
              <caption className="sr-only">
                {t("project.stack.caption")}
              </caption>
              <thead>
                <tr>
                  <th scope="col">{t("project.stack.technology")}</th>
                  <th scope="col">{t("project.stack.role")}</th>
                </tr>
              </thead>
              <tbody>
                {projectStack.map((technology) => (
                  <tr key={technology.id}>
                    <th scope="row">{technology.name}</th>
                    <td>{t(`project.stack.roles.${technology.id}`)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
          <section id="flow" aria-labelledby="flow-title">
            <p className="project-eyebrow">
              {t("project.sectionLabel", {
                number: "03",
                label: t("project.sections.flow"),
              })}
            </p>
            <h2 id="flow-title">{t("project.flow.title")}</h2>
            <RoundFlow />
          </section>
          <section id="architecture" aria-labelledby="architecture-title">
            <p className="project-eyebrow">
              {t("project.sectionLabel", {
                number: "04",
                label: t("project.sections.architecture"),
              })}
            </p>
            <h2 id="architecture-title">{t("project.architecture.title")}</h2>
            <p>{t("project.architecture.body")}</p>
            <Architecture />
          </section>
          <section id="decisions" aria-labelledby="decisions-title">
            <p className="project-eyebrow">
              {t("project.sectionLabel", {
                number: "05",
                label: t("project.sections.decisions"),
              })}
            </p>
            <h2 id="decisions-title">{t("project.decisions.title")}</h2>
            <ol className="project-decisions">
              {decisions.map((decision) => (
                <li key={decision}>
                  <h3>{t(`project.decisions.items.${decision}.title`)}</h3>
                  <p>{t(`project.decisions.items.${decision}.body`)}</p>
                </li>
              ))}
            </ol>
          </section>
          <section id="quality" aria-labelledby="quality-title">
            <p className="project-eyebrow">
              {t("project.sectionLabel", {
                number: "06",
                label: t("project.sections.quality"),
              })}
            </p>
            <h2 id="quality-title">{t("project.quality.title")}</h2>
            <p>{t("project.quality.body")}</p>
            <div className="project-commands">
              <code>{t("project.quality.commands.check")}</code>
              <p>{t("project.quality.check")}</p>
              <code>{t("project.quality.commands.integration")}</code>
              <p>{t("project.quality.integration")}</p>
            </div>
            <p className="project-note">{t("project.quality.delivery")}</p>
          </section>
          <section id="limits" aria-labelledby="limits-title">
            <p className="project-eyebrow">
              {t("project.sectionLabel", {
                number: "07",
                label: t("project.sections.limits"),
              })}
            </p>
            <h2 id="limits-title">{t("project.limits.title")}</h2>
            <ul className="project-limits">
              {limits.map((limit) => (
                <li key={limit}>{t(`project.limits.items.${limit}`)}</li>
              ))}
            </ul>
          </section>
          <section id="repository" aria-labelledby="repository-title">
            <p className="project-eyebrow">
              {t("project.sectionLabel", {
                number: "08",
                label: t("project.sections.repository"),
              })}
            </p>
            <h2 id="repository-title">{t("project.repository.title")}</h2>
            <p>{t("project.repository.body")}</p>
            <div className="project-actions">
              <Button asChild variant="outline">
                <a
                  href={projectRepository}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  <Icon name="github" />
                  {t("project.code")}
                </a>
              </Button>
              <Link href="/" className="project-text-link">
                {t("project.back")}
                <Icon name="arrow" />
              </Link>
            </div>
            <p className="project-note">{t("project.repository.credit")}</p>
          </section>
        </div>
      </div>
    </main>
  );
}
