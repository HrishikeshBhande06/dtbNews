import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { BookOpen, Bookmark, BookmarkCheck, Search, Trash2, ExternalLink, RefreshCw } from 'lucide-react';

const API_BASE_URL = import.meta.env.PROD 
  ? 'https://dtb-news-backend.onrender.com/api' // We will get this URL from Render in Step 2
  : 'http://localhost:5000/api';

function App() {
  const [activeTab, setActiveTab] = useState('today'); // 'today' or 'archive'
  const [articles, setArticles] = useState([]);
  const [archive, setArchive] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);

  const categories = ['All', 'AI', 'Web Dev', 'Mobile', 'Cloud', 'Security', 'DevOps', 'General Tech'];

  // Fetch news based on current view selection
  const fetchData = async () => {
    setLoading(true);
    try {
      if (activeTab === 'today') {
        const response = await axios.get(`${API_BASE_URL}/news`);
        setArticles(response.data.articles || []);
      } else {
        const response = await axios.get(`${API_BASE_URL}/archive`);
        setArchive(response.data.saved || []);
      }
    } catch (error) {
      console.error("Error communicating with backend API:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, [activeTab]);

  // Save an article to archive
  const saveArticle = async (article) => {
    try {
      const response = await axios.post(`${API_BASE_URL}/archive`, article);
      alert("Article safely archived!");
      // If user saved from "today" view, we can track if it is saved locally
      fetchData();
    } catch (error) {
      console.error("Error saving article:", error);
    }
  };

  // Delete an article from archive
  const deleteArticle = async (id) => {
    try {
      await axios.delete(`${API_BASE_URL}/archive/${id}`);
      setArchive(archive.filter(item => item.id !== id));
    } catch (error) {
      console.error("Error removing article:", error);
    }
  };

  // filter logical mapping
  const currentItems = activeTab === 'today' ? articles : archive;
  const filteredArticles = currentItems.filter(art => {
    const matchesCategory = selectedCategory === 'All' || art.category === selectedCategory;
    const matchesSearch = art.title?.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          art.summary?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen font-sans bg-slate-900 text-slate-100">
      {/* Header Banner */}
      <header className="border-b border-slate-800 bg-slate-900/50 backdrop-blur sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 py-4 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-emerald-500/10 text-emerald-400 rounded-lg border border-emerald-500/20">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-xl font-bold tracking-tight bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Daily Tech Brief
              </h1>
              <p className="text-xs text-slate-400">AI-Curated Engineering Insights</p>
            </div>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 bg-slate-950 p-1 rounded-xl border border-slate-800">
            <button 
              onClick={() => { setActiveTab('today'); setSelectedCategory('All'); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'today' ? 'bg-slate-800 text-emerald-400 border border-slate-700/50' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Today's Feed
            </button>
            <button 
              onClick={() => { setActiveTab('archive'); setSelectedCategory('All'); }}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${activeTab === 'archive' ? 'bg-slate-800 text-emerald-400 border border-slate-700/50' : 'text-slate-400 hover:text-slate-200'}`}
            >
              Saved Archive
            </button>
          </div>
        </div>
      </header>

      {/* Control Deck (Search + Filter Categories) */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between mb-8">
          {/* Search Inputs */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-2.5 w-4 h-4 text-slate-500" />
            <input 
              type="text" 
              placeholder="Search briefing items..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-9 pr-4 py-2 text-sm text-slate-200 focus:outline-none focus:border-emerald-500/50 transition-colors"
            />
          </div>

          {/* Category Chips */}
          <div className="flex items-center gap-2 overflow-x-auto w-full md:w-auto pb-2 md:pb-0 no-scrollbar">
            {categories.map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-3 py-1 rounded-full text-xs font-medium whitespace-nowrap border transition-all ${selectedCategory === cat ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30' : 'bg-slate-950 text-slate-400 border-slate-850 hover:border-slate-700'}`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Loading Indicator */}
        {loading && (
          <div className="flex justify-center items-center py-20 text-slate-400 gap-2">
            <RefreshCw className="w-5 h-5 animate-spin" /> Loading brief files...
          </div>
        )}

        {/* Dashboard Grid Feed */}
        {!loading && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredArticles.length > 0 ? (
              filteredArticles.map(art => (
                <div key={art.id} className="bg-slate-950 border border-slate-800/80 rounded-2xl p-6 hover:border-slate-700 transition-all flex flex-col justify-between group">
                  <div>
                    {/* Top Meta info */}
                    <div className="flex justify-between items-start mb-3 gap-2">
                      <span className="px-2.5 py-0.5 bg-slate-900 border border-slate-800 rounded-md text-[11px] font-semibold text-emerald-400 tracking-wide uppercase">
                        {art.category || 'General'}
                      </span>
                      <span className="text-[11px] text-slate-500">{art.source}</span>
                    </div>

                    {/* News Title */}
                    <h3 className="text-md font-bold text-slate-100 group-hover:text-emerald-300 transition-colors mb-3 leading-snug">
                      {art.title}
                    </h3>

                    {/* AI generated Core Summary */}
                    <p className="text-sm text-slate-400 mb-4 leading-relaxed">
                      {art.summary}
                    </p>

                    {/* Context/Why it matters segment */}
                    <div className="bg-slate-900/60 border-l-2 border-teal-500/50 p-3 rounded-r-xl mb-4">
                      <span className="text-[11px] font-bold tracking-wider text-teal-400 block uppercase mb-0.5">Why It Matters:</span>
                      <p className="text-xs text-slate-300 italic">{art.whyItMatters}</p>
                    </div>
                  </div>

                  {/* Operational Action Footer Buttons */}
                  <div className="flex justify-between items-center mt-2 pt-4 border-t border-slate-900">
                    <a 
                      href={art.url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="text-xs text-slate-400 hover:text-slate-200 flex items-center gap-1 font-medium"
                    >
                      Read Context <ExternalLink className="w-3. h-3" />
                    </a>

                    {activeTab === 'today' ? (
                      <button 
                        onClick={() => saveArticle(art)}
                        className="p-2 text-slate-400 hover:text-emerald-400 transition-colors"
                        title="Bookmark Article"
                      >
                        <Bookmark className="w-4 h-4" />
                      </button>
                    ) : (
                      <button 
                        onClick={() => deleteArticle(art.id)}
                        className="p-2 text-slate-400 hover:text-rose-400 transition-colors"
                        title="Delete Article"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            ) : (
              <div className="col-span-full text-center py-20 text-slate-500 text-sm">
                No articles matching selected filter or search parameters.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}

export default App;