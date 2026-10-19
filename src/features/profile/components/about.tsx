import { Button } from "@/components/ui/button";
import Image from "next/image";
import { Icon } from "@/components/ui/icon";
import { profile, selectedProjects } from "@/content/profile";
import { getTranslations } from "@/i18n/server";

export async function About() {
  const t = await getTranslations();
  const facts = ["work", "education", "learning"] as const;

  return (
    <section
      id="sobre"
      className="landing-section"
      aria-labelledby="about-title"
    >
      <div className="site-container landing-section-inner about-grid">
        <div>
          <p className="landing-eyebrow text-highlight">
            {t("landing.about.eyebrow")}
          </p>
          <h2 id="about-title" className="landing-section-title">
            {t("landing.about.title")}
          </h2>
        </div>
        <div className="min-w-0 space-y-7">
          <p className="about-description">{t("landing.about.description")}</p>
          <ol className="profile-facts">
            {facts.map((fact, index) => (
              <li key={fact}>
                <span className="fact-index">
                  {String(index + 1).padStart(2, "0")}
                </span>
                <div>
                  <h3 className="font-semibold">
                    {t(`landing.about.facts.${fact}.title`)}
                  </h3>
                  <p className="mt-1 text-[15px] leading-relaxed text-muted-foreground">
                    {t(`landing.about.facts.${fact}.description`, {
                      company: profile.company,
                      team: profile.team,
                      school: profile.school,
                      previousCompany: profile.previousCompany,
                      previousProduct: profile.previousProduct,
                      postgraduateSchool: profile.postgraduateSchool,
                    })}
                  </p>
                </div>
              </li>
            ))}
          </ol>
          <div className="space-y-3">
            <h3 className="landing-eyebrow text-muted-foreground">
              {t("landing.about.skills")}
            </h3>
            <ul className="profile-skills">
              {profile.technologies.map((skill) => (
                <li key={skill.name}>
                  {"logo" in skill ? (
                    <span className="skill-logo" aria-hidden="true">
                      <Image
                        src={`/icons/${skill.logo}.svg`}
                        alt=""
                        width={20}
                        height={20}
                      />
                    </span>
                  ) : (
                    <Icon name={skill.icon} className="skill-symbol" />
                  )}
                  <span>
                    {t(`landing.about.skillLabels.${skill.name}`, {
                      defaultValue: skill.name,
                    })}
                  </span>
                </li>
              ))}
            </ul>
          </div>
          <div className="space-y-3">
            <h3 className="landing-eyebrow text-muted-foreground">
              {t("landing.about.projects")}
            </h3>
            <ul className="profile-projects">
              {selectedProjects.map((project) => (
                <li key={project.id}>
                  <a
                    className="project-title-link"
                    href={project.href}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <h4 className="font-semibold">
                      {project.name}
                      <span className="sr-only">
                        {t("landing.about.visitProject")}
                      </span>
                    </h4>
                    <Icon name="arrow" className="shrink-0 text-highlight" />
                  </a>
                  <p className="text-sm leading-relaxed text-muted-foreground">
                    {t(`landing.about.projectDescriptions.${project.id}`)}
                  </p>
                  <div className="project-meta">
                    <p className="text-xs text-muted-foreground">
                      {project.technologies}
                    </p>
                    <a
                      href={project.repository}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="project-code-link"
                      aria-label={`${t("landing.about.sourceCode")} — ${project.name}`}
                    >
                      <Icon name="github" className="size-4" />
                      {t("landing.about.sourceCode")}
                    </a>
                  </div>
                </li>
              ))}
            </ul>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <a
                href={profile.github}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="github" />
                {t("social.github")}
              </a>
            </Button>
            <Button asChild variant="outline">
              <a
                href={profile.linkedin}
                target="_blank"
                rel="noopener noreferrer"
              >
                <Icon name="linkedin" />
                {t("social.linkedin")}
              </a>
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
