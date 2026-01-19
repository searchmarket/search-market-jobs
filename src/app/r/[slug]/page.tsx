'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Search, MapPin, Briefcase, DollarSign, Building2, Clock, ChevronRight, Linkedin, Mail, Phone } from 'lucide-react'
import Link from 'next/link'
import { useParams } from 'next/navigation'

interface Recruiter {
  id: string
  full_name: string | null
  email: string
  phone: string | null
  bio: string | null
  linkedin_url: string | null
  photo_url: string | null
  company_name: string | null
  company_logo_url: string | null
  slug: string
}

interface Job {
  id: string
  title: string
  description: string | null
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
  } | null
}

export default function RecruiterPage() {
  const params = useParams()
  const [recruiter, setRecruiter] = useState<Recruiter | null>(null)
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const supabase = createClient()

  useEffect(() => {
    if (params.slug) {
      fetchRecruiter(params.slug as string)
    }
  }, [params.slug])

  async function fetchRecruiter(slug: string) {
    const { data: recruiterData, error: recruiterError } = await supabase
      .from('recruiters')
      .select('*')
      .eq('slug', slug)
      .single()

    if (recruiterError || !recruiterData) {
      console.error('Error fetching recruiter:', recruiterError)
      setLoading(false)
      return
    }

    setRecruiter(recruiterData as Recruiter)

    // Fetch their published jobs
    const { data: jobsData, error: jobsError } = await supabase
      .from('jobs')
      .select('id, title, description, city, state, country, location_type, employment_type, salary_min, salary_max, salary_currency, created_at, clients(company_name, industry)')
      .eq('recruiter_id', recruiterData.id)
      .eq('is_published', true)
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (jobsError) {
      console.error('Error fetching jobs:', jobsError)
    } else {
      setJobs((jobsData as unknown as Job[]) || [])
    }

    setLoading(false)
  }

  const formatLocation = (city: string | null, state: string | null, locationType: string) => {
    const location = [city, state].filter(Boolean).join(', ')
    if (locationType === 'remote') return 'Remote'
    if (!location) return locationType
    return `${location}${locationType === 'hybrid' ? ' (Hybrid)' : ''}`
  }

  const formatSalary = (min: number | null, max: number | null, currency: string) => {
    if (!min && !max) return null
    const fmt = (n: number) => `$${(n / 1000).toFixed(0)}k`
    if (min && max) return `${fmt(min)} - ${fmt(max)} ${currency}`
    if (min) return `${fmt(min)}+ ${currency}`
    if (max) return `Up to ${fmt(max)} ${currency}`
    return null
  }

  const formatDate = (date: string) => {
    const d = new Date(date)
    const now = new Date()
    const diff = Math.floor((now.getTime() - d.getTime()) / (1000 * 60 * 60 * 24))
    if (diff === 0) return 'Today'
    if (diff === 1) return 'Yesterday'
    if (diff < 7) return `${diff} days ago`
    if (diff < 30) return `${Math.floor(diff / 7)} weeks ago`
    return d.toLocaleDateString()
  }

  const filteredJobs = jobs.filter(job => {
    return job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.clients?.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase())
  })

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-gray-500">Loading...</div>
      </div>
    )
  }

  if (!recruiter) {
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
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Recruiter Not Found</h1>
          <p className="text-gray-500 mb-6">This recruiter page doesn't exist.</p>
          <Link href="/" className="text-brand-blue hover:underline">
            ← Browse all jobs
          </Link>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-navy text-white">
        <div className="max-w-5xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between">
            {recruiter.company_logo_url ? (
              <img src={recruiter.company_logo_url} alt={recruiter.company_name || ''} className="h-10" />
            ) : recruiter.company_name ? (
              <span className="text-2xl font-bold">{recruiter.company_name}</span>
            ) : (
              <Link href="/" className="text-2xl font-bold">
                Search<span className="text-brand-accent">.Market</span>
              </Link>
            )}
            <Link href="/" className="text-sm text-gray-300 hover:text-white">
              View all jobs →
            </Link>
          </div>
        </div>
      </header>

      {/* Recruiter Profile */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-start gap-6">
            {recruiter.photo_url ? (
              <img 
                src={recruiter.photo_url} 
                alt={recruiter.full_name || ''} 
                className="w-24 h-24 rounded-full object-cover"
              />
            ) : (
              <div className="w-24 h-24 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue font-bold text-2xl">
                {recruiter.full_name?.split(' ').map(n => n[0]).join('') || 'R'}
              </div>
            )}
            <div className="flex-1">
              <h1 className="text-2xl font-bold text-gray-900 mb-1">
                {recruiter.full_name || 'Recruiter'}
              </h1>
              {recruiter.company_name && (
                <p className="text-gray-600 mb-3">{recruiter.company_name}</p>
              )}
              {recruiter.bio && (
                <p className="text-gray-600 mb-4 max-w-2xl">{recruiter.bio}</p>
              )}
              <div className="flex flex-wrap gap-4">
                {recruiter.email && (
                  <a 
                    href={`mailto:${recruiter.email}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-brand-blue"
                  >
                    <Mail className="w-4 h-4" />
                    {recruiter.email}
                  </a>
                )}
                {recruiter.phone && (
                  <a 
                    href={`tel:${recruiter.phone}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-brand-blue"
                  >
                    <Phone className="w-4 h-4" />
                    {recruiter.phone}
                  </a>
                )}
                {recruiter.linkedin_url && (
                  <a 
                    href={recruiter.linkedin_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-2 text-gray-600 hover:text-brand-blue"
                  >
                    <Linkedin className="w-4 h-4" />
                    LinkedIn
                  </a>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <main className="max-w-5xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold text-gray-900">
            Open Positions ({jobs.length})
          </h2>
          <div className="relative">
            <Search className="w-5 h-5 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" />
            <input
              type="text"
              placeholder="Search jobs..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent w-64"
            />
          </div>
        </div>

        {/* Job Listings */}
        {filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">
              {jobs.length === 0 ? 'No open positions' : 'No jobs match your search'}
            </h3>
            <p className="text-gray-500">
              {jobs.length === 0 ? 'Check back soon for new opportunities' : 'Try a different search term'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredJobs.map((job) => (
              <Link
                key={job.id}
                href={`/job/${job.id}`}
                className="block bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:border-brand-accent hover:shadow-md transition-all"
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 bg-brand-blue/10 rounded-lg flex items-center justify-center text-brand-blue font-semibold shrink-0">
                        {job.clients?.company_name?.substring(0, 2).toUpperCase() || 'CO'}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h3>
                        <div className="flex items-center gap-2 text-gray-600 mb-3">
                          <Building2 className="w-4 h-4" />
                          <span>{job.clients?.company_name || 'Company'}</span>
                          {job.clients?.industry && (
                            <span className="text-gray-400">• {job.clients.industry}</span>
                          )}
                        </div>
                        <div className="flex flex-wrap items-center gap-4 text-sm text-gray-500">
                          <div className="flex items-center gap-1">
                            <MapPin className="w-4 h-4" />
                            {formatLocation(job.city, job.state, job.location_type)}
                          </div>
                          <div className="flex items-center gap-1">
                            <Briefcase className="w-4 h-4" />
                            {job.employment_type.replace('_', ' ')}
                          </div>
                          {formatSalary(job.salary_min, job.salary_max, job.salary_currency) && (
                            <div className="flex items-center gap-1 text-brand-green font-medium">
                              <DollarSign className="w-4 h-4" />
                              {formatSalary(job.salary_min, job.salary_max, job.salary_currency)}
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Clock className="w-4 h-4" />
                            {formatDate(job.created_at)}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-400 shrink-0 mt-2" />
                </div>
              </Link>
            ))}
          </div>
        )}
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-100 mt-12">
        <div className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="text-gray-500 text-sm">
              Powered by <a href="https://search.market" className="text-brand-blue hover:underline">Search Market</a>
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <Link href="/" className="hover:text-brand-blue">View all jobs</Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
