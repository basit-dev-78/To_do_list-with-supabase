// -------------------- SUPABASE SETUP --------------------
const { createClient } = supabase;
const supabaseClient = createClient(
  'https://oketrniyfqovdkmqfrhv.supabase.co',
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im9rZXRybml5ZnFvdmRrbXFmcmh2Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NzA5ODgyNDUsImV4cCI6MjA4NjU2NDI0NX0.A-bh9kTixS3Si5suSSGZXVoZZ_9_tNss0ahvzuCX0sE'
);

// -------------------- DOM ELEMENTS --------------------
const taskInput = document.getElementById("taskInput");
const addBtn = document.getElementById("addBtn");
const taskList = document.getElementById("taskList");
const filterBtns = document.querySelectorAll(".filter-btn");

let tasks = JSON.parse(localStorage.getItem("tasks")) || [];
let currentFilter = "all";

// -------------------- LOCAL STORAGE --------------------
function saveTasks() {
    localStorage.setItem("tasks", JSON.stringify(tasks));
}

// -------------------- RENDER TASKS --------------------
function renderTasks() {
    taskList.innerHTML = "";

    const filteredTasks = tasks.filter(task => {
        if (currentFilter === "active") return !task.completed;
        if (currentFilter === "completed") return task.completed;
        return true;
    });

    filteredTasks.forEach((task, index) => {
        const li = document.createElement("li");
        li.classList.add("task-item");
        if (task.completed) li.classList.add("completed");

        const span = document.createElement("span");
        span.textContent = task.text;

        const actions = document.createElement("div");
        actions.classList.add("task-actions");

        const completeBtn = document.createElement("button");
        completeBtn.textContent = "✓";
        completeBtn.classList.add("complete-btn");
        completeBtn.onclick = () => toggleComplete(index);

        const deleteBtn = document.createElement("button");
        deleteBtn.textContent = "✕";
        deleteBtn.classList.add("delete-btn");
        deleteBtn.onclick = () => deleteTask(index);

        actions.appendChild(completeBtn);
        actions.appendChild(deleteBtn);

        li.appendChild(span);
        li.appendChild(actions);

        taskList.appendChild(li);
    });
}

// -------------------- ADD TASK --------------------
async function addTask() {
    const text = taskInput.value.trim();
    if (!text) return alert("Please enter a task.");

    // Add to Supabase
    const { data, error } = await supabaseClient
        .from('todos')
        .insert([{ data: text, completed: false }])
        .select(); // get inserted row including id

    if (error) {
        console.error("Error adding task to Supabase:", error);
        return;
    }

    // Add to local tasks array
    const newTask = {
        id: data[0].id, // Supabase id
        text: text,
        completed: false
    };

    tasks.push(newTask);
    saveTasks();
    renderTasks();
    taskInput.value = "";
}

// -------------------- TOGGLE COMPLETE --------------------
async function toggleComplete(index) {
    const task = tasks[index];
    task.completed = !task.completed;

    // Update in Supabase
    const { error } = await supabaseClient
        .from('todos')
        .update({ completed: task.completed })
        .eq('id', task.id);

    if (error) console.error("Error updating task:", error);

    saveTasks();
    renderTasks();
}

async function deleteTask(index) {
    const task = tasks[index];

    // Delete from Supabase
    const { error } = await supabaseClient
        .from('todos')
        .delete()
        .eq('id', task.id);

    if (error) {
        console.error("Error deleting task from Supabase:", error);
        return;
    }

    tasks.splice(index, 1);
    saveTasks();
    renderTasks();
}

filterBtns.forEach(btn => {
    btn.addEventListener("click", () => {
        document.querySelector(".filter-btn.active").classList.remove("active");
        btn.classList.add("active");
        currentFilter = btn.dataset.filter;
        renderTasks();
    });
});

addBtn.addEventListener("click", addTask);
taskInput.addEventListener("keypress", e => {
    if (e.key === "Enter") addTask();
});

renderTasks();
