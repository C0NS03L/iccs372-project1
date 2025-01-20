'use client';
import Head from 'next/head';
import { useEffect, useState } from 'react';
// import { TaskAddRequest } from './api/task/route';

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
  // const [task, setTask] = useState('');

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

  // const addTask = () => {
  //   const addTaskToDB = async (task: TaskAddRequest) => {
  //     const response = await fetch('/api/task', {
  //       method: 'POST',
  //       headers: {
  //         'Content-Type': 'application/json',
  //       },
  //       body: JSON.stringify(task),
  //     });

  //     if (!response.ok) {
  //       console.error('Failed to add task');
  //       return;
  //     }

  //     const newTask = await response.json();
  //     setTasks((prevTasks) => [...prevTasks, newTask.title]);
  //     setTask('');
  //   };
  //   addTaskToDB({ title: task, description: '', completed: false });
  // };

  return (
    <div className='col-span-2 row-span-1 rounded bg-gray-800 p-4 shadow'>
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
  const [isPopupOpen, setIsPopupOpen] = useState(false);
  const [newEvent, setNewEvent] = useState({
    title: '',
    description: '',
    status: 'PLANNED',
    startDate: '',
    endDate: '',
    tasks: [{ title: '', description: '' }],
  });

  useEffect(() => {
    const fetchEvents = async () => {
      const response = await fetch('/api/experiment');
      const experiments = await response.json();
      const formattedExperiments = experiments.map(
        (experiment: { startDate: string; title: string }) => ({
          time: new Date(experiment.startDate).toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          }),
          activity: experiment.title,
        })
      );
      setEvents(formattedExperiments);
    };

    fetchEvents();
  }, []);

  const handleTaskChange = (index: number, key: string, value: string) => {
    const updatedTasks = [...newEvent.tasks];
    updatedTasks[index] = { ...updatedTasks[index], [key]: value };
    setNewEvent({ ...newEvent, tasks: updatedTasks });
  };

  const addTaskField = () => {
    setNewEvent({
      ...newEvent,
      tasks: [...newEvent.tasks, { title: '', description: '' }],
    });
  };

  const removeTaskField = (index: number) => {
    const updatedTasks = newEvent.tasks.filter((_, i) => i !== index);
    setNewEvent({ ...newEvent, tasks: updatedTasks });
  };

  const addExperiment = async () => {
    const response = await fetch('/api/experiment', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(newEvent),
    });

    if (!response.ok) {
      console.error('Failed to add experiment');
      console.log(await response.json());
      return;
    }

    const addedExperiment = await response.json();
    setEvents((prevEvents) => [
      ...prevEvents,
      {
        time: new Date(addedExperiment.startDate).toLocaleTimeString([], {
          hour: '2-digit',
          minute: '2-digit',
        }),
        activity: addedExperiment.title,
      },
    ]);
    setIsPopupOpen(false);
    setNewEvent({
      title: '',
      description: '',
      status: 'PLANNED',
      startDate: '',
      endDate: '',
      tasks: [{ title: '', description: '' }],
    });
  };

  return (
    <div className='col-span-1 row-span-1 rounded bg-gray-800 p-4 shadow'>
      <h2 className='text-xl font-bold'>Schedule</h2>
      <button
        onClick={() => setIsPopupOpen(true)}
        className='mt-2 rounded bg-green-500 px-4 py-2 text-white'
      >
        Create New Experiment
      </button>
      <ul className='mt-4'>
        {events.map((event, index) => (
          <li key={index} className='border-b border-gray-700 py-2'>
            <span>
              {event.time} - {event.activity}
            </span>
          </li>
        ))}
      </ul>

      {isPopupOpen && (
        <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='w-1/3 rounded bg-gray-800 p-4'>
            <h2 className='text-lg font-bold text-white'>New Experiment</h2>
            <input
              type='text'
              value={newEvent.title}
              onChange={(e) =>
                setNewEvent({ ...newEvent, title: e.target.value })
              }
              className='mt-2 w-full border border-gray-700 bg-gray-700 p-2 text-white'
              placeholder='Title'
            />
            <textarea
              value={newEvent.description}
              onChange={(e) =>
                setNewEvent({ ...newEvent, description: e.target.value })
              }
              className='mt-2 w-full border border-gray-700 bg-gray-700 p-2 text-white'
              placeholder='Description'
            />
            <select
              value={newEvent.status}
              onChange={(e) =>
                setNewEvent({ ...newEvent, status: e.target.value })
              }
              className='mt-2 w-full border border-gray-700 bg-gray-700 p-2 text-white'
            >
              <option value='PLANNED'>PLANNED</option>
              <option value='IN_PROGRESS'>IN_PROGRESS</option>
              <option value='COMPLETED'>COMPLETED</option>
            </select>
            <input
              type='datetime-local'
              value={newEvent.startDate}
              onChange={(e) =>
                setNewEvent({ ...newEvent, startDate: e.target.value })
              }
              className='mt-2 w-full border border-gray-700 bg-gray-700 p-2 text-white'
              placeholder='Start Date'
            />
            <input
              type='datetime-local'
              value={newEvent.endDate}
              onChange={(e) =>
                setNewEvent({ ...newEvent, endDate: e.target.value })
              }
              className='mt-2 w-full border border-gray-700 bg-gray-700 p-2 text-white'
              placeholder='End Date'
            />
            <div className='mt-4'>
              <h3 className='text-white'>Tasks</h3>
              {newEvent.tasks.map((task, index) => (
                <div key={index} className='mt-2'>
                  <input
                    type='text'
                    value={task.title}
                    onChange={(e) =>
                      handleTaskChange(index, 'title', e.target.value)
                    }
                    className='mr-2 w-1/2 border border-gray-700 bg-gray-700 p-2 text-white'
                    placeholder='Task Title'
                  />
                  <input
                    type='text'
                    value={task.description}
                    onChange={(e) =>
                      handleTaskChange(index, 'description', e.target.value)
                    }
                    className='mr-2 w-1/2 border border-gray-700 bg-gray-700 p-2 text-white'
                    placeholder='Task Description'
                  />
                  <button
                    onClick={() => removeTaskField(index)}
                    className='rounded bg-red-500 px-2 py-1 text-white'
                  >
                    Remove
                  </button>
                </div>
              ))}
              <button
                onClick={addTaskField}
                className='mt-2 rounded bg-blue-500 px-4 py-2 text-white'
              >
                Add Task
              </button>
            </div>
            <div className='mt-4 flex justify-end'>
              <button
                onClick={() => setIsPopupOpen(false)}
                className='mr-2 rounded bg-gray-600 px-4 py-2 text-white'
              >
                Cancel
              </button>
              <button
                onClick={addExperiment}
                className='rounded bg-blue-500 px-4 py-2 text-white'
              >
                Add
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
