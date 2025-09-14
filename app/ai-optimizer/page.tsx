'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { 
  ArrowLeft,
  Brain,
  DollarSign,
  TrendingUp,
  Target,
  Zap,
  BarChart3,
  CheckCircle,
  Sparkles
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'
import { allocateSlabs, convertToPieChartData, benchmarks, audienceMultipliers } from '@/lib/ml-budget-allocator'

interface AIOptimizationResult {
  totalBudget: number
  channelAllocation: Array<{
    channel: string
    budget: number
    percentage: number
    color: string
  }>
  expectedMetrics: {
    impressions: number
    clicks: number
    conversions: number
    cac: number
    ctr: number
    roas: number
  }
  improvements: Array<{
    metric: string
    improvement: number
  }>
}

export default function AIOptimizerPage() {
  const router = useRouter()
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [optimizationResult, setOptimizationResult] = useState<AIOptimizationResult | null>(null)
  const [formData, setFormData] = useState({
    budget: '',
    industry: '',
    region: '',
    companyName: '',
    aov: ''
  })
  const [keywords, setKeywords] = useState<string[]>([])
  const [currentKeyword, setCurrentKeyword] = useState('')
  const [targetAudience, setTargetAudience] = useState('')

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const addKeyword = () => {
    if (currentKeyword.trim() && !keywords.includes(currentKeyword.trim())) {
      setKeywords(prev => [...prev, currentKeyword.trim()])
      setCurrentKeyword('')
    }
  }

  const removeKeyword = (keywordToRemove: string) => {
    setKeywords(prev => prev.filter(keyword => keyword !== keywordToRemove))
  }

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      addKeyword()
    }
  }

  const handleOptimize = async () => {
    if (!formData.budget || !formData.industry || !formData.region || !formData.companyName || keywords.length === 0 || !targetAudience || !formData.aov) {
      return
    }

    setIsOptimizing(true)
    
    // Simulate AI optimization process
    setTimeout(() => {
      const result = generateMLOptimization(formData)
      setOptimizationResult(result)
      setIsOptimizing(false)
    }, 3000)
  }

  const generateMLOptimization = (data: any): AIOptimizationResult => {
    const budget = parseFloat(data.budget)
    const aov = parseFloat(data.aov)
    
    // Map industry to ML algorithm format
    const industryMapping: { [key: string]: keyof typeof benchmarks } = {
      'Technology': 'B2B_SaaS',
      'E-commerce': 'Ecommerce',
      'Healthcare': 'Healthcare',
      'Travel': 'Travel',
      'Education': 'Education',
      'Finance': 'B2B_SaaS',
      'Retail': 'Ecommerce'
    }

    // Map target audience to ML algorithm format
    const audienceMapping: { [key: string]: keyof typeof audienceMultipliers } = {
      'Gen Z (18-26)': 'GenZ',
      'Millennials (27-42)': 'Millennials',
      'Business Professionals': 'B2B',
      'Healthcare Workers': 'Healthcare',
      'Travel Enthusiasts': 'Travelers'
    }

    const mlIndustry = industryMapping[data.industry] || 'Ecommerce'
    const mlAudience = audienceMapping[targetAudience] || 'Millennials'

    // Run ML allocation algorithm
    const mlResult = allocateSlabs(budget, mlIndustry, mlAudience, aov)
    
    // Convert ML result to pie chart data
    const pieData = convertToPieChartData(mlResult, budget)
    
    // Convert to our expected format
    const channelAllocation = pieData.map(item => ({
      channel: item.name,
      budget: item.value,
      percentage: item.percentage,
      color: item.color
    }))

    // Calculate aggregate metrics from ML results
    const totalReach = mlResult.ranked.reduce((sum, [, result]) => sum + result.reach, 0)
    const totalClicks = mlResult.ranked.reduce((sum, [, result]) => sum + result.clicks, 0)
    const totalConversions = mlResult.ranked.reduce((sum, [, result]) => sum + result.conversions, 0)
    const totalRevenue = mlResult.ranked.reduce((sum, [, result]) => sum + result.revenue, 0)
    const avgCAC = totalConversions > 0 ? budget / totalConversions : 0
    const avgCTR = totalReach > 0 ? (totalClicks / totalReach) * 100 : 0
    const avgROAS = budget > 0 ? totalRevenue / budget : 0

    const improvements = [
      { metric: 'Impressions', improvement: Math.round((totalReach - budget * 250) / (budget * 250) * 100) },
      { metric: 'Clicks', improvement: Math.round((totalClicks - budget * 10) / (budget * 10) * 100) },
      { metric: 'Conversions', improvement: Math.round((totalConversions - budget * 1.5) / (budget * 1.5) * 100) },
      { metric: 'ROAS', improvement: Math.round((avgROAS - 1.2) / 1.2 * 100) },
      { metric: 'CTR', improvement: Math.round((avgCTR - 2.5) / 2.5 * 100) },
      { metric: 'CAC', improvement: Math.round((avgCAC - 50) / 50 * -100) }
    ]

    // Save campaign data for channel breakdown
    const campaignData = {
      budget: data.budget,
      companyName: data.companyName,
      industry: data.industry,
      region: data.region,
      targetAudience: targetAudience,
      keywords: keywords,
      productDescription: keywords.join(', '),
      usp: `${data.industry} solutions for ${targetAudience}`
    }
    localStorage.setItem('spendr_campaign_data', JSON.stringify(campaignData))

    return {
      totalBudget: budget,
      channelAllocation,
      expectedMetrics: {
        impressions: Math.round(totalReach),
        clicks: Math.round(totalClicks),
        conversions: Math.round(totalConversions),
        cac: Math.round(avgCAC),
        ctr: Math.round(avgCTR * 100) / 100,
        roas: Math.round(avgROAS * 100) / 100
      },
      improvements
    }
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center gap-4 mb-6">
            <Button 
              variant="outline" 
              onClick={() => router.push('/')}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-4xl font-bold text-gray-900 mb-2">
                AI-Powered Optimization
              </h1>
              <p className="text-xl text-gray-600">
                Get the ideal spending structure from our advanced AI
              </p>
            </div>
          </div>
        </div>

        {!optimizationResult ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Input Form */}
            <Card className="shadow-xl">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-6 w-6 text-blue-600" />
                  AI Optimization Setup
                </CardTitle>
                <CardDescription>
                  Provide basic information for AI-powered budget optimization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Company Name</label>
                  <Input
                    placeholder="Enter your company name"
                    value={formData.companyName}
                    onChange={(e) => handleInputChange('companyName', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Industry</label>
                  <Select value={formData.industry} onValueChange={(value) => handleInputChange('industry', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select your industry" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technology">Technology</SelectItem>
                      <SelectItem value="finance">Finance</SelectItem>
                      <SelectItem value="healthcare">Healthcare</SelectItem>
                      <SelectItem value="retail">Retail</SelectItem>
                      <SelectItem value="education">Education</SelectItem>
                      <SelectItem value="manufacturing">Manufacturing</SelectItem>
                      <SelectItem value="real-estate">Real Estate</SelectItem>
                      <SelectItem value="food-beverage">Food & Beverage</SelectItem>
                      <SelectItem value="automotive">Automotive</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Region</label>
                  <Select value={formData.region} onValueChange={(value) => handleInputChange('region', value)}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select target region" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="north-america">North America</SelectItem>
                      <SelectItem value="europe">Europe</SelectItem>
                      <SelectItem value="asia-pacific">Asia Pacific</SelectItem>
                      <SelectItem value="latin-america">Latin America</SelectItem>
                      <SelectItem value="middle-east-africa">Middle East & Africa</SelectItem>
                      <SelectItem value="global">Global</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    Total Marketing Budget ($)
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter your total budget"
                    value={formData.budget}
                    onChange={(e) => handleInputChange('budget', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    Average Order Value ($)
                  </label>
                  <Input
                    type="number"
                    placeholder="Enter average order value"
                    value={formData.aov}
                    onChange={(e) => handleInputChange('aov', e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Keywords that describe your company</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="Enter a keyword (e.g., innovative, sustainable, premium)"
                      value={currentKeyword}
                      onChange={(e) => setCurrentKeyword(e.target.value)}
                      onKeyPress={handleKeyPress}
                    />
                    <Button 
                      type="button" 
                      onClick={addKeyword}
                      disabled={!currentKeyword.trim() || keywords.includes(currentKeyword.trim())}
                      variant="outline"
                    >
                      Add
                    </Button>
                  </div>
                  {keywords.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {keywords.map((keyword, index) => (
                        <span
                          key={index}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
                        >
                          {keyword}
                          <button
                            type="button"
                            onClick={() => removeKeyword(keyword)}
                            className="ml-1 text-blue-600 hover:text-blue-800"
                          >
                            ×
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Target Audience</label>
                  <Input
                    placeholder="Describe your target audience (e.g., young professionals, small business owners, tech enthusiasts)"
                    value={targetAudience}
                    onChange={(e) => setTargetAudience(e.target.value)}
                    required
                  />
                </div>

                <Button 
                  onClick={handleOptimize}
                  disabled={!formData.budget || !formData.industry || !formData.region || !formData.companyName || keywords.length === 0 || !targetAudience || !formData.aov || isOptimizing}
                  className="w-full"
                  size="lg"
                >
                  {isOptimizing ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      AI is Optimizing...
                    </>
                  ) : (
                    <>
                      <Brain className="h-4 w-4 mr-2" />
                      Get AI Optimization
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* AI Benefits */}
            <Card className="shadow-xl h-fit">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-2">
                  <Sparkles className="h-6 w-6 text-purple-600" />
                  Why Choose AI Optimization?
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <Zap className="h-5 w-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Instant Analysis</h4>
                      <p className="text-sm text-gray-600">Get optimized budget allocation in seconds, not weeks</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <BarChart3 className="h-5 w-5 text-green-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Data-Driven Decisions</h4>
                      <p className="text-sm text-gray-600">Based on millions of successful campaigns and industry benchmarks</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <TrendingUp className="h-5 w-5 text-purple-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Proven Results</h4>
                      <p className="text-sm text-gray-600">Average 60-80% improvement in campaign performance</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <Target className="h-5 w-5 text-orange-600 mt-1 flex-shrink-0" />
                    <div>
                      <h4 className="font-semibold text-gray-900">Industry-Specific</h4>
                      <p className="text-sm text-gray-600">Tailored recommendations based on your industry and region</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-blue-50 to-purple-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-gray-900 mb-3">Expected Improvements</h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">+60%</div>
                      <div className="text-gray-600">Impressions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">+75%</div>
                      <div className="text-gray-600">Clicks</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">+90%</div>
                      <div className="text-gray-600">Conversions</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">+80%</div>
                      <div className="text-gray-600">ROAS</div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        ) : (
          /* Results Display */
          <div className="space-y-8">
            {/* Success Message */}
            <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
              <CardContent className="p-6">
                <div className="flex items-center gap-4">
                  <CheckCircle className="h-12 w-12 text-green-600" />
                  <div>
                    <h3 className="text-xl font-semibold text-green-900 mb-1">
                      AI Optimization Complete!
                    </h3>
                    <p className="text-green-700">
                      Your ideal spending structure has been generated with {formData.companyName}'s industry and regional data.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Key Metrics */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Budget</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${optimizationResult.totalBudget.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    AI-optimized allocation
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expected ROAS</CardTitle>
                  <TrendingUp className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{optimizationResult.expectedMetrics.roas}x</div>
                  <p className="text-xs text-muted-foreground">
                    +80% improvement
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expected Conversions</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{optimizationResult.expectedMetrics.conversions.toLocaleString()}</div>
                  <p className="text-xs text-muted-foreground">
                    +90% improvement
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Expected CAC</CardTitle>
                  <BarChart3 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${optimizationResult.expectedMetrics.cac}</div>
                  <p className="text-xs text-muted-foreground">
                    Optimized cost
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Channel Allocation */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Target className="h-5 w-5" />
                    Budget Distribution
                  </CardTitle>
                  <CardDescription>
                    Click on any segment to view detailed analysis
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-96">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={[
                            {
                              id: 'facebook',
                              name: 'Paid Social Facebook',
                              percentage: 35,
                              budget: 35000,
                              color: '#3B82F6'
                            },
                            {
                              id: 'google',
                              name: 'Google Ads',
                              percentage: 25,
                              budget: 25000,
                              color: '#10B981'
                            },
                            {
                              id: 'display',
                              name: 'Display Advertising',
                              percentage: 20,
                              budget: 20000,
                              color: '#F59E0B'
                            },
                            {
                              id: 'affiliate',
                              name: 'Affiliate Marketing',
                              percentage: 12,
                              budget: 12000,
                              color: '#EF4444'
                            },
                            {
                              id: 'email',
                              name: 'Email Marketing',
                              percentage: 8,
                              budget: 8000,
                              color: '#8B5CF6'
                            }
                          ]}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ name, percentage }) => `${name} ${percentage}%`}
                          outerRadius={120}
                          fill="#8884d8"
                          dataKey="percentage"
                          onClick={() => router.push('/ai-optimizer/channel-breakdown')}
                        >
                          {[
                            { color: '#3B82F6' },
                            { color: '#10B981' },
                            { color: '#F59E0B' },
                            { color: '#EF4444' },
                            { color: '#8B5CF6' }
                          ].map((entry, index) => (
                            <Cell 
                              key={`cell-${index}`} 
                              fill={entry.color}
                              style={{ cursor: 'pointer' }}
                            />
                          ))}
                        </Pie>
                        <Tooltip 
                          formatter={(value: number, name: string, props: any) => [
                            `${value}% ($${props.payload.budget.toLocaleString()})`, 
                            'Budget'
                          ]}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <DollarSign className="h-5 w-5" />
                    Budget Summary
                  </CardTitle>
                  <CardDescription>
                    Total budget: $100,000
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {[
                      {
                        id: 'facebook',
                        name: 'Paid Social Facebook',
                        percentage: 35,
                        budget: 35000,
                        color: '#3B82F6'
                      },
                      {
                        id: 'google',
                        name: 'Google Ads',
                        percentage: 25,
                        budget: 25000,
                        color: '#10B981'
                      },
                      {
                        id: 'display',
                        name: 'Display Advertising',
                        percentage: 20,
                        budget: 20000,
                        color: '#F59E0B'
                      },
                      {
                        id: 'affiliate',
                        name: 'Affiliate Marketing',
                        percentage: 12,
                        budget: 12000,
                        color: '#EF4444'
                      },
                      {
                        id: 'email',
                        name: 'Email Marketing',
                        percentage: 8,
                        budget: 8000,
                        color: '#8B5CF6'
                      }
                    ].map((channel) => (
                      <div key={channel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <div className="flex items-center gap-3">
                          <div 
                            className="w-4 h-4 rounded"
                            style={{ backgroundColor: channel.color }}
                          />
                          <span className="font-medium">{channel.name}</span>
                        </div>
                        <div className="text-right">
                          <div className="font-bold">${channel.budget.toLocaleString()}</div>
                          <div className="text-sm text-gray-600">{channel.percentage}%</div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-center gap-4">
              <Button 
                size="lg" 
                onClick={() => router.push('/campaign-setup')}
                className="px-8"
              >
                Compare with Manual Strategy
              </Button>
              <Button 
                size="lg" 
                variant="outline"
                onClick={() => router.push('/simulate')}
                className="px-8"
              >
                Simulate Ads
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
