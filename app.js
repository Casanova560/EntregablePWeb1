const DATA_URL = 'tasks.json'
let tasks = []
let editMode = false
let editId = null

const taskTable = document.getElementById('taskTable')
const taskBody = document.getElementById('taskBody')
const taskForm = document.getElementById('taskForm')

function renderTasks() {
  taskBody.innerHTML = ''
  if (tasks.length === 0) {
    taskTable.style.display = 'none'
    return
  }
  taskTable.style.display = ''
  tasks.forEach(task => {
    const tr = document.createElement('tr')
    tr.className = task.is_done ? 'done' : ''
    tr.innerHTML = `
      <td>${task.title}</td>
      <td>${task.description || ''}</td>
      <td>${task.due_date}${task.due_time ? ' ' + task.due_time : ''}</td>
      <td>${task.is_done ? 'Completada' : 'Pendiente'}</td>
      <td class="task-actions">
        <button class="toggle">${task.is_done ? '↺' : '✓'}</button>
        <button class="edit">✎</button>
        <button class="delete">🗑️</button>
      </td>
    `
    tr.querySelector('.toggle').addEventListener('click', () => {
      task.is_done = !task.is_done
      renderTasks()
    })
    tr.querySelector('.edit').addEventListener('click', () => {
      editMode = true
      editId = task.id
      taskForm.title.value = task.title
      taskForm.description.value = task.description
      taskForm.due_date.value = task.due_date
      taskForm.due_time.value = task.due_time || ''
      taskForm.querySelector('button[type="submit"]').textContent = 'Actualizar'
    })
    tr.querySelector('.delete').addEventListener('click', () => {
      tasks = tasks.filter(t => t.id !== task.id)
      if (editMode && editId === task.id) {
        editMode = false
        editId = null
        taskForm.reset()
        taskForm.querySelector('button[type="submit"]').textContent = 'Agregar tarea'
      }
      renderTasks()
    })
    taskBody.appendChild(tr)
  })
}

async function loadTasks() {
  const res = await fetch(DATA_URL)
  tasks = await res.json()
  renderTasks()
}

taskForm.addEventListener('submit', e => {
  e.preventDefault()
  const formData = new FormData(taskForm)
  const title = formData.get('title').trim()
  const description = formData.get('description').trim()
  const due_date = formData.get('due_date')
  const due_time = formData.get('due_time')
  const today = new Date().toISOString().split('T')[0]
  if (!title) return alert('El título no puede quedar vacío.')
  if (due_date < today) return alert('La fecha de vencimiento no puede ser anterior a hoy.')
  if (editMode) {
    tasks = tasks.map(t =>
      t.id === editId ? { ...t, title, description, due_date, due_time } : t
    )
    editMode = false
    editId = null
    taskForm.querySelector('button[type="submit"]').textContent = 'Agregar tarea'
  } else {
    const newTask = {
      id: tasks.length ? Math.max(...tasks.map(t => t.id)) + 1 : 1,
      title,
      description,
      due_date,
      due_time,
      is_done: false
    }
    tasks.push(newTask)
  }
  taskForm.reset()
  renderTasks()
})

loadTasks()

