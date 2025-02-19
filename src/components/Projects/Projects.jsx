import React from 'react';
import styles from './Projects.module.css';

const Projects = () => {
  const projects = [
    {
      title: 'Astra',
      description: 'Scalable HMM-based annotation and sequence retrieval tool.',
      technologies: ['Python', 'Pandas', 'PyHMMER', 'Biopython'],
      link: 'https://github.com/jwestrob/astra'
    },
    {
      title: 'Jacobviz',
      description: 'Interactive web platform for visualizing contact sites and predicted contact residues in categorical jacobian matrices generated by ESM2-style pLM model predictions.',
      technologies: ['Javascript', 'D3.js', 'Node.js', 'CSS'],
      link: 'https://github.com/jwestrob/jacobviz'
    },
    {
      title: 'Diverse Genomic Embedding Benchmark (DGEB)',
      description: 'Protein language model performance benchmarks utilizing data from across the tree of life.',
      technologies: ['Python'],
      link: 'https://github.com/TattaBio/DGEB'
    }
  ];

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>Projects</h2>
        <p className={styles.description}>
          Here are some of my key projects in environmental science and data analysis.
          Each project represents a unique approach to understanding and addressing environmental challenges.
        </p>

        <div className={styles.projectsGrid}>
          {projects.map((project, index) => (
            <a href={project.link} className={styles.projectLink} key={index}>
              <div className={styles.projectCard}>
                <h3 className={styles.projectTitle}>{project.title}</h3>
                <p className={styles.projectDescription}>{project.description}</p>
                <div className={styles.technologies}>
                  {project.technologies.map((tech, techIndex) => (
                    <span key={techIndex} className={styles.techTag}>{tech}</span>
                  ))}
                </div>
              </div>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Projects;