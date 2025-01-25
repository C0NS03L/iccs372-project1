'use client';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface StockAlert {
  name: string;
  quantity: number;
  buyBy: string; // Date in YYYY-MM-DD format
  completed: boolean;
}

export default function StockAlert() {
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);

  useEffect(() => {
    // Simulating fetching stock alerts with a hardcoded JSON object
    const mockData: StockAlert[] = [
      { name: 'Apples', quantity: 50, buyBy: '2025-01-30', completed: false },
      { name: 'Bananas', quantity: 30, buyBy: '2025-02-02', completed: false },
      { name: 'Carrots', quantity: 20, buyBy: '2025-02-05', completed: false },
    ];
    setStockAlerts(mockData);
  }, []);

  const handleComplete = (index: number) => {
    const stock = stockAlerts[index];

    Swal.fire({
      customClass: {
        popup: 'bg-gray-800 text-gray-200',
        confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white',
        cancelButton: 'bg-gray-500 hover:bg-gray-600 text-white',
      },
      title: `Are you sure you want to add ${stock.quantity} to the stock?`,
      input: 'number',
      inputLabel: 'If you bought extra, specify the quantity:',
      inputValue: stock.quantity,
      showCancelButton: true,
      confirmButtonText: 'Yes, Add',
      preConfirm: (value) => {
        if (!value || isNaN(Number(value))) {
          Swal.showValidationMessage('Please enter a valid number');
        } else {
          return Number(value);
        }
      },
    }).then((result) => {
      if (result.isConfirmed) {
        const updatedStockAlerts = [...stockAlerts];
        updatedStockAlerts[index] = {
          ...updatedStockAlerts[index],
          quantity: result.value,
          completed: true,
        };
        setStockAlerts(updatedStockAlerts);

        Swal.fire(
          'Completed!',
          `Successfully marked "${stock.name}" as completed with ${result.value} quantity added!`,
          'success'
        );
      }
    });
  };

  return (
    <div className='col-span-1 row-span-1 rounded bg-gray-800 p-4 shadow'>
      <h2 className='text-xl font-bold'>Stock Alert</h2>
      <ul className='mt-4'>
        {stockAlerts.map((alert, index) => (
          <li
            key={index}
            className={`border-b border-gray-700 py-2 ${
              alert.completed ? 'line-through opacity-50' : ''
            }`}
          >
            <div className='flex items-center justify-between'>
              <span>
                <strong>{alert.name}</strong>: Buy {alert.quantity} by{' '}
                {new Date(alert.buyBy).toLocaleDateString()}
              </span>
              {!alert.completed && (
                <button
                  onClick={() => handleComplete(index)}
                  className='rounded bg-blue-500 px-2 py-1 text-white'
                >
                  Complete
                </button>
              )}
            </div>
          </li>
        ))}
      </ul>
    </div>
  );
}
