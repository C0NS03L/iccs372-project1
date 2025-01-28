// StockTracking.tsx
'use client';
import { useEffect, useState } from 'react';

interface Stock {
  name: string;
  stock: number;
}

export default function StockTracking() {
  const [stocks, setStocks] = useState<Stock[]>([]);

  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await fetch('/api/inventory');
        const inventory = await response.json();
        setStocks(inventory);
      } catch (error) {
        console.error('Error fetching inventory:', error);
        setStocks([]);
      }
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
