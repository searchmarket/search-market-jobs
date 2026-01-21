'use client'

import { useState, useEffect } from 'react'
import { createClient } from '@/lib/supabase'
import { MapPin, Briefcase, DollarSign, Building2, Clock, ArrowLeft, Globe, Send, CheckCircle, Loader2, Upload } from 'lucide-react'
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
  recruiter_id: string
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
  const [showForm, setShowForm] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitted, setSubmitted] = useState(false)
  const [resumeFile, setResumeFile] = useState<File | null>(null)
  const [parsingResume, setParsingResume] = useState(false)
  const [resumeParsed, setResumeParsed] = useState(false)
  const supabase = createClient()

  const [formData, setFormData] = useState({
    first_name: '',
    last_name: '',
    email: '',
    phone: '',
    linkedin_url: '',
    current_title: '',
    current_company: '',
    years_experience: '',
    message: ''
  })

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

  async function handleResumeUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return

    if (file.type !== 'application/pdf') {
      alert('Please upload a PDF file')
      return
    }

    setParsingResume(true)
    setResumeFile(file)

    try {
      const formDataUpload = new FormData()
      formDataUpload.append('file', file)

      const response = await fetch('/api/parse-resume', {
        method: 'POST',
        body: formDataUpload
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to parse resume')
      }

      const data = await response.json()

      // Fill form with parsed data
      setFormData(prev => ({
        ...prev,
        first_name: data.first_name || prev.first_name,
        last_name: data.last_name || prev.last_name,
        email: data.email || prev.email,
        phone: data.phone || prev.phone,
        linkedin_url: data.linkedin_url || prev.linkedin_url,
        current_title: data.current_title || prev.current_title,
        current_company: data.current_company || prev.current_company,
        years_experience: data.years_experience?.toString() || prev.years_experience,
        message: data.summary || prev.message
      }))

      setResumeParsed(true)
    } catch (error) {
      console.error('Error parsing resume:', error)
      alert(error instanceof Error ? error.message : 'Failed to parse resume')
      setResumeFile(null)
    }

    setParsingResume(false)
    e.target.value = ''
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    if (!job) return

    setSubmitting(true)

    // Calculate 90-minute exclusive window for the job poster
    const exclusiveUntil = new Date(Date.now() + 90 * 60 * 1000).toISOString()

    try {
      // Create the candidate
      const { data: candidate, error: candidateError } = await supabase
        .from('candidates')
        .insert([{
          first_name: formData.first_name,
          last_name: formData.last_name,
          email: formData.email,
          phone: formData.phone || null,
          linkedin_url: formData.linkedin_url || null,
          current_title: formData.current_title || null,
          current_company: formData.current_company || null,
          years_experience: formData.years_experience ? parseInt(formData.years_experience) : null,
          notes: formData.message || null,
          source: 'Job Board Application',
          status: 'active',
          recruiter_id: job.recruiter_id,
          exclusive_until: exclusiveUntil
        }])
        .select()
        .single()

      if (candidateError) {
        // Check if candidate already exists with this email
        if (candidateError.code === '23505') {
          // Get existing candidate - don't change exclusive window for existing candidates
          const { data: existingCandidate } = await supabase
            .from('candidates')
            .select('id, owned_by')
            .eq('email', formData.email)
            .eq('recruiter_id', job.recruiter_id)
            .single()

          if (existingCandidate) {
            // Create application for existing candidate
            await supabase
              .from('applications')
              .insert([{
                job_id: job.id,
                candidate_id: existingCandidate.id,
                recruiter_id: job.recruiter_id,
                stage: 'applied',
                notes: formData.message || null
              }])
          }
        } else {
          throw candidateError
        }
      } else if (candidate) {
        // Create application for new candidate
        await supabase
          .from('applications')
          .insert([{
            job_id: job.id,
            candidate_id: candidate.id,
            recruiter_id: job.recruiter_id,
            stage: 'applied',
            notes: formData.message || null
          }])

        // Save resume as Word file if uploaded
        if (resumeFile) {
          try {
            const resumeFormData = new FormData()
            resumeFormData.append('file', resumeFile)
            resumeFormData.append('candidateId', candidate.id)
            resumeFormData.append('recruiterId', job.recruiter_id)

            await fetch('/api/save-resume', {
              method: 'POST',
              body: resumeFormData
            })
          } catch (resumeError) {
            console.error('Error saving resume file:', resumeError)
            // Don't fail the application if resume save fails
          }
        }
      }

      setSubmitted(true)
    } catch (error) {
      console.error('Error submitting application:', error)
      alert('There was an error submitting your application. Please try again.')
    }

    setSubmitting(false)
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
                {job.clients?.industry?.substring(0, 2).toUpperCase() || 'JB'}
              </div>
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-gray-900 mb-2">{job.title}</h1>
                <div className="flex items-center gap-2 text-lg text-gray-600">
                  <Building2 className="w-5 h-5" />
                  <span>{job.clients?.industry || 'Confidential'}</span>
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
                <div 
                  className="text-gray-600 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: job.description }}
                />
              </div>
            )}

            {job.requirements && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-gray-900 mb-4">Requirements</h2>
                <div 
                  className="text-gray-600 prose prose-sm max-w-none"
                  dangerouslySetInnerHTML={{ __html: job.requirements }}
                />
              </div>
            )}

            {/* Apply Section */}
            {submitted ? (
              <div className="p-8 bg-green-50 rounded-xl text-center">
                <CheckCircle className="w-16 h-16 text-green-500 mx-auto mb-4" />
                <h2 className="text-2xl font-semibold text-gray-900 mb-2">Application Submitted!</h2>
                <p className="text-gray-600 mb-4">
                  Thank you for applying. The recruiter will review your application and contact you if there's a match.
                </p>
                <Link href="/" className="text-brand-blue hover:underline">
                  Browse more jobs
                </Link>
              </div>
            ) : showForm ? (
              <div className="p-6 bg-gray-50 rounded-xl">
                <h2 className="text-xl font-semibold text-gray-900 mb-6">Apply for this position</h2>
                
                {/* Resume Upload Section */}
                <div className="mb-6 p-4 border-2 border-dashed border-gray-300 rounded-lg bg-white">
                  <div className="text-center">
                    {resumeParsed ? (
                      <div className="flex items-center justify-center gap-2 text-green-600">
                        <CheckCircle className="w-5 h-5" />
                        <span className="font-medium">Resume parsed: {resumeFile?.name}</span>
                      </div>
                    ) : parsingResume ? (
                      <div className="flex items-center justify-center gap-2 text-gray-600">
                        <Loader2 className="w-5 h-5 animate-spin" />
                        <span>Parsing resume...</span>
                      </div>
                    ) : (
                      <>
                        <Upload className="w-8 h-8 text-gray-400 mx-auto mb-2" />
                        <p className="text-gray-600 mb-2">Upload your resume to auto-fill the form</p>
                        <label className="inline-flex items-center gap-2 px-4 py-2 bg-brand-accent text-white font-medium rounded-lg hover:bg-blue-500 cursor-pointer transition-colors">
                          <Upload className="w-4 h-4" />
                          Upload PDF Resume
                          <input
                            type="file"
                            accept=".pdf"
                            onChange={handleResumeUpload}
                            className="hidden"
                          />
                        </label>
                        <p className="text-xs text-gray-500 mt-2">Or fill in the form manually below</p>
                      </>
                    )}
                  </div>
                </div>

                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.first_name}
                        onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                      <input
                        type="text"
                        required
                        value={formData.last_name}
                        onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                      <input
                        type="email"
                        required
                        value={formData.email}
                        onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                      <input
                        type="tel"
                        value={formData.phone}
                        onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">LinkedIn Profile</label>
                    <input
                      type="url"
                      value={formData.linkedin_url}
                      onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      placeholder="https://linkedin.com/in/yourprofile"
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Title</label>
                      <input
                        type="text"
                        value={formData.current_title}
                        onChange={(e) => setFormData({ ...formData, current_title: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-1">Current Company</label>
                      <input
                        type="text"
                        value={formData.current_company}
                        onChange={(e) => setFormData({ ...formData, current_company: e.target.value })}
                        className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Years of Experience</label>
                    <input
                      type="number"
                      value={formData.years_experience}
                      onChange={(e) => setFormData({ ...formData, years_experience: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Why are you interested in this role?</label>
                    <textarea
                      rows={4}
                      value={formData.message}
                      onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-lg border border-gray-200 focus:outline-none focus:ring-2 focus:ring-brand-accent"
                      placeholder="Tell us about yourself and why you'd be a great fit..."
                    />
                  </div>

                  <div className="flex gap-3 pt-4">
                    <button
                      type="button"
                      onClick={() => setShowForm(false)}
                      className="px-6 py-3 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={submitting}
                      className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-brand-accent text-white font-medium rounded-lg hover:bg-blue-500 transition-colors disabled:opacity-50"
                    >
                      {submitting ? (
                        <Loader2 className="w-5 h-5 animate-spin" />
                      ) : (
                        <Send className="w-5 h-5" />
                      )}
                      {submitting ? 'Submitting...' : 'Submit Application'}
                    </button>
                  </div>
                </form>
              </div>
            ) : (
              <div className="p-6 bg-brand-navy rounded-xl text-white">
                <h2 className="text-xl font-semibold mb-2">Interested in this position?</h2>
                <p className="text-gray-300 mb-4">
                  Apply now and let the recruiter know you're interested.
                </p>
                <button
                  onClick={() => setShowForm(true)}
                  className="inline-flex items-center gap-2 px-6 py-3 bg-brand-accent text-white font-medium rounded-lg hover:bg-blue-500 transition-colors"
                >
                  <Send className="w-5 h-5" />
                  Apply Now
                </button>
              </div>
            )}
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
