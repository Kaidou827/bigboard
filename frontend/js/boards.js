const API_URL = 'https://bigboard-backend.onrender.com/api';

async function loadBoards() {
    try {
        const response = await fetch(`${API_URL}/boards`);
        const boards = await response.json();
        displayBoards(boards);
        updateStats(boards);
    } catch (error) {
        console.error('Error loading boards:', error);
    }
}

function displayBoards(boards) {
    const boardsContainer = document.getElementById('boards-container');
    boardsContainer.innerHTML = '';

    boards.forEach(board => {
        boardsContainer.innerHTML += `
            <a href="/board/${board.name}" class="board-card">
                <i class="${board.icon}"></i>
                <div class="board-info">
                    <h3>/${board.name}</h3>
                    <p>${board.description}</p>
                    <span class="post-count">${board.postCount} posts</span>
                </div>
            </a>
        `;
    });
}

function updateStats(boards) {
    const totalBoards = boards.length;
    const totalPosts = boards.reduce((sum, board) => sum + board.postCount, 0);
    
    document.querySelector('.stat-value:nth-child(1)').textContent = totalBoards;
    document.querySelector('.stat-value:nth-child(2)').textContent = totalPosts;
}

// Load boards when page loads
document.addEventListener('DOMContentLoaded', loadBoards); 