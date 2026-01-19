'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Search, MapPin, Briefcase, DollarSign, Building2, Clock, ChevronRight } from 'lucide-react'
import Link from 'next/link'

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

export default function JobsPage() {
  const [jobs, setJobs] = useState<Job[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [locationFilter, setLocationFilter] = useState('')
  const [typeFilter, setTypeFilter] = useState('')
  const supabase = createClient()

  useEffect(() => {
    fetchJobs()
  }, [])

  async function fetchJobs() {
    const { data, error } = await supabase
      .from('jobs')
      .select('id, title, description, city, state, country, location_type, employment_type, salary_min, salary_max, salary_currency, created_at, clients(company_name, industry)')
      .eq('is_published', true)
      .eq('status', 'open')
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching jobs:', error)
    } else {
      setJobs((data as unknown as Job[]) || [])
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
    const matchesSearch = 
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.clients?.company_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.description?.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesLocation = !locationFilter || 
      job.location_type === locationFilter ||
      job.city?.toLowerCase().includes(locationFilter.toLowerCase()) ||
      job.state?.toLowerCase().includes(locationFilter.toLowerCase())
    
    const matchesType = !typeFilter || job.employment_type === typeFilter

    return matchesSearch && matchesLocation && matchesType
  })

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-brand-navy text-white">
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center justify-between mb-8">
            <Link href="/" className="text-2xl font-bold">
              Search<span className="text-brand-accent">.Market</span>
            </Link>
            <a 
              href="https://search.market" 
              className="text-sm text-gray-300 hover:text-white"
            >
              For Recruiters →
            </a>
          </div>
          <div className="text-center py-8">
            <h1 className="text-4xl font-bold mb-4">Find Your Next Opportunity</h1>
            <p className="text-xl text-gray-300 mb-8">Browse open positions from top recruiters</p>
            
            {/* Search Bar */}
            <div className="max-w-3xl mx-auto">
              <div className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="w-5 h-5 absolute left-4 top-1/2 -translate-y-1/2 text-gray-400" />
                  <input
                    type="text"
                    placeholder="Search jobs, companies, or keywords..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full pl-12 pr-4 py-3 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="flex flex-wrap gap-4 mb-6">
          <select
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            <option value="">All Locations</option>
            <option value="remote">Remote</option>
            <option value="hybrid">Hybrid</option>
            <option value="onsite">On-site</option>
          </select>
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 rounded-lg border border-gray-200 bg-white focus:outline-none focus:ring-2 focus:ring-brand-accent"
          >
            <option value="">All Types</option>
            <option value="permanent">Permanent</option>
            <option value="contract">Contract</option>
            <option value="contract_to_hire">Contract to Hire</option>
          </select>
          <div className="ml-auto text-gray-500">
            {filteredJobs.length} {filteredJobs.length === 1 ? 'job' : 'jobs'} found
          </div>
        </div>

        {/* Job Listings */}
        {loading ? (
          <div className="text-center py-12 text-gray-500">Loading jobs...</div>
        ) : filteredJobs.length === 0 ? (
          <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-12 text-center">
            <Briefcase className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">No jobs found</h3>
            <p className="text-gray-500">Try adjusting your search or filters</p>
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
                        <h2 className="text-xl font-semibold text-gray-900 mb-1">{job.title}</h2>
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
        <div className="max-w-6xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="text-gray-500 text-sm">
              © 2025 Search Market. All rights reserved.
            </div>
            <div className="flex items-center gap-6 text-sm text-gray-500">
              <a href="https://search.market" className="hover:text-brand-blue">For Recruiters</a>
              <a href="https://search.market" className="hover:text-brand-blue">About</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  )
}
