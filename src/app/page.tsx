'use client'

import Link from 'next/link'
import { useState } from 'react'
import { ChevronRightIcon, SparklesIcon, BeakerIcon, LightBulbIcon } from '@heroicons/react/24/outline'
import { motion } from 'framer-motion'
import Header from '@/components/ui/Header'
import Footer from '@/components/ui/Footer'
import VoiceAgent from '@/components/ui/VoiceAgent'
import LeadCaptureForm from '@/components/forms/LeadCaptureForm'

export default function Home() {
  const [showLeadForm, setShowLeadForm] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-white to-purple-50">
      <Header />
      
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-20 pb-24 sm:pt-32 sm:pb-32">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="mx-auto max-w-4xl text-center"
          >
            <h1 className="text-4xl font-bold tracking-tight text-gray-900 sm:text-6xl lg:text-7xl">
              Discover Your
              <span className="bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                {' '}Perfect AI Tools{' '}
              </span>
              in 60 Seconds
            </h1>
            
            <p className="mt-6 text-lg leading-8 text-gray-600 sm:text-xl max-w-3xl mx-auto">
              Stop searching through endless AI directories. Nova, your intelligent guide, 
              understands your business and delivers personalized tool recommendations that 
              amplify what you do best.
            </p>
            
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button
                onClick={() => setShowLeadForm(true)}
                className="group relative inline-flex items-center gap-x-2 rounded-full bg-indigo-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:bg-indigo-500 hover:shadow-xl hover:-translate-y-0.5"
              >
                <SparklesIcon className="h-5 w-5" />
                Start Your AI Discovery
                <ChevronRightIcon className="h-4 w-4 transition-transform group-hover:translate-x-1" />
              </button>
              
              <Link
                href="/discover"
                className="text-lg font-semibold leading-6 text-gray-900 hover:text-indigo-600 transition-colors flex items-center gap-x-1"
              >
                Explore Tools <span aria-hidden="true">→</span>
              </Link>
            </div>
          </motion.div>
        </div>
        
        {/* Background Elements */}
        <div className="absolute inset-x-0 -top-40 -z-10 transform-gpu overflow-hidden blur-3xl sm:-top-80">
          <div className="relative left-[calc(50%-11rem)] aspect-[1155/678] w-[36.125rem] -translate-x-1/2 rotate-[30deg] bg-gradient-to-tr from-indigo-200 to-purple-400 opacity-30 sm:left-[calc(50%-30rem)] sm:w-[72.1875rem]"></div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-24 bg-white">
        <div className="mx-auto max-w-7xl px-6 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-gray-900 sm:text-4xl">
              Where Business Growth Feels Good
            </h2>
            <p className="mt-4 text-lg leading-8 text-gray-600">
              Experience effortless AI discovery designed for your success
            </p>
          </div>
          
          <div className="mx-auto mt-16 max-w-2xl sm:mt-20 lg:mt-24 lg:max-w-none">
            <dl className="grid max-w-xl grid-cols-1 gap-x-8 gap-y-16 lg:max-w-none lg:grid-cols-3">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.1 }}
                className="flex flex-col"
              >
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <BeakerIcon className="h-5 w-5 flex-none text-indigo-600" />
                  Share Your Vision
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Tell Nova about your business dreams and challenges. She listens with 
                    perfect memory and infinite patience, understanding what makes your vision special.
                  </p>
                </dd>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.2 }}
                className="flex flex-col"
              >
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <LightBulbIcon className="h-5 w-5 flex-none text-indigo-600" />
                  Discover Possibilities
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Receive intelligent recommendations from our curated database of 500+ AI tools, 
                    each one perfectly matched to amplify your unique strengths.
                  </p>
                </dd>
              </motion.div>
              
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.3 }}
                className="flex flex-col"
              >
                <dt className="flex items-center gap-x-3 text-base font-semibold leading-7 text-gray-900">
                  <SparklesIcon className="h-5 w-5 flex-none text-indigo-600" />
                  Begin Your Transformation
                </dt>
                <dd className="mt-4 flex flex-auto flex-col text-base leading-7 text-gray-600">
                  <p className="flex-auto">
                    Choose the path that feels right. Nova guides your implementation with 
                    ongoing support, celebrating every step of your beautiful AI journey.
                  </p>
                </dd>
              </motion.div>
            </dl>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="bg-gradient-to-r from-indigo-600 to-purple-600">
        <div className="px-6 py-24 sm:px-6 sm:py-32 lg:px-8">
          <div className="mx-auto max-w-2xl text-center">
            <h2 className="text-3xl font-bold tracking-tight text-white sm:text-4xl">
              Ready to Explore What&apos;s Possible?
            </h2>
            <p className="mx-auto mt-6 max-w-xl text-lg leading-8 text-indigo-200">
              Perfect timing to begin your transformation. Let&apos;s create your AI future together.
            </p>
            <div className="mt-10 flex items-center justify-center gap-x-6">
              <button
                onClick={() => setShowLeadForm(true)}
                className="rounded-full bg-white px-8 py-4 text-lg font-semibold text-indigo-600 shadow-sm transition-all hover:bg-indigo-50 hover:shadow-lg hover:-translate-y-0.5"
              >
                Begin Your Journey
              </button>
              <Link
                href="/discover"
                className="text-lg font-semibold leading-6 text-white hover:text-indigo-200 transition-colors"
              >
                Discover Tools <span aria-hidden="true">→</span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Lead Capture Modal */}
      {showLeadForm && (
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-semibold text-gray-900">
                  Begin Your AI Discovery
                </h3>
                <button
                  onClick={() => setShowLeadForm(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  ×
                </button>
              </div>
              <LeadCaptureForm onSubmit={() => setShowLeadForm(false)} />
            </div>
          </div>
        </div>
      )}

      <Footer />
      <VoiceAgent />
    </div>
  )
}
