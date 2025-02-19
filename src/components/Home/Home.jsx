import React from 'react';
import styles from './Home.module.css';
import headshot from '../../assets/headshot.jpg';

const Home = () => {
  return (
    <section id="home" className={styles.home}>
      <div className={styles.container}>
        <div className={styles.content}>
          <div className={styles.imageFrame}>
            <img src={headshot} alt="Jacob West-Roberts" className={styles.profileImage} />
            <div className={styles.placeholder} />
          </div>
          <h1 className={styles.title}>Hi, I'm Jacob West-Roberts</h1>
          <h2 className={styles.subtitle}>Computational Biologist & Environmental Scientist</h2>
          <p className={styles.description}>
            I work to understand biological sequences, describe new and rare organisms, and develop tools to further biological research.
          </p>
          <div className={styles.cta}>
            <a href="about" className={styles.primaryButton}>About Me</a>
            <a href="contact" className={styles.secondaryButton}>Contact</a>
          </div>
          <div className={styles.socialLinks}>
            <a href="https://github.com/jwestrob" className={styles.socialLink} aria-label="GitHub">
              <i className="fab fa-github"></i>
            </a>
            <a href="https://x.com/Jwestrob" className={styles.socialLink} aria-label="Twitter">
              <i className="fab fa-twitter"></i>
            </a>
            <a href="https://scholar.google.com/citations?hl=en&user=AqcNAskAAAAJ" className={styles.socialLink} aria-label="Google Scholar">
              <i className="fas fa-graduation-cap"></i>
            </a>
            <a href="https://www.linkedin.com/in/jwestrob/" className={styles.socialLink} aria-label="LinkedIn">
              <i className="fab fa-linkedin"></i>
            </a>
          </div>
          <div className={styles.scrollIndicator}>
            <svg
              className={styles.chevron}
              width="40"
              height="40"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="6 9 12 15 18 9" />
            </svg>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Home;