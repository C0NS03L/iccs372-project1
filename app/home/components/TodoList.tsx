'use client';
import { useEffect, useState } from 'react';

interface Task {
  id: string;
  title: string;
  completed: boolean;
  dueDate: string;
}

export default function TodoList() {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTasks();
  }, []);

  const fetchTasks = async () => {
    try {
      setLoading(true);
      const today = new Date();
      const todayUtc = today.toISOString().split('T')[0];
      
      const response = await fetch(`/api/task?query_date=${todayUtc}`);
      if (!response.ok) {
        throw new Error('Failed to fetch tasks');
      }
      
      const tasksData = await response.json();
      setTasks(tasksData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load tasks');
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleTaskCompletion = async (taskId: string, completed: boolean) => {
    try {
      const response = await fetch('/api/task', {
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
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update task');
      }

      // Refresh tasks after updating
      await fetchTasks();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update task');
      console.error('Error updating task:', err);
    }
  };

  if (loading) {
    return (
      <div className='col-span-1 row-span-1 rounded bg-gray-800 p-4 shadow'>
        <h2 className='text-xl font-bold'>Todo List</h2>
        <div className='mt-4 text-center'>Loading tasks...</div>
      </div>
    );
  }

  return (
    <div className='col-span-1 row-span-1 rounded bg-gray-800 p-4 shadow'>
      <h2 className='text-xl font-bold'>Todo List</h2>
      {error && (
        <div className='mt-2 rounded bg-red-500 p-2 text-white'>{error}</div>
      )}
      <div className='mt-2'>
        {tasks.length === 0 ? (
          <p className='text-center text-gray-400 mt-4'>No tasks for today</p>
        ) : (
          <ul className='mt-4'>
            {tasks.map((task) => (
              <li
                key={task.id}
                className={`border-b border-gray-700 py-2 flex items-center justify-between ${
                  task.completed ? 'opacity-50' : ''
                }`}
              >
                <div className='flex items-center gap-2'>
                  <input
                    type='checkbox'
                    checked={task.completed}
                    onChange={(e) => handleTaskCompletion(task.id, e.target.checked)}
                    className='rounded border-gray-600 bg-gray-700 text-blue-500 focus:ring-blue-500'
                  />
                  <span className={task.completed ? 'line-through' : ''}>
                    {task.title}
                  </span>
                </div>
                <span className='text-sm text-gray-400'>
                  {new Date(task.dueDate).toLocaleTimeString([], {
                    hour: '2-digit',
                    minute: '2-digit',
                  })}
                </span>
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}