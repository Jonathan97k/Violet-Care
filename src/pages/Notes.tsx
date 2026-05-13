import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  getAllNotes,
  addNote,
  updateNote,
  deleteNote,
  getPinnedNotes,
} from '../utils/db';
import { track } from '../utils/track';
import type { Note } from '../types';

function generateId(): string {
  return Date.now().toString(36) + Math.random().toString(36).substr(2);
}

type SortOption = 'recent' | 'pinned' | 'category';
type Category = 'work' | 'personal' | 'clinical' | 'ideas';

const Notes = () => {
  const [notes, setNotes] = useState<Note[]>([]);
  const [filteredNotes, setFilteredNotes] = useState<Note[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [categoryFilter, setCategoryFilter] = useState<Category | 'all'>('all');
  const [isEditing, setIsEditing] = useState(false);
  const [editingNote, setEditingNote] = useState<Note | null>(null);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<Category>('personal');
  const [autoSaveTimer, setAutoSaveTimer] = useState<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    loadNotes();
  }, []);

  useEffect(() => {
    filterAndSortNotes();
  }, [notes, searchQuery, sortBy, categoryFilter]);

  useEffect(() => {
    if (isEditing && (title || content)) {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
      const timer = setTimeout(() => {
        handleAutoSave();
      }, 3000);
      setAutoSaveTimer(timer);
    }
    return () => {
      if (autoSaveTimer) clearTimeout(autoSaveTimer);
    };
  }, [title, content, category, isEditing]);

  const loadNotes = async () => {
    try {
      const allNotes = await getAllNotes();
      setNotes(allNotes);
    } catch (error) {
      console.error('Failed to load notes:', error);
    }
  };

  const filterAndSortNotes = async () => {
    let filtered = [...notes];

    if (searchQuery) {
      filtered = filtered.filter(
        (note) =>
          note.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          note.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    if (categoryFilter !== 'all') {
      filtered = filtered.filter((note) => note.category === categoryFilter);
    }

    switch (sortBy) {
      case 'pinned':
        const pinned = await getPinnedNotes();
        filtered = [
          ...pinned.filter((n) => filtered.some((f) => f.id === n.id)),
          ...filtered.filter((n) => !n.isPinned),
        ];
        break;
      case 'category':
        filtered.sort((a, b) => a.category.localeCompare(b.category));
        break;
      case 'recent':
      default:
        filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
        break;
    }

    setFilteredNotes(filtered);
  };

  const handleAutoSave = async () => {
    if (editingNote && (title || content)) {
      try {
        const updatedNote: Note = {
          ...editingNote,
          title: title || 'Untitled',
          content,
          category,
          updatedAt: new Date().toISOString(),
        };
        await updateNote(updatedNote);
        setEditingNote(updatedNote);
        await loadNotes();
      } catch (error) {
        console.error('Failed to auto-save note:', error);
      }
    }
  };

  const handleCreateNote = async () => {
    try {
      const newNote: Note = {
        id: generateId(),
        title: 'Untitled',
        content: '',
        category: 'personal',
        isPinned: false,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      await addNote(newNote);
      track('Notes', 'note_created');
      setEditingNote(newNote);
      setTitle('');
      setContent('');
      setCategory('personal');
      setIsEditing(true);
      await loadNotes();
    } catch (error) {
      console.error('Failed to create note:', error);
    }
  };

  const handleEditNote = (note: Note) => {
    setEditingNote(note);
    setTitle(note.title);
    setContent(note.content);
    setCategory(note.category);
    setIsEditing(true);
  };

  const handleSaveNote = async () => {
    if (!editingNote) return;

    try {
      const updatedNote: Note = {
        ...editingNote,
        title: title || 'Untitled',
        content,
        category,
        updatedAt: new Date().toISOString(),
      };
      await updateNote(updatedNote);
      track('Notes', 'note_updated');
      setEditingNote(null);
      setIsEditing(false);
      setTitle('');
      setContent('');
      setCategory('personal');
      await loadNotes();
    } catch (error) {
      console.error('Failed to save note:', error);
    }
  };

  const handleDeleteNote = async (id: string) => {
    try {
      await deleteNote(id);
      track('Notes', 'note_deleted');
      await loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
    }
  };

  const handleTogglePin = async (note: Note) => {
    try {
      const updatedNote: Note = {
        ...note,
        isPinned: !note.isPinned,
        updatedAt: new Date().toISOString(),
      };
      await updateNote(updatedNote);
      await loadNotes();
    } catch (error) {
      console.error('Failed to toggle pin:', error);
    }
  };

  const handleCancelEdit = () => {
    setEditingNote(null);
    setIsEditing(false);
    setTitle('');
    setContent('');
    setCategory('personal');
  };

  const getCategoryColor = (cat: Category) => {
    const colors = {
      work: 'bg-violet-500/20 text-violet-300',
      personal: 'bg-rose-400/20 text-rose-300',
      clinical: 'bg-blue-400/20 text-blue-300',
      ideas: 'bg-amber-400/20 text-amber-300',
    };
    return colors[cat];
  };

  const containerVariants = {
    animate: {
      transition: {
        staggerChildren: 0.07,
      },
    },
  };

  const itemVariants = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
  };

  if (isEditing) {
    return (
      <div className="min-h-screen pb-24 px-6 pt-6">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6"
        >
          <button
            onClick={handleCancelEdit}
            className="text-violet-300 font-dm-sans mb-4 block hover:text-white transition-colors"
          >
            ← Back
          </button>
          <h1 className="text-3xl font-playfair font-semibold text-white mb-2">
            {editingNote?.title || 'New Note'}
          </h1>
          <p className="text-violet-300 font-dm-sans text-sm">
            Auto-saves every 3 seconds
          </p>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="space-y-4"
        >
          <div>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Note title..."
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white text-xl font-playfair focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
            />
          </div>

          <div>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as Category)}
              className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white font-dm-sans focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
            >
              <option value="work">Work</option>
              <option value="personal">Personal</option>
              <option value="clinical">Clinical</option>
              <option value="ideas">Ideas</option>
            </select>
          </div>

          <div>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="Start writing..."
              className="w-full min-h-[400px] px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white font-dm-sans focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none resize-none"
            />
            <p className="text-violet-300 font-dm-sans text-sm mt-2 text-right">
              {content.length} characters
            </p>
          </div>

          <div className="flex gap-3">
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleSaveNote}
              className="flex-1 px-6 py-3 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-dm-sans font-medium shadow-glow transition-all"
            >
              Save Note
            </motion.button>
            <motion.button
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
              onClick={handleCancelEdit}
              className="px-6 py-3 bg-white/10 hover:bg-white/20 border border-white/20 text-white rounded-2xl font-dm-sans font-medium transition-all"
            >
              Cancel
            </motion.button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-24 px-6 pt-6">
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-6"
      >
        <h1 className="text-3xl font-playfair font-semibold text-white mb-2">
          Notes
        </h1>
        <p className="text-violet-300 font-dm-sans">
          {filteredNotes.length} {filteredNotes.length === 1 ? 'note' : 'notes'}
        </p>
      </motion.div>

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="mb-6 space-y-4"
      >
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search notes..."
          className="w-full px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white font-dm-sans focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
        />

        <div className="flex gap-3 flex-wrap">
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value as SortOption)}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white font-dm-sans focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
          >
            <option value="recent">Recent</option>
            <option value="pinned">Pinned</option>
            <option value="category">Category</option>
          </select>

          <select
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value as Category | 'all')}
            className="flex-1 px-4 py-3 bg-white/10 border border-white/20 rounded-2xl text-white font-dm-sans focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 outline-none"
          >
            <option value="all">All Categories</option>
            <option value="work">Work</option>
            <option value="personal">Personal</option>
            <option value="clinical">Clinical</option>
            <option value="ideas">Ideas</option>
          </select>
        </div>
      </motion.div>

      <motion.button
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.2 }}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={handleCreateNote}
        className="w-full mb-6 px-6 py-4 bg-violet-600 hover:bg-violet-500 text-white rounded-2xl font-dm-sans font-medium shadow-glow transition-all"
      >
        + Create New Note
      </motion.button>

      {filteredNotes.length === 0 ? (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="glass-card p-8 text-center"
        >
          <p className="text-xl font-playfair text-white mb-2">
            A blank page, full of possibility
          </p>
          <p className="text-violet-300 font-dm-sans">
            Create your first note to get started
          </p>
        </motion.div>
      ) : (
        <motion.div
          variants={containerVariants}
          initial="initial"
          animate="animate"
          className="space-y-3"
        >
          <AnimatePresence>
            {filteredNotes.map((note) => (
              <motion.div
                key={note.id}
                variants={itemVariants}
                layout
                whileHover={{ scale: 1.02 }}
                onClick={() => handleEditNote(note)}
                className="glass-card p-4 cursor-pointer relative"
              >
                {note.isPinned && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    className="absolute top-4 right-4 text-violet-400"
                  >
                    📌
                  </motion.div>
                )}
                <div className="mb-2">
                  <span
                    className={`px-2 py-1 rounded-lg text-xs font-dm-sans font-medium ${getCategoryColor(note.category)}`}
                  >
                    {note.category}
                  </span>
                </div>
                <h3 className="text-lg font-playfair font-semibold text-white mb-2">
                  {note.title}
                </h3>
                <p className="text-violet-200 font-dm-sans text-sm line-clamp-2">
                  {note.content || 'No content'}
                </p>
                <p className="text-violet-300 font-dm-sans text-xs mt-3">
                  {new Date(note.updatedAt).toLocaleDateString()}
                </p>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleTogglePin(note);
                  }}
                  className="absolute bottom-4 right-4 text-violet-300 hover:text-violet-400 transition-colors"
                >
                  {note.isPinned ? '📌' : '📍'}
                </motion.button>
                <motion.button
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (confirm('Delete this note?')) {
                      handleDeleteNote(note.id);
                    }
                  }}
                  className="absolute bottom-4 right-12 text-violet-300 hover:text-rose-400 transition-colors"
                >
                  🗑️
                </motion.button>
              </motion.div>
            ))}
          </AnimatePresence>
        </motion.div>
      )}
    </div>
  );
};

export default Notes;
