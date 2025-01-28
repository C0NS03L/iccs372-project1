/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { availableStock } from './Schedule';
import { Key, useState } from 'react'; // Add this import

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
  addStockItem,
}: any) => {
  const [error, setError] = useState<string>('');
  const [loading, setLoading] = useState(false);

  const createExperiment = async () => {
    try {
      setLoading(true);
      setError('');

      if (!newExperiment.title || !newExperiment.description || !newExperiment.startDate || !newExperiment.endDate) {
        throw new Error('Please fill in all required fields');
      }

      const experimentData = {
        title: newExperiment.title,
        description: newExperiment.description,
        startDate: newExperiment.startDate.toISOString(),
        endDate: newExperiment.endDate.toISOString(),
        items: stockNeeded.map((item: { name: any; quantity: any; }) => ({
          name: item.name,
          quantity: item.quantity
        }))
      };

      const response = await fetch('/api/experiments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(experimentData)
      });

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 409 && data.alternativeSlots) {
          throw new Error(`Time slot conflict. Alternative slots available: ${
            data.alternativeSlots.map((slot: { startDate: string | number | Date; endDate: string | number | Date; }) => 
              `${new Date(slot.startDate).toLocaleString()} - ${new Date(slot.endDate).toLocaleString()}`
            ).join(', ')
          }`);
        }
        throw new Error(data.error || 'Failed to create experiment');
      }

      setIsModalOpen(false);
      setNewExperiment({
        title: '',
        description: '',
        room: 'Lab1',
        startDate: new Date(),
        endDate: new Date()
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
      <div className='fixed inset-0 flex items-center justify-center bg-black bg-opacity-50'>
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
              <label className='text-gray-400'>Start Date:</label>
              <DatePicker
                selected={newExperiment.startDate}
                onChange={(date: Date | null) =>
                  date && setNewExperiment({ ...newExperiment, startDate: date })
                }
                showTimeSelect
                dateFormat='Pp'
                className='w-full rounded border border-gray-700 bg-gray-700 p-2 text-white'
              />
            </div>
            <div className='mb-4'>
              <label className='text-gray-400'>End Date:</label>
              <DatePicker
                selected={newExperiment.endDate}
                onChange={(date: Date | null) =>
                  date && setNewExperiment({ ...newExperiment, endDate: date })
                }
                showTimeSelect
                dateFormat='Pp'
                className='w-full rounded border border-gray-700 bg-gray-700 p-2 text-white'
              />
            </div>
            <div className='mb-4'>
              <h3 className='text-gray-200'>Stock Needed</h3>
              <input
                type='text'
                placeholder='Search for stock items...'
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className='mb-2 w-full rounded border border-gray-700 bg-gray-700 p-2 text-white'
              />
              <div className='max-h-32 overflow-y-auto rounded border border-gray-700'>
                {availableStock
                  .filter((item) =>
                    item.name.toLowerCase().includes(searchQuery.toLowerCase())
                  )
                  .map((item, index) => (
                    <div
                      key={index}
                      className='flex justify-between border-b border-gray-700 p-2'
                    >
                      <span>
                        {item.name} (In Stock: {item.currentStock})
                      </span>
                      <button
                        onClick={() => addStockItem(item)}
                        className='rounded bg-blue-500 px-2 py-1 text-white hover:bg-blue-600'
                      >
                        Add
                      </button>
                    </div>
                  ))}
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
                  </tr>
                </thead>
                <tbody>
                  {stockNeeded.map((item: any, index: Key | null | undefined) => (
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
                          className='w-full rounded border border-gray-700 bg-gray-700 p-2 text-white'
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <button
              onClick={createExperiment}
              className='mt-4 w-full rounded bg-green-500 px-4 py-2 text-white hover:bg-green-600'
            >
              Create Experiment
            </button>
            <button
              onClick={() => setIsModalOpen(false)}
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
