import React from 'react';
import styles from './About.module.css';
import bbridge from '../../assets/img/bbridge.jpg';

const About = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <div className={styles.imageContainer}>
          <img src={bbridge} alt="Bridge" className={styles.image} />
        </div>
        <h2 className={styles.title}>About Me</h2>
        <div className={styles.textContent}>
          <p>
            Welcome! I'm a passionate researcher and educator with interests in environmental science
            and data analysis. 
          </p>
          <p>
            I have experience in both field research and computational methods, combining traditional
            ecological approaches with modern data science techniques.
          </p>
          <p>
          I currently work at Sift Biosciences as a computational biologist, helping to build next-gen cancer immunotherapies.
          </p>
          <p>
          All animations on this site were made by me (using LLMs, of course!)
          </p>
        </div>
      </div>
    </div>
  );
};

export default About;