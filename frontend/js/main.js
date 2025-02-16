const API_URL = 'http://localhost:5001/api';
const socket = io('http://localhost:5001');

// Socket event listeners
socket.on('newPost', (post) => {
    addPostToDOM(post);
});

socket.on('updatePost', (updatedPost) => {
    updatePostInDOM(updatedPost);
});

// Load posts
async function loadPosts() {
    try {
        const response = await fetch(`${API_URL}/posts`);
        const posts = await response.json();
        displayPosts(posts);
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// Display posts
function displayPosts(posts) {
    const postsContainer = document.getElementById('posts');
    postsContainer.innerHTML = '';
    posts.forEach(post => addPostToDOM(post));
}

// Add a single post to DOM
function addPostToDOM(post) {
    const postsContainer = document.getElementById('posts');
    const postElement = createPostElement(post);
    postsContainer.insertBefore(postElement, postsContainer.firstChild);
}

// Update existing post in DOM
function updatePostInDOM(updatedPost) {
    const existingPost = document.querySelector(`[data-post-id="${updatedPost._id}"]`);
    if (existingPost) {
        const newPost = createPostElement(updatedPost);
        existingPost.replaceWith(newPost);
    }
}

// Create post element
function createPostElement(post) {
    const postDiv = document.createElement('div');
    postDiv.className = 'post';
    postDiv.dataset.postId = post._id;

    const timeAgo = moment(post.createdAt).fromNow();

    postDiv.innerHTML = `
        <div class="post-header">
            <span class="post-board">/${post.board}</span>
            <span class="post-meta">Posted by <a href="#">${post.author}</a> • ${timeAgo}</span>
        </div>
        <h3>${post.title}</h3>
        <p>${post.content}</p>
        <div class="post-actions">
            <button class="action-btn vote-btn" onclick="handleVote('${post._id}')">
                <i class="fas fa-arrow-up"></i> ${post.votes || 0}
            </button>
            <button class="action-btn">
                <i class="fas fa-comment"></i> ${post.comments || 0}
            </button>
            <button class="action-btn">
                <i class="fas fa-bookmark"></i>
            </button>
            <button class="action-btn">
                <i class="fas fa-share"></i>
            </button>
        </div>
    `;

    return postDiv;
}

// Handle form submission
document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = {
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        author: document.getElementById('author').value || 'Anonymous'
    };

    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            document.getElementById('postForm').reset();
        }
    } catch (error) {
        console.error('Error creating post:', error);
    }
});

// Handle vote
async function handleVote(postId) {
    try {
        await fetch(`${API_URL}/posts/${postId}/vote`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            }
        });
    } catch (error) {
        console.error('Error voting:', error);
    }
}

// Load posts when page loads
loadPosts(); 