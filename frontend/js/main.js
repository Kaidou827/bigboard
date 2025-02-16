const API_URL = window.location.hostname === 'localhost' 
    ? 'http://localhost:5002/api'
    : 'https://bigboard-backend.onrender.com/api';

const SOCKET_URL = window.location.hostname === 'localhost'
    ? 'http://localhost:5002'
    : 'https://bigboard-backend.onrender.com';

const socket = io(SOCKET_URL);
const VOTED_POSTS_KEY = 'votedPosts';

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
    // Update post counter
    document.getElementById('post-counter').textContent = sortedPosts.length;
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
    
    // Add click handler
    postDiv.onclick = (e) => {
        e.preventDefault();
        e.stopPropagation();
        showPostView(post._id);
    };
    
    // Add image HTML if post has an image
    const imageHtml = post.image ? `
        <div class="post-image">
            <img src="${post.image}" alt="Post image">
        </div>
    ` : '';
    
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
        ${imageHtml}
        ${actionsHtml}
    `;
    
    return postDiv;
}

// Add image preview handling
document.getElementById('image').addEventListener('change', function(e) {
    const file = e.target.files[0];
    if (file) {
        const reader = new FileReader();
        reader.onload = function(e) {
            const preview = document.getElementById('image-preview');
            preview.innerHTML = `
                <div class="preview-container">
                    <img src="${e.target.result}" alt="Preview">
                    <button type="button" class="remove-image">×</button>
                </div>
            `;
        };
        reader.readAsDataURL(file);
    }
});

// Update form submission
document.getElementById('postForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const formData = new FormData();
    formData.append('title', document.getElementById('title').value);
    formData.append('content', document.getElementById('content').value);
    formData.append('author', document.getElementById('author').value || 'Anonymous');
    formData.append('board', document.getElementById('board').value);
    
    const imageFile = document.getElementById('image').files[0];
    if (imageFile) {
        formData.append('image', imageFile);
    }

    try {
        const response = await fetch(`${API_URL}/posts`, {
            method: 'POST',
            body: formData
        });

        if (response.ok) {
            const data = await response.json();
            document.getElementById('postForm').reset();
            document.getElementById('image-preview').innerHTML = '';
            loadPosts();
        }
    } catch (error) {
        console.error('Error creating post:', error);
    }
});

// Handle vote
async function handleVote(postId) {
    try {
        // Check if user has already voted
        const votedPosts = JSON.parse(localStorage.getItem(VOTED_POSTS_KEY) || '[]');
        if (votedPosts.includes(postId)) {
            console.log('Already voted on this post');
            return;
        }

        const response = await fetch(`${API_URL}/posts/${postId}/vote`, {
            method: 'PATCH',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        if (response.ok) {
            // Save voted post to localStorage
            votedPosts.push(postId);
            localStorage.setItem(VOTED_POSTS_KEY, JSON.stringify(votedPosts));
            
            // Update UI to show voted state
            const voteBtn = document.querySelector(`[data-post-id="${postId}"] .vote-btn`);
            if (voteBtn) {
                voteBtn.classList.add('voted');
                voteBtn.disabled = true;
            }
        }
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
    const postDetail = document.getElementById('post-detail');
    
    const imageHtml = post.image ? `
        <div class="post-image">
            <img src="${post.image}" alt="Post image">
        </div>
    ` : '';
    
    const postHtml = `
        <div class="post">
            <div class="post-header">
                <span class="post-board">/${post.board}</span>
                <span class="post-meta">Posted by <a href="#">${post.author}</a> • ${moment(post.createdAt).fromNow()}</span>
            </div>
            <h3>${post.title}</h3>
            <p>${post.content}</p>
            ${imageHtml}
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
    if (!replies || replies.length === 0) {
        repliesContainer.innerHTML = `
            <div class="no-replies">
                <p>No replies yet. Be the first to reply!</p>
            </div>
        `;
        return;
    }

    repliesContainer.innerHTML = replies
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .map(reply => `
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

// Handle reply form submission
document.getElementById('replyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
    const postId = new URLSearchParams(window.location.search).get('post');
    const formData = {
        content: document.getElementById('replyContent').value,
        author: document.getElementById('replyAuthor').value || 'Anonymous'
    };

    try {
        const response = await fetch(`${API_URL}/posts/${postId}/reply`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(formData)
        });

        if (response.ok) {
            const updatedPost = await response.json();
            document.getElementById('replyForm').reset();
            displayReplies(updatedPost.replies);
        } else {
            console.error('Error response:', await response.text());
        }
    } catch (error) {
        console.error('Error creating reply:', error);
    }
});

// Modal functions
function showLoginModal() {
    document.getElementById('login-modal').classList.add('active');
}

function showRegisterModal() {
    document.getElementById('register-modal').classList.add('active');
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target.classList.contains('modal')) {
        event.target.classList.remove('active');
    }
}

// Handle login form submission
document.getElementById('login-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('login-username').value;
    const password = document.getElementById('login-password').value;

    console.log('Attempting login with:', { username });

    try {
        const response = await fetch(`${API_URL}/users/login`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        console.log('Login response:', response);
        if (response.ok) {
            const user = await response.json();
            console.log('Login successful:', user);
            localStorage.setItem('user', JSON.stringify(user));
            updateAuthUI(user);
            document.getElementById('login-modal').classList.remove('active');
            document.getElementById('login-form').reset();
        } else {
            const error = await response.json();
            console.log('Login failed:', error);
            alert(error.message);
        }
    } catch (error) {
        console.error('Login error:', error);
        alert('Error logging in');
    }
});

// Handle register form submission
document.getElementById('register-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const username = document.getElementById('register-username').value;
    const password = document.getElementById('register-password').value;

    try {
        const response = await fetch(`${API_URL}/users/register`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ username, password })
        });

        if (response.ok) {
            const user = await response.json();
            localStorage.setItem('user', JSON.stringify(user));
            updateAuthUI(user);
            document.getElementById('register-modal').classList.remove('active');
            document.getElementById('register-form').reset();
        } else {
            const error = await response.json();
            alert(error.message);
        }
    } catch (error) {
        console.error('Register error:', error);
        alert('Error registering');
    }
});

// Update UI based on auth state
function updateAuthUI(user) {
    const loginRegister = document.getElementById('login-register');
    const userInfo = document.getElementById('user-info');
    const username = document.getElementById('username');

    if (user) {
        loginRegister.style.display = 'none';
        userInfo.style.display = 'block';
        username.textContent = user.username;
    } else {
        loginRegister.style.display = 'block';
        userInfo.style.display = 'none';
        username.textContent = '';
    }
}

// Logout function
function logout() {
    localStorage.removeItem('user');
    updateAuthUI(null);
}

// Check auth state on page load
const user = JSON.parse(localStorage.getItem('user'));
if (user) {
    updateAuthUI(user);
}

// Load boards into selector
async function loadBoardSelector() {
    try {
        console.log('Loading boards for selector...');
        const response = await fetch(`${API_URL}/boards`);
        console.log('Boards response:', response);
        const boards = await response.json();
        console.log('Loaded boards:', boards);
        const selector = document.getElementById('board');
        
        if (!selector) {
            console.error('Board selector element not found!');
            return;
        }
        
        // Clear existing options except the first one
        while (selector.options.length > 1) {
            selector.remove(1);
        }
        
        boards.forEach(board => {
            const option = document.createElement('option');
            option.value = board.name;
            option.textContent = `/${board.name}`;
            console.log('Adding board option:', board.name);
            selector.appendChild(option);
        });
        
        console.log('Final selector options:', selector.options.length);
    } catch (error) {
        console.error('Error loading boards:', error);
    }
}

// When page loads
document.addEventListener('DOMContentLoaded', () => {
    loadPosts();
    loadBoardSelector();
}); 