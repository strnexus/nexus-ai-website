import React, { useState, useEffect, useMemo } from 'react';
import { Search, Filter, Star, Zap, Clock, DollarSign, Users, Sparkles } from 'lucide-react';

// Types based on our comprehensive schema
interface AITool {
  Tool_ID: string;
  Tool_Name: string;
  Category: string;
  Sub_Category: string;
  Business_Size: string;
  Industry_Focus: string;
  Pain_Point_Addressed: string;
  Pricing_Model: string;
  Starting_Price: string;
  Key_Features: string;
  Integration_Capabilities: string;
  Ease_of_Use: string;
  Setup_Time: string;
  ROI_Potential: string;
  Website: string;
  Description: string;
  Use_Case_Example: string;
  Competitive_Advantage: string;
  Latest_Update: string;
}

interface Filters {
  search: string;
  categories: string[];
  businessSize: string[];
  pricing: string[];
  roi: string[];
  ease: string[];
}

const AIToolsDiscovery: React.FC = () => {
  const [tools, setTools] = useState<AITool[]>([]);
  const [filteredTools, setFilteredTools] = useState<AITool[]>([]);
  const [currentView, setCurrentView] = useState<'home' | 'browse' | 'detail'>('home');
  const [selectedTool, setSelectedTool] = useState<AITool | null>(null);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [filters, setFilters] = useState<Filters>({
    search: '',
    categories: [],
    businessSize: [],
    pricing: [],
    roi: [],
    ease: []
  });

  // Load tools data (this would come from your API/database)
  useEffect(() => {
    // Sample tools data - in production this would be loaded from your database
    const sampleTools: AITool[] = [
      {
        Tool_ID: '001',
        Tool_Name: 'Tidio',
        Category: 'Customer Service & Support',
        Sub_Category: 'AI Chatbots',
        Business_Size: 'Small (6-50)',
        Industry_Focus: 'E-commerce, Service',
        Pain_Point_Addressed: '24/7 customer support, Poor customer response times',
        Pricing_Model: 'Freemium',
        Starting_Price: 'Free + $20/mo',
        Key_Features: 'AI chatbot, Live chat, Multichannel support, 76% don\'t need human transfer',
        Integration_Capabilities: 'Email, Messenger, Website widgets',
        Ease_of_Use: '2',
        Setup_Time: '15 minutes',
        ROI_Potential: 'High',
        Website: 'tidio.com',
        Description: 'AI chatbot that provides 24/7 customer support with easy setup for small businesses',
        Use_Case_Example: 'E-commerce store answering product questions automatically',
        Competitive_Advantage: '76% of users don\'t request transfers to human agents',
        Latest_Update: '2025'
      },
      // Add more tools from the CSV data...
    ];
    
    setTools(sampleTools);
    setFilteredTools(sampleTools);
  }, []);

  // Filter tools based on current filters
  useEffect(() => {
    let filtered = tools;

    if (filters.search) {
      filtered = filtered.filter(tool =>
        tool.Tool_Name.toLowerCase().includes(filters.search.toLowerCase()) ||
        tool.Description.toLowerCase().includes(filters.search.toLowerCase()) ||
        tool.Category.toLowerCase().includes(filters.search.toLowerCase())
      );
    }

    if (filters.categories.length > 0) {
      filtered = filtered.filter(tool => filters.categories.includes(tool.Category));
    }

    if (filters.businessSize.length > 0) {
      filtered = filtered.filter(tool => filters.businessSize.includes(tool.Business_Size));
    }

    if (filters.pricing.length > 0) {
      filtered = filtered.filter(tool => filters.pricing.includes(tool.Pricing_Model));
    }

    if (filters.roi.length > 0) {
      filtered = filtered.filter(tool => filters.roi.includes(tool.ROI_Potential));
    }

    if (filters.ease.length > 0) {
      filtered = filtered.filter(tool => filters.ease.includes(tool.Ease_of_Use));
    }

    setFilteredTools(filtered);
  }, [tools, filters]);

  // Get unique categories for filtering
  const categories = useMemo(() => 
    [...new Set(tools.map(tool => tool.Category))], [tools]
  );

  // Get ease of use text
  const getEaseText = (ease: string) => {
    const easeMap: { [key: string]: string } = {
      '1': 'Very Easy',
      '2': 'Easy',
      '3': 'Moderate',
      '4': 'Complex',
      '5': 'Very Complex'
    };
    return easeMap[ease] || 'Unknown';
  };

  // Toggle favorite
  const toggleFavorite = (toolId: string) => {
    setFavorites(prev => 
      prev.includes(toolId) 
        ? prev.filter(id => id !== toolId)
        : [...prev, toolId]
    );
  };

  // Hero Section Component
  const HeroSection = () => (
    <div className="relative overflow-hidden bg-gradient-to-br from-teal-50 via-blue-50 to-purple-50 dark:from-slate-900 dark:via-slate-800 dark:to-slate-900">
      {/* Subtle background pattern */}
      <div className="absolute inset-0 bg-grid-slate-100 [mask-image:linear-gradient(0deg,white,rgba(255,255,255,0.6))] dark:bg-grid-slate-700/25"></div>
      
      <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-24 sm:py-32">
        <div className="text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-300 mb-6">
            <Sparkles className="w-4 h-4 mr-2" />
            Discover Your Perfect AI Companion
          </div>
          
          <h1 className="text-4xl sm:text-6xl font-bold text-gray-900 dark:text-gray-100 mb-6 tracking-tight">
            <span className="block">Amplify Your</span>
            <span className="block bg-gradient-to-r from-teal-600 to-blue-600 bg-clip-text text-transparent">
              Natural Brilliance
            </span>
          </h1>
          
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto mb-12 leading-relaxed">
            Nova understands your unique business dreams and connects you with AI tools 
            that enhance what you do best. Join thousands of visionary entrepreneurs 
            creating their intelligent future.
          </p>

          {/* Search Bar */}
          <div className="max-w-2xl mx-auto mb-12">
            <div className="relative">
              <Search className="absolute left-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Imagine what's possible... (e.g., 'customer support', 'content creation')"
                className="w-full pl-12 pr-4 py-4 text-lg bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 rounded-2xl shadow-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all duration-200"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6 max-w-4xl mx-auto">
            <div className="text-center p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700">
              <div className="text-3xl font-bold text-teal-600 dark:text-teal-400 mb-2">{tools.length}+</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Curated Tools</div>
            </div>
            <div className="text-center p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700">
              <div className="text-3xl font-bold text-blue-600 dark:text-blue-400 mb-2">{categories.length}</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Categories</div>
            </div>
            <div className="text-center p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700">
              <div className="text-3xl font-bold text-purple-600 dark:text-purple-400 mb-2">100%</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">SMB Focused</div>
            </div>
            <div className="text-center p-6 bg-white/80 dark:bg-slate-800/80 backdrop-blur-sm rounded-2xl border border-gray-200 dark:border-slate-700">
              <div className="text-3xl font-bold text-orange-600 dark:text-orange-400 mb-2">2025</div>
              <div className="text-sm text-gray-600 dark:text-gray-300">Latest Updates</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );

  // Category Grid Component
  const CategoryGrid = () => (
    <div className="py-16 bg-white dark:bg-slate-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-12">
          <h2 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Discover by Purpose
          </h2>
          <p className="text-lg text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            Every category is carefully curated to help you find tools that align with your business dreams
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {categories.map((category, index) => {
            const categoryTools = tools.filter(tool => tool.Category === category);
            const colors = [
              'bg-gradient-to-br from-teal-500 to-teal-600',
              'bg-gradient-to-br from-blue-500 to-blue-600',
              'bg-gradient-to-br from-purple-500 to-purple-600',
              'bg-gradient-to-br from-orange-500 to-orange-600',
              'bg-gradient-to-br from-green-500 to-green-600',
              'bg-gradient-to-br from-pink-500 to-pink-600',
              'bg-gradient-to-br from-indigo-500 to-indigo-600',
              'bg-gradient-to-br from-red-500 to-red-600',
            ];
            
            return (
              <div
                key={category}
                onClick={() => {
                  setFilters(prev => ({ ...prev, categories: [category] }));
                  setCurrentView('browse');
                }}
                className="group cursor-pointer relative overflow-hidden rounded-2xl bg-white dark:bg-slate-800 border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
              >
                <div className={`absolute inset-0 ${colors[index % colors.length]} opacity-5 group-hover:opacity-10 transition-opacity duration-300`}></div>
                <div className="relative p-6">
                  <div className={`w-12 h-12 rounded-xl ${colors[index % colors.length]} flex items-center justify-center mb-4`}>
                    <Zap className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2">
                    {category}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                    Discover {categoryTools.length} tools that transform how you work
                  </p>
                  <div className="flex items-center text-sm text-teal-600 dark:text-teal-400 font-medium group-hover:translate-x-1 transition-transform duration-200">
                    Explore possibilities →
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );

  // Tool Card Component
  const ToolCard = ({ tool }: { tool: AITool }) => {
    const isFavorite = favorites.includes(tool.Tool_ID);
    
    return (
      <div className="group relative bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 overflow-hidden">
        {/* Favorite Button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(tool.Tool_ID);
          }}
          className={`absolute top-4 right-4 z-10 p-2 rounded-full transition-colors duration-200 ${
            isFavorite 
              ? 'bg-yellow-100 text-yellow-600 hover:bg-yellow-200' 
              : 'bg-gray-100 dark:bg-slate-700 text-gray-400 hover:text-yellow-500 hover:bg-yellow-50 dark:hover:bg-slate-600'
          }`}
        >
          <Star className={`w-4 h-4 ${isFavorite ? 'fill-current' : ''}`} />
        </button>

        <div 
          className="p-6 cursor-pointer"
          onClick={() => {
            setSelectedTool(tool);
            setCurrentView('detail');
          }}
        >
          {/* Tool Header */}
          <div className="mb-4">
            <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100 mb-2 pr-8">
              {tool.Tool_Name}
            </h3>
            <div className="text-sm text-teal-600 dark:text-teal-400 font-medium mb-2">
              {tool.Category}
            </div>
            <p className="text-gray-600 dark:text-gray-300 text-sm leading-relaxed">
              {tool.Description}
            </p>
          </div>

          {/* Metadata */}
          <div className="flex flex-wrap gap-2 mb-4">
            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300">
              <Users className="w-3 h-3 mr-1" />
              {tool.Business_Size}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300">
              <Clock className="w-3 h-3 mr-1" />
              {tool.Setup_Time}
            </span>
            <span className="inline-flex items-center px-2 py-1 rounded-lg text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-300">
              {getEaseText(tool.Ease_of_Use)}
            </span>
          </div>

          {/* Pricing */}
          <div className="flex items-center justify-between">
            <div className="flex items-center text-lg font-semibold text-gray-900 dark:text-gray-100">
              <DollarSign className="w-4 h-4 mr-1 text-green-600" />
              {tool.Starting_Price}
            </div>
            <div className={`px-3 py-1 rounded-full text-xs font-medium ${
              tool.ROI_Potential === 'High' 
                ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300'
                : tool.ROI_Potential === 'Medium'
                ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300'
                : 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-300'
            }`}>
              {tool.ROI_Potential} ROI Potential
            </div>
          </div>

          {/* Features Preview */}
          <div className="mt-4 pt-4 border-t border-gray-200 dark:border-slate-700">
            <p className="text-sm text-gray-500 dark:text-gray-400 line-clamp-2">
              {tool.Key_Features.split(',').slice(0, 3).join(', ')}...
            </p>
          </div>
        </div>
      </div>
    );
  };

  // Filters Sidebar Component
  const FiltersSidebar = () => (
    <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 p-6 h-fit sticky top-24">
      <div className="flex items-center justify-between mb-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100">Refine Your Search</h3>
        <button
          onClick={() => setFilters({
            search: '',
            categories: [],
            businessSize: [],
            pricing: [],
            roi: [],
            ease: []
          })}
          className="text-sm text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
        >
          Clear All
        </button>
      </div>

      <div className="space-y-6">
        {/* Search */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Search Tools
          </label>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
            <input
              type="text"
              placeholder="Search by name or purpose..."
              className="w-full pl-10 pr-3 py-2 border border-gray-300 dark:border-slate-600 rounded-lg focus:ring-2 focus:ring-teal-500 focus:border-transparent dark:bg-slate-700 dark:text-gray-100"
              value={filters.search}
              onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
            />
          </div>
        </div>

        {/* Categories */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Category
          </label>
          <div className="space-y-2 max-h-40 overflow-y-auto">
            {categories.map(category => (
              <label key={category} className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  checked={filters.categories.includes(category)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters(prev => ({ ...prev, categories: [...prev.categories, category] }));
                    } else {
                      setFilters(prev => ({ ...prev, categories: prev.categories.filter(c => c !== category) }));
                    }
                  }}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{category}</span>
              </label>
            ))}
          </div>
        </div>

        {/* Business Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Business Size
          </label>
          <div className="space-y-2">
            {['Small (6-50)', 'Medium (51-200)', 'Micro (1-5)'].map(size => (
              <label key={size} className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  checked={filters.businessSize.includes(size)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters(prev => ({ ...prev, businessSize: [...prev.businessSize, size] }));
                    } else {
                      setFilters(prev => ({ ...prev, businessSize: prev.businessSize.filter(s => s !== size) }));
                    }
                  }}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{size}</span>
              </label>
            ))}
          </div>
        </div>

        {/* ROI Potential */}
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
            Growth Impact
          </label>
          <div className="space-y-2">
            {['High', 'Medium', 'Low'].map(roi => (
              <label key={roi} className="flex items-center">
                <input
                  type="checkbox"
                  className="rounded border-gray-300 text-teal-600 focus:ring-teal-500"
                  checked={filters.roi.includes(roi)}
                  onChange={(e) => {
                    if (e.target.checked) {
                      setFilters(prev => ({ ...prev, roi: [...prev.roi, roi] }));
                    } else {
                      setFilters(prev => ({ ...prev, roi: prev.roi.filter(r => r !== roi) }));
                    }
                  }}
                />
                <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">{roi} Potential</span>
              </label>
            ))}
          </div>
        </div>
      </div>
    </div>
  );

  // Tool Detail View Component
  const ToolDetailView = () => {
    if (!selectedTool) return null;

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <button
          onClick={() => setCurrentView('browse')}
          className="mb-8 inline-flex items-center text-teal-600 hover:text-teal-700 dark:text-teal-400 dark:hover:text-teal-300"
        >
          ← Back to Discovery
        </button>

        <div className="bg-white dark:bg-slate-800 rounded-2xl border border-gray-200 dark:border-slate-700 overflow-hidden">
          {/* Header */}
          <div className="px-8 py-8 border-b border-gray-200 dark:border-slate-700">
            <div className="flex items-start justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  {selectedTool.Tool_Name}
                </h1>
                <p className="text-lg text-teal-600 dark:text-teal-400 mb-4">
                  {selectedTool.Category} • {selectedTool.Sub_Category}
                </p>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {selectedTool.Description}
                </p>
              </div>
              <div className="text-right">
                <div className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-1">
                  {selectedTool.Starting_Price}
                </div>
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedTool.Pricing_Model}
                </div>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="p-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Left Column */}
            <div className="space-y-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  What It Does for You
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {selectedTool.Use_Case_Example}
                </p>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Key Capabilities
                </h3>
                <div className="space-y-2">
                  {selectedTool.Key_Features.split(',').map((feature, index) => (
                    <div key={index} className="flex items-center">
                      <div className="w-2 h-2 bg-teal-500 rounded-full mr-3"></div>
                      <span className="text-gray-700 dark:text-gray-300">{feature.trim()}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Why It's Special
                </h3>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                  {selectedTool.Competitive_Advantage}
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              <div className="bg-gradient-to-br from-teal-50 to-blue-50 dark:from-slate-700/50 dark:to-slate-600/50 rounded-xl p-6">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Perfect For Your Business
                </h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Business Size:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{selectedTool.Business_Size}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Best For:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{selectedTool.Industry_Focus}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Ease of Use:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{getEaseText(selectedTool.Ease_of_Use)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Setup Time:</span>
                    <span className="font-medium text-gray-900 dark:text-gray-100">{selectedTool.Setup_Time}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-300">Growth Potential:</span>
                    <span className={`font-medium ${
                      selectedTool.ROI_Potential === 'High' ? 'text-green-600 dark:text-green-400' :
                      selectedTool.ROI_Potential === 'Medium' ? 'text-yellow-600 dark:text-yellow-400' :
                      'text-gray-600 dark:text-gray-400'
                    }`}>{selectedTool.ROI_Potential}</span>
                  </div>
                </div>
              </div>

              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-3">
                  Connects With
                </h3>
                <p className="text-gray-600 dark:text-gray-300 mb-4">
                  {selectedTool.Integration_Capabilities}
                </p>
                
                <div className="flex gap-3">
                  <a
                    href={`https://${selectedTool.Website}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 bg-teal-600 hover:bg-teal-700 text-white px-6 py-3 rounded-lg font-medium text-center transition-colors duration-200"
                  >
                    Explore {selectedTool.Tool_Name}
                  </a>
                  <button
                    onClick={() => toggleFavorite(selectedTool.Tool_ID)}
                    className={`px-4 py-3 rounded-lg border transition-colors duration-200 ${
                      favorites.includes(selectedTool.Tool_ID)
                        ? 'bg-yellow-50 border-yellow-300 text-yellow-700 hover:bg-yellow-100'
                        : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-slate-700 dark:border-slate-600 dark:text-gray-300 dark:hover:bg-slate-600'
                    }`}
                  >
                    <Star className={`w-5 h-5 ${favorites.includes(selectedTool.Tool_ID) ? 'fill-current' : ''}`} />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  };

  // Main render based on current view
  if (currentView === 'detail') {
    return <ToolDetailView />;
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-slate-900">
      {/* Navigation */}
      <nav className="bg-white dark:bg-slate-800 border-b border-gray-200 dark:border-slate-700 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center">
              <div className="text-2xl font-bold text-teal-600 dark:text-teal-400">
                AI Discovery
              </div>
              <div className="hidden md:block ml-8">
                <div className="flex items-baseline space-x-4">
                  <button
                    onClick={() => setCurrentView('home')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      currentView === 'home' 
                        ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100'
                    }`}
                  >
                    Home
                  </button>
                  <button
                    onClick={() => setCurrentView('browse')}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors duration-200 ${
                      currentView === 'browse' 
                        ? 'bg-teal-100 text-teal-700 dark:bg-teal-900/30 dark:text-teal-300' 
                        : 'text-gray-500 hover:text-gray-700 dark:text-gray-300 dark:hover:text-gray-100'
                    }`}
                  >
                    Browse Tools
                  </button>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {favorites.length > 0 && (
                <div className="text-sm text-gray-500 dark:text-gray-400">
                  {favorites.length} saved
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* Content */}
      {currentView === 'home' ? (
        <>
          <HeroSection />
          <CategoryGrid />
        </>
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col lg:flex-row gap-8">
            {/* Filters Sidebar */}
            <div className="lg:w-80 flex-shrink-0">
              <FiltersSidebar />
            </div>

            {/* Tools Grid */}
            <div className="flex-1">
              <div className="mb-6">
                <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Discover Your Perfect Tools
                </h2>
                <p className="text-gray-600 dark:text-gray-300">
                  {filteredTools.length} tools ready to amplify your business potential
                </p>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredTools.map(tool => (
                  <ToolCard key={tool.Tool_ID} tool={tool} />
                ))}
              </div>

              {filteredTools.length === 0 && (
                <div className="text-center py-12">
                  <div className="text-gray-400 text-6xl mb-4">🔍</div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
                    No tools found
                  </h3>
                  <p className="text-gray-500 dark:text-gray-400">
                    Try adjusting your search criteria to discover more possibilities
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AIToolsDiscovery;