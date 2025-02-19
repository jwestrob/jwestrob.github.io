import React from 'react';
import { useParams, Link } from 'react-router-dom';
import { getPostsByProject } from '../../utils/postUtils';
import ReactMarkdown from 'react-markdown';

function Walkthroughs2021() {
  const { slug } = useParams();
  const posts = getPostsByProject('ESPM_112L_2021');

  // If we have a slug, show the individual post
  if (slug) {
    const post = posts.find(p => p.slug === slug);
    if (!post) {
      return <div>Post not found</div>;
    }

    // Get the content from the posts object
    const postContent = post.content;

    return (
      <div className="post-container">
        <Link to="/espm112l-2021">&larr; Back to all walkthroughs</Link>
        <h1>{post.title}</h1>
        <ReactMarkdown>{postContent}</ReactMarkdown>
      </div>
    );
  }

  // Otherwise, show the list of posts
  return (
    <div className="walkthroughs-container">
      <h1>ESPM 112L Walkthroughs 2021</h1>
      <div className="posts-list">
        {posts.map((post) => (
          <div key={post.slug} className="post-preview">
            <Link to={`/posts/${post.slug}`}>
              <h2>{post.title}</h2>
              {post.excerpt && <p>{post.excerpt}</p>}
              <span className="post-date">{post.date}</span>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
}

export default Walkthroughs2021;