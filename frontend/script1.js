const API_BASE_URL = 'https://66uq0p8wy7.execute-api.us-east-1.amazonaws.com/prod';

/* -------------------- LAMBDA FUNCTIONS -------------------- */
async function fetchTodosLambda() {
    try {
        const res = await fetch(`${API_BASE_URL}/todos`);
        if (!res.ok) throw new Error('Lambda endpoint failed');
        const todos = await res.json();
        renderTodos(todos, 'lambda');
    } catch (error) {
        console.log('Lambda fetch failed, trying EC2 endpoint...');
        try {
            const res = await fetch(`${API_BASE_URL}/todos-a`);
            const todos = await res.json();
            renderTodos(todos, 'ec2');
            showResponse('Loaded from EC2 (Lambda unavailable)', 'success');
        } catch (fallbackError) {
            showResponse('Error fetching todos from both endpoints', 'error');
        }
    }
}

async function addTodoViaLambda() {
    const task = document.getElementById('todoInput').value.trim();
    if (!task) {
        showResponse('Please enter a task', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/add-todo`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task })
        });
        
        if (response.ok) {
            document.getElementById('todoInput').value = '';
            showResponse('Todo added successfully via Lambda! ✅', 'success');
            fetchTodosLambda();
        } else {
            showResponse('Error adding todo via Lambda', 'error');
        }
    } catch (error) {
        showResponse('Error adding via Lambda', 'error');
    }
}

async function deleteTodoLambda(id) {
    if (!confirm('Are you sure you want to delete this Lambda todo?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/delete-todo/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('Lambda delete failed');
        
        showResponse('Lambda Todo deleted successfully! 🗑️', 'success');
        fetchTodosLambda();
    } catch (error) {
        console.log('Lambda delete failed, trying EC2 endpoint...');
        try {
            const response = await fetch(`${API_BASE_URL}/delete-todo-a/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showResponse('Todo deleted via EC2 (Lambda unavailable)! 🗑️', 'success');
                fetchTodosLambda();
            } else {
                showResponse('Error deleting todo from both endpoints', 'error');
            }
        } catch (fallbackError) {
            showResponse('Error deleting todo from both endpoints', 'error');
        }
    }
}

/* -------------------- EC2 FUNCTIONS -------------------- */
async function fetchTodosEC2() {
    try {
        const res = await fetch(`${API_BASE_URL}/todos-a`);
        if (!res.ok) throw new Error('EC2 endpoint failed');
        const todos = await res.json();
        renderTodos(todos, 'ec2');
    } catch (error) {
        console.log('EC2 fetch failed, trying Lambda endpoint...');
        try {
            const res = await fetch(`${API_BASE_URL}/todos`);
            const todos = await res.json();
            renderTodos(todos, 'lambda');
            showResponse('Loaded from Lambda (EC2 unavailable)', 'success');
        } catch (fallbackError) {
            showResponse('Error fetching todos from both endpoints', 'error');
        }
    }
}

async function addTodoViaEC2() {
    const task = document.getElementById('todoInput').value.trim();
    if (!task) {
        showResponse('Please enter a task', 'error');
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/add-todo-a`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ task })
        });
        
        if (response.ok) {
            document.getElementById('todoInput').value = '';
            showResponse('Todo added successfully via EC2! ✅', 'success');
            fetchTodosEC2();
        } else {
            showResponse('Error adding todo via EC2', 'error');
        }
    } catch (error) {
        showResponse('Error adding via EC2', 'error');
    }
}

async function deleteTodoEC2(id) {
    if (!confirm('Are you sure you want to delete this EC2 todo?')) {
        return;
    }
    
    try {
        const response = await fetch(`${API_BASE_URL}/delete-todo-a/${id}`, {
            method: 'DELETE'
        });
        
        if (!response.ok) throw new Error('EC2 delete failed');
        
        showResponse('EC2 Todo deleted successfully! 🗑️', 'success');
        fetchTodosEC2();
    } catch (error) {
        console.log('EC2 delete failed, trying Lambda endpoint...');
        try {
            const response = await fetch(`${API_BASE_URL}/delete-todo/${id}`, {
                method: 'DELETE'
            });
            
            if (response.ok) {
                showResponse('Todo deleted via Lambda (EC2 unavailable)! 🗑️', 'success');
                fetchTodosEC2();
            } else {
                showResponse('Error deleting todo from both endpoints', 'error');
            }
        } catch (fallbackError) {
            showResponse('Error deleting todo from both endpoints', 'error');
        }
    }
}

/* -------------------- COMMON UI FUNCTIONS -------------------- */
function renderTodos(todos, source) {
    const list = document.getElementById('todoList');
    list.innerHTML = '';
    
    if (todos.length === 0) {
        list.innerHTML = '<li>No todos yet. Add one to get started! 🚀</li>';
        return;
    }
    
    todos.forEach(todo => {
        const li = document.createElement('li');
        li.className = 'todo-item';
        
        const taskSpan = document.createElement('span');
        taskSpan.className = 'task-text';
        taskSpan.textContent = todo.task;
        
        const deleteBtn = document.createElement('button');
        deleteBtn.className = 'btn-delete';
        deleteBtn.innerHTML = '🗑️ Mark as complete';
        deleteBtn.onclick = () => {
            if (source === 'lambda') deleteTodoLambda(todo.id);
            else deleteTodoEC2(todo.id);
        };
        
        li.appendChild(taskSpan);
        li.appendChild(deleteBtn);
        list.appendChild(li);
    });
}

function showResponse(message, type) {
    const responseDiv = document.getElementById('response');
    responseDiv.textContent = message;
    responseDiv.className = `response-message ${type}`;
    
    setTimeout(() => {
        responseDiv.textContent = '';
        responseDiv.className = 'response-message';
    }, 3000);
}

/* -------------------- INITIAL LOAD -------------------- */
// Default to Lambda todos on page load
window.onload = fetchTodosLambda;