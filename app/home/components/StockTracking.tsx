'use client';
import { useEffect, useState } from 'react';
import Swal from 'sweetalert2';

interface Stock {
  id: string;
  name: string;
  description: string;
  stockLevel: number;
  unit: string;
  lowStockThreshold: number;
}

interface StockFormData {
  name: string;
  description: string;
  stockLevel: number;
  unit: string;
  lowStockThreshold: number;
}

export default function StockTracking() {
  const [stocks, setStocks] = useState<Stock[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [editingStock, setEditingStock] = useState<Stock | null>(null);
  const [formData, setFormData] = useState<StockFormData>({
    name: '',
    description: '',
    stockLevel: 0,
    unit: 'units',
    lowStockThreshold: 5,
  });
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchStocks();
  }, []);

  const fetchStocks = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/inventory');
      if (!response.ok) {
        throw new Error('Failed to fetch inventory');
      }
      const inventory = await response.json();
      setStocks(inventory);
    } catch (error) {
      console.error('Error fetching inventory:', error);
      setError('Failed to load inventory');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (stock: Stock) => {
    setEditingStock(stock);
    setFormData({
      name: stock.name,
      description: stock.description,
      stockLevel: stock.stockLevel,
      unit: stock.unit,
      lowStockThreshold: stock.lowStockThreshold,
    });
    setIsModalOpen(true);
  };

  const handleAdd = () => {
    setEditingStock(null);
    setFormData({
      name: '',
      description: '',
      stockLevel: 0,
      unit: 'units',
      lowStockThreshold: 10,
    });
    setIsModalOpen(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const response = await fetch('/api/inventory', {
        method: editingStock ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...(editingStock && { id: editingStock.id }),
          ...formData,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Failed to save inventory item');
      }

      await fetchStocks();
      setIsModalOpen(false);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to save inventory item'
      );
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const confirmResult = await Swal.fire({
        title: 'Are you sure?',
        text: "You won't be able to revert this!",
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#ef4444', // red-500
        cancelButtonColor: '#4b5563', // gray-600
        confirmButtonText: 'Yes, delete it!',
        customClass: {
          popup: 'bg-gray-800 text-gray-200',
          confirmButton: 'bg-red-500 hover:bg-red-600',
          cancelButton: 'bg-gray-600 hover:bg-gray-700',
        },
      });

      if (confirmResult.isConfirmed) {
        const response = await fetch(`/api/inventory`, {
          method: 'DELETE',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ id }),
        });

        if (!response.ok) {
          throw new Error('Failed to delete inventory item');
        }

        await fetchStocks();
        setIsModalOpen(false);

        await Swal.fire({
          title: 'Deleted!',
          text: 'The item has been deleted.',
          icon: 'success',
          customClass: {
            popup: 'bg-gray-800 text-gray-200',
            confirmButton: 'bg-blue-500 hover:bg-blue-600',
          },
        });
      }
    } catch (err) {
      Swal.fire({
        title: 'Error!',
        text: err instanceof Error ? err.message : 'Failed to delete item',
        icon: 'error',
        customClass: {
          popup: 'bg-gray-800 text-gray-200',
          confirmButton: 'bg-blue-500 hover:bg-blue-600',
        },
      });
    }
  };

  const filteredStocks = stocks.filter(
    (stock) =>
      stock.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.description.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className='col-span-1 row-span-1 flex h-full flex-col rounded bg-gray-800 p-4 shadow'>
      {' '}
      {/* Added flex and h-full */}
      <div className='mb-4 space-y-4'>
        {' '}
        {/* Added space-y-4 for vertical spacing */}
        <div className='flex items-center justify-between'>
          <h2 className='text-xl font-bold'>Stock Tracking</h2>
          <button
            onClick={handleAdd}
            className='flex items-center gap-2 rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600'
          >
            <svg
              xmlns='http://www.w3.org/2000/svg'
              className='h-5 w-5'
              viewBox='0 0 20 20'
              fill='currentColor'
            >
              <path
                fillRule='evenodd'
                d='M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z'
                clipRule='evenodd'
              />
            </svg>
            Add Stock
          </button>
        </div>
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
            placeholder='Search inventory...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className='w-full border-0 bg-transparent text-white placeholder-gray-400 focus:outline-none focus:ring-0'
          />
        </div>
      </div>
      {loading ? (
        <div className='py-4 text-center'>Loading inventory...</div>
      ) : error ? (
        <div className='py-4 text-center text-red-500'>{error}</div>
      ) : filteredStocks.length === 0 ? (
        <div className='py-4 text-center text-gray-400'>
          {stocks.length === 0
            ? 'No items in inventory'
            : 'No matching items found'}
        </div>
      ) : (
        <div className='-mx-4 flex-1 overflow-y-auto px-4'>
          {' '}
          {/* Scroll container */}
          <ul className='min-w-full space-y-2'>
            {filteredStocks.map((stock) => (
              <li
                key={stock.id}
                className='flex items-center justify-between rounded-md border border-gray-700 px-2 py-3 hover:bg-gray-700/30'
              >
                <div>
                  <div className='font-medium'>{stock.name}</div>
                  <div className='text-sm text-gray-400'>
                    Stock: {stock.stockLevel} {stock.unit}
                    {stock.stockLevel <= stock.lowStockThreshold && (
                      <span className='ml-2 text-yellow-500'>(Low Stock)</span>
                    )}
                  </div>
                  <div className='text-sm text-gray-400'>
                    {stock.description}
                  </div>
                </div>
                <button
                  onClick={() => handleEdit(stock)}
                  className='rounded bg-gray-700 px-3 py-1 text-sm transition-colors hover:bg-gray-600'
                >
                  Edit
                </button>
              </li>
            ))}
          </ul>
        </div>
      )}
      {/* Add/Edit Modal */}
      {isModalOpen && (
        <div className='fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50'>
          <div className='w-full max-w-md rounded-lg bg-gray-800 p-6 shadow-xl'>
            <div className='mb-4 flex items-center justify-between'>
              <h3 className='text-xl font-bold'>
                {editingStock ? 'Edit Stock' : 'Add Stock'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className='text-gray-400 hover:text-white'
              >
                <svg
                  xmlns='http://www.w3.org/2000/svg'
                  className='h-6 w-6'
                  fill='none'
                  viewBox='0 0 24 24'
                  stroke='currentColor'
                >
                  <path
                    strokeLinecap='round'
                    strokeLinejoin='round'
                    strokeWidth={2}
                    d='M6 18L18 6M6 6l12 12'
                  />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit} className='space-y-4'>
              <div>
                <label className='mb-1 block text-sm font-medium text-gray-400'>
                  Item Name
                </label>
                <input
                  type='text'
                  value={formData.name}
                  onChange={(e) =>
                    setFormData({ ...formData, name: e.target.value })
                  }
                  className='w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  required
                />
              </div>

              <div>
                <label className='mb-1 block text-sm font-medium text-gray-400'>
                  Description
                </label>
                <textarea
                  value={formData.description}
                  onChange={(e) =>
                    setFormData({ ...formData, description: e.target.value })
                  }
                  className='w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  required
                />
              </div>

              <div>
                <label className='mb-1 block text-sm font-medium text-gray-400'>
                  Quantity
                </label>
                <input
                  type='number'
                  value={formData.stockLevel}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      stockLevel: parseInt(e.target.value) || 0,
                    })
                  }
                  min='0'
                  className='w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  required
                />
              </div>

              <div>
                <label className='mb-1 block text-sm font-medium text-gray-400'>
                  Unit
                </label>
                <input
                  type='text'
                  value={formData.unit}
                  onChange={(e) =>
                    setFormData({ ...formData, unit: e.target.value })
                  }
                  className='w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  required
                  placeholder='e.g., units, kg, liters'
                />
              </div>

              <div>
                <label className='mb-1 block text-sm font-medium text-gray-400'>
                  Low Stock Threshold
                </label>
                <input
                  type='number'
                  value={formData.lowStockThreshold}
                  onChange={(e) =>
                    setFormData({
                      ...formData,
                      lowStockThreshold: parseInt(e.target.value) || 0,
                    })
                  }
                  min='0'
                  className='w-full rounded-md border border-gray-600 bg-gray-700 px-3 py-2 focus:border-blue-500 focus:ring-1 focus:ring-blue-500'
                  required
                />
              </div>

              <div className='mt-6 flex gap-3'>
                <button
                  type='submit'
                  className='flex-1 rounded-md bg-blue-500 px-4 py-2 text-white transition-colors hover:bg-blue-600'
                >
                  {editingStock ? 'Save Changes' : 'Add Item'}
                </button>
                <button
                  type='button'
                  onClick={() => setIsModalOpen(false)}
                  className='flex-1 rounded-md bg-gray-600 px-4 py-2 text-white transition-colors hover:bg-gray-700'
                >
                  Cancel
                </button>
                {editingStock && (
                  <button
                    type='button'
                    onClick={() => handleDelete(editingStock.id)}
                    className='flex-1 rounded-md bg-red-500 px-4 py-2 text-white transition-colors hover:bg-red-600'
                  >
                    Delete
                  </button>
                )}
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
