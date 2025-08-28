document.addEventListener('DOMContentLoaded', () => {
    // --- Global State ---
    let todos = [];
    let taskTemplates = [];
    let currentFilter = 'all';
    let currentSort = 'creation';

    // --- DOM Element References ---
    const todoList = document.getElementById('todo-list');
    const todoInput = document.getElementById('todo-input');
    const todoDueDateInput = document.getElementById('todo-due-date');
    const addTodoForm = document.getElementById('add-todo-form');
    const itemsLeftSpan = document.getElementById('items-left');
    const clearCompletedBtn = document.getElementById('clear-completed');
    const emptyState = document.getElementById('empty-state');
    const filterButtons = document.querySelectorAll('.filter-btn');
    const sortTasksSelect = document.getElementById('sort-tasks');

    const tasksPage = document.getElementById('tasks-page');
    const templatesPage = document.getElementById('templates-page');
    const navTasks = document.getElementById('nav-tasks');
    const navTemplates = document.getElementById('nav-templates');

    const templatesList = document.getElementById('templates-list');
    const templateInput = document.getElementById('template-input');
    const addTemplateForm = document.getElementById('add-template-form');
    const templatesEmptyState = document.getElementById('templates-empty-state');


    // --- Local Storage Functions ---
    const saveTodos = () => localStorage.setItem('todos', JSON.stringify(todos));
    const loadTodos = () => {
        const stored = localStorage.getItem('todos');
        if (stored) todos = JSON.parse(stored);
    };
    const saveTemplates = () => localStorage.setItem('taskTemplates', JSON.stringify(taskTemplates));
    const loadTemplates = () => {
        const stored = localStorage.getItem('taskTemplates');
        if (stored) taskTemplates = JSON.parse(stored);
    };

    // --- Page Navigation ---
    const switchPage = (page) => {
        if (page === 'tasks') {
            tasksPage.style.display = 'block';
            templatesPage.style.display = 'none';
            navTasks.classList.add('nav-active');
            navTemplates.classList.remove('nav-active');
        } else {
            tasksPage.style.display = 'none';
            templatesPage.style.display = 'block';
            navTasks.classList.remove('nav-active');
            navTemplates.classList.add('nav-active');
            renderTemplates();
        }
    };
    navTasks.addEventListener('click', () => switchPage('tasks'));
    navTemplates.addEventListener('click', () => switchPage('templates'));

    // --- Main Render Functions ---
    const renderTodos = () => {
        todoList.innerHTML = '';

        // 1. Sort
        let processedTodos = [...todos];
        if (currentSort === 'dueDate') {
            processedTodos.sort((a, b) => {
                if (!a.dueDate) return 1; // tasks without due date go to the end
                if (!b.dueDate) return -1;
                return new Date(a.dueDate) - new Date(b.dueDate);
            });
        } else { // 'creation'
            processedTodos.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        }

        // 2. Filter
        const filteredTodos = processedTodos.filter(todo => {
            if (currentFilter === 'active') return !todo.completed;
            if (currentFilter === 'completed') return todo.completed;
            return true;
        });

        emptyState.style.display = todos.length === 0 ? 'block' : 'none';
        filteredTodos.forEach(todo => todoList.appendChild(createTodoElement(todo)));
        
        const itemsLeft = todos.filter(todo => !todo.completed).length;
        itemsLeftSpan.textContent = `${itemsLeft} item${itemsLeft !== 1 ? 's' : ''} left`;
    };

    const renderTemplates = () => {
        templatesList.innerHTML = '';
        templatesEmptyState.style.display = taskTemplates.length === 0 ? 'block' : 'none';
        taskTemplates.forEach(template => templatesList.appendChild(createTemplateElement(template)));
    };
    
    // --- Element Creation Functions ---
    const createTodoElement = (todo) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `p-4 mb-2 rounded-lg shadow-sm transition-all duration-200 ${todo.completed ? 'bg-gray-200 dark:bg-gray-700' : 'bg-white dark:bg-gray-800'}`;
        itemDiv.dataset.id = todo.id;
        itemDiv.draggable = true;

        // Drag and Drop listeners...
        itemDiv.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', todo.id);
            setTimeout(() => itemDiv.classList.add('dragging'), 0);
        });
        itemDiv.addEventListener('dragend', () => itemDiv.classList.remove('dragging'));
        itemDiv.addEventListener('dragover', (e) => e.preventDefault());
        itemDiv.addEventListener('dragenter', (e) => {
            e.preventDefault();
            if (itemDiv.dataset.id !== document.querySelector('.dragging')?.dataset.id) {
                 itemDiv.classList.add('drag-over');
            }
        });
        itemDiv.addEventListener('dragleave', () => itemDiv.classList.remove('drag-over'));
        itemDiv.addEventListener('drop', (e) => {
            e.preventDefault();
            itemDiv.classList.remove('drag-over');
            const draggedId = e.dataTransfer.getData('text/plain');
            if (draggedId === todo.id) return;
            const draggedIndex = todos.findIndex(t => t.id === draggedId);
            const droppedOnIndex = todos.findIndex(t => t.id === todo.id);
            const [draggedItem] = todos.splice(draggedIndex, 1);
            todos.splice(droppedOnIndex, 0, draggedItem);
            saveAndRender();
        });

        const mainContent = document.createElement('div');
        mainContent.className = 'flex items-center justify-between';

        const contentDiv = document.createElement('div');
        contentDiv.className = 'flex items-center w-full';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = todo.completed;
        checkbox.className = 'h-6 w-6 rounded-full text-blue-500 focus:ring-blue-400 border-gray-300 dark:border-gray-600 dark:bg-gray-700';
        checkbox.addEventListener('change', () => handleToggle(todo.id));
        const textSpan = document.createElement('span');
        textSpan.textContent = todo.text;
        textSpan.className = `ml-4 text-lg cursor-pointer ${todo.completed ? 'line-through text-gray-500 dark:text-gray-400' : 'text-gray-800 dark:text-gray-200'}`;
        textSpan.addEventListener('dblclick', () => enableEditing(itemDiv, todo, 'todo'));
        contentDiv.append(checkbox, textSpan);

        const actionsDiv = document.createElement('div');
        actionsDiv.className = 'flex items-center space-x-2';
        const editButton = document.createElement('button');
        editButton.className = 'text-gray-400 hover:text-blue-500 transition-colors duration-200';
        editButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M17.414 2.586a2 2 0 00-2.828 0L7 10.172V13h2.828l7.586-7.586a2 2 0 000-2.828z" /><path fill-rule="evenodd" d="M2 6a2 2 0 012-2h4a1 1 0 010 2H4v10h10v-4a1 1 0 112 0v4a2 2 0 01-2 2H4a2 2 0 01-2-2V6z" clip-rule="evenodd" /></svg>`;
        editButton.addEventListener('click', () => enableEditing(itemDiv, todo, 'todo'));
        const deleteButton = document.createElement('button');
        deleteButton.className = 'text-gray-400 hover:text-red-500 transition-colors duration-200';
        deleteButton.innerHTML = `<svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm4 0a1 1 0 012 0v6a1 1 0 11-2 0V8z" clip-rule="evenodd" /></svg>`;
        deleteButton.addEventListener('click', () => handleDelete(todo.id));
        actionsDiv.append(editButton, deleteButton);

        mainContent.append(contentDiv, actionsDiv);
        itemDiv.appendChild(mainContent);

        if (todo.dueDate) {
            const dueDateP = document.createElement('p');
            dueDateP.className = 'text-xs text-gray-500 dark:text-gray-400 mt-2 ml-10';
            dueDateP.textContent = `Due: ${new Date(todo.dueDate).toLocaleString()}`;
            itemDiv.appendChild(dueDateP);
        }

        return itemDiv;
    };

    const createTemplateElement = (template) => {
        const card = document.createElement('div');
        card.className = 'bg-white dark:bg-gray-800 p-4 rounded-lg shadow-lg';
        const header = document.createElement('div');
        header.className = 'flex justify-between items-center mb-4';
        const title = document.createElement('h3');
        title.className = 'text-xl font-bold text-gray-800 dark:text-gray-200';
        title.textContent = template.name;
        const headerActions = document.createElement('div');
        headerActions.className = 'flex gap-2';
        const loadButton = document.createElement('button');
        loadButton.textContent = 'Load to Tasks';
        loadButton.className = 'px-3 py-1 bg-green-500 text-white text-sm rounded-md hover:bg-green-600';
        loadButton.onclick = () => handleLoadTemplate(template.id);
        const deleteTemplateBtn = document.createElement('button');
        deleteTemplateBtn.textContent = 'Delete';
        deleteTemplateBtn.className = 'px-3 py-1 bg-red-500 text-white text-sm rounded-md hover:bg-red-600';
        deleteTemplateBtn.onclick = () => handleDeleteTemplate(template.id);
        headerActions.append(loadButton, deleteTemplateBtn);
        header.append(title, headerActions);

        const taskList = document.createElement('div');
        taskList.className = 'space-y-2 mb-4';
        template.tasks.forEach(task => taskList.appendChild(createTemplateTaskElement(task, template.id)));

        const addTaskForm = document.createElement('form');
        addTaskForm.className = 'flex gap-2';
        const taskInput = document.createElement('input');
        taskInput.type = 'text';
        taskInput.placeholder = 'Add a task to this template';
        taskInput.className = 'w-full px-3 py-2 text-sm rounded-md bg-gray-100 dark:bg-gray-700 border border-gray-300 dark:border-gray-600';
        const addTaskBtn = document.createElement('button');
        addTaskBtn.type = 'submit';
        addTaskBtn.textContent = 'Add Task';
        addTaskBtn.className = 'px-4 py-2 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600';
        addTaskForm.append(taskInput, addTaskBtn);
        addTaskForm.onsubmit = (e) => {
            e.preventDefault();
            const text = taskInput.value.trim();
            if (text) {
                handleAddTaskToTemplate(template.id, text);
                taskInput.value = '';
            }
        };
        
        card.append(header, taskList, addTaskForm);
        return card;
    };

    const createTemplateTaskElement = (task, templateId) => {
        const itemDiv = document.createElement('div');
        itemDiv.className = `flex items-center justify-between p-2 rounded bg-gray-100 dark:bg-gray-700`;
        itemDiv.dataset.id = task.id;
        itemDiv.draggable = true;

        itemDiv.addEventListener('dragstart', (e) => {
            e.stopPropagation(); // Prevent card from dragging
            e.dataTransfer.setData('text/plain', JSON.stringify({taskId: task.id, templateId: templateId}));
            setTimeout(() => itemDiv.classList.add('dragging'), 0);
        });
        itemDiv.addEventListener('dragend', () => itemDiv.classList.remove('dragging'));
        itemDiv.addEventListener('dragover', (e) => e.preventDefault());
        itemDiv.addEventListener('dragenter', (e) => {
            e.preventDefault();
             itemDiv.classList.add('drag-over');
        });
        itemDiv.addEventListener('dragleave', () => itemDiv.classList.remove('drag-over'));
        itemDiv.addEventListener('drop', (e) => {
            e.stopPropagation();
            itemDiv.classList.remove('drag-over');
            const data = JSON.parse(e.dataTransfer.getData('text/plain'));
            if (data.templateId !== templateId) return; // Can't drag between templates
            
            const template = taskTemplates.find(t => t.id === templateId);
            if (!template) return;

            const draggedIndex = template.tasks.findIndex(t => t.id === data.taskId);
            const droppedOnIndex = template.tasks.findIndex(t => t.id === task.id);
            
            const [draggedItem] = template.tasks.splice(draggedIndex, 1);
            template.tasks.splice(droppedOnIndex, 0, draggedItem);

            saveTemplates();
            renderTemplates();
        });

        const contentDiv = document.createElement('div');
        contentDiv.className = 'flex items-center w-full';
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = task.completed;
        checkbox.className = 'h-5 w-5 rounded text-blue-500 focus:ring-blue-400 border-gray-300 dark:border-gray-600 dark:bg-gray-700';
        checkbox.addEventListener('change', () => handleToggleTaskInTemplate(templateId, task.id));
        const textSpan = document.createElement('span');
        textSpan.textContent = task.text;
        textSpan.className = `ml-3 text-md ${task.completed ? 'line-through text-gray-500' : 'text-gray-800 dark:text-gray-200'}`;
        textSpan.addEventListener('dblclick', () => enableEditing(itemDiv, task, 'template', templateId));
        contentDiv.append(checkbox, textSpan);

        const deleteButton = document.createElement('button');
        deleteButton.className = 'text-gray-400 hover:text-red-500';
        deleteButton.innerHTML = `&times;`; // '✖' symbol
        deleteButton.addEventListener('click', () => handleDeleteTaskFromTemplate(templateId, task.id));

        itemDiv.append(contentDiv, deleteButton);
        return itemDiv;
    };

    // --- Editing Logic ---
    const enableEditing = (itemDiv, item, type, templateId = null) => {
        const originalContent = itemDiv.innerHTML;
        itemDiv.innerHTML = ''; // Clear the element
        itemDiv.draggable = false;

        const inputContainer = document.createElement('div');
        inputContainer.className = 'w-full space-y-2';

        const textInput = document.createElement('input');
        textInput.type = 'text';
        textInput.value = item.text;
        textInput.className = 'w-full p-1 border-b-2 border-blue-500 focus:outline-none bg-transparent';

        const dateInput = document.createElement('input');
        dateInput.type = 'datetime-local';
        // The value for datetime-local needs to be in 'YYYY-MM-DDTHH:mm' format
        if (item.dueDate) {
            const d = new Date(item.dueDate);
            // Adjust for timezone offset to display correctly in the input
            const timezoneOffset = d.getTimezoneOffset() * 60000;
            const localDate = new Date(d - timezoneOffset);
            dateInput.value = localDate.toISOString().slice(0, 16);
        }
        dateInput.className = 'w-full p-1 bg-transparent border-b-2 border-blue-500';

        const saveButton = document.createElement('button');
        saveButton.textContent = 'Save';
        saveButton.className = 'px-3 py-1 bg-blue-500 text-white text-sm rounded-md hover:bg-blue-600';
        
        const saveEdit = () => {
            const newText = textInput.value.trim();
            const newDate = dateInput.value;
            if (newText) {
                if (type === 'todo') {
                    handleEdit(item.id, newText, newDate);
                } else if (type === 'template') {
                   // Templates don't have dates, so we just save the text
                    handleEditTaskInTemplate(templateId, item.id, newText);
                }
            } else {
                // If text is empty, revert
                itemDiv.innerHTML = originalContent;
                itemDiv.draggable = true;
            }
        };

        saveButton.addEventListener('click', saveEdit);
        
        inputContainer.appendChild(textInput);
        // Only add date input for main tasks, not template tasks
        if (type === 'todo') {
            inputContainer.appendChild(dateInput);
        }
        inputContainer.appendChild(saveButton);
        itemDiv.appendChild(inputContainer);

        textInput.focus();
        textInput.addEventListener('keypress', (e) => e.key === 'Enter' && saveEdit());
    };

    // --- CRUD Handlers ---
    const handleAddTodo = (e) => {
        e.preventDefault();
        const text = todoInput.value.trim();
        const dueDate = todoDueDateInput.value;
        if (text === '') return;
        todos.push({ id: crypto.randomUUID(), text, completed: false, createdAt: new Date().toISOString(), dueDate: dueDate || null });
        todoInput.value = '';
        todoDueDateInput.value = '';
        saveAndRender();
    };
    const handleToggle = (id) => {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            todo.completed = !todo.completed;
            saveAndRender();
        }
    };
    const handleDelete = (id) => {
        todos = todos.filter(t => t.id !== id);
        saveAndRender();
    };
    const handleEdit = (id, newText, newDueDate) => {
        const todo = todos.find(t => t.id === id);
        if (todo) {
            todo.text = newText;
            todo.dueDate = newDueDate || null;
            saveAndRender();
        }
    };
    const handleClearCompleted = () => {
        todos = todos.filter(todo => !todo.completed);
        saveAndRender();
    };
    
    // --- Template Handlers ---
    const handleAddTemplate = (e) => {
        e.preventDefault();
        const name = templateInput.value.trim();
        if (name === '') return;
        taskTemplates.push({ id: crypto.randomUUID(), name, tasks: [] });
        templateInput.value = '';
        saveTemplates();
        renderTemplates();
    };
    const handleDeleteTemplate = (id) => {
        taskTemplates = taskTemplates.filter(t => t.id !== id);
        saveTemplates();
        renderTemplates();
    };
    const handleAddTaskToTemplate = (templateId, taskText) => {
        const template = taskTemplates.find(t => t.id === templateId);
        if (template) {
            template.tasks.push({ id: crypto.randomUUID(), text: taskText, completed: false });
            saveTemplates();
            renderTemplates();
        }
    };
    const handleDeleteTaskFromTemplate = (templateId, taskId) => {
        const template = taskTemplates.find(t => t.id === templateId);
        if (template) {
            template.tasks = template.tasks.filter(t => t.id !== taskId);
            saveTemplates();
            renderTemplates();
        }
    };
    const handleToggleTaskInTemplate = (templateId, taskId) => {
        const template = taskTemplates.find(t => t.id === templateId);
        const task = template?.tasks.find(t => t.id === taskId);
        if (task) {
            task.completed = !task.completed;
            saveTemplates();
            renderTemplates();
        }
    };
    const handleEditTaskInTemplate = (templateId, taskId, newText) => {
        const template = taskTemplates.find(t => t.id === templateId);
        const task = template?.tasks.find(t => t.id === taskId);
        if (task) {
            task.text = newText;
            saveTemplates();
            renderTemplates();
        }
    };
    const handleLoadTemplate = (templateId) => {
        const template = taskTemplates.find(t => t.id === templateId);
        if (template) {
            template.tasks.forEach(task => {
                todos.push({ id: crypto.randomUUID(), text: task.text, completed: false, createdAt: new Date().toISOString(), dueDate: null });
            });
            saveTodos();
            alert(`'${template.name}' loaded into tasks!`);
            switchPage('tasks');
            renderTodos();
        }
    };

    // --- Utility Functions ---
    const saveAndRender = () => {
        saveTodos();
        renderTodos();
    };

    // --- Event Listeners Setup ---
    addTodoForm.addEventListener('submit', handleAddTodo);
    addTemplateForm.addEventListener('submit', handleAddTemplate);
    clearCompletedBtn.addEventListener('click', handleClearCompleted);
    sortTasksSelect.addEventListener('change', (e) => {
        currentSort = e.target.value;
        renderTodos();
    });
    filterButtons.forEach(button => {
        button.addEventListener('click', () => {
            currentFilter = button.dataset.filter;
            filterButtons.forEach(btn => btn.classList.remove('text-blue-500'));
            document.querySelectorAll(`.filter-btn[data-filter="${currentFilter}"]`).forEach(btn => btn.classList.add('text-blue-500'));
            renderTodos();
        });
    });

    // --- Initial Load ---
    loadTodos();
    loadTemplates();
    renderTodos();
});