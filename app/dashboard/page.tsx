'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { 
  DollarSign, 
  Users, 
  Globe, 
  Clock, 
  Target, 
  TrendingUp, 
  Eye, 
  Lightbulb,
  BarChart3
} from 'lucide-react'
import { ImprovedFunnelChart } from '@/components/improved-funnel-chart'
import { RegionalHeatmap } from '@/components/regional-heatmap'
import { BudgetAllocationChart } from '@/components/budget-allocation-chart'
import { ShortcomingsPanel } from '@/components/shortcomings-panel'

interface CampaignData {
  budget: string
  productDescription: string
  targetAudience: string
  region: string
  campaignDuration: string
  objective?: string
  businessSize?: string
  usp: string
  demographics: string
  companyName: string
  industry: string
  impressions?: string
  clicks?: string
  conversions?: string
  budgetAllocation?: {
    instagram?: string
    linkedin?: string
    facebook?: string
    google?: string
    twitter?: string
    youtube?: string
    tiktok?: string
    other?: string
  }
}

interface PredictedMetrics {
  impressions: number
  clicks: number
  conversions: number
  cac: number
  ctr: number
  roas: number
}

export default function DashboardPage() {
  const router = useRouter()
  const [campaignData, setCampaignData] = useState<CampaignData | null>(null)
  const [predictedMetrics, setPredictedMetrics] = useState<PredictedMetrics | null>(null)
  const [groqApiKey, setGroqApiKey] = useState('')

  useEffect(() => {
    const data = localStorage.getItem('spendr_campaign_data')
    const savedGroqApiKey = localStorage.getItem('spendr_groq_api_key')
    if (data) {
      const parsed = JSON.parse(data)
      setCampaignData(parsed)
      
      // Generate predicted metrics based on input
      const metrics = generatePredictedMetrics(parsed)
      setPredictedMetrics(metrics)
    } else {
      router.push('/')
    }

    if (savedGroqApiKey) {
      setGroqApiKey(savedGroqApiKey)
    }
  }, [router])

  const generatePredictedMetrics = (data: CampaignData): PredictedMetrics => {
    const budget = parseFloat(data.budget)
    
    // Use user-provided data if available, otherwise generate AI predictions
    let impressions, clicks, conversions
    
    if (data.impressions && data.clicks && data.conversions) {
      // Use user-provided data
      impressions = parseInt(data.impressions)
      clicks = parseInt(data.clicks)
      conversions = parseInt(data.conversions)
    } else {
      // Generate AI predictions based on budget and other factors
      const baseMultiplier = data.industry === 'technology' ? 1.2 : data.industry === 'finance' ? 1.1 : 1.0
      const regionMultiplier = data.region === 'north-america' ? 1.3 : data.region === 'europe' ? 1.1 : 0.9
      
      impressions = Math.round(budget * 150 * baseMultiplier * regionMultiplier)
      clicks = Math.round(impressions * 0.025) // 2.5% CTR
      conversions = Math.round(clicks * 0.08) // 8% conversion rate
    }
    
    // Calculate derived metrics
    const cac = conversions > 0 ? Math.round(budget / conversions) : 0
    const ctr = impressions > 0 ? Math.round((clicks / impressions) * 100 * 100) / 100 : 0
    const roas = conversions > 0 ? Math.round((conversions * 150) / budget * 100) / 100 : 0 // Assuming $150 average order value

    return { impressions, clicks, conversions, cac, ctr, roas }
  }

  if (!campaignData || !predictedMetrics) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-8">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Campaign Dashboard
          </h1>
          <p className="text-gray-600">
            {campaignData.companyName} • {campaignData.industry} • {campaignData.region}
          </p>
        </div>

        {/* Campaign Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Budget</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">${parseInt(campaignData.budget).toLocaleString()}</div>
              <p className="text-xs text-muted-foreground">
                {campaignData.campaignDuration}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Target Audience</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaignData.targetAudience}</div>
              <p className="text-xs text-muted-foreground">
                {campaignData.region}
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Campaign Duration</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{campaignData.campaignDuration}</div>
              <p className="text-xs text-muted-foreground">
                Active period
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">USP</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-sm font-medium line-clamp-2">{campaignData.usp}</div>
            </CardContent>
          </Card>
        </div>

        {/* Predicted Reach Model */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Campaign Performance Metrics
            </CardTitle>
            <CardDescription>
              {campaignData.impressions || campaignData.clicks || campaignData.conversions 
                ? "Your current campaign data" 
                : "AI-powered predictions based on your campaign parameters"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-6">

              {/* AI Predictions */}
              <div>
                <h4 className="text-lg font-semibold mb-4 text-gray-900">
                  {campaignData.impressions || campaignData.clicks || campaignData.conversions 
                    ? "Calculated Performance" 
                    : "AI-Predicted Performance"}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-orange-600 mb-1">
                      ${predictedMetrics.cac}
                    </div>
                    <div className="text-sm text-gray-600">CAC</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-indigo-600 mb-1">
                      {predictedMetrics.ctr}%
                    </div>
                    <div className="text-sm text-gray-600">CTR</div>
                  </div>
                  <div className="text-center p-4 bg-gray-50 rounded-lg">
                    <div className="text-2xl font-bold text-emerald-600 mb-1">
                      {predictedMetrics.roas}x
                    </div>
                    <div className="text-sm text-gray-600">ROAS</div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="mb-6 rounded-lg border bg-white p-4">
          <div className="flex flex-col gap-2 md:flex-row md:items-center">
            <label htmlFor="groq-api-key" className="text-sm font-medium text-gray-800">
              🔑 Groq API Key:
            </label>
            <Input
              id="groq-api-key"
              type="password"
              placeholder="gsk_..."
              value={groqApiKey}
              onChange={(e) => {
                const nextValue = e.target.value
                setGroqApiKey(nextValue)
                localStorage.setItem('spendr_groq_api_key', nextValue)
              }}
              className="md:max-w-xl"
            />
          </div>
        </div>

        {/* Main Content Tabs */}
        <Tabs defaultValue="visualizations" className="space-y-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="visualizations">Visualizations</TabsTrigger>
            <TabsTrigger value="shortcomings">Shortcomings</TabsTrigger>
            <TabsTrigger value="optimize">Optimize and Compare</TabsTrigger>
            <TabsTrigger value="simulate">Simulate Ad</TabsTrigger>
            <TabsTrigger value="rate-ad">Rate Ad</TabsTrigger>
          </TabsList>

          <TabsContent value="visualizations" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <ImprovedFunnelChart data={predictedMetrics} />

              <Card>
                <CardHeader>
                  <CardTitle>Regional Heatmap</CardTitle>
                </CardHeader>
                <CardContent>
                  <RegionalHeatmap region={campaignData.region} />
                </CardContent>
              </Card>
            </div>

            <BudgetAllocationChart 
              budgetAllocation={campaignData.budgetAllocation || {}} 
              totalBudget={parseFloat(campaignData.budget)} 
            />
          </TabsContent>

          <TabsContent value="shortcomings">
            <ShortcomingsPanel 
              campaignData={campaignData} 
              predictedMetrics={predictedMetrics} 
              groqApiKey={groqApiKey}
            />
          </TabsContent>

          <TabsContent value="optimize">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5" />
                  AI Optimization & Comparison
                </CardTitle>
                <CardDescription>
                  Compare your manual allocation with AI-powered optimization
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Lightbulb className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Ready to Optimize and Compare?</h3>
                  <p className="text-gray-600 mb-6">
                    Compare your current budget allocation with AI-optimized recommendations
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => router.push('/optimize-compare')}
                    className="px-8"
                  >
                    Optimize and Compare
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="simulate">
            <Card>
              <CardHeader>
                <CardTitle>Ad Simulation</CardTitle>
                <CardDescription>
                  See how your ads would look on different platforms
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <Eye className="h-16 w-16 text-blue-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Simulate Your Ads</h3>
                  <p className="text-gray-600 mb-6">
                    Upload your ad creatives and see how they would appear across different platforms
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => router.push('/simulate')}
                    className="px-8"
                  >
                    Start Ad Simulation
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="rate-ad">
            <Card>
              <CardHeader>
                <CardTitle>Ad Rating & Analysis</CardTitle>
                <CardDescription>
                  Get AI-powered analysis and improvement suggestions for your ads
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12">
                  <BarChart3 className="h-16 w-16 text-green-500 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold mb-2">Rate Your Ads</h3>
                  <p className="text-gray-600 mb-6">
                    Analyze your ad copy with AI-powered scoring and get detailed improvement suggestions
                  </p>
                  <Button 
                    size="lg" 
                    onClick={() => router.push('/rate-ad')}
                    className="px-8"
                  >
                    Start Ad Analysis
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  )
}
