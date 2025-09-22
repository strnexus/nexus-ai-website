// Global types for the application

export interface Contact {
  id: string
  name: string
  email: string
  company: string
  phone?: string
  message: string
  service: string
  budget: string
  createdAt: Date
  status: 'new' | 'contacted' | 'qualified' | 'converted' | 'closed'
}

export interface Service {
  id: string
  name: string
  description: string
  features: string[]
  pricing: {
    starting: number
    currency: string
    period: string
  }
  icon: string
}

export interface BlogPost {
  id: string
  title: string
  slug: string
  excerpt: string
  content: string
  author: string
  publishedAt: Date
  tags: string[]
  coverImage?: string
  seoTitle?: string
  seoDescription?: string
}

export interface VoiceMessage {
  id: string
  transcript: string
  response: string
  timestamp: Date
  userId?: string
}

export interface SEOData {
  title?: string
  description?: string
  keywords?: string
  canonical?: string
  openGraph?: {
    title?: string
    description?: string
    image?: string
    type?: string
  }
  twitter?: {
    title?: string
    description?: string
    image?: string
  }
  structuredData?: object
}

export interface ApiResponse<T = any> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginationParams {
  page: number
  limit: number
  sortBy?: string
  sortOrder?: 'asc' | 'desc'
}

export interface PaginatedResponse<T> {
  data: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
    hasNext: boolean
    hasPrev: boolean
  }
}