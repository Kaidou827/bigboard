const API_URL = 'https://bigboard-backend.onrender.com/api';
const socket = io('https://bigboard-backend.onrender.com');

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
        console.log('Fetching posts...');
        const response = await fetch(`${API_URL}/posts`);
        const posts = await response.json();
        console.log('Received posts:', posts);
        displayPosts(posts);
    } catch (error) {
        console.error('Error loading posts:', error);
    }
}

// Display posts
function displayPosts(posts) {
    const postsContainer = document.getElementById('posts');
    postsContainer.innerHTML = '';
    // Sort posts by date, newest first
    const sortedPosts = posts.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    console.log('Posts with IDs:', sortedPosts.map(p => ({ id: p._id, title: p.title })));
    sortedPosts.forEach(post => addPostToDOM(post));
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
    
    // Add click handler with logging
    postDiv.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        console.log('Clicked post with ID:', post._id); // Debug log
        showPostView(post._id);
    };
    
    // Make sure post actions don't trigger the post view
    const actionsHtml = `
        <div class="post-actions" onclick="event.stopPropagation()">
            <button class="action-btn vote-btn" onclick="event.stopPropagation(); handleVote('${post._id}')">
                <i class="fas fa-arrow-up"></i> ${post.votes || 0}
            </button>
            <button class="action-btn">
                <i class="fas fa-comment"></i> ${post.replies?.length || 0}
            </button>
            <button class="action-btn">
                <i class="fas fa-bookmark"></i>
            </button>
            <button class="action-btn">
                <i class="fas fa-share"></i>
            </button>
        </div>
    `;
    
    postDiv.innerHTML = `
        <div class="post-header">
            <span class="post-board">/${post.board}</span>
            <span class="post-meta">Posted by <a href="#" onclick="event.stopPropagation()">${post.author}</a> • ${moment(post.createdAt).fromNow()}</span>
        </div>
        <h3>${post.title}</h3>
        <p>${post.content}</p>
        ${actionsHtml}
    `;
    
    return postDiv;
}

// Handle form submission
document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    console.log('Form submitted');
    
    const formData = {
        title: document.getElementById('title').value,
        content: document.getElementById('content').value,
        author: document.getElementById('author').value || 'Anonymous',
        board: 'general' // Add default board
    };

    console.log('Sending data:', formData);

    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        console.log('Response:', response);

        if (response.ok) {
            const data = await response.json();
            console.log('Post created:', data);
            document.getElementById('postForm').reset();
            // Reload posts after creating a new one
            loadPosts();
        } else {
            console.error('Error response:', await response.text());
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

// Add these functions to handle post viewing
function showPostView(postId) {
    console.log('Showing post view for ID:', postId);
    document.getElementById('main-feed').style.display = 'none';
    document.getElementById('post-view').style.display = 'block';
    loadPostDetails(postId);
    // Update URL without page reload
    window.history.pushState({ postId }, '', `?post=${postId}`);
}

function showMainFeed() {
    document.getElementById('post-view').style.display = 'none';
    document.getElementById('main-feed').style.display = 'block';
    window.history.pushState({}, '', '/');
}

// Add function to load post details
async function loadPostDetails(postId) {
    try {
        console.log('Loading post details for ID:', postId);
        if (!postId) {
            throw new Error('No post ID provided');
        }

        const response = await fetch(`${API_URL}/posts/${postId}`);
        console.log('Response:', response);
        
        if (response.status === 404) {
            throw new Error('Post not found');
        }
        
        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }
        
        const post = await response.json();
        console.log('Loaded post:', post);
        
        if (!post || !post._id) {
            throw new Error('Invalid post data received');
        }

        displayPostDetail(post);
        displayReplies(post.replies || []);
    } catch (error) {
        console.error('Error loading post:', error);
        document.getElementById('post-detail').innerHTML = `
            <div class="post">
                <h3>Error loading post</h3>
                <p>${error.message}</p>
                <button onclick="showMainFeed()" class="back-button">
                    <i class="fas fa-arrow-left"></i> Back to Feed
                </button>
            </div>
        `;
    }
}

// Add functions to display post detail and replies
function displayPostDetail(post) {
    console.log('Displaying post detail:', post); // Debug log
    const postDetail = document.getElementById('post-detail');
    
    // Create a non-clickable version of the post
    const postHtml = `
        <div class="post">
            <div class="post-header">
                <span class="post-board">/${post.board}</span>
                <span class="post-meta">Posted by <a href="#">${post.author}</a> • ${moment(post.createdAt).fromNow()}</span>
            </div>
            <h3>${post.title}</h3>
            <p>${post.content}</p>
            <div class="post-actions">
                <button class="action-btn vote-btn" onclick="handleVote('${post._id}')">
                    <i class="fas fa-arrow-up"></i> ${post.votes || 0}
                </button>
                <button class="action-btn">
                    <i class="fas fa-comment"></i> ${post.replies?.length || 0}
                </button>
                <button class="action-btn">
                    <i class="fas fa-bookmark"></i>
                </button>
                <button class="action-btn">
                    <i class="fas fa-share"></i>
                </button>
            </div>
        </div>
    `;
    
    postDetail.innerHTML = postHtml;
}

function displayReplies(replies) {
    const repliesContainer = document.getElementById('replies');
    repliesContainer.innerHTML = replies.map(reply => `
        <div class="reply">
            <div class="reply-header">
                <span class="reply-author">${reply.author}</span>
                <span class="reply-meta">${moment(reply.createdAt).fromNow()}</span>
            </div>
            <p>${reply.content}</p>
        </div>
    `).join('');
}

// Handle back/forward browser navigation
window.onpopstate = function(event) {
    if (event.state && event.state.postId) {
        showPostView(event.state.postId);
    } else {
        showMainFeed();
    }
};

// Check URL on page load for direct post links
window.onload = function() {
    const urlParams = new URLSearchParams(window.location.search);
    const postId = urlParams.get('post');
    if (postId) {
        showPostView(postId);
    }
}; 