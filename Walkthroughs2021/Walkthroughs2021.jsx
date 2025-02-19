import React, { useEffect, useState } from 'react';
import styles from './Walkthroughs2021.module.css';
import { getPostsByProject } from '../../../utils/postUtils';

const Walkthroughs2021 = () => {
  const [posts, setPosts] = useState([]);

  useEffect(() => {
    const walkthroughPosts = getPostsByProject('ESPM_112L_2021');
    setPosts(walkthroughPosts);
  }, []);
  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>ESPM 112L 2021 Walkthroughs</h2>
        
        <p className={styles.description}>
          Below you'll find all the walkthroughs from the 2021 session of ESPM 112L.
          These materials cover various topics in bioinformatics and metagenomics analysis.
        </p>

        <div className={styles.walkthroughList}>
          {posts.map((post) => (
            <div key={post.slug} className={styles.walkthroughItem}>
              <h3 className={styles.walkthroughTitle}>{post.title}</h3>
              <p className={styles.walkthroughDate}>
                {new Date(post.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </p>
              <p className={styles.walkthroughExcerpt}>{post.excerpt}</p>
              <a href={`/posts/${post.slug}`} className={styles.readMoreLink}>
                Read More
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Walkthroughs2021;