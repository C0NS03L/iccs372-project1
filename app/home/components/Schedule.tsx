/* eslint-disable @typescript-eslint/no-explicit-any */
'use client';

import { useState } from 'react';
import BookExperimentModal from './BookExperimentModal'; // Import modal
import Swal from 'sweetalert2';
import withReactContent from 'sweetalert2-react-content';

const MySwal = withReactContent(Swal);

export const availableStock = [
  { name: 'Item A', currentStock: 10 },
  { name: 'Item B', currentStock: 5 },
  { name: 'Item C', currentStock: 15 },
];

const Schedule = () => {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [stockNeeded, setStockNeeded] = useState<any[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [newExperiment, setNewExperiment] = useState({
    title: '',
    description: '',
    room: 'Lab1',
    startDate: new Date(),
    endDate: new Date(),
  });

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [editingExperimentIndex, setEditingExperimentIndex] = useState<
    number | null
  >(null);

  const handleStockChange = (index: number, value: number) => {
    const updatedStock = [...stockNeeded];
    updatedStock[index].quantity = value;
    setStockNeeded(updatedStock);
  };

  const addStockItem = (stock: { name: string; currentStock: number }) => {
    if (!stockNeeded.find((item) => item.name === stock.name)) {
      setStockNeeded([...stockNeeded, { name: stock.name, quantity: 0 }]);
    }
  };

  // Check for overlapping lab times
  const checkLabTimeConflict = () => {
    return experiments.some((experiment) => {
      return (
        experiment.room === newExperiment.room &&
        ((newExperiment.startDate >= experiment.startDate &&
          newExperiment.startDate < experiment.endDate) ||
          (newExperiment.endDate > experiment.startDate &&
            newExperiment.endDate <= experiment.endDate) ||
          (newExperiment.startDate <= experiment.startDate &&
            newExperiment.endDate >= experiment.endDate))
      );
    });
  };

  const createExperiment = () => {
    if (!newExperiment.title.trim()) {
      MySwal.fire({
        title: 'Validation Error',
        text: 'Experiment title is required.',
        icon: 'error',
        confirmButtonText: 'Ok',
        customClass: {
          popup: 'bg-gray-800 text-gray-200',
        },
      });
      return;
    }

    if (checkLabTimeConflict()) {
      MySwal.fire({
        title: 'Time Conflict!',
        text: `The selected time for this experiment conflicts with another experiment in ${newExperiment.room}. Please choose a different time.`,
        icon: 'error',
        confirmButtonText: 'Ok',
        customClass: {
          popup: 'bg-gray-800 text-gray-200',
        },
      });
      return;
    }

    const missingStock = stockNeeded.filter(
      (item) =>
        item.quantity >
        (availableStock.find((stock) => stock.name === item.name)
          ?.currentStock ?? 0)
    );

    if (missingStock.length > 0) {
      const stockAlertItems = missingStock
        .map((item) => `- ${item.name}: Need ${item.quantity}`)
        .join('<br>');

      MySwal.fire({
        title: 'Buy Stock Alert!',
        html: `The following items are missing stock and need to be purchased:<br>${stockAlertItems}`,
        icon: 'warning',
        confirmButtonText: 'Add to Stock Alert',
        customClass: {
          popup: 'bg-gray-800 text-gray-200',
        },
      });
    }

    if (isEditing && editingExperimentIndex !== null) {
      const updatedExperiments = [...experiments];
      updatedExperiments[editingExperimentIndex] = {
        ...newExperiment,
        stockNeeded,
      };
      setExperiments(updatedExperiments);
    } else {
      setExperiments((prev) => [
        ...prev,
        {
          ...newExperiment,
          stockNeeded,
        },
      ]);
    }

    setStockNeeded([]);
    setNewExperiment({
      title: '',
      description: '',
      room: 'Lab1',
      startDate: new Date(),
      endDate: new Date(),
    });
    setIsEditing(false);
    setIsModalOpen(false); // Close the modal after booking or editing the experiment
  };

  const editExperiment = (index: number) => {
    setNewExperiment({
      ...experiments[index],
      startDate: new Date(experiments[index].startDate),
      endDate: new Date(experiments[index].endDate),
    });
    setStockNeeded(experiments[index].stockNeeded);
    setIsEditing(true);
    setEditingExperimentIndex(index);
    setIsModalOpen(true);
  };

  return (
    <div className='col-span-1 row-span-1 rounded bg-gray-800 p-4 shadow'>
      <h2 className='text-xl font-bold'>Currently Booked Experiments</h2>
      <ul className='mt-4'>
        {experiments.map((experiment, index) => (
          <li key={index} className='border-b border-gray-700 py-2'>
            <div>
              {experiment.title} - {experiment.room}
            </div>
            <div className='text-sm text-gray-400'>
              {experiment.startDate.toLocaleString()} -{' '}
              {experiment.endDate.toLocaleString()}
            </div>
            <button
              onClick={() => editExperiment(index)}
              className='mt-2 rounded bg-yellow-500 px-4 py-2 text-white hover:bg-yellow-600'
            >
              Edit
            </button>
          </li>
        ))}
      </ul>
      <button
        onClick={() => setIsModalOpen(true)}
        className='mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
      >
        Book Experiment
      </button>

      <BookExperimentModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        newExperiment={newExperiment}
        setNewExperiment={setNewExperiment}
        stockNeeded={stockNeeded}
        setStockNeeded={setStockNeeded}
        createExperiment={createExperiment}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleStockChange={handleStockChange}
        addStockItem={addStockItem}
      />
    </div>
  );
};

export default Schedule;
