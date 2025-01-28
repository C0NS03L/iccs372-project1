'use client';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface StockAlert {
  id: string | number;
  inventoryName: string;
  quantity: number;
  arrivalDate: string;
  status: string;
  createdAt: string;
}

export default function StockAlert() {
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchStockAlerts();
  }, []);

  const fetchStockAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/reorders');
      if (!response.ok) {
        throw new Error('Failed to fetch stock alerts');
      }
      const data = await response.json();
      setStockAlerts(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
      Swal.fire({
        title: 'Error!',
        text: 'Failed to load stock alerts',
        icon: 'error',
        customClass: {
          popup: 'bg-gray-800 text-gray-200',
          confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white',
        },
      });
    } finally {
      setLoading(false);
    }
  };

  const handleComplete = async (alert: StockAlert) => {
    try {
      const result = await Swal.fire({
        customClass: {
          popup: 'bg-gray-800 text-gray-200',
          confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white',
          cancelButton: 'bg-gray-500 hover:bg-gray-600 text-white',
        },
        title: `Are you sure you want to add ${alert.quantity} to the stock?`,
        input: 'number',
        inputLabel: 'If you bought extra, specify the quantity:',
        inputValue: alert.quantity,
        showCancelButton: true,
        confirmButtonText: 'Yes, Add',
        preConfirm: (value) => {
          if (!value || isNaN(Number(value))) {
            Swal.showValidationMessage('Please enter a valid number');
          } else {
            return Number(value);
          }
        },
      });

      if (result.isConfirmed) {
        const response = await fetch(`/api/reorders?id=${alert.id}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            quantity: result.value,
            status: 'COMPLETED',
          }),
        });

        if (!response.ok) {
          throw new Error('Failed to update reorder status');
        }

        // Refresh the stock alerts
        await fetchStockAlerts();

        await Swal.fire({
          title: 'Completed!',
          text: `Successfully marked "${alert.inventoryName}" as completed with ${result.value} quantity added!`,
          icon: 'success',
          customClass: {
            popup: 'bg-gray-800 text-gray-200',
            confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white',
          },
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'Error!',
        text: err instanceof Error ? err.message : 'Failed to update stock alert',
        icon: 'error',
        customClass: {
          popup: 'bg-gray-800 text-gray-200',
          confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white',
        },
      });
    }
  };

  if (loading) {
    return (
      <div className='col-span-1 row-span-1 rounded bg-gray-800 p-4 shadow'>
        <h2 className='text-xl font-bold'>Stock Alert</h2>
        <div className='mt-4 text-center'>Loading...</div>
      </div>
    );
  }

  return (
    <div className='col-span-1 row-span-1 rounded bg-gray-800 p-4 shadow'>
      <h2 className='text-xl font-bold'>Stock Alert</h2>
      {error && (
        <div className='mt-2 rounded bg-red-500 p-2 text-white'>{error}</div>
      )}
      <ul className='mt-4'>
        {stockAlerts.length === 0 ? (
          <li className='text-center text-gray-400'>No stock alerts</li>
        ) : (
          stockAlerts.map((alert) => (
            <li
              key={alert.id}
              className={`border-b border-gray-700 py-2 ${
                alert.status === 'COMPLETED' ? 'line-through opacity-50' : ''
              }`}
            >
              <div className='flex items-center justify-between'>
                <span>
                  <strong>{alert.inventoryName}</strong>: Buy {alert.quantity} by{' '}
                  {new Date(alert.arrivalDate).toLocaleDateString()}
                </span>
                {alert.status !== 'COMPLETED' && (
                  <button
                    onClick={() => handleComplete(alert)}
                    className='rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600'
                  >
                    Complete
                  </button>
                )}
              </div>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}