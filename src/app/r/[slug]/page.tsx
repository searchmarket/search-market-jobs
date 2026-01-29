'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { Search, MapPin, Briefcase, DollarSign, Building2, Clock, ChevronRight, Linkedin, Mail, Phone, X, Send, Loader2, User, MessageSquare } from 'lucide-react'
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
  specializations: string[] | null
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
  const [showJobs, setShowJobs] = useState(false)
  const [showContactModal, setShowContactModal] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [contactForm, setContactForm] = useState({
    company_name: '',
    name: '',
    email: '',
    phone: '',
    preferred_contact: 'email',
    notes: ''
  })
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

  async function handleContactSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!recruiter) return
    
    setSubmitting(true)

    try {
      // Send email via API
      const response = await fetch('/api/contact-recruiter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          recruiter_email: recruiter.email,
          recruiter_name: recruiter.full_name,
          ...contactForm
        })
      })

      if (response.ok) {
        setSubmitted(true)
      } else {
        alert('Error sending request. Please try again.')
      }
    } catch (error) {
      console.error('Error:', error)
      alert('Error sending request. Please try again.')
    }

    setSubmitting(false)
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
        <div className="max-w-5xl mx-auto px-4 py-10">
          <div className="flex flex-col md:flex-row items-center md:items-start gap-8">
            {/* Photo */}
            <div className="shrink-0">
              {recruiter.photo_url ? (
                <img 
                  src={recruiter.photo_url} 
                  alt={recruiter.full_name || ''} 
                  className="w-32 h-32 rounded-full object-cover border-4 border-white shadow-lg"
                />
              ) : (
                <div className="w-32 h-32 bg-brand-blue/10 rounded-full flex items-center justify-center text-brand-blue font-bold text-3xl border-4 border-white shadow-lg">
                  {recruiter.full_name?.split(' ').map(n => n[0]).join('') || 'R'}
                </div>
              )}
            </div>

            {/* Info */}
            <div className="flex-1 text-center md:text-left">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                {recruiter.full_name || 'Recruiter'}
              </h1>
              {recruiter.company_name && (
                <p className="text-lg text-gray-600 mb-4">{recruiter.company_name}</p>
              )}
              
              {/* Contact Info */}
              <div className="flex flex-wrap justify-center md:justify-start gap-4 mb-4">
                {recruiter.email && (
                  <a 
                    href={`mailto:${recruiter.email}`}
                    className="flex items-center gap-2 text-gray-600 hover:text-brand-blue"
                  >
                    <Mail className="w-4 h-4" />
                    {recruiter.email}
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

              {/* Bio */}
              {recruiter.bio && (
                <p className="text-gray-600 mb-6 max-w-2xl">{recruiter.bio}</p>
              )}

              {/* Specializations */}
              {recruiter.specializations && recruiter.specializations.length > 0 && (
                <div className="mb-6">
                  <h3 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-2">Specializations</h3>
                  <div className="flex flex-wrap justify-center md:justify-start gap-2">
                    {recruiter.specializations.map((spec, index) => (
                      <span 
                        key={index}
                        className="px-3 py-1 bg-brand-blue/10 text-brand-blue rounded-full text-sm font-medium"
                      >
                        {spec}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row justify-center md:justify-start gap-3">
                <button
                  onClick={() => setShowJobs(!showJobs)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-navy text-white font-medium rounded-lg hover:bg-brand-blue transition-colors"
                >
                  <Briefcase className="w-5 h-5" />
                  {recruiter.full_name?.split(' ')[0] || 'My'}'s Open Jobs ({jobs.length})
                </button>
                <button
                  onClick={() => setShowContactModal(true)}
                  className="flex items-center justify-center gap-2 px-6 py-3 bg-brand-green text-white font-medium rounded-lg hover:bg-green-600 transition-colors"
                >
                  <MessageSquare className="w-5 h-5" />
                  I Need Help Finding Talent
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs Section - Only shown when button is clicked */}
      {showJobs && (
        <main className="max-w-5xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-semibold text-gray-900">
              Open Positions ({jobs.length})
            </h2>
            {jobs.length > 0 && (
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
            )}
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
      )}

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

      {/* Contact Modal */}
      {showContactModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl max-w-lg w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-100">
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-semibold text-gray-900">I Need Help Finding Talent</h2>
                <button
                  onClick={() => { setShowContactModal(false); setSubmitted(false) }}
                  className="p-2 text-gray-400 hover:text-gray-600"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {submitted ? (
              <div className="p-8 text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <Send className="w-8 h-8 text-green-600" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">Request Sent!</h3>
                <p className="text-gray-600 mb-6">
                  {recruiter.full_name || 'The recruiter'} will be in touch with you soon.
                </p>
                <button
                  onClick={() => { setShowContactModal(false); setSubmitted(false) }}
                  className="px-6 py-2 bg-brand-navy text-white rounded-lg hover:bg-brand-blue"
                >
                  Close
                </button>
              </div>
            ) : (
              <form onSubmit={handleContactSubmit} className="p-6 space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Company Name *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.company_name}
                    onChange={(e) => setContactForm({ ...contactForm, company_name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="Your company name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Your Name *</label>
                  <input
                    type="text"
                    required
                    value={contactForm.name}
                    onChange={(e) => setContactForm({ ...contactForm, name: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="Your full name"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    required
                    value={contactForm.email}
                    onChange={(e) => setContactForm({ ...contactForm, email: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="your@email.com"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={contactForm.phone}
                    onChange={(e) => setContactForm({ ...contactForm, phone: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="(555) 123-4567"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Best Way to Contact You *</label>
                  <select
                    required
                    value={contactForm.preferred_contact}
                    onChange={(e) => setContactForm({ ...contactForm, preferred_contact: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                  >
                    <option value="email">Email</option>
                    <option value="phone">Phone</option>
                    <option value="text">Text Message</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">What do you need help with? *</label>
                  <textarea
                    required
                    rows={4}
                    value={contactForm.notes}
                    onChange={(e) => setContactForm({ ...contactForm, notes: e.target.value })}
                    className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    placeholder="Tell us about the role(s) you're looking to fill, ideal candidate profile, timeline, etc."
                  />
                </div>

                <div className="flex gap-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowContactModal(false)}
                    className="flex-1 px-4 py-2.5 border border-gray-200 text-gray-700 font-medium rounded-lg hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 px-4 py-2.5 bg-brand-green text-white font-medium rounded-lg hover:bg-green-600 disabled:opacity-50 flex items-center justify-center gap-2"
                  >
                    {submitting ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        Sending...
                      </>
                    ) : (
                      <>
                        <Send className="w-4 h-4" />
                        Send Request
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
