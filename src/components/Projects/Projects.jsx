import React from 'react';
import styles from './Projects.module.css';

const Projects = () => {
  const projects = [
    {
      title: 'Environmental Data Analysis Tool',
      description: 'A Python-based tool for analyzing environmental datasets, featuring statistical analysis and visualization capabilities.',
      technologies: ['Python', 'Pandas', 'Matplotlib', 'Scikit-learn'],
      link: '#'
    },
    {
      title: 'Biodiversity Mapping Platform',
      description: 'Interactive web platform for visualizing and analyzing biodiversity data across different ecosystems.',
      technologies: ['React', 'D3.js', 'Node.js', 'MongoDB'],
      link: '#'
    },
    {
      title: 'Climate Change Impact Model',
      description: 'Predictive modeling system for assessing climate change impacts on local ecosystems.',
      technologies: ['R', 'TensorFlow', 'GIS', 'AWS'],
      link: '#'
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