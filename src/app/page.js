'use client';

import ProjectCard from "@/components/ProjectCard";
import Mail from "@/components/Mail";
import { useEffect, useState } from "react";

export default () => {
  const [projects, setProjects] = useState([]);
  const [cv, setCv] = useState("");

  useEffect(() => {
    const fetchProjects = async () => {
      try {
        const response = await fetch('https://raw.githubusercontent.com/luuxis/portfolio-assets/refs/heads/master/projet-list.json?t=' + new Date().getTime());
        if (response.ok) {
          const data = await response.json();
          setProjects(data.projects || []);
          setCv(data.cv);
        }
      } catch (error) {
        console.error('Erreur:', error);
      }
    };

    fetchProjects();
  }, []);
  return (
    <>
      <section className="text-center mt-24">
        <h2 className="text-5xl font-bold">
          Hey, moi c'est <span className="text-teal-400">Luuxis</span>
        </h2>
        <p className="mt-4 text-xl text-gray-200">Développeur Web Full-Stack & Passionné de Tech</p>
        <p className="mt-2 text-sm text-gray-400">Étudiant à EPITECH - Dév, cybersécurité & optimisation système</p>
        <a className="inline-block mt-6 px-6 py-2 bg-teal-500 text-white font-medium rounded-md hover:bg-teal-600 transition-all duration-200 shadow-lg" href="#contact">
          Me Contacter
        </a>
      </section>

      <div className="mt-24 flex flex-col md:flex-row gap-8 px-6 text-center">
        <section id="about" className="mt-24 px-6 py-12 bg-gray-800 rounded-xl w-11/12 md:w-3/4 mx-auto shadow-md flex flex-col items-center justify-center">
          <h3 className="text-3xl font-semibold text-teal-400 mb-4">À propos de moi</h3>
          <p className="text-gray-300 leading-relaxed text-center">
            Je suis un développeur full-stack étudiant à EPITECH, passionné par le développement web, android, et la cybersécurité.
            J’ai commencé à coder par curiosité et j’ai rapidement découvert ma passion pour la création de solutions innovantes.
            Je crée des solutions optimisées et performantes en utilisant des technologies modernes et en adoptant une approche clean & scalable.
          </p>
        </section>

        <section id="progression" className="mt-24 px-6 py-12 bg-gray-800 rounded-xl w-11/12 md:w-3/4 mx-auto shadow-md flex flex-col items-center justify-center">
          <h3 className="text-3xl font-semibold text-teal-400 mb-4">Ma démarche & progression</h3>
          <p className="text-gray-300 leading-relaxed mb-4">
            Mon parcours de développeur a commencé par curiosité et s’est affirmé par la pratique. J’ai développé une forte capacité à apprendre de manière autonome,
            à explorer des technologies modernes et à produire des solutions concrètes.
          </p>
          <p className="text-gray-300 leading-relaxed">
            Chaque projet m’a permis de renforcer ma rigueur, mon esprit critique et ma capacité à collaborer avec d’autres développeurs.
            J’analyse chaque étape pour comprendre ce que j’ai acquis et ce qu’il me reste à apprendre.
          </p>
        </section>
      </div>

      <section id="projects" className="mt-24 px-6">
        <h3 className="text-3xl text-teal-400 font-semibold mb-10 text-center">Mes Projets</h3>
        <div className="flex flex-wrap justify-center gap-6">
          {projects.map((proj, index) => (
            <ProjectCard
              key={index}
              image={proj.image}
              title={proj.title}
              description={proj.description}
              tags={proj.tags}
              projectLink={proj.projectLink}
              rncp={proj.rncp}
              moreInfoLink={proj.moreInfoLink}
            />
          ))}
        </div>
      </section>

      <section id="skills" className="mt-24 text-center px-6">
        <h3 className="text-3xl text-teal-400 font-semibold">Compétences</h3>
        <div className="flex flex-wrap justify-center gap-6 mt-8">
          <div className="bg-gray-800 p-6 rounded-lg shadow w-full md:w-1/4">
            <p className="text-teal-300 font-medium">Web Development</p>
            <p className="text-gray-400 text-sm">React, Node.js, TailwindCSS</p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg shadow w-full md:w-1/4">
            <p className="text-teal-300 font-medium">DevOps</p>
            <p className="text-gray-400 text-sm">Docker, Caddy, SQLite</p>
          </div>
        </div>
      </section>

      <section id="timeline" className="mt-24 p-10 bg-gray-800 rounded-xl w-11/12 md:w-3/4 mx-auto shadow-md">
        <h3 className="text-3xl text-teal-400 font-semibold text-center">Mon Parcours</h3>
        <ul className="mt-6 text-gray-300 space-y-2">
          <li><strong>2021 :</strong> Débuts dans le développement web & scripts personnels</li>
          <li><strong>2022 :</strong> Premiers projets Node.js & Electron</li>
          <li><strong>2023 :</strong> Selvania Launcher & lancement de LuuxCraft</li>
          <li><strong>2024 :</strong> Collaboration open source & déploiement stable</li>
          <li><strong>2025 :</strong> Intégration CI/CD, Cloud, sécurité avancée</li>
        </ul>
      </section>

      <section id="competences-detaillees" className="mt-24 p-10 bg-gray-800 rounded-xl w-11/12 md:w-3/4 mx-auto shadow-md">
        <h3 className="text-3xl text-teal-400 font-semibold text-center">Compétences détaillées</h3>
        <div className="overflow-x-auto mt-6">
          <table className="min-w-full text-gray-300 border-separate border-spacing-y-3">
            <thead>
              <tr className="bg-gray-700">
                <th className="text-left px-4 py-2">Domaine</th>
                <th className="text-left px-4 py-2">Technologies</th>
              </tr>
            </thead>
            <tbody>
              <tr>
                <td className="px-4 py-2">Front-End</td>
                <td className="px-4 py-2">React, Next.js, vue.js, nuxt.js, TailwindCSS</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Back-End</td>
                <td className="px-4 py-2">Node.js, Express.js, Fastify, php, Symfony, Laravel</td>
              </tr>
              <tr>
                <td className="px-4 py-2">Base de données</td>
                <td className="px-4 py-2">MySQL, SQLite, MongoDB</td>
              </tr>
              <tr>
                <td className="px-4 py-2">DevOps</td>
                <td className="px-4 py-2">Docker, SQLite, Caddy</td>
              </tr>
            </tbody>

          </table>
        </div>
      </section>

      <section id="cv" className="mt-24 p-10 bg-gray-800 rounded-xl w-11/12 md:w-3/4 mx-auto text-center shadow-md">
        <h3 className="text-3xl text-teal-400 font-semibold">Télécharger mon CV</h3>
        <p className="text-gray-300 mt-4">Cliquez ci-dessous pour obtenir une version PDF de mon parcours professionnel.</p>
        <a href={cv} target="_blank" className="mt-6 inline-block px-6 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 transition-all duration-200 shadow">
          Voir mon CV
        </a>
      </section>

      <section id="contact" className="mt-24 p-10 bg-gray-800 rounded-xl w-11/12 md:w-3/4 mx-auto text-center shadow-md">
        <h3 className="text-3xl text-teal-400 font-semibold">Me Contacter</h3>
        <p className="text-gray-300 mt-4">Retrouvez-moi sur :</p>
        <ul className="text-gray-400 mt-2 space-y-1">
          <li><a href="https://github.com/luuxis" className="hover:underline" target="_blank">GitHub : @luuxis</a></li>
          <li><a href="https://www.linkedin.com/in/luuxis/" className="hover:underline" target="_blank">LinkedIn : @luuxis</a></li>
          <li><a href="https://discord.luuxis.fr" className="hover:underline" target="_blank">Discord : @luuxis</a></li>
          <li><a href="mailto:andre.gallo@epitech.eu" className="hover:underline" target="_blank">Mail : @luuxis</a></li>
        </ul>
      </section>

      <Mail />
    </>
  );
}