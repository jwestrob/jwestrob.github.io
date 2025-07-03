import React from 'react';
import { Link } from 'react-router-dom';
import styles from './ESPM112L.module.css';

const ESPM112L = () => {
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>ESPM 112L Teaching Materials</h2>
        
        <p className={styles.description}>
          Welcome to the ESPM 112L teaching materials section. Here you'll find comprehensive 
          walkthroughs created for Environmental Science, Policy, and Management 112L classes 
          from both 2021 and 2023 sessions.
        </p>

        <div className={styles.linksContainer}>
          <Link to="/espm112l-2021" className={styles.yearLink}>
            <div className={styles.yearCard}>
              <h3>2021 Walkthroughs</h3>
              <p>Access teaching materials and walkthroughs from the 2021 session</p>
            </div>
          </Link>

          <Link to="/espm112l-2023" className={styles.yearLink}>
            <div className={styles.yearCard}>
              <h3>2023 Walkthroughs</h3>
              <p>Access teaching materials and walkthroughs from the 2023 session</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ESPM112L;
