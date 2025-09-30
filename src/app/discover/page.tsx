'use client'

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  MagnifyingGlassIcon, 
  FunnelIcon, 
  StarIcon,
  GlobeAltIcon,
  SparklesIcon,
  CurrencyDollarIcon
} from '@heroicons/react/24/outline'
import { StarIcon as StarSolidIcon } from '@heroicons/react/24/solid'
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import VoiceAgent from '@/components/ui/VoiceAgent'

interface AITool {
  id: string
  slug: string
  name: string
  description: string
  website: string
  logo?: string
  screenshot?: string
  categories: Array<{
    id: string
    name: string
    slug: string
    icon: string
    color: string
  }>
  industries: Array<{
    id: string
    name: string
    slug: string
    icon: string
  }>
  pricing: {
    name: string
    price: number | null
    currency: string
    billingCycle: string
    isFree: boolean
  } | null
  features: string[]
  useCases: string[]
  tags: string[]
  qualityScore: number
  smbRelevanceScore: number
}

interface Filters {
  search: string
  category: string
  industry: string
  priceRange: string
}

export default function DiscoverPage() {
  const [tools, setTools] = useState<AITool[]>([])
  const [categories, setCategories] = useState<any[]>([])
  const [industries, setIndustries] = useState<any[]>([])
  const [filters, setFilters] = useState<Filters>({
    search: '',
    category: '',
    industry: '',
    priceRange: ''
  })
  const [loading, setLoading] = useState(true)
  const [showFilters, setShowFilters] = useState(false)

  useEffect(() => {
    fetchTools()
    fetchMetadata()
  }, [filters.category, filters.industry])

  const fetchTools = async () => {
    try {
      setLoading(true)
      const params = new URLSearchParams({
        limit: '24'
      })
      
      if (filters.category) params.append('category', filters.category)
      if (filters.industry) params.append('industry', filters.industry)
      
      const response = await fetch(`/api/tools?${params}`)
      const data = await response.json()
      setTools(data.tools || [])
    } catch (error) {
      console.error('Error fetching tools:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchMetadata = async () => {
    try {
      const [categoriesRes, industriesRes] = await Promise.all([
        fetch('/api/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'categories' })
        }),
        fetch('/api/tools', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ action: 'industries' })
        })
      ])

      const categoriesData = await categoriesRes.json()
      const industriesData = await industriesRes.json()

      setCategories(categoriesData.categories || [])
      setIndustries(industriesData.industries || [])
    } catch (error) {
      console.error('Error fetching metadata:', error)
    }
  }

  const filteredTools = tools.filter(tool => {
    if (filters.search) {
      const search = filters.search.toLowerCase()
      return (
        tool.name.toLowerCase().includes(search) ||
        tool.description.toLowerCase().includes(search) ||
        tool.features.some(f => f.toLowerCase().includes(search))
      )
    }
    return true
  })

  const getPriceDisplay = (pricing: AITool['pricing']) => {
    if (!pricing) return 'Contact for Pricing'
    if (pricing.isFree) return 'Free'
    if (pricing.price === null) return 'Custom Pricing'
    return `$${pricing.price}/${pricing.billingCycle}`
  }

  const getPriceColor = (pricing: AITool['pricing']) => {
    if (!pricing || pricing.price === null) return 'text-gray-600'
    if (pricing.isFree) return 'text-green-600'
    if (pricing.price < 50) return 'text-blue-600'
    return 'text-purple-600'
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header />
      
      {/* Hero Section */}
      <section className="pt-20 pb-12">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-5xl">
              Discover Your
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {' '}Perfect AI Tools{' '}
              </span>
            </h1>
            <p className="mt-4 text-lg text-gray-600 max-w-3xl mx-auto">
              Explore our curated collection of {tools.length} AI tools designed to amplify what you do best. 
              Each tool is personally selected for small and medium businesses.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Search and Filters */}
      <section className="pb-8">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="bg-white rounded-2xl shadow-sm border border-gray-200 p-6">
            {/* Search Bar */}
            <div className="relative mb-6">
              <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
              <input
                type="text"
                placeholder="Search AI tools, features, or use cases..."
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                value={filters.search}
                onChange={(e) => setFilters(prev => ({ ...prev, search: e.target.value }))}
              />
            </div>

            {/* Filter Toggle */}
            <div className="flex items-center justify-between mb-4">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center gap-2 px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                <FunnelIcon className="h-4 w-4" />
                Filters
                {(filters.category || filters.industry) && (
                  <span className="bg-indigo-100 text-indigo-800 text-xs px-2 py-1 rounded-full">
                    Active
                  </span>
                )}
              </button>
              
              <div className="text-sm text-gray-600">
                {filteredTools.length} tools found
              </div>
            </div>

            {/* Filters Panel */}
            {showFilters && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-4 border-t border-gray-200"
              >
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Category
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => setFilters(prev => ({ ...prev, category: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Categories</option>
                    {categories.map(cat => (
                      <option key={cat.id} value={cat.slug}>
                        {cat.icon} {cat.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Industry
                  </label>
                  <select
                    value={filters.industry}
                    onChange={(e) => setFilters(prev => ({ ...prev, industry: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Industries</option>
                    {industries.map(ind => (
                      <option key={ind.id} value={ind.slug}>
                        {ind.icon} {ind.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Price Range
                  </label>
                  <select
                    value={filters.priceRange}
                    onChange={(e) => setFilters(prev => ({ ...prev, priceRange: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  >
                    <option value="">All Prices</option>
                    <option value="free">Free</option>
                    <option value="under-50">Under $50</option>
                    <option value="50-200">$50 - $200</option>
                    <option value="over-200">Over $200</option>
                  </select>
                </div>
              </motion.div>
            )}
          </div>
        </div>
      </section>

      {/* Tools Grid */}
      <section className="pb-24">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {Array.from({ length: 8 }).map((_, i) => (
                <div key={i} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 animate-pulse">
                  <div className="h-12 bg-gray-200 rounded mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded mb-2"></div>
                  <div className="h-4 bg-gray-200 rounded mb-4"></div>
                  <div className="h-8 bg-gray-200 rounded"></div>
                </div>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6"
            >
              {filteredTools.map((tool, index) => (
                <motion.div
                  key={tool.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.5, delay: index * 0.05 }}
                  className="bg-white rounded-xl shadow-sm border border-gray-200 hover:shadow-lg hover:border-indigo-200 transition-all duration-300 group"
                >
                  <div className="p-6">
                    {/* Header */}
                    <div className="flex items-start justify-between mb-4">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 text-lg group-hover:text-indigo-600 transition-colors">
                          {tool.name}
                        </h3>
                        
                        {/* Categories */}
                        <div className="flex flex-wrap gap-1 mt-2">
                          {tool.categories.slice(0, 2).map(category => (
                            <span
                              key={category.id}
                              className="text-xs px-2 py-1 rounded-full text-white"
                              style={{ backgroundColor: category.color }}
                            >
                              {category.icon} {category.name}
                            </span>
                          ))}
                        </div>
                      </div>

                      {/* Quality Score */}
                      <div className="flex items-center gap-1 text-yellow-500">
                        <StarSolidIcon className="h-4 w-4" />
                        <span className="text-sm font-medium text-gray-600">
                          {Math.round(tool.qualityScore / 10) / 10}
                        </span>
                      </div>
                    </div>

                    {/* Description */}
                    <p className="text-gray-600 text-sm mb-4 line-clamp-3">
                      {tool.description}
                    </p>

                    {/* Features */}
                    <div className="mb-4">
                      <div className="flex flex-wrap gap-1">
                        {tool.features.slice(0, 3).map((feature, i) => (
                          <span 
                            key={i}
                            className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full"
                          >
                            {feature}
                          </span>
                        ))}
                        {tool.features.length > 3 && (
                          <span className="text-xs px-2 py-1 bg-gray-100 text-gray-700 rounded-full">
                            +{tool.features.length - 3} more
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Pricing */}
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center gap-1">
                        <CurrencyDollarIcon className="h-4 w-4 text-gray-400" />
                        <span className={`text-sm font-medium ${getPriceColor(tool.pricing)}`}>
                          {getPriceDisplay(tool.pricing)}
                        </span>
                      </div>
                      
                      <div className="flex items-center gap-1 text-indigo-600">
                        <SparklesIcon className="h-4 w-4" />
                        <span className="text-xs font-medium">
                          {Math.round(tool.smbRelevanceScore)}% SMB fit
                        </span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <a
                      href={tool.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-full flex items-center justify-center gap-2 bg-indigo-600 text-white py-2 px-4 rounded-lg hover:bg-indigo-700 transition-colors text-sm font-medium"
                    >
                      <GlobeAltIcon className="h-4 w-4" />
                      Explore Tool
                    </a>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}

          {/* Empty State */}
          {!loading && filteredTools.length === 0 && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="text-center py-16"
            >
              <MagnifyingGlassIcon className="h-16 w-16 text-gray-300 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                No tools found
              </h3>
              <p className="text-gray-600 mb-6 max-w-md mx-auto">
                Try adjusting your search terms or filters to discover more AI tools that could transform your business.
              </p>
              <button
                onClick={() => setFilters({ search: '', category: '', industry: '', priceRange: '' })}
                className="bg-indigo-600 text-white px-6 py-2 rounded-lg hover:bg-indigo-700 transition-colors"
              >
                Clear All Filters
              </button>
            </motion.div>
          )}
        </div>
      </section>

      <Footer />
      <VoiceAgent />
    </div>
  )
}