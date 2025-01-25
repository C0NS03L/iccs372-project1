'use client';
import { useEffect, useState } from 'react';

export default function TodoList() {
  const [tasks, setTasks] = useState<string[]>([]);

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await fetch('/api/task');
      const tasks = await response.json();
      const taskTitles = tasks.map((task: { title: string }) => task.title);
      setTasks(taskTitles);
    };
    fetchTasks();
  }, []);

  return (
    <div className='col-span-1 row-span-1 rounded bg-gray-800 p-4 shadow'>
      <h2 className='text-xl font-bold'>Todo List</h2>
      <div className='mt-2'>
        <ul className='mt-4'>
          {tasks.map((t, index) => (
            <li key={index} className='border-b border-gray-700 py-2'>
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}
