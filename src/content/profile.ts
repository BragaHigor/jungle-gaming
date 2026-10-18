export const profile = {
  name: "Higor Braga",
  initials: "HB",
  github: "https://github.com/BragaHigor",
  linkedin: "https://www.linkedin.com/in/higorbraga-99010ba1/",
  city: "Franca",
  region: "SP",
  company: "LuizaLabs",
  team: "Jovem Nerd",
  school: "FATEC Franca",
  previousCompany: "Compass UOL",
  previousProduct: "Vivo",
  postgraduateSchool: "GRAN",
  technologies: [
    "React",
    "Next.js",
    "TypeScript",
    "Tailwind CSS",
    "Node.js",
    "Git",
    "GitHub Actions",
  ],
} as const;

export const selectedProjects = [
  {
    id: "threadflow",
    name: "ThreadFlow",
    href: "https://www.threadflow.com.br/",
    repository: "https://github.com/BragaHigor/site-threadflow",
    technologies: "Next.js · TypeScript · Tailwind CSS",
  },
  {
    id: "maestri",
    name: "Maestri Advocacia",
    href: "https://www.maestriadv.com.br/",
    repository: "https://github.com/BragaHigor/maestri-advocacia",
    technologies: "Next.js · TypeScript · Tailwind CSS",
  },
  {
    id: "border",
    name: "Encinas & Braga Border Collie",
    href: "https://border-collie-puppies.vercel.app/",
    repository: "https://github.com/BragaHigor/border-collie-puppies",
    technologies: "Next.js · TypeScript · Tailwind CSS",
  },
] as const;
