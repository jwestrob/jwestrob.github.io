import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import PhyloBackground from '../Background/PhyloBackground';
import styles from './PostLayout.module.css';

const PostLayout = () => {
  const { postId } = useParams();
  const [content, setContent] = useState('');
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/src/_posts/${postId}.md`);
        if (!response.ok) {
          throw new Error('Post not found');
        }
        const text = await response.text();
        setContent(text);
      } catch (err) {
        setError(err.message);
      }
    };

    fetchPost();
  }, [postId]);

  return (
    <div className={styles.container}>
      <PhyloBackground />
      <div className={styles.content}>
        {error ? (
          <div className={styles.error}>{error}</div>
        ) : (
          <div className={styles.markdownContent}>
            <ReactMarkdown>{content}</ReactMarkdown>
          </div>
        )}
      </div>
    </div>
  );
};

export default PostLayout;