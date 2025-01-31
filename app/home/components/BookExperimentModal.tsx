/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';
import { useEffect, Key, useState } from 'react';
import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';

interface InventoryItem {
  id: string;
  name: string;
  description: string;
  stockLevel: number;
  unit: string;
  lowStockThreshold: number;
}

const BookExperimentModal = ({
  isModalOpen,
  setIsModalOpen,
  newExperiment,
  setNewExperiment,
  stockNeeded,
  setStockNeeded,
  searchQuery,
  setSearchQuery,
  handleStockChange,
}: any) => {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [inventoryLoading, setInventoryLoading] = useState(true);
  const [inventoryError, setInventoryError] = useState<string | null>(null);

  useEffect(() => {
    if (isModalOpen) {
      fetchInventory();
    }
  }, [isModalOpen]);

  const fetchInventory = async () => {
    try {
      setInventoryLoading(true);
      const response = await fetch('/api/inventory');
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      const data = await response.json();
      setInventory(data);
    } catch (error) {
      setInventoryError(
        error instanceof Error ? error.message : 'Failed to load inventory'
      );
    } finally {
      setInventoryLoading(false);
    }
  };

  const addStockItem = (item: InventoryItem) => {
    if (!stockNeeded.some((stock: { id: string }) => stock.id === item.id)) {
      setStockNeeded([
        ...stockNeeded,
        {
          id: item.id,
          name: item.name,
          quantity: 1,
          unit: item.unit,
          available: item.stockLevel,
        },
      ]);
    }
  };

  const createExperiment = async () => {
    try {
      setLoading(true);
      setError('');

      if (
        !newExperiment.title ||
        !newExperiment.description ||
        !newExperiment.startDate ||
        !newExperiment.endDate
      ) {
        throw new Error('Please fill in all required fields');
      }

      // Validate stock quantities
      for (const stock of stockNeeded) {
        const inventoryItem = inventory.find((item) => item.id === stock.id);
        if (!inventoryItem) continue;

        // if (stock.quantity > inventoryItem.stockLevel) {
        //   throw new Error(
        //     `Insufficient stock for ${stock.name}. Available: ${inventoryItem.stockLevel} ${inventoryItem.unit}`
        //   );
        // }
      }

      const experimentData = {
        title: newExperiment.title,
        description: newExperiment.description,
        startDate: newExperiment.startDate.toISOString(),
        endDate: newExperiment.endDate.toISOString(),
        room: newExperiment.room,
        items: stockNeeded.map(
          (item: {
            id: string;
            name: string;
            quantity: number;
            unit: string;
          }) => ({
            id: item.id,
            name: item.name,
            quantity: item.quantity,
            unit: item.unit,
          })
        ),
      };

      const response = await fetch('/api/experiment', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(experimentData),
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.alternativeSlots) {
          throw new Error(
            `Time slot conflict. Alternative slots available: ${data.alternativeSlots
              .map(
                (slot: {
                  startDate: string | number | Date;
                  endDate: string | number | Date;
                }) =>
                  `${new Date(slot.startDate).toLocaleString()} - ${new Date(slot.endDate).toLocaleString()}`
              )
              .join(', ')}`
          );
        }
        throw new Error(data.error || 'Failed to create experiment');
      }

      setIsModalOpen(false);
      setNewExperiment({
        title: '',
        description: '',
        room: 'Lab1',
        startDate: new Date('2025-01-28T15:21:47Z'),
        endDate: new Date('2025-01-28T15:21:47Z'),
      });
      setStockNeeded([]);
      setSearchQuery('');
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An error occurred');
    } finally {
      setLoading(false);
    }
  };

  return (
    isModalOpen && (
      <div className='fixed inset-0 z-10 flex items-center justify-center bg-black bg-opacity-50'>
        <div className='w-128 rounded bg-gray-800 p-6 shadow-lg'>
          <h3 className='mb-4 text-xl font-bold'>Book a New Experiment</h3>
          <div>
            <input
              type='text'
              placeholder='Experiment Title'
              value={newExperiment.title}
              onChange={(e) =>
                setNewExperiment({ ...newExperiment, title: e.target.value })
              }
              className='mb-2 w-full rounded border border-gray-700 bg-gray-700 p-2 text-white'
            />
            <textarea
              placeholder='Description'
              value={newExperiment.description}
              onChange={(e) =>
                setNewExperiment({
                  ...newExperiment,
                  description: e.target.value,
                })
              }
              className='mb-2 w-full rounded border border-gray-700 bg-gray-700 p-2 text-white'
            />
            <select
              value={newExperiment.room}
              onChange={(e) =>
                setNewExperiment({ ...newExperiment, room: e.target.value })
              }
              className='mb-2 w-full rounded border border-gray-700 bg-gray-700 p-2 text-white'
            >
              <option value='Lab1'>Lab1</option>
              <option value='Lab2'>Lab2</option>
              <option value='Lab3'>Lab3</option>
            </select>
            <div className='mb-2'>
              <label className='block text-sm font-medium text-gray-400'>
                Start Date:
              </label>
              <DatePicker
                selected={newExperiment.startDate}
                onChange={(date: Date | null) =>
                  date &&
                  setNewExperiment({ ...newExperiment, startDate: date })
                }
                showTimeSelect
                dateFormat='Pp'
                className='w-full rounded border border-gray-700 bg-gray-700 p-2 text-white'
                minDate={new Date('2025-01-28T15:21:47Z')}
              />
            </div>
            <div className='mb-4'>
              <label className='block text-sm font-medium text-gray-400'>
                End Date:
              </label>
              <DatePicker
                selected={newExperiment.endDate}
                onChange={(date: Date | null) =>
                  date && setNewExperiment({ ...newExperiment, endDate: date })
                }
                showTimeSelect
                dateFormat='Pp'
                className='w-full rounded border border-gray-700 bg-gray-700 p-2 text-white'
                minDate={newExperiment.startDate}
              />
            </div>

            <div className='mb-4'>
              <h3 className='mb-2 text-gray-200'>Stock Needed</h3>
              <input
                type='text'
                placeholder='Search for stock items...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='mb-2 w-full rounded border border-gray-700 bg-gray-700 p-2 text-white'
              />
              <div className='max-h-32 overflow-y-auto rounded border border-gray-700'>
                {inventoryLoading ? (
                  <div className='p-2 text-gray-400'>Loading inventory...</div>
                ) : inventoryError ? (
                  <div className='p-2 text-red-500'>{inventoryError}</div>
                ) : (
                  inventory
                    .filter((item) =>
                      item.name
                        .toLowerCase()
                        .includes(searchQuery.toLowerCase())
                    )
                    .map((item) => (
                      <div
                        key={item.id}
                        className='flex justify-between border-b border-gray-700 p-2'
                      >
                        <div>
                          <span className='font-medium'>{item.name}</span>
                          <span className='ml-2 text-sm text-gray-400'>
                            (In Stock: {item.stockLevel} {item.unit})
                          </span>
                          <div className='text-sm text-gray-500'>
                            {item.description}
                          </div>
                        </div>
                        <button
                          onClick={() => addStockItem(item)}
                          disabled={stockNeeded.some(
                            (stock: { id: string }) => stock.id === item.id
                          )}
                          className={`rounded px-2 py-1 text-white ${
                            stockNeeded.some(
                              (stock: { id: string }) => stock.id === item.id
                            )
                              ? 'cursor-not-allowed bg-gray-600'
                              : 'bg-blue-500 hover:bg-blue-600'
                          }`}
                        >
                          {stockNeeded.some(
                            (stock: { id: string }) => stock.id === item.id
                          )
                            ? 'Added'
                            : 'Add'}
                        </button>
                      </div>
                    ))
                )}
              </div>
              <table className='mt-4 w-full table-auto border-collapse'>
                <thead>
                  <tr>
                    <th className='border-b border-gray-700 py-2 text-left'>
                      Item
                    </th>
                    <th className='border-b border-gray-700 py-2 text-left'>
                      Quantity
                    </th>
                    <th className='border-b border-gray-700 py-2 text-left'>
                      Unit
                    </th>
                    <th className='border-b border-gray-700 py-2 text-left'>
                      Available
                    </th>
                    <th className='border-b border-gray-700 py-2 text-left'>
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {stockNeeded.map(
                    (item: any, index: Key | null | undefined) => (
                      <tr key={index}>
                        <td className='border-b border-gray-700 py-2'>
                          {item.name}
                        </td>
                        <td className='border-b border-gray-700 py-2'>
                          <input
                            type='number'
                            value={item.quantity}
                            onChange={(e) =>
                              handleStockChange(index, Number(e.target.value))
                            }
                            min={1}
                            max={item.available}
                            className='w-full rounded border border-gray-700 bg-gray-700 p-2 text-white'
                          />
                        </td>
                        <td className='border-b border-gray-700 py-2'>
                          {item.unit}
                        </td>
                        <td className='border-b border-gray-700 py-2'>
                          {item.available}
                        </td>
                        <td className='border-b border-gray-700 py-2'>
                          <button
                            onClick={() => {
                              const newStockNeeded = [...stockNeeded];
                              if (typeof index === 'number') {
                                newStockNeeded.splice(index, 1);
                                setStockNeeded(newStockNeeded);
                              }
                            }}
                            className='rounded bg-red-500 px-2 py-1 text-white hover:bg-red-600'
                          >
                            Remove
                          </button>
                        </td>
                      </tr>
                    )
                  )}
                </tbody>
              </table>
            </div>

            {error && (
              <div className='mb-4 rounded bg-red-500 p-2 text-white'>
                {error}
              </div>
            )}

            <button
              onClick={createExperiment}
              disabled={loading}
              className='mt-4 w-full rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600 disabled:bg-green-800'
            >
              {loading ? 'Creating...' : 'Create Experiment'}
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
              disabled={loading}
              className='mt-2 w-full rounded bg-red-500 px-4 py-2 text-white hover:bg-red-600'
            >
              Close
            </button>
          </div>
        </div>
      </div>
    )
  );
};

export default BookExperimentModal;
