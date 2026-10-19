import { Icon } from "@/components/ui/icon";
import { projectArchitecture, sourceHref } from "@/content/project";
import { getTranslations } from "@/i18n/server";

export async function Architecture() {
  const t = await getTranslations();
  return (
    <div className="project-architecture">
      {projectArchitecture.map((pattern) => (
        <details key={pattern.id}>
          <summary>
            <span>
              {t(`project.architecture.patterns.${pattern.id}.title`)}
            </span>
            <Icon name="chevronDown" />
          </summary>
          <div className="project-detail-body">
            <p>{t(`project.architecture.patterns.${pattern.id}.body`)}</p>
            <p className="project-file-label">
              {t("project.architecture.source")}
            </p>
            <ul className="project-files">
              {pattern.files.map((file) => (
                <li key={file}>
                  <a
                    href={sourceHref(file)}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    <code>{file}</code>
                    <Icon name="arrow" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </details>
      ))}
    </div>
  );
}
