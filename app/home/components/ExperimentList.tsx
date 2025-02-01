'use client';
import { useState, useEffect } from 'react';
import BookExperimentModal from './BookExperimentModal'; // Add this import

interface ExperimentItem {
  id: string;
  title: string;
  description: string;
  LabRoom: {
    name: string;
  };
  startDate: string;
  endDate: string;
  createdBy: string;
  status: string;
  items: {
    id: string;
    name: string;
    quantity: number;
    unit: string;
  }[];
}

export default function ExperimentList() {
  const [experiments, setExperiments] = useState<ExperimentItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedExperimentId, setSelectedExperimentId] = useState<
    string | null
  >(null);
  const [newExperiment, setNewExperiment] = useState({
    title: '',
    description: '',
    room: '',
    startDate: new Date(),
    endDate: new Date(),
  });
  const [stockNeeded, setStockNeeded] = useState<
    { id: string; name: string; quantity: number; unit: string }[]
  >([]);
  const [searchQuery, setSearchQuery] = useState('');

  useEffect(() => {
    fetchExperiments();
  }, []);

  const refreshExperiments = () => {
    fetchExperiments();
  };

  const handleStockChange = (index: number, value: number) => {
    const newStockNeeded = [...stockNeeded];
    newStockNeeded[index] = {
      ...newStockNeeded[index],
      quantity: value,
    };
    setStockNeeded(newStockNeeded);
  };

  const handleEdit = (id: string) => {
    console.log('Editing experiment', id);
    // Reset the form state
    setNewExperiment({
      title: '',
      description: '',
      room: '',
      startDate: new Date(),
      endDate: new Date(),
    });
    setStockNeeded([]);
    setSearchQuery('');

    setSelectedExperimentId(id);
    setIsModalOpen(true);
  };

  const fetchExperiments = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/experiment');
      if (!response.ok) {
        throw new Error('Failed to fetch experiments');
      }
      const data = await response.json();
      setExperiments(data);
      console.log(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load experiments'
      );
    } finally {
      setLoading(false);
    }
  };

  const filteredExperiments = experiments.filter(
    (exp) =>
      exp.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
      exp.LabRoom.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='flex h-full flex-col rounded bg-gray-800 p-4 shadow'>
      <div className='mb-4 space-y-4'>
        <div className='flex items-center gap-2 rounded-md bg-gray-700 px-3 py-2'>
          <svg
            xmlns='http://www.w3.org/2000/svg'
            className='h-5 w-5 text-gray-400'
            fill='none'
            viewBox='0 0 24 24'
            stroke='currentColor'
          >
            <path
              strokeLinecap='round'
              strokeLinejoin='round'
              strokeWidth={2}
              d='M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z'
            />
          </svg>
          <input
            type='text'
            placeholder='Search experiments...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full border-0 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-0'
          />
        </div>
      </div>
      <div className='flex-1 overflow-y-auto'>
        {loading ? (
          <div className='py-4 text-center'>Loading experiments...</div>
        ) : error ? (
          <div className='py-4 text-center text-red-500'>{error}</div>
        ) : filteredExperiments.length === 0 ? (
          <div className='py-4 text-center text-gray-400'>
            {experiments.length === 0
              ? 'No experiments booked'
              : 'No matching experiments found'}
          </div>
        ) : (
          <div className='space-y-4'>
            {filteredExperiments.length > 0 &&
              filteredExperiments.map((experiment) => (
                <div
                  key={experiment.id}
                  className='rounded-lg border border-gray-700 p-4'
                >
                  <div className='mb-2 flex items-center justify-between'>
                    <h3 className='text-lg font-semibold'>
                      {experiment.title}
                    </h3>
                    <span
                      className={`rounded-full px-2 py-1 text-xs ${
                        new Date(experiment.endDate) < new Date()
                          ? 'bg-gray-600 text-gray-300'
                          : new Date(experiment.startDate) <= new Date()
                            ? 'bg-green-500/20 text-green-400'
                            : 'bg-blue-500/20 text-blue-400'
                      }`}
                    >
                      {new Date(experiment.endDate) < new Date()
                        ? 'Completed'
                        : new Date(experiment.startDate) <= new Date()
                          ? 'In Progress'
                          : 'Scheduled'}
                    </span>
                  </div>
                  <p className='text-gray-400'>{experiment.description}</p>
                  <div className='mt-2 space-y-1 text-sm text-gray-400'>
                    <div>Room: {experiment.LabRoom.name}</div>
                    <div>
                      Time: {new Date(experiment.startDate).toLocaleString()} -{' '}
                      {new Date(experiment.endDate).toLocaleString()}
                    </div>
                  </div>
                  <div className='mt-3'>
                    <h4 className='mb-2 text-sm font-semibold text-gray-300'>
                      Required Items:
                    </h4>
                    <div className='grid grid-cols-2 gap-2 sm:grid-cols-3'>
                      {experiment.items.map((item) => (
                        <div
                          key={`${experiment.id}-${item.id}`}
                          className='rounded bg-gray-700/50 px-2 py-1 text-sm'
                        >
                          {item.name}: {item.quantity} {item.unit}
                        </div>
                      ))}
                    </div>
                  </div>
                  <button
                    onClick={() => handleEdit(experiment.id)}
                    className='mt-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600'
                  >
                    Edit
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
      <BookExperimentModal
        isModalOpen={isModalOpen}
        setIsModalOpen={setIsModalOpen}
        newExperiment={newExperiment}
        setNewExperiment={setNewExperiment}
        stockNeeded={stockNeeded}
        setStockNeeded={setStockNeeded}
        searchQuery={searchQuery}
        setSearchQuery={setSearchQuery}
        handleStockChange={handleStockChange}
        experimentId={selectedExperimentId}
        onSuccess={refreshExperiments} // Add this line
      />
    </div>
  );
}
