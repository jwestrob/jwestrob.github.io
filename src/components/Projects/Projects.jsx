import React from 'react';
import styles from './Projects.module.css';
import ThreeDragonBackground from '../Background/ThreeDragonBackground'; // Updated import

const Projects = () => {
  const projects = [
    {
      title: 'Astra- High Performance HMM Annotation Suite',
      description: 'A Python-based tool for analyzing protein sequences with HMMs and organizing multiple databases.',
      technologies: ['Python', 'Pandas', 'PyHMMer'],
      link: 'https://github.com/jwestrob/astra'
    },
    {
      title: 'Genomic Analysis AI Agent',
      description: 'Agentic RAG system that automates genome annotation and provides intelligent, expert-level analysis of provided genomes and proteins. (Under construction but definitely works!)',
      technologies: ['Python', 'DSPy', 'Neo4j', 'SQLite', 'LiteLLM'],
      link: 'https://github.com/jwestrob/microbial_claude_matter'
    },
    {
      title: 'GAIA - Genome Context-Aware Protein Annotation',
      description: 'Web-based system for protein language model embedding-based search and annotation of protein sequences. Co-first authored publication published at Science Advances.',
      technologies: ['Python', 'BLAST', 'HuggingFace', 'Qdrant/HNSW', 'ESMFold'],
      link: 'https://www.science.org/doi/10.1126/sciadv.adv5109'
    }
  ];

  return (
    <>
      <ThreeDragonBackground /> {/* Updated component */}
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
    </>
  );
};

export default Projects;
