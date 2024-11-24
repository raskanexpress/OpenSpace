// main.js
const postsData = [];

// Function to load and parse markdown files
async function loadPosts() {
    try {
        const response = await fetch('posts/index.json');
        const posts = await response.json();
        
        for (const post of posts) {
            const postResponse = await fetch(`posts/${post.filename}`);
            const postContent = await postResponse.text();
            const { metadata, content } = parseMarkdown(postContent);
            postsData.push({ ...metadata, content, filename: post.filename });
        }
        
        updateUI();
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// Function to parse markdown frontmatter and content
function parseMarkdown(markdown) {
    const frontmatterRegex = /^---\n([\s\S]*?)\n---\n([\s\S]*)$/;
    const match = markdown.match(frontmatterRegex);
    
    if (!match) return { metadata: {}, content: markdown };
    
    const metadata = {};
    const frontMatter = match[1];
    const content = match[2];
    
    frontMatter.split('\n').forEach(line => {
        const [key, ...values] = line.split(':');
        if (key && values.length) {
            const value = values.join(':').trim();
            if (key === 'tags') {
                metadata[key] = value.replace('[', '').replace(']', '').split(',').map(tag => tag.trim());
            } else {
                metadata[key] = value;
            }
        }
    });
    
    return { metadata, content };
}

// Function to calculate reading time
function calculateReadingTime(content) {
    const wordsPerMinute = 200;
    const words = content.trim().split(/\s+/).length;
    return Math.ceil(words / wordsPerMinute);
}

// Function to generate table of contents
function generateTOC(content) {
    const headings = content.match(/#{2,3}\s.+/g) || [];
    return headings.map(heading => {
        const level = heading.match(/#/g).length;
        const text = heading.replace(/#/g, '').trim();
        return { level, text };
    });
}

// Function to update UI with posts and sidebar
function updateUI() {
    updatePostsList();
    updateCategories();
    updateTags();
}

// Function to update posts list
function updatePostsList(filteredPosts = postsData) {
    const postsListElement = document.getElementById('postsList');
    postsListElement.innerHTML = filteredPosts.map(post => `
        <div class="post-card">
            <h2><a href="post.html?post=${post.filename}" class="post-title">${post.title}</a></h2>
            <div class="post-meta">
                <span class="date">${new Date(post.date).toLocaleDateString()}</span>
                <span class="reading-time">${post.readingTime || calculateReadingTime(post.content)} min read</span>
            </div>
            <div class="tags">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
        </div>
    `).join('');
}

// Function to update categories
function updateCategories() {
    const categories = [...new Set(postsData.flatMap(post => post.category || []))];
    const categoriesListElement = document.getElementById('categoriesList');
    
    categoriesListElement.innerHTML = categories.map(category => `
        <li><a href="#" onclick="filterByCategory('${category}')">${category}</a></li>
    `).join('');
}

// Function to update tags
function updateTags() {
    const tags = [...new Set(postsData.flatMap(post => post.tags || []))];
    const tagCloudElement = document.getElementById('tagCloud');
    
    tagCloudElement.innerHTML = tags.map(tag => `
        <span class="tag" onclick="filterByTag('${tag}')">${tag}</span>
    `).join('');
}

// Function to filter posts by category
function filterByCategory(category) {
    const filteredPosts = postsData.filter(post => post.category === category);
    updatePostsList(filteredPosts);
}

// Function to filter posts by tag
function filterByTag(tag) {
    const filteredPosts = postsData.filter(post => post.tags.includes(tag));
    updatePostsList(filteredPosts);
}

// Function to search posts
function searchPosts() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    const filteredPosts = postsData.filter(post => 
        post.title.toLowerCase().includes(searchTerm) ||
        post.content.toLowerCase().includes(searchTerm) ||
        post.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
    updatePostsList(filteredPosts);
}

// Load posts when the page loads
document.addEventListener('DOMContentLoaded', loadPosts);