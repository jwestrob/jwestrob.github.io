// Enhanced frontmatter parser for browser environment
const parseFrontmatter = (content) => {
  const frontmatterRegex = /^---[\r\n]([\s\S]*?)[\r\n]---/;
  const match = content.match(frontmatterRegex);
  
  if (!match) return { data: {} };
  
  const frontmatter = match[1];
  const data = {};
  
  let currentKey = null;
  let inArray = false;
  
  frontmatter.split(/\r?\n/).forEach(line => {
    if (!line) return;

    const trimmedLine = line.trim();
    if (!trimmedLine) return;
    
    // Handle array items
    if (trimmedLine.startsWith('-')) {
      if (currentKey && !inArray) {
        data[currentKey] = [];
        inArray = true;
      }
      if (inArray) {
        const value = trimmedLine.slice(1).trim();
        if (value) {
          // Remove quotes if they exist
          const cleanValue = value.replace(/^['"](.*)['"]$/, '$1');
          data[currentKey].push(cleanValue);
        }
      }
      return;
    }
    
    // Handle key-value pairs
    const colonIndex = trimmedLine.indexOf(':');
    if (colonIndex !== -1) {
      currentKey = trimmedLine.slice(0, colonIndex).trim();
      let value = trimmedLine.slice(colonIndex + 1).trim();
      
      // Reset array flag when we hit a new key
      inArray = false;
      
      // Remove surrounding quotes if they exist
      if (value) {
        value = value.replace(/^['"](.*)['"]$/, '$1');
        data[currentKey] = value;
      }
    }
  });
  
  return { data };
};

// Use Vite's import.meta.glob to load all markdown files at build time
const posts = import.meta.glob('../../_posts/*.md', { as: 'raw', eager: true });

export const getPostsByProject = (projectName) => {
 // console.log('Starting getPostsByProject with projectName:', projectName);
  //console.log('Available posts:', Object.keys(posts));
  
  const allPosts = Object.entries(posts).map(([path, content]) => {
    //console.log('\nProcessing file:', path);
    //console.log('Raw content:', content.substring(0, 200) + '...');
    
    const { data } = parseFrontmatter(content);
    //console.log('Parsed frontmatter:', data);
    
    const fileName = path.split('/').pop();
    //console.log('Generated fileName:', fileName);
    
    const post = {
      slug: fileName.replace(/\.md$/, ''),
      title: data.title,
      date: data.date,
      excerpt: data.excerpt,
      project: data.project,
      path: path
    };
    
    //console.log('Created post object:', post);
    return post;
  });
  
  // Filter posts by project name
  const filteredPosts = allPosts.filter(post => post.project === projectName);
  //console.log('Filtered posts:', filteredPosts);
  
  // Sort posts by week number and add content to each post
  return filteredPosts.map(post => {
    // Add the content to the post object
    return {
      ...post,
      content: posts[post.path].replace(/^---[\r\n][\s\S]*?[\r\n]---[\r\n]?/, '')
    };
  }).sort((a, b) => {
    const getWeekNumber = (title) => {
      const match = title.match(/Week (\d+)/i);
      return match ? parseInt(match[1]) : 0;
    };
    
    const weekA = getWeekNumber(a.title);
    const weekB = getWeekNumber(b.title);
    return weekA - weekB;
  });
};