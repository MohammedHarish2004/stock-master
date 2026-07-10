import { useState, useEffect } from 'react';
import { Tags, Plus, Trash2 } from 'lucide-react';
import toast from 'react-hot-toast';
import { socket } from '../socket';

const Categories = () => {
  const [categories, setCategories] = useState([]);
  const [newCategory, setNewCategory] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    fetchCategories();
    socket.on('category-updated', fetchCategories);
    return () => socket.off('category-updated', fetchCategories);
  }, []);

  const fetchCategories = async () => {
    try {
      const res = await fetch('/api/categories');
      const data = await res.json();
      setCategories(data);
    } catch (error) {
      toast.error('Failed to load categories');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!newCategory.trim()) return;
    
    setIsSaving(true);
    try {
      const res = await fetch('/api/categories', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: newCategory.trim() })
      });
      if (res.ok) {
        toast.success('Category added');
        setNewCategory('');
      } else {
        toast.error('Failed to add category');
      }
    } catch (error) {
      toast.error('Network error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Are you sure you want to delete this category?')) return;
    try {
      const res = await fetch(`/api/categories/${id}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Category deleted');
      } else {
        toast.error('Failed to delete category');
      }
    } catch (error) {
      toast.error('Network error');
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="bg-[#00868e]/5 p-6 border-b border-gray-100 flex items-center space-x-3">
          <div className="bg-[#00868e] p-2 rounded-xl">
            <Tags className="text-white w-6 h-6" />
          </div>
          <div>
            <h2 className="text-xl font-bold text-gray-800">Manage Categories</h2>
            <p className="text-sm text-gray-500">Add or remove product categories.</p>
          </div>
        </div>
        
        <div className="p-6">
          <form onSubmit={handleSubmit} className="flex gap-4 mb-8">
            <input 
              type="text" 
              value={newCategory} 
              onChange={e => setNewCategory(e.target.value)}
              placeholder="New Category Name"
              className="flex-1 px-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-[#00868e]/20 focus:border-[#00868e] transition-colors focus:bg-white outline-none"
              required
            />
            <button type="submit" disabled={isSaving} className="px-6 py-3 bg-[#00868e] text-white font-medium rounded-xl hover:bg-[#00868e]/80 flex items-center">
              <Plus className="w-5 h-5 mr-2" /> Add
            </button>
          </form>

          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
            {categories.map(cat => (
              <div key={cat.id} className="flex justify-between items-center bg-gray-50 border border-gray-200 p-4 rounded-xl">
                <span className="font-medium text-gray-700">{cat.name}</span>
                <button onClick={() => handleDelete(cat.id)} className="text-danger hover:bg-red-100 p-2 rounded-lg">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
            {categories.length === 0 && <p className="text-gray-500 text-sm col-span-3">No categories found. Add one above.</p>}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Categories;
