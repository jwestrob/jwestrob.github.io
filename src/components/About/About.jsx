import React from 'react';
import styles from './About.module.css';

const About = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>About Me</h2>
        <div className={styles.textContent}>
          <p>
            Welcome! I'm a passionate researcher and educator with interests in environmental science
            and data analysis. My work focuses on understanding complex ecological systems and
            developing innovative approaches to environmental challenges.
          </p>
          <p>
            I have experience in both field research and computational methods, combining traditional
            ecological approaches with modern data science techniques. Through my work, I aim to bridge
            the gap between theoretical understanding and practical applications in environmental science.
          </p>
          <p>
            When I'm not working, you can find me exploring nature, contributing to open-source
            projects, or engaging with the scientific community through various outreach programs.
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;