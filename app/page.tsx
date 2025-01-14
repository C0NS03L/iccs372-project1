'use client';
import Head from 'next/head';
import { useEffect, useState } from 'react';
import { TaskAddRequest } from './api/task/route';

export default function Home() {
  return (
    <div className='h-[100vh] bg-gray-900 text-gray-100'>
      <Head>
        <title>Dashboard</title>
      </Head>
      <div className='grid h-full grid-cols-2 grid-rows-2 gap-4 p-4'>
        <TodoList />
        <StockTracking />
        <Schedule />
      </div>
    </div>
  );
}

function TodoList() {
  const [tasks, setTasks] = useState<string[]>([]);
  const [task, setTask] = useState('');

  useEffect(() => {
    const fetchTasks = async () => {
      const response = await fetch('/api/task');
      const tasks = await response.json();
      console.log('Tasks:', tasks);
      const taskTitles = tasks.map((task: { title: string }) => task.title);
      setTasks(taskTitles);
    };
    fetchTasks();
  }, []);

  const addTask = () => {
    const addTaskToDB = async (task: TaskAddRequest) => {
      const response = await fetch('/api/task', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(task),
      });

      if (!response.ok) {
        console.error('Failed to add task');
        return;
      }

      const newTask = await response.json();
      setTasks((prevTasks) => [...prevTasks, newTask.title]);
      setTask('');
    };
    addTaskToDB({ title: task, description: '', completed: false });
  };

  return (
    <div className='col-span-2 row-span-1 rounded bg-gray-800 p-4 shadow'>
      <h2 className='text-xl font-bold'>Todo List</h2>
      <div className='mt-2'>
        <input
          type='text'
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className='w-full border border-gray-700 bg-gray-700 p-2 text-gray-100'
          placeholder='Add a task'
        />
        <button
          onClick={addTask}
          className='mt-2 rounded bg-blue-500 px-4 py-2 text-white'
        >
          Add
        </button>
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
function StockTracking() {
  interface Stock {
    name: string;
    stock: number;
  }

  const [stocks, setStocks] = useState<Stock[]>([]);

  useEffect(() => {
    const fetchStocks = async () => {
      const response = await fetch('/api/inventory');
      const inventory = await response.json();
      console.log('Inventory:' + inventory);
      setStocks(inventory);
    };
    fetchStocks();
  }, []);

  return (
    <div className='col-span-1 row-span-1 rounded bg-gray-800 p-4 shadow'>
      <h2 className='text-xl font-bold'>Stock Tracking</h2>
      <ul className='mt-4'>
        {stocks.map((stock, index) => (
          <li key={index} className='border-b border-gray-700 py-2'>
            <span>
              {stock.name} - {stock.stock}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Schedule() {
  interface Event {
    time: string;
    activity: string;
  }

  const [events, setEvents] = useState<Event[]>([]);

  useEffect(() => {
    const fetchEvents = async () => {
      const response = await fetch('/api/experiment');
      const experiments = await response.json();
      console.log('Experiments:' + experiments);
      const formattedExperiments = experiments.map(
        (experiment: { startDate: string; title: string }) => ({
          time: new Date(experiment.startDate).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          activity: experiment.title,
        })
      );
      console.log('Formatted Experiments:' + formattedExperiments);
      setEvents(formattedExperiments);
    };

    fetchEvents();
  }, []);

  return (
    <div className='col-span-1 row-span-1 rounded bg-gray-800 p-4 shadow'>
      <h2 className='text-xl font-bold'>Schedule</h2>
      <ul className='mt-4'>
        {events.map((event, index) => (
          <li key={index} className='border-b border-gray-700 py-2'>
            <span>
              {event.time} - {event.activity}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
