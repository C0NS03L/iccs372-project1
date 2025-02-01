'use client';
import { useState, useEffect } from 'react';
import Swal from 'sweetalert2';

interface StockAlert {
  id: string;
  inventoryId: string;
  inventoryName: string;
  quantity: number;
  status: string;
  arrivalDate: string;
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
      const response = await fetch('/api/reorder');
      if (!response.ok) {
        throw new Error('Failed to fetch stock alerts');
      }
      const data = await response.json();

      // Sort by creation date
      const sortedData = [...data].sort(
        (a: StockAlert, b: StockAlert) =>
          new Date(b.arrivalDate).getTime() - new Date(a.arrivalDate).getTime()
      );

      console.log(sortedData);

      setStockAlerts(sortedData);
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
          if (!value || isNaN(Number(value)) || Number(value) <= 0) {
            Swal.showValidationMessage('Please enter a valid positive number');
          } else {
            return Number(value);
          }
        },
      });

      if (result.isConfirmed) {
        const response = await fetch('/api/reorder', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: alert.inventoryName,
            quantity: result.value,
            status: 'COMPLETED',
          }),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || 'Failed to update reorder status');
        }

        // After successful update, update the inventory
        const inventoryResponse = await fetch('/api/inventory', {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            name: alert.inventoryName,
            id: alert.inventoryId,
            stockLevel: { increment: result.value },
          }),
        });

        if (!inventoryResponse.ok) {
          throw new Error('Failed to update inventory stock level');
        }

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
        window.location.reload();
      }
    } catch (err) {
      console.error('Error in handleComplete:', err);
      Swal.fire({
        title: 'Error!',
        text:
          err instanceof Error ? err.message : 'Failed to update stock alert',
        icon: 'error',
        customClass: {
          popup: 'bg-gray-800 text-gray-200',
          confirmButton: 'bg-blue-500 hover:bg-blue-600 text-white',
        },
      });
    }
  };
  return (
    <div className='col-span-1 row-span-1 rounded bg-gray-800 p-4 shadow'>
      <h2 className='text-xl font-bold'>Stock Alert</h2>
      {error && (
        <div className='mt-2 rounded bg-red-500 p-2 text-white'>{error}</div>
      )}
      {loading ? (
        <div className='mt-4 text-center'>Loading...</div>
      ) : (
        <ul className='mt-4 space-y-2'>
          {stockAlerts.length === 0 ? (
            <li className='text-center text-gray-400'>No stock alerts</li>
          ) : (
            stockAlerts.map((alert, index) => (
              <li
                key={`${alert.inventoryName}-${alert.arrivalDate}-${index}`}
                className={`relative rounded border border-gray-700 p-3 ${
                  alert.status === 'COMPLETED'
                    ? 'bg-gray-700/30'
                    : 'hover:bg-gray-700/30'
                }`}
                style={{ zIndex: alert.status === 'COMPLETED' ? 1 : 2 }}
              >
                <div className='flex items-center justify-between'>
                  <div className='space-y-1'>
                    <div
                      className={
                        alert.status === 'COMPLETED'
                          ? 'text-gray-500 line-through'
                          : ''
                      }
                    >
                      <strong>{alert.inventoryName}</strong>
                      <span className='ml-2 text-sm text-gray-400'>
                        (Need {alert.quantity})
                      </span>
                    </div>
                    <div className='text-sm text-gray-400'>
                      Arrive by:{' '}
                      {new Date(alert.arrivalDate).toLocaleDateString()}
                    </div>
                  </div>
                  {alert.status !== 'COMPLETED' && (
                    <button
                      onClick={() => handleComplete(alert)}
                      className='rounded bg-blue-500 px-3 py-1 text-white transition-colors hover:bg-blue-600'
                      style={{ zIndex: 3 }}
                    >
                      Complete
                    </button>
                  )}
                </div>
              </li>
            ))
          )}
        </ul>
      )}
    </div>
  );
}
