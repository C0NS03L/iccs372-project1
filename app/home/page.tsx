// Home.tsx
'use client';
import Head from 'next/head';
import TodoList from './components/TodoList';
import StockTracking from './components/StockTracking';
import Schedule from './components/Schedule';
import StockAlert from './components/StockAlert';

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
        <StockAlert />
      </div>
    </div>
  );
}
