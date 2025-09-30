'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { motion } from 'framer-motion'

interface FormData {
  name: string
  email: string
  company: string
  phone?: string
  message: string
  service: string
  budget: string
}

interface LeadCaptureFormProps {
  title?: string
  subtitle?: string
  className?: string
}

const services = [
  'AI Automation',
  'Lead Generation',
  'Voice Agents',
  'Chatbots',
  'Consulting',
  'Other',
]

const budgetRanges = [
  'Under $5,000',
  '$5,000 - $15,000',
  '$15,000 - $50,000',
  '$50,000 - $100,000',
  '$100,000+',
  'Not sure yet',
]

export default function LeadCaptureForm({
  title = "Get Your Free AI Automation Consultation",
  subtitle = "Transform your business with intelligent automation. Let's discuss your needs.",
  className = "",
}: LeadCaptureFormProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  
  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm<FormData>()

  const onSubmit = async (data: FormData) => {
    setIsSubmitting(true)
    
    try {
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      })

      if (response.ok) {
        setIsSubmitted(true)
        reset()
      } else {
        throw new Error('Failed to submit form')
      }
    } catch (error) {
      console.error('Error submitting form:', error)
      // Handle error (could show toast notification)
    } finally {
      setIsSubmitting(false)
    }
  }

  if (isSubmitted) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className={`bg-green-50 border border-green-200 rounded-lg p-8 text-center ${className}`}
      >
        <div className="text-green-600 mb-4">
          <svg className="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 48 48">
            <circle cx="24" cy="24" r="20" stroke="currentColor" strokeWidth="2" fill="currentColor" fillOpacity="0.1" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 24l6 6 12-12" />
          </svg>
        </div>
        <h3 className="text-xl font-semibold text-green-900 mb-2">Thank You!</h3>
        <p className="text-green-700">
          We&apos;ve received your request. Our AI automation experts will contact you within 24 hours to discuss your project.
        </p>
      </motion.div>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`bg-white rounded-lg shadow-xl p-8 ${className}`}
    >
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-gray-900 mb-2">{title}</h2>
        <p className="text-gray-600">{subtitle}</p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">
              Full Name *
            </label>
            <input
              type="text"
              id="name"
              {...register('name', { required: 'Name is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Your full name"
            />
            {errors.name && (
              <p className="mt-1 text-sm text-red-600">{errors.name.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
              Email Address *
            </label>
            <input
              type="email"
              id="email"
              {...register('email', {
                required: 'Email is required',
                pattern: {
                  value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                  message: 'Invalid email address',
                },
              })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="your@email.com"
            />
            {errors.email && (
              <p className="mt-1 text-sm text-red-600">{errors.email.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="company" className="block text-sm font-medium text-gray-700 mb-1">
              Company *
            </label>
            <input
              type="text"
              id="company"
              {...register('company', { required: 'Company is required' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="Your company name"
            />
            {errors.company && (
              <p className="mt-1 text-sm text-red-600">{errors.company.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              {...register('phone')}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              placeholder="+1 (555) 123-4567"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label htmlFor="service" className="block text-sm font-medium text-gray-700 mb-1">
              Service of Interest *
            </label>
            <select
              id="service"
              {...register('service', { required: 'Please select a service' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select a service...</option>
              {services.map((service) => (
                <option key={service} value={service}>
                  {service}
                </option>
              ))}
            </select>
            {errors.service && (
              <p className="mt-1 text-sm text-red-600">{errors.service.message}</p>
            )}
          </div>

          <div>
            <label htmlFor="budget" className="block text-sm font-medium text-gray-700 mb-1">
              Budget Range *
            </label>
            <select
              id="budget"
              {...register('budget', { required: 'Please select a budget range' })}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="">Select budget range...</option>
              {budgetRanges.map((range) => (
                <option key={range} value={range}>
                  {range}
                </option>
              ))}
            </select>
            {errors.budget && (
              <p className="mt-1 text-sm text-red-600">{errors.budget.message}</p>
            )}
          </div>
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-1">
            Tell us about your project *
          </label>
          <textarea
            id="message"
            rows={4}
            {...register('message', { required: 'Please describe your project' })}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            placeholder="Describe your current challenges and how AI automation could help your business..."
          />
          {errors.message && (
            <p className="mt-1 text-sm text-red-600">{errors.message.message}</p>
          )}
        </div>

        <motion.button
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-indigo-600 text-white py-3 px-6 rounded-md font-semibold hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
              Submitting...
            </div>
          ) : (
            'Get Your Free Consultation'
          )}
        </motion.button>

        <p className="text-sm text-gray-500 text-center">
          By submitting this form, you agree to our privacy policy. We&apos;ll never spam you or share your information.
        </p>
      </form>
    </motion.div>
  )
}