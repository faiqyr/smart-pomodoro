import { useEffect, useState } from 'react';
import { taskAPI } from '../services/api';

interface Task {
  id: string;
  title: string;
  description: string;
  priority: string;
  status: string;
  created_at: string;
  completed_at: string | null;
}

export default function TasksPage() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [filter, setFilter] = useState('all');
  const [showModal, setShowModal] = useState(false);
  const [editTask, setEditTask] = useState<Task | null>(null);
  const [form, setForm] = useState({ title: '', description: '', priority: 'medium' });

  useEffect(() => { loadTasks(); }, []);

  const loadTasks = async () => {
    try {
      const res = await taskAPI.getAll();
      setTasks(res.data.data);
    } catch (err) { console.error(err); }
  };

  const filteredTasks = tasks.filter(t => filter === 'all' ? true : t.status === filter);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editTask) {
        await taskAPI.update(editTask.id, form);
      } else {
        await taskAPI.create(form);
      }
      setShowModal(false);
      setEditTask(null);
      setForm({ title: '', description: '', priority: 'medium' });
      loadTasks();
    } catch (err) { console.error(err); }
  };

  const toggleStatus = async (task: Task) => {
    const newStatus = task.status === 'completed' ? 'pending' : 'completed';
    await taskAPI.update(task.id, { status: newStatus });
    loadTasks();
  };

  const handleDelete = async (id: string) => {
    if (confirm('Delete this task?')) {
      await taskAPI.delete(id);
      loadTasks();
    }
  };

  const startEdit = (task: Task) => {
    setEditTask(task);
    setForm({ title: task.title, description: task.description, priority: task.priority });
    setShowModal(true);
  };

  const priorityColor: Record<string, string> = { high: 'danger', medium: 'warning', low: 'info' };

  return (
    <div>
      <div className="page-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
        <div>
          <h2>Task Management</h2>
          <p>Organize and track your tasks</p>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditTask(null); setForm({ title: '', description: '', priority: 'medium' }); setShowModal(true); }}>
          + New Task
        </button>
      </div>

      <div className="tabs">
        {['all', 'pending', 'in_progress', 'completed'].map(s => (
          <button key={s} className={`tab ${filter === s ? 'active' : ''}`} onClick={() => setFilter(s)}>
            {s === 'all' ? 'All' : s === 'in_progress' ? 'In Progress' : s.charAt(0).toUpperCase() + s.slice(1)}
            {s === 'all' ? ` (${tasks.length})` : ` (${tasks.filter(t => t.status === s).length})`}
          </button>
        ))}
      </div>

      {filteredTasks.length === 0 ? (
        <div className="empty-state">
          <div className="empty-icon">📋</div>
          <p>No tasks found. Create your first task!</p>
        </div>
      ) : (
        filteredTasks.map(task => (
          <div className="task-item" key={task.id}>
            <div className={`task-checkbox ${task.status === 'completed' ? 'completed' : ''}`} onClick={() => toggleStatus(task)}>
              {task.status === 'completed' && '✓'}
            </div>
            <div className="task-content">
              <div className={`task-title ${task.status === 'completed' ? 'completed' : ''}`}>{task.title}</div>
              <div className="task-meta">
                <span className={`badge badge-${priorityColor[task.priority]}`}>{task.priority}</span>
                <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>
                  {new Date(task.created_at).toLocaleDateString()}
                </span>
              </div>
            </div>
            <div className="task-actions">
              <button className="btn btn-ghost btn-sm" onClick={() => {
                const next = task.status === 'pending' ? 'in_progress' : task.status === 'in_progress' ? 'completed' : 'pending';
                taskAPI.update(task.id, { status: next }).then(loadTasks);
              }}>
                {task.status === 'pending' ? '▶ Start' : task.status === 'in_progress' ? '✓ Done' : '↩ Reopen'}
              </button>
              <button className="btn btn-ghost btn-sm" onClick={() => startEdit(task)}>✏️</button>
              <button className="btn btn-ghost btn-sm" onClick={() => handleDelete(task.id)} style={{ color: 'var(--accent-danger)' }}>🗑️</button>
            </div>
          </div>
        ))
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3 className="modal-title">{editTask ? 'Edit Task' : 'New Task'}</h3>
              <button className="btn btn-ghost btn-icon" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="form-group">
                <label className="form-label">Title</label>
                <input className="form-input" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} required placeholder="Task title" />
              </div>
              <div className="form-group">
                <label className="form-label">Description</label>
                <textarea className="form-input" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Task description (optional)" />
              </div>
              <div className="form-group">
                <label className="form-label">Priority</label>
                <select className="form-input" value={form.priority} onChange={(e) => setForm({ ...form, priority: e.target.value })}>
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
              </div>
              <button type="submit" className="btn btn-primary" style={{ width: '100%' }}>
                {editTask ? 'Update Task' : 'Create Task'}
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
