'use client';
import { useEffect, useState } from 'react';

interface Task {
  id: string;
  title: string;
  description: string;
  completed: boolean;
  dueDate: string;
}

interface NewTask {
  title: string;
  description: string;
  completed: boolean;
  dueDate?: string;
}

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTask, setNewTask] = useState<NewTask>({
    title: '',
    description: '',
    completed: false,
  });

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      // Format today's date as YYYY-MM-DD
      const today = new Date('2025-01-28').toISOString().split('T')[0];
      const response = await fetch(`/api/todo?query_date=${today}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to fetch tasks');
      }

      const tasksData = await response.json();
      setTasks(tasksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      const response = await fetch('/api/todo', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          taskId,
          completed,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to update task');
      }

      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
    }
  };

  const handleSubmitNewTask = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTask), // Will include dueDate if specified
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create task');
      }

      // Reset form and close modal
      setNewTask({
        title: '',
        description: '',
        completed: false,
      });
      setIsModalOpen(false);

      // Refresh tasks
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create task');
    }
  };

  return (
    <div className='col-span-1 row-span-1 rounded bg-gray-800 p-4 shadow'>
      <div className='mb-4 flex items-center justify-between'>
        <h2 className='text-xl font-bold'>Todo List</h2>
        <button
          onClick={() => setIsModalOpen(true)}
          className='flex items-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600'
        >
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-5 w-5'
            viewBox='0 0 20 20'
            fill='currentColor'
          >
            <path
              fillRule='evenodd'
              d='M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z'
              clipRule='evenodd'
            />
          </svg>
          Add Task
        </button>
      </div>

      {/* Task List */}
      {loading ? (
        <div className='py-4 text-center'>Loading tasks...</div>
      ) : tasks.length === 0 ? (
        <div className='py-4 text-center text-gray-400'>No tasks for today</div>
      ) : (
        <ul className='space-y-2'>
          {tasks.map((task) => (
            <li
              key={task.id}
              className={`flex items-center justify-between rounded-md border border-gray-700 p-3 ${
                task.completed ? 'bg-gray-700/50' : ''
              }`}
            >
              <div className='flex items-center gap-3'>
                <input
                  type='checkbox'
                  checked={task.completed}
                  onChange={(e) =>
                    handleTaskCompletion(task.id, e.target.checked)
                  }
                  className='rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500'
                />
                <div
                  className={task.completed ? 'text-gray-400 line-through' : ''}
                >
                  <div className='font-medium'>{task.title}</div>
                  {task.description && (
                    <div className='text-sm text-gray-400'>
                      {task.description}
                    </div>
                  )}
                </div>
              </div>
              <div className='text-sm text-gray-400'>
                {new Date(task.dueDate).toLocaleTimeString([], {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* Add Task Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl'>
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='text-xl font-bold'>Add New Task</h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className='text-gray-400 hover:text-white'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-6 w-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmitNewTask} className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-400'>
                  Task Title
                </label>
                <input
                  type='text'
                  value={newTask.title}
                  onChange={(e) =>
                    setNewTask({ ...newTask, title: e.target.value })
                  }
                  className='w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  required
                />
              </div>

              <div>
                <label className='mb-1 block text-sm font-medium text-gray-400'>
                  Description
                </label>
                <textarea
                  value={newTask.description}
                  onChange={(e) =>
                    setNewTask({ ...newTask, description: e.target.value })
                  }
                  className='w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  rows={3}
                  required
                />
              </div>

              <div>
                <label className='mb-1 block text-sm font-medium text-gray-400'>
                  Due Date & Time (Optional)
                </label>
                <input
                  type='datetime-local'
                  value={newTask.dueDate || ''}
                  onChange={(e) =>
                    setNewTask({ ...newTask, dueDate: e.target.value })
                  }
                  className='w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  min='2025-01-28T14:44:24'
                  max='2025-01-28T23:59:59'
                />
                <p className='mt-1 text-sm text-gray-400'>
                  If not specified, due date will be set to end of today
                  (23:59:59)
                </p>
              </div>

              <div className='mt-6 flex gap-3'>
                <button
                  type='submit'
                  className='flex-1 rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600'
                >
                  Create Task
                </button>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='flex-1 rounded-md bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700'
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {error && (
        <div className='mt-4 rounded-md bg-red-500 p-3 text-white'>{error}</div>
      )}
    </div>
  );
}
