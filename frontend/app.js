const DATA_URL = 'tasks.json'
let tasks = []
let editMode = false
let editId = null

const taskForm       = document.getElementById('taskForm')
const pendingList    = document.getElementById('pendingList')
const inProgressList = document.getElementById('inProgressList')
const completedList  = document.getElementById('completedList')
const titleInput     = taskForm.querySelector('[name="title"]')
const dateInput      = taskForm.querySelector('[name="due_date"]')

// Validaciones inline
function showError(el, msg) {
  clearError(el)
  const e = document.createElement('div')
  e.className = 'error-msg'
  e.textContent = msg
  el.after(e)
  el.classList.add('input-error')
}
function clearError(el) {
  const nxt = el.nextElementSibling
  if (nxt && nxt.classList.contains('error-msg')) nxt.remove()
  el.classList.remove('input-error')
}
titleInput.addEventListener('input', () => {
  if (!titleInput.value.trim()) showError(titleInput, 'El título es obligatorio.')
  else clearError(titleInput)
})
dateInput.addEventListener('input', () => {
  if (dateInput.value < dateInput.min) showError(dateInput, 'Fecha inválida.')
  else clearError(dateInput)
})

// Render de las tres columnas
function renderTasks() {
  pendingList.innerHTML    = ''
  inProgressList.innerHTML = ''
  completedList.innerHTML  = ''

  if (tasks.length === 0) {
    pendingList.innerHTML    = `<li class="empty-state">No hay tareas aún.</li>`
    inProgressList.innerHTML = `<li class="empty-state">No hay tareas en progreso.</li>`
    completedList.innerHTML  = `<li class="empty-state">No hay tareas completadas.</li>`
    return
  }

  tasks.forEach(task => {
    const li = document.createElement('li')
    li.draggable      = true
    li.dataset.id     = task.id
    li.setAttribute('role','listitem')
    li.setAttribute('tabindex','0')
    li.setAttribute('aria-grabbed','false')
    li.className      = task.status === 'completed' ? 'done' : ''
    li.innerHTML      = `
      <div class="task-details">
        <strong>${task.title}</strong>
        <p>${task.description || ''}</p>
        <small>${task.due_date}${task.due_time ? ' ' + task.due_time : ''}</small>
      </div>
      <div class="task-actions">
        <button class="edit"   aria-label="Editar">✎</button>
        <button class="delete" aria-label="Eliminar">🗑️</button>
      </div>
    `
    li.addEventListener('dragstart', e => {
      e.dataTransfer.setData('text/plain', li.dataset.id)
      li.setAttribute('aria-grabbed','true')
    })
    li.addEventListener('dragend', () => {
      document.querySelectorAll('.task-list').forEach(ul => ul.classList.remove('drag-over'))
      li.setAttribute('aria-grabbed','false')
    })
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
    if (task.status === 'pending')    pendingList.appendChild(li)
    if (task.status === 'inProgress') inProgressList.appendChild(li)
    if (task.status === 'completed')  completedList.appendChild(li)
  })

  if (!pendingList.children.length)    pendingList.innerHTML    = `<li class="empty-state">No hay tareas pendientes.</li>`
  if (!inProgressList.children.length) inProgressList.innerHTML = `<li class="empty-state">No hay tareas en progreso.</li>`
  if (!completedList.children.length)  completedList.innerHTML  = `<li class="empty-state">No hay tareas completadas.</li>`
}

function allowDrop(e) {
  e.preventDefault()
  e.currentTarget.classList.add('drag-over')
}
function onDrop(e) {
  e.preventDefault()
  const id     = +e.dataTransfer.getData('text/plain')
  const status = e.currentTarget.parentElement.dataset.status
  tasks = tasks.map(t => t.id === id ? { ...t, status } : t)
  renderTasks()
}

function startEdit(task) {
  editMode = true
  editId = task.id
  taskForm.title.value       = task.title
  taskForm.description.value = task.description
  taskForm.due_date.value    = task.due_date
  taskForm.due_time.value    = task.due_time || ''
  taskForm.querySelector('button[type="submit"]').textContent = 'Actualizar'
}

async function loadTasks() {
  const res = await fetch(DATA_URL)
  const raw = await res.json()
  tasks = raw.map(t => ({
    ...t,
    status: t.is_done ? 'completed' : 'pending'
  }))
  renderTasks()
}

taskForm.addEventListener('submit', e => {
  e.preventDefault()
  clearError(titleInput)
  clearError(dateInput)

  if (!titleInput.value.trim()) {
    showError(titleInput,'El título es obligatorio.')
    titleInput.focus()
    return
  }
  if (dateInput.value < dateInput.min) {
    showError(dateInput,'Fecha inválida.')
    dateInput.focus()
    return
  }

  const f = new FormData(taskForm)
  const data = {
    title:       f.get('title').trim(),
    description: f.get('description').trim(),
    due_date:    f.get('due_date'),
    due_time:    f.get('due_time'),
    status:      'pending'
  }

  if (editMode) {
    tasks = tasks.map(t => t.id === editId ? { ...t, ...data } : t)
    editMode = false
    editId = null
    taskForm.querySelector('button[type="submit"]').textContent = 'Agregar tarea'
  } else {
    const id = tasks.length ? Math.max(...tasks.map(t=>t.id)) + 1 : 1
    tasks.push({ id, ...data })
  }

  taskForm.reset()
  renderTasks()
})

;[pendingList, inProgressList, completedList].forEach(ul => {
  ul.addEventListener('dragover', allowDrop)
  ul.addEventListener('drop',     onDrop)
})

loadTasks()


