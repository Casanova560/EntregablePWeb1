const DATA_URL = 'tasks.json'
let tasks = []
let editMode = false
let editId = null

const taskForm = document.getElementById('taskForm')
const pendingList = document.getElementById('pendingList')
const completedList = document.getElementById('completedList')

function renderTasks() {
  pendingList.innerHTML = ''
  completedList.innerHTML = ''
  tasks.forEach(task => {
    const li = document.createElement('li')
    li.draggable = true
    li.dataset.id = task.id
    li.className = task.is_done ? 'done' : ''
    li.innerHTML = `
      <span>
        <strong>${task.title}</strong><br>
        <small>${task.due_date}${task.due_time ? ' ' + task.due_time : ''}</small>
      </span>
      <div class="task-actions">
        <button class="edit">✎</button>
        <button class="delete">🗑️</button>
      </div>
    `
    li.addEventListener('dragstart', onDragStart)
    li.addEventListener('dragend', onDragEnd)
    li.querySelector('.edit').addEventListener('click', () => startEdit(task))
    li.querySelector('.delete').addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id)
      if (editMode && editId === task.id) {
        editMode = false
        editId = null
        taskForm.reset()
        taskForm.querySelector('button[type="submit"]').textContent = 'Agregar tarea'
      }
      renderTasks()
    })
    if (task.is_done) completedList.appendChild(li)
    else pendingList.appendChild(li)
  })
}

function onDragStart(e) {
  e.dataTransfer.setData('text/plain', e.target.dataset.id)
}
function onDragEnd() {
  document.querySelectorAll('.task-list').forEach(ul => ul.classList.remove('drag-over'))
}
function allowDrop(e) {
  e.preventDefault()
  e.currentTarget.classList.add('drag-over')
}
function onDrop(e) {
  e.preventDefault()
  const id = +e.dataTransfer.getData('text/plain')
  const status = e.currentTarget.parentElement.dataset.status === 'true'
  tasks = tasks.map(t => t.id === id ? { ...t, is_done: status } : t)
  renderTasks()
}

function startEdit(task) {
  editMode = true
  editId = task.id
  taskForm.title.value = task.title
  taskForm.description.value = task.description
  taskForm.due_date.value = task.due_date
  taskForm.due_time.value = task.due_time || ''
  taskForm.querySelector('button[type="submit"]').textContent = 'Actualizar'
}

async function loadTasks() {
  const res = await fetch(DATA_URL)
  tasks = await res.json()
  renderTasks()
}

taskForm.addEventListener('submit', e => {
  e.preventDefault()
  const f = new FormData(taskForm)
  const title = f.get('title').trim()
  const date = f.get('due_date')
  const today = new Date().toISOString().split('T')[0]
  if (!title || date < today) return
  const data = {
    title,
    description: f.get('description').trim(),
    due_date: date,
    due_time: f.get('due_time'),
    is_done: false
  }
  if (editMode) {
    tasks = tasks.map(t => t.id === editId ? { ...t, ...data } : t)
    editMode = false
    editId = null
    taskForm.querySelector('button[type="submit"]').textContent = 'Agregar tarea'
  } else {
    const id = tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1
    tasks.push({ id, ...data })
  }
  taskForm.reset()
  renderTasks()
})

;[pendingList, completedList].forEach(ul => {
  ul.addEventListener('dragover', allowDrop)
  ul.addEventListener('drop', onDrop)
})

loadTasks()

