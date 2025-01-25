/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/no-unused-vars */
'use client';

import DatePicker from 'react-datepicker';
import 'react-datepicker/dist/react-datepicker.css';
import { availableStock } from './Schedule';

const BookExperimentModal = ({
  isModalOpen,
  setIsModalOpen,
  newExperiment,
  setNewExperiment,
  stockNeeded,
  setStockNeeded,
  createExperiment,
  searchQuery,
  setSearchQuery,
  handleStockChange,
  addStockItem,
}: any) => {
  return (
    isModalOpen && (
      <div className='fixed inset-0 flex justify-center items-center bg-black bg-opacity-50'>
        <div className='bg-gray-800 p-6 rounded shadow-lg w-128'>
          <h3 className='text-xl font-bold mb-4'>Book a New Experiment</h3>
          <div>
            <input
              type='text'
              placeholder='Experiment Title'
              value={newExperiment.title}
              onChange={(e) =>
                setNewExperiment({ ...newExperiment, title: e.target.value })
              }
              className='w-full mb-2 rounded border border-gray-700 bg-gray-700 p-2 text-white'
            />
            <textarea
              placeholder='Description'
              value={newExperiment.description}
              onChange={(e) =>
                setNewExperiment({ ...newExperiment, description: e.target.value })
              }
              className='w-full mb-2 rounded border border-gray-700 bg-gray-700 p-2 text-white'
            />
            <select
              value={newExperiment.room}
              onChange={(e) =>
                setNewExperiment({ ...newExperiment, room: e.target.value })
              }
              className='w-full mb-2 rounded border border-gray-700 bg-gray-700 p-2 text-white'
            >
              <option value='Lab1'>Lab1</option>
              <option value='Lab2'>Lab2</option>
              <option value='Lab3'>Lab3</option>
            </select>
            <div className='mb-2'>
              <label className='text-gray-400'>Start Date:</label>
              <DatePicker
                selected={newExperiment.startDate}
                onChange={(date: Date) =>
                  setNewExperiment({ ...newExperiment, startDate: date })
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
                onChange={(date: Date) =>
                  setNewExperiment({ ...newExperiment, endDate: date })
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
                      <span>{item.name} (In Stock: {item.currentStock})</span>
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
                  {stockNeeded.map((item, index) => (
                    <tr key={index}>
                      <td className='border-b border-gray-700 py-2'>{item.name}</td>
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
