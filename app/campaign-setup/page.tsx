'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Target, DollarSign, Globe, Clock, Users, Lightbulb } from 'lucide-react'
import {
  AD_CREATIVE_FORMAT_OPTIONS,
  BUSINESS_SIZE_OPTIONS,
  CAMPAIGN_OBJECTIVE_OPTIONS,
  CAMPAIGN_DURATION_OPTIONS,
  INDUSTRY_OPTIONS,
  REGION_OPTIONS,
  TARGET_AUDIENCE_GROUPS,
} from '@/lib/form-options'

export default function CampaignSetupPage() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    campaignName: '',
    budget: '',
    productDescription: '',
    targetAudience: '',
    region: '',
    campaignDuration: '',
    objective: '',
    businessSize: '',
    creativeFormats: [] as string[],
    usp: '',
    demographics: '',
    companyName: '',
    industry: '',
    impressions: '',
    clicks: '',
    conversions: '',
    // Budget allocation
    budgetAllocation: {
      instagram: '',
      linkedin: '',
      facebook: '',
      google: '',
      twitter: '',
      youtube: '',
      tiktok: '',
      other: ''
    }
  })

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleBudgetAllocationChange = (platform: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      budgetAllocation: {
        ...prev.budgetAllocation,
        [platform]: value
      }
    }))
  }

  const handleCreativeFormatsChange = (selectedValues: string[]) => {
    setFormData((prev) => ({
      ...prev,
      creativeFormats: selectedValues,
    }))
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    // Save form data to localStorage
    localStorage.setItem('spendr_campaign_data', JSON.stringify(formData))
    
    // Create a new project and save it
    const newProject = {
      id: Date.now().toString(),
      name: formData.campaignName || 'New Campaign',
      company: formData.companyName,
      industry: formData.industry,
      budget: parseFloat(formData.budget),
      status: 'draft' as const,
      createdAt: new Date().toISOString(),
      lastModified: new Date().toISOString(),
      metrics: {
        impressions: formData.impressions ? parseInt(formData.impressions) : 0,
        clicks: formData.clicks ? parseInt(formData.clicks) : 0,
        conversions: formData.conversions ? parseInt(formData.conversions) : 0,
        roas: 0
      },
      data: formData
    }
    
    // Get existing projects
    const existingProjects = JSON.parse(localStorage.getItem('spendr_projects') || '[]')
    const updatedProjects = [...existingProjects, newProject]
    localStorage.setItem('spendr_projects', JSON.stringify(updatedProjects))
    
    // Navigate to dashboard
    router.push('/dashboard')
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4 pt-8">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-4xl font-bold text-gray-900 mb-2">
              Campaign Setup
            </h1>
            <p className="text-xl text-gray-600">
              Provide your campaign details for comprehensive analysis
            </p>
          </div>
        </div>

        <Card className="shadow-xl">
          <CardHeader>
            <CardTitle className="text-2xl text-center">Campaign Details</CardTitle>
            <CardDescription className="text-center">
              Fill in your campaign information to get started with analysis and optimization
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Company Name */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Users className="h-4 w-4" />
                    Company Name
                  </label>
                  <Input
                    placeholder="Enter your company name"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    required
                  />
                </div>

                {/* Industry */}
                <div className="space-y-2">
                  <label className="text-sm font-medium">Industry</label>
                  <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRY_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Budget */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Campaign Budget ($)
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter your budget"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    required
                  />
                </div>

                {/* Campaign Duration */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Clock className="h-4 w-4" />
                    Campaign Duration
                  </label>
                  <Select value={formData.campaignDuration} onValueChange={(value) => handleInputChange('campaignDuration', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select duration" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPAIGN_DURATION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Campaign Objective</label>
                  <Select value={formData.objective} onValueChange={(value) => handleInputChange('objective', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select campaign objective" />
                    </SelectTrigger>
                    <SelectContent>
                      {CAMPAIGN_OBJECTIVE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Business Size</label>
                  <Select value={formData.businessSize} onValueChange={(value) => handleInputChange('businessSize', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select business size" />
                    </SelectTrigger>
                    <SelectContent>
                      {BUSINESS_SIZE_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Region */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Globe className="h-4 w-4" />
                    Target Region
                  </label>
                  <Select value={formData.region} onValueChange={(value) => handleInputChange('region', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target region" />
                    </SelectTrigger>
                    <SelectContent>
                      {REGION_OPTIONS.map((option) => (
                        <SelectItem key={option.value} value={option.value}>
                          {option.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Target Audience */}
                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <Target className="h-4 w-4" />
                    Target Audience
                  </label>
                  <select
                    value={formData.targetAudience}
                    onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                    required
                  >
                    <option value="" disabled>
                      Select target audience
                    </option>
                    {TARGET_AUDIENCE_GROUPS.map((group) => (
                      <optgroup key={group.label} label={group.label}>
                        {group.options.map((option) => (
                          <option key={option.value} value={option.value}>
                            {option.label}
                          </option>
                        ))}
                      </optgroup>
                    ))}
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Ad Creative Format (Multi-select)</label>
                <select
                  multiple
                  value={formData.creativeFormats}
                  onChange={(e) => {
                    const selectedValues = Array.from(e.target.selectedOptions).map((option) => option.value)
                    handleCreativeFormatsChange(selectedValues)
                  }}
                  className="flex min-h-[130px] w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
                >
                  {AD_CREATIVE_FORMAT_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-gray-500">
                  Hold Ctrl (Windows) or Command (Mac) to select multiple formats.
                </p>
              </div>

              {/* Product Description */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Product/Service Description</label>
                <Textarea
                  placeholder="Describe your product or service in detail..."
                  value={formData.productDescription}
                  onChange={(e) => handleInputChange('productDescription', e.target.value)}
                  className="min-h-[100px]"
                  required
                />
              </div>

              {/* USP */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Lightbulb className="h-4 w-4" />
                  Unique Selling Proposition (USP)
                </label>
                <Textarea
                  placeholder="What makes your product/service unique?"
                  value={formData.usp}
                  onChange={(e) => handleInputChange('usp', e.target.value)}
                  className="min-h-[80px]"
                  required
                />
              </div>

              {/* Demographics */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Demographics</label>
                <Textarea
                  placeholder="Age range, gender, income level, interests, etc."
                  value={formData.demographics}
                  onChange={(e) => handleInputChange('demographics', e.target.value)}
                  className="min-h-[80px]"
                  required
                />
              </div>

              {/* Performance Metrics */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Current Campaign Performance</h3>
                <p className="text-sm text-gray-600">Enter your current campaign metrics (if available)</p>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Impressions</label>
                    <Input
                      type="number"
                      placeholder="e.g., 100000"
                      value={formData.impressions}
                      onChange={(e) => handleInputChange('impressions', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Clicks</label>
                    <Input
                      type="number"
                      placeholder="e.g., 2500"
                      value={formData.clicks}
                      onChange={(e) => handleInputChange('clicks', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Conversions</label>
                    <Input
                      type="number"
                      placeholder="e.g., 125"
                      value={formData.conversions}
                      onChange={(e) => handleInputChange('conversions', e.target.value)}
                    />
                  </div>
                </div>
              </div>


              {/* Budget Allocation */}
              <div className="space-y-4">
                <h3 className="text-lg font-semibold text-gray-900">Current Budget Allocation (%)</h3>
                <p className="text-sm text-gray-600">How do you currently distribute your marketing budget across platforms?</p>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Instagram</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.budgetAllocation.instagram}
                      onChange={(e) => handleBudgetAllocationChange('instagram', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">LinkedIn</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.budgetAllocation.linkedin}
                      onChange={(e) => handleBudgetAllocationChange('linkedin', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Facebook</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.budgetAllocation.facebook}
                      onChange={(e) => handleBudgetAllocationChange('facebook', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Google</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.budgetAllocation.google}
                      onChange={(e) => handleBudgetAllocationChange('google', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Twitter</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.budgetAllocation.twitter}
                      onChange={(e) => handleBudgetAllocationChange('twitter', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">YouTube</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.budgetAllocation.youtube}
                      onChange={(e) => handleBudgetAllocationChange('youtube', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">TikTok</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.budgetAllocation.tiktok}
                      onChange={(e) => handleBudgetAllocationChange('tiktok', e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Other</label>
                    <Input
                      type="number"
                      placeholder="0"
                      value={formData.budgetAllocation.other}
                      onChange={(e) => handleBudgetAllocationChange('other', e.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="flex justify-center pt-6">
                <Button type="submit" size="lg" className="px-12">
                  Generate Campaign Analysis
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
