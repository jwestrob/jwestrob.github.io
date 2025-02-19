import React from 'react';
import { getPostsByProject } from '../../utils/postUtils';
import styles from './ESPM112L2021.module.css';

const ESPM112L2023 = () => {
  console.log('ESPM112L2021 component rendering');
  const posts = getPostsByProject('ESPM_112L');
  console.log('Retrieved posts:', posts);

  return (
    <div className={styles.container}>
      <div className={styles.content}>
        <h2 className={styles.title}>ESPM 112L 2023 Walkthroughs</h2>
        
        <div className={styles.postsContainer}>
          {posts.map((post) => (
            <div key={post.slug} className={styles.postCard}>
              <h3 className={styles.postTitle}>{post.title}</h3>
              <p className={styles.postDate}>{new Date(post.date).toLocaleDateString()}</p>
              <p className={styles.postExcerpt}>{post.excerpt}</p>
              <a href={`/posts/${post.slug}`} className={styles.readMore}>
                Read More
              </a>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default ESPM112L2023;