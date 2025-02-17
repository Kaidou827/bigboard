const API_URL = 'https://bigboard-backend.onrender.com/api';
const socket = io('https://bigboard-backend.onrender.com');

// Get post ID from URL
const postId = new URLSearchParams(window.location.search).get('id');

// Load post and replies
async function loadPost() {
    try {
        const response = await fetch(`${API_URL}/posts/${postId}`);
        const post = await response.json();
        displayPost(post);
        displayReplies(post.replies);
    } catch (error) {
        console.error('Error loading post:', error);
    }
}

// Display post
function displayPost(post) {
    const postDetail = document.getElementById('post-detail');
    postDetail.innerHTML = `
        <div class="post">
            <div class="post-header">
                <span class="post-board">/${post.board}</span>
                <span class="post-meta">Posted by <a href="#">${post.author}</a> • ${moment(post.createdAt).fromNow()}</span>
            </div>
            <h2>${post.title}</h2>
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
}

// Display replies
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

// Handle reply submission
document.getElementById('replyForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    
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
        }
    } catch (error) {
        console.error('Error creating reply:', error);
    }
});

// Socket event for real-time updates
socket.on('postUpdated', (updatedPost) => {
    if (updatedPost._id === postId) {
        displayPost(updatedPost);
        displayReplies(updatedPost.replies);
    }
});

// Load post when page loads
loadPost(); 