"use client";
import Image from "next/image";
import Head from "next/head";
import { useState } from "react";

export default function Home() {
  return (
    <div className="bg-gray-900 text-gray-100 h-[100vh]">
      <Head>
        <title>Dashboard</title>
      </Head>
      <div className="h-full grid grid-cols-2 grid-rows-2 gap-4 p-4">
        <TodoList />
        <StockTracking />
        <Schedule />
      </div>
    </div>
  );
}

function TodoList() {
  const [tasks, setTasks] = useState([]);
  const [task, setTask] = useState("");

  const addTask = () => {
    if (task.trim()) {
      setTasks([...tasks, task]); // TODO: Save tasks to a database
      setTask("");
    }
  };

  return (
    <div className="bg-gray-800 p-4 rounded shadow col-span-2 row-span-1">
      <h2 className="text-xl font-bold">Todo List</h2>
      <div className="mt-2">
        <input
          type="text"
          value={task}
          onChange={(e) => setTask(e.target.value)}
          className="border border-gray-700 bg-gray-700 text-gray-100 p-2 w-full"
          placeholder="Add a task"
        />
        <button
          onClick={addTask}
          className="bg-blue-500 text-white px-4 py-2 mt-2 rounded"
        >
          Add
        </button>
        <ul className="mt-4">
          {tasks.map((t, index) => (
            <li key={index} className="border-b border-gray-700 py-2">
              {t}
            </li>
          ))}
        </ul>
      </div>
    </div>
  );
}

function StockTracking() {
  const [stocks, setStocks] = useState([
    { symbol: "AAPL", amount: 150 },
    { symbol: "TSLA", amount: 700 },
  ]); //TODO: Fetch stock prices from an API

  return (
    <div className="bg-gray-800 p-4 rounded shadow col-span-1 row-span-1">
      <h2 className="text-xl font-bold">Stock Tracking</h2>
      <ul className="mt-4">
        {stocks.map((stock, index) => (
          <li
            key={index}
            className="border-b border-gray-700 py-2 flex justify-between"
          >
            <span>{stock.symbol}</span>
            <span>${stock.amount}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Schedule() {
  const [events, setEvents] = useState([
    { time: "9:00 AM", activity: "Team meeting" },
    { time: "2:00 PM", activity: "Project review" },
  ]); // TODO: Fetch events from a DB/API

  return (
    <div className="bg-gray-800 p-4 rounded shadow col-span-1 row-span-1">
      <h2 className="text-xl font-bold">Schedule</h2>
      <ul className="mt-4">
        {events.map((event, index) => (
          <li key={index} className="border-b border-gray-700 py-2">
            <span>
              {event.time} - {event.activity}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
}
