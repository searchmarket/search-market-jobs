'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { MapPin, Briefcase, DollarSign, Building2, Clock, ArrowLeft, Globe, Mail } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Job {
  id: string
  title: string
  description: string | null
  requirements: string | null
  city: string | null
  state: string | null
  country: string | null
  location_type: string
  employment_type: string
  salary_min: number | null
  salary_max: number | null
  salary_currency: string
  created_at: string
  clients: {
    company_name: string
    industry: string | null
    website: string | null
  } | null
  recruiters: {
    full_name: string | null
    email: string
  } | null
}

export default function JobDetailPage() {
  const params = useParams()
  const [job, setJob] = useState<Job | null>(null)
  const [loading, setLoading] = useState(true)
  const supabase = createClient()

  useEffect(() => {
    if (params.id) {
      fetchJob(params.id as string)
    }
  }, [params.id])

  async function fetchJob(id: string) {
    const { data, error } = await supabase
      .from('jobs')
      .select('*, clients(company_name, industry, website), recruiters(full_name, email)')
      .eq('id', id)
      .eq('is_published', true)
      .single()

    if (error) {
      console.error('Error fetching job:', error)
    } else {
      setJob(data as unknown as Job)
    }
    setLoading(false)
  }

  const formatLocation = (city: string | null, state: string | null, country: string | null, locationType: string) => {
    const location = [city, state, country].filter(Boolean).join(', ')
    if (locationType === 'remote') return 'Remote'
    if (!location) return locationType
    return `${location}${locationType === 'hybrid' ? ' (Hybrid)' : ''}`
  }

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return null
    const fmt = (n: number) => `$${n.toLocaleString()}`
    if (min && max) return `${fmt(min)} - ${fmt(max)} ${currency}`
    if (min) return `${fmt(min)}+ ${currency}`
    if (max) return `Up to ${fmt(max)} ${currency}`
    return null
  }

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!job) {
    return (
      <div className="min-h-screen bg-gray-50">
        <header className="bg-brand-navy text-white">
          <div className="max-w-4xl mx-auto px-4 py-6">
            <Link href="/" className="text-2xl font-bold">
              Search<span className="text-brand-accent">.Market</span>
            </Link>
          </div>
        </header>
        <main className="max-w-4xl mx-auto px-4 py-12 text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Job Not Found</h1>
          <p className="text-gray-500 mb-6">This job may have been removed or is no longer available.</p>
          <Link href="/" className="text-brand-blue hover:underline">
            ← Back to all jobs
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-navy text-white">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <Link href="/" className="text-2xl font-bold">
            Search<span className="text-brand-accent">.Market</span>
          </Link>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-4xl mx-auto px-4 py-8">
        <Link 
          href="/" 
          className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-6"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to all jobs
        </Link>

        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Job Header */}
          <div className="p-8 border-b border-gray-100">
            <div className="flex items-start gap-4 mb-6">
              <div className="w-16 h-16 bg-brand-blue/10 rounded-xl flex items-center justify-center text-brand-blue font-bold text-xl">
                {job.clients?.company_name?.substring(0, 2).toUpperCase() || 'CO'}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <div className="flex items-center gap-2 text-lg text-gray-600">
                  <Building2 className="w-5 h-5" />
                  <span>{job.clients?.company_name || 'Company'}</span>
                  {job.clients?.industry && (
                    <span className="text-gray-400">• {job.clients.industry}</span>
                  )}
                </div>
              </div>
            </div>

            <div className="flex flex-wrap gap-4 text-gray-600">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <MapPin className="w-4 h-4" />
                {formatLocation(job.city, job.state, job.country, job.location_type)}
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <Briefcase className="w-4 h-4" />
                {job.employment_type.replace('_', ' ')}
              </div>
              {formatSalary(job.salary_min, job.salary_max, job.salary_currency) && (
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-50 text-brand-green rounded-full font-medium">
                  <DollarSign className="w-4 h-4" />
                  {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                </div>
              )}
              <div className="flex items-center gap-2 px-3 py-1.5 bg-gray-100 rounded-full">
                <Clock className="w-4 h-4" />
                Posted {formatDate(job.created_at)}
              </div>
            </div>
          </div>

          {/* Job Content */}
          <div className="p-8">
            {job.description && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About the Role</h2>
                <div className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {job.description}
                </div>
              </div>
            )}

            {job.requirements && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
                <div className="text-gray-600 whitespace-pre-wrap leading-relaxed">
                  {job.requirements}
                </div>
              </div>
            )}

            {/* Company Info */}
            {job.clients && (
              <div className="mb-8 p-6 bg-gray-50 rounded-xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">About {job.clients.company_name}</h2>
                <div className="flex flex-wrap gap-4">
                  {job.clients.industry && (
                    <div className="text-gray-600">
                      <span className="font-medium">Industry:</span> {job.clients.industry}
                    </div>
                  )}
                  {job.clients.website && (
                    <a 
                      href={job.clients.website.startsWith('http') ? job.clients.website : `https://${job.clients.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-2 text-brand-blue hover:underline"
                    >
                      <Globe className="w-4 h-4" />
                      Company Website
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Apply Section */}
            <div className="p-6 bg-brand-navy rounded-xl text-white">
              <h2 className="text-xl font-semibold mb-2">Interested in this position?</h2>
              <p className="text-gray-300 mb-4">
                Contact the recruiter to learn more and apply.
              </p>
              {job.recruiters?.email && (
                <a
                  href={`mailto:${job.recruiters.email}?subject=Application for ${job.title}`}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-white font-medium rounded-lg hover:bg-blue-500 transition-colors"
                >
                  <Mail className="w-5 h-5" />
                  Apply Now
                </a>
              )}
            </div>
          </div>
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="text-gray-500 text-sm">
              © 2025 Search Market. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="https://search.market" className="hover:text-brand-blue">For Recruiters</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
