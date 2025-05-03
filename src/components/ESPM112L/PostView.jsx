import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactMarkdown from 'react-markdown';
import styles from './ESPM112L.module.css';
import PhyloBackground from '../Background/PhyloBackground';
import { getPostsByProject } from '../../utils/postUtils';

const PostView = () => {
  const [postContent, setPostContent] = useState('');
  const [postTitle, setPostTitle] = useState('');
  const { slug } = useParams();

  useEffect(() => {
    // Get all posts from both projects
    const posts2021 = getPostsByProject('ESPM_112L_2021');
    const posts2023 = getPostsByProject('ESPM_112L');
    const allPosts = [...posts2021, ...posts2023];
    
    // Find the matching post by slug
    const post = allPosts.find(post => post.slug === slug);
    
    if (post) {
      setPostContent(post.content);
      setPostTitle(post.title);
    } else {
      console.error(`Post with slug '${slug}' not found`);
      setPostContent('# Post Not Found\n\nSorry, the requested post could not be found.');
    }
  }, [slug]);

  return (
    <div className={styles.container}>
      <PhyloBackground />
      <div className={styles.content}>
        {postTitle && <h1>{postTitle}</h1>}
        <ReactMarkdown>{postContent}</ReactMarkdown>
      </div>
    </div>
  );
};

export default PostView;
