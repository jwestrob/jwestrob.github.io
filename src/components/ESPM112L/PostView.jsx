import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import styles from './ESPM112L.module.css';
import PhyloBackground from '../Background/PhyloBackground';

const PostView = () => {
  const [postContent, setPostContent] = useState('');
  const { slug } = useParams();

  useEffect(() => {
    const fetchPost = async () => {
      try {
        const response = await fetch(`/_posts/${slug}.md`);
        if (!response.ok) throw new Error('Post not found');
        const content = await response.text();
        
        // Remove YAML front matter
        const processedContent = content.replace(/^---[\s\S]*?---\n*/m, '');
        setPostContent(processedContent);
      } catch (error) {
        console.error('Error loading post:', error);
        setPostContent('Error loading post content');
      }
    };

    fetchPost();
  }, [slug]);

  return (
    <div className={styles.container}>
      <PhyloBackground />
      <div className={styles.content}>
        <ReactMarkdown>{postContent}</ReactMarkdown>
      </div>
    </div>
  );
};

export default PostView;