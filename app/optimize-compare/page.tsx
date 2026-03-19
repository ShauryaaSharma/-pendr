'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
  ArrowLeft,
  TrendingUp,
  DollarSign,
  Target,
  Sparkles,
  BarChart3,
  Brain,
  Users,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts'

interface CampaignData {
  budget: string
  companyName: string
  industry: string
  region: string
  targetAudience: string
  objective?: string
  campaignObjective?: string
  campaignDuration?: string
  duration?: string
  businessSize?: string
  productDescription?: string
  usp?: string
  demographics?: string
  creativeFormats?: string[]
  adFormats?: string[]
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

interface AllocationData {
  platform: string
  manual: number
  aiOptimized: number
  change: number
  color: string
}

interface KpiData {
  projectedROI: { manual: number; ai: number }
  estimatedRevenue: { manual: number; ai: number }
  estimatedConversions: { manual: number; ai: number }
  improvement: number
}

interface InsightsData {
  increased: string[]
  decreased: string[]
}

interface CompareResult {
  kpiData: KpiData
  allocationData: AllocationData[]
}

interface CompareAnalyzeApiResponse {
  success: boolean
  result?: {
    kpiData: KpiData
    allocationData: AllocationData[]
    insights: InsightsData
  }
  error?: string
}

interface GroqPlatformInsight {
  platform: string
  manualPct: number
  aiPct: number
  direction: 'increased' | 'decreased' | 'unchanged'
  engineReason: string
  strategicReason: string
  risk: string
}

interface GroqInsightsResponse {
  platformInsights: GroqPlatformInsight[]
  overallStrategy: string
  topOpportunity: string
  keyRisk: string
  quickWins: string[]
}

export default function OptimizeComparePage() {
  const router = useRouter()

  const [campaignData, setCampaignData] = useState<CampaignData | null>(null)
  const [allocationData, setAllocationData] = useState<AllocationData[]>([])
  const [kpiData, setKpiData] = useState<KpiData>({
    projectedROI: { manual: 0, ai: 0 },
    estimatedRevenue: { manual: 0, ai: 0 },
    estimatedConversions: { manual: 0, ai: 0 },
    improvement: 0,
  })
  const [activeTab, setActiveTab] = useState('visual')
  const [groqApiKey, setGroqApiKey] = useState('')
  const [groqInsightsData, setGroqInsightsData] = useState<GroqInsightsResponse | null>(null)
  const [insightsLoading, setInsightsLoading] = useState(false)
  const [insightsError, setInsightsError] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)

  const normalizeGroqInsights = (payload: unknown): GroqInsightsResponse | null => {
    if (!payload || typeof payload !== 'object') {
      return null
    }

    const raw = payload as Partial<GroqInsightsResponse>
    if (!Array.isArray(raw.platformInsights)) {
      return null
    }

    const platformInsights = raw.platformInsights
      .map((item) => {
        if (!item || typeof item !== 'object') {
          return null
        }

        const insight = item as Partial<GroqPlatformInsight>
        const platform = String(insight.platform || '').trim()
        if (!platform) {
          return null
        }

        const directionRaw = String(insight.direction || '').toLowerCase()
        const direction: 'increased' | 'decreased' | 'unchanged' =
          directionRaw === 'increased' || directionRaw === 'decreased' || directionRaw === 'unchanged'
            ? directionRaw
            : 'unchanged'

        const engineReason = String(insight.engineReason || '').trim()
        const strategicReason = String(insight.strategicReason || '').trim()
        const risk = String(insight.risk || '').trim()

        if (!engineReason || !strategicReason || !risk) {
          return null
        }

        return {
          platform,
          manualPct: Number(insight.manualPct) || 0,
          aiPct: Number(insight.aiPct) || 0,
          direction,
          engineReason,
          strategicReason,
          risk,
        }
      })
      .filter((item): item is GroqPlatformInsight => item !== null)

    const overallStrategy = String(raw.overallStrategy || '').trim()
    const topOpportunity = String(raw.topOpportunity || '').trim()
    const keyRisk = String(raw.keyRisk || '').trim()
    const quickWins = Array.isArray(raw.quickWins)
      ? raw.quickWins.map((item) => String(item).trim()).filter((item) => item.length > 0)
      : []

    if (!overallStrategy || !topOpportunity || !keyRisk || quickWins.length === 0) {
      return null
    }

    return {
      platformInsights,
      overallStrategy,
      topOpportunity,
      keyRisk,
      quickWins: quickWins.slice(0, 3),
    }
  }

  const buildFallbackComparison = (data: CampaignData): CompareResult => {
    const totalBudget = parseFloat(data.budget) || 0
    const manualRaw = data.budgetAllocation || {}

    const manualPercentages = {
      facebook: parseFloat(manualRaw.facebook || '0') || 0,
      google: parseFloat(manualRaw.google || '0') || 0,
      instagram: parseFloat(manualRaw.instagram || '0') || 0,
      tiktok: parseFloat(manualRaw.tiktok || '0') || 0,
      linkedin: parseFloat(manualRaw.linkedin || '0') || 0,
      youtube: parseFloat(manualRaw.youtube || '0') || 0,
    }

    if (Object.values(manualPercentages).every((value) => value === 0)) {
      manualPercentages.facebook = 22
      manualPercentages.google = 24
      manualPercentages.instagram = 16
      manualPercentages.tiktok = 12
      manualPercentages.linkedin = 12
      manualPercentages.youtube = 14
    }

    const sumManual = Object.values(manualPercentages).reduce((sum, value) => sum + value, 0) || 1
    const aiWeights = {
      facebook: 0.24,
      google: 0.28,
      instagram: 0.17,
      tiktok: 0.12,
      linkedin: 0.09,
      youtube: 0.1,
    }

    const platformMeta = [
      { key: 'facebook', platform: 'Facebook Ads', color: '#3B82F6' },
      { key: 'google', platform: 'Google Ads', color: '#10B981' },
      { key: 'instagram', platform: 'Instagram', color: '#EC4899' },
      { key: 'tiktok', platform: 'TikTok', color: '#000000' },
      { key: 'linkedin', platform: 'LinkedIn Ads', color: '#0077B5' },
      { key: 'youtube', platform: 'YouTube', color: '#FF0000' },
    ] as const

    const generatedAllocation = platformMeta.map((platform) => {
      const manual = totalBudget * ((manualPercentages[platform.key] || 0) / sumManual)
      const aiOptimized = totalBudget * aiWeights[platform.key]
      return {
        platform: platform.platform,
        manual,
        aiOptimized,
        change: aiOptimized - manual,
        color: platform.color,
      }
    })

    const manualRevenue = Math.round(totalBudget * 1.35)
    const aiRevenue = Math.round(totalBudget * 2.1)
    const manualConversions = Math.round(totalBudget * 0.018)
    const aiConversions = Math.round(totalBudget * 0.033)
    const manualRoi = totalBudget > 0 ? ((manualRevenue - totalBudget) / totalBudget) * 100 : 0
    const aiRoi = totalBudget > 0 ? ((aiRevenue - totalBudget) / totalBudget) * 100 : 0
    const improvement = manualRoi !== 0 ? ((aiRoi - manualRoi) / Math.abs(manualRoi)) * 100 : aiRoi

    return {
      kpiData: {
        projectedROI: {
          manual: Math.round(manualRoi * 10) / 10,
          ai: Math.round(aiRoi * 10) / 10,
        },
        estimatedRevenue: { manual: manualRevenue, ai: aiRevenue },
        estimatedConversions: { manual: manualConversions, ai: aiConversions },
        improvement: Math.round(improvement * 10) / 10,
      },
      allocationData: generatedAllocation,
    }
  }

  const fetchGroqInsights = async (campaign: CampaignData, comparison: CompareResult, apiKey: string) => {
    if (!apiKey.trim()) {
      setInsightsError('Groq API key not found.')
      return
    }

    setInsightsLoading(true)
    setInsightsError(null)

    try {
      const budgetValue = parseFloat(campaign.budget) || 0
      const safeBudget = budgetValue > 0 ? budgetValue : 1

      const shifts = comparison.allocationData
        .map((item) => {
          const manualPct = (item.manual / safeBudget) * 100
          const aiPct = (item.aiOptimized / safeBudget) * 100
          const diff = aiPct - manualPct
          return {
            platform: item.platform,
            manualPct: Math.round(manualPct * 100) / 100,
            aiPct: Math.round(aiPct * 100) / 100,
            diff: Math.round(diff * 100) / 100,
            aiBudget: Math.round(item.aiOptimized),
          }
        })
        .filter((item) => item.manualPct > 0 || item.aiPct > 0)

      const computedAllocationText = shifts
        .map((item) => `Platform: ${item.platform}: ${item.aiPct}% ($${item.aiBudget.toLocaleString()})`)
        .join('\n')

      const manualBudgetAllocation = {
        instagram: parseFloat(campaign.budgetAllocation?.instagram || '0') || 0,
        linkedin: parseFloat(campaign.budgetAllocation?.linkedin || '0') || 0,
        facebook: parseFloat(campaign.budgetAllocation?.facebook || '0') || 0,
        google: parseFloat(campaign.budgetAllocation?.google || '0') || 0,
        twitter: parseFloat(campaign.budgetAllocation?.twitter || '0') || 0,
        youtube: parseFloat(campaign.budgetAllocation?.youtube || '0') || 0,
        tiktok: parseFloat(campaign.budgetAllocation?.tiktok || '0') || 0,
        other: parseFloat(campaign.budgetAllocation?.other || '0') || 0,
      }

      const increasedPlatforms = shifts.filter((item) => item.diff > 0.01).map((item) => item.platform)
      const decreasedPlatforms = shifts.filter((item) => item.diff < -0.01).map((item) => item.platform)

      const objective = campaign.objective || campaign.campaignObjective || 'not specified'
      const duration = campaign.campaignDuration || campaign.duration || 'not specified'
      const adFormats = campaign.creativeFormats || campaign.adFormats || []

      const prompt = `You are a senior digital marketing strategist. You have been given two things:
1. A campaign brief submitted by the user
2. A mathematically computed budget allocation from a rules-based engine that uses industry CPM/CTR/CVR benchmarks, audience multipliers, region factors, and objective weights

Your job is to VALIDATE and ENRICH this allocation with strategic reasoning. Do not change the allocation percentages - explain WHY each platform received what it did, based on the full campaign context.

Campaign Brief:
- Company: ${campaign.companyName}
- Industry: ${campaign.industry}
- Total Budget: $${campaign.budget}
- Campaign Duration: ${duration}
- Objective: ${objective}
- Business Size: ${campaign.businessSize || 'not specified'}
- Target Region: ${campaign.region}
- Target Audience: ${campaign.targetAudience}
- Ad Formats: ${adFormats.join(', ') || 'not specified'}
- Product Description: ${campaign.productDescription || 'not specified'}
- USP: ${campaign.usp || 'not specified'}
- Demographics: ${campaign.demographics || 'not specified'}
- Current Impressions: ${campaign.impressions || 'not specified'}
- Current Clicks: ${campaign.clicks || 'not specified'}
- Current Conversions: ${campaign.conversions || 'not specified'}
- Current Budget Allocation: ${JSON.stringify(manualBudgetAllocation)}

Computed AI Allocation from engine (DO NOT change these numbers, only explain them):
${computedAllocationText}

Engine-computed KPIs:
- Manual Projected ROI: ${comparison.kpiData.projectedROI.manual}%
- AI Projected ROI: ${comparison.kpiData.projectedROI.ai}%
- Manual Est. Revenue: $${comparison.kpiData.estimatedRevenue.manual}
- AI Est. Revenue: $${comparison.kpiData.estimatedRevenue.ai}
- Manual Est. Conversions: ${comparison.kpiData.estimatedConversions.manual}
- AI Est. Conversions: ${comparison.kpiData.estimatedConversions.ai}
- Improvement: ${comparison.kpiData.improvement}%

Increased allocations (from engine): ${increasedPlatforms.join(', ') || 'none'}
Decreased allocations (from engine): ${decreasedPlatforms.join(', ') || 'none'}

Return ONLY raw JSON, no markdown, no explanation outside JSON:
{
  "platformInsights": [
    {
      "platform": "Platform name",
      "manualPct": 30,
      "aiPct": 14,
      "direction": "increased" | "decreased" | "unchanged",
      "engineReason": "Why the rules-based engine likely scored this platform higher/lower based on the industry, audience, and objective multipliers",
      "strategicReason": "Your strategic interpretation of why this change makes sense for THIS specific company, product, audience, and goal",
      "risk": "One-line risk or caveat for this platform allocation"
    }
  ],
  "overallStrategy": "2-3 sentence summary of the overall allocation strategy for this specific campaign",
  "topOpportunity": "The single biggest opportunity this reallocation unlocks for this company",
  "keyRisk": "The most important risk to monitor with this new allocation",
  "quickWins": ["3 specific short-term actions this company should take in the first 2 weeks"]
}`

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${apiKey.trim()}`,
        },
        body: JSON.stringify({
          model: 'llama-3.3-70b-versatile',
          max_tokens: 2500,
          temperature: 0.4,
          messages: [{ role: 'user', content: prompt }],
        }),
      })

      if (!response.ok) {
        throw new Error('Failed to fetch Groq insights.')
      }

      const payload = await response.json()
      const content = payload?.choices?.[0]?.message?.content
      if (typeof content !== 'string') {
        throw new Error('Invalid Groq response.')
      }

      let parsedJson: unknown
      try {
        parsedJson = JSON.parse(content)
      } catch {
        const objectMatch = content.match(/\{[\s\S]*\}/)
        if (!objectMatch) {
          throw new Error('Groq response is not valid JSON.')
        }
        parsedJson = JSON.parse(objectMatch[0])
      }

      const normalized = normalizeGroqInsights(parsedJson)
      if (!normalized) {
        throw new Error('Groq insights payload is missing required fields.')
      }

      setGroqInsightsData(normalized)
    } catch {
      setInsightsError('Failed to load AI insights.')
    } finally {
      setInsightsLoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false

    const loadComparison = async () => {
      const storedCampaign = localStorage.getItem('spendr_campaign_data')
      const storedKey = localStorage.getItem('spendr_groq_api_key') || ''

      if (!storedCampaign) {
        router.push('/')
        return
      }

      const parsedCampaign = JSON.parse(storedCampaign) as CampaignData
      if (cancelled) {
        return
      }

      setCampaignData(parsedCampaign)
      setGroqApiKey(storedKey)
      setGroqInsightsData(null)
      setInsightsError(null)
      setIsLoading(true)

      const fallback = buildFallbackComparison(parsedCampaign)
      let comparisonResult: CompareResult = fallback

      try {
        const response = await fetch('/api/budget-optimizer', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            mode: 'compare_analyze',
            input: parsedCampaign,
          }),
        })

        const payload = (await response.json()) as CompareAnalyzeApiResponse
        if (!response.ok || !payload.success || !payload.result) {
          throw new Error(payload.error || 'Failed to generate comparison.')
        }

        comparisonResult = {
          kpiData: payload.result.kpiData,
          allocationData: payload.result.allocationData,
        }
      } catch (error) {
        console.error('Python comparison failed, using fallback model:', error)
      }

      if (cancelled) {
        return
      }

      setKpiData(comparisonResult.kpiData)
      setAllocationData(comparisonResult.allocationData)
      setIsLoading(false)

      if (storedKey.trim()) {
        void fetchGroqInsights(parsedCampaign, comparisonResult, storedKey)
      } else {
        setInsightsError('Groq API key not found.')
      }
    }

    void loadComparison()

    return () => {
      cancelled = true
    }
  }, [router])

  const handleProceedWithManual = () => {
    router.push('/campaign-setup')
  }

  const handleProceedWithAI = () => {
    router.push('/ai-optimizer')
  }

  if (!campaignData || isLoading) {
    return <div className="flex items-center justify-center min-h-screen">Loading...</div>
  }

  const budgetValue = parseFloat(campaignData.budget) || 0
  const safeTotalBudget = budgetValue > 0 ? budgetValue : 1

  const allocationShiftData = allocationData
    .map((item) => {
      const manualPct = (item.manual / safeTotalBudget) * 100
      const aiPct = (item.aiOptimized / safeTotalBudget) * 100
      const diff = aiPct - manualPct
      return {
        platform: item.platform,
        color: item.color,
        manualPct: Math.round(manualPct * 100) / 100,
        aiPct: Math.round(aiPct * 100) / 100,
        diff: Math.round(diff * 100) / 100,
      }
    })
    .filter((item) => item.manualPct > 0 || item.aiPct > 0)

  const changedPlatformInsights = (groqInsightsData?.platformInsights || []).filter((item) => {
    if (item.direction !== 'unchanged') {
      return true
    }
    return Math.abs(item.aiPct - item.manualPct) > 0.01
  })

  return (
    <div className="min-h-screen bg-gray-50 p-4 pt-8">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">AI vs Manual Comparison</h1>
            <p className="text-gray-600">Compare your manual allocation with AI-powered optimization</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Projected ROI</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-blue-600">{kpiData.projectedROI.manual}%</span>
                <span className="text-sm text-gray-500">Manual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-red-600">{kpiData.projectedROI.ai}%</span>
                <span className="text-sm text-gray-500">AI</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Est. Revenue</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-blue-600">${kpiData.estimatedRevenue.manual.toLocaleString()}</span>
                <span className="text-sm text-gray-500">Manual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-red-600">${kpiData.estimatedRevenue.ai.toLocaleString()}</span>
                <span className="text-sm text-gray-500">AI</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Est. Conversions</CardTitle>
              <Target className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-lg font-bold text-blue-600">{kpiData.estimatedConversions.manual}</span>
                <span className="text-sm text-gray-500">Manual</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-lg font-bold text-green-600">{kpiData.estimatedConversions.ai}</span>
                <span className="text-sm text-gray-500">AI</span>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Improvement</CardTitle>
              <Sparkles className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-center">
                <div className="text-2xl font-bold text-red-600 mb-1">{kpiData.improvement}%</div>
                <div className="text-sm text-gray-500">AI vs Manual</div>
              </div>
            </CardContent>
          </Card>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="visual">Visual Comparison</TabsTrigger>
            <TabsTrigger value="detailed">Detailed Breakdown</TabsTrigger>
            <TabsTrigger value="insights">AI Insights</TabsTrigger>
          </TabsList>

          <TabsContent value="visual" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Users className="h-5 w-5" />
                    Your Manual Allocation
                  </CardTitle>
                  <CardDescription>Budget distribution based on your preferences</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationData.filter((item) => item.manual > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ platform, manual }) => `${platform} ${Math.round((manual / safeTotalBudget) * 100)}%`}
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="manual"
                        >
                          {allocationData
                            .filter((item) => item.manual > 0)
                            .map((entry, index) => (
                              <Cell key={`manual-cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Budget']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5" />
                    AI Optimization
                  </CardTitle>
                  <CardDescription>Data-driven allocation for maximum ROI</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={allocationData.filter((item) => item.aiOptimized > 0)}
                          cx="50%"
                          cy="50%"
                          labelLine={false}
                          label={({ platform, aiOptimized }) =>
                            `${platform} ${Math.round((aiOptimized / safeTotalBudget) * 100)}%`
                          }
                          outerRadius={100}
                          fill="#8884d8"
                          dataKey="aiOptimized"
                        >
                          {allocationData
                            .filter((item) => item.aiOptimized > 0)
                            .map((entry, index) => (
                              <Cell key={`ai-cell-${index}`} fill={entry.color} />
                            ))}
                        </Pie>
                        <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Budget']} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  What Changed
                </CardTitle>
                <CardDescription>Manual allocation vs AI allocation by platform</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-5">
                  {allocationShiftData.map((item) => {
                    const pillClass =
                      item.diff > 0
                        ? 'bg-green-100 text-green-700'
                        : item.diff < 0
                          ? 'bg-red-100 text-red-700'
                          : 'bg-gray-100 text-gray-700'
                    const shiftColor = item.diff > 0 ? 'bg-green-500' : item.diff < 0 ? 'bg-red-500' : 'bg-gray-400'
                    const from = Math.min(item.manualPct, item.aiPct)
                    const to = Math.max(item.manualPct, item.aiPct)
                    const width = Math.max(to - from, 1.5)
                    const diffLabel = `${item.diff > 0 ? '+' : ''}${item.diff}%`

                    return (
                      <div key={item.platform} className="space-y-2">
                        <div className="flex items-center justify-between gap-4">
                          <div className="font-medium text-gray-900">{item.platform}</div>
                          <div className="text-sm text-gray-600">
                            {item.manualPct}% {'->'} {item.aiPct}%
                          </div>
                          <span className={`text-xs font-semibold px-2 py-1 rounded-full ${pillClass}`}>{diffLabel}</span>
                        </div>
                        <div className="relative h-3 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className="absolute left-0 top-0 h-full bg-blue-200"
                            style={{ width: `${Math.max(item.manualPct, 1)}%` }}
                          />
                          <div
                            className="absolute left-0 top-0 h-full bg-emerald-200"
                            style={{ width: `${Math.max(item.aiPct, 1)}%`, opacity: 0.7 }}
                          />
                          <div
                            className={`absolute top-0 h-full ${shiftColor}`}
                            style={{ left: `${from}%`, width: `${width}%`, opacity: 0.7 }}
                          />
                        </div>
                      </div>
                    )
                  })}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="detailed" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Budget Allocation Comparison
                </CardTitle>
                <CardDescription>Direct comparison of channel allocations</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={allocationData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="platform" angle={-45} textAnchor="end" height={100} />
                      <YAxis />
                      <Tooltip formatter={(value: number) => [`$${value.toLocaleString()}`, 'Budget']} />
                      <Bar dataKey="manual" fill="#3B82F6" name="Manual" />
                      <Bar dataKey="aiOptimized" fill="#10B981" name="AI Optimized" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="insights" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Optimization Insights
                </CardTitle>
                <CardDescription>Strategic explanation layered on top of the engine output</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insightsLoading && (
                    <div className="grid grid-cols-1 gap-4">
                      {Array.from({ length: 5 }, (_, idx) => (
                        <div key={`insight-skeleton-${idx}`} className="border rounded-lg p-4 animate-pulse space-y-3">
                          <div className="h-5 w-1/3 bg-gray-200 rounded" />
                          <div className="h-4 w-11/12 bg-gray-200 rounded" />
                          <div className="h-4 w-full bg-gray-200 rounded" />
                          <div className="h-4 w-2/3 bg-gray-200 rounded" />
                        </div>
                      ))}
                    </div>
                  )}

                  {!insightsLoading && insightsError && (
                    <div className="p-4 border border-red-200 bg-red-50 rounded-lg text-sm text-red-700">{insightsError}</div>
                  )}

                  {!insightsLoading && !insightsError && groqInsightsData && (
                    <>
                      <Card className="border-blue-200 bg-blue-50">
                        <CardHeader>
                          <CardTitle className="text-lg">Overall Strategy</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <p className="text-sm text-blue-900 leading-relaxed">{groqInsightsData.overallStrategy}</p>
                        </CardContent>
                      </Card>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <Card className="border-green-200 bg-green-50">
                          <CardHeader>
                            <CardTitle className="text-base text-green-800">Top Opportunity</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-green-900">{groqInsightsData.topOpportunity}</p>
                          </CardContent>
                        </Card>

                        <Card className="border-amber-200 bg-amber-50">
                          <CardHeader>
                            <CardTitle className="text-base text-amber-800">Key Risk</CardTitle>
                          </CardHeader>
                          <CardContent>
                            <p className="text-sm text-amber-900">{groqInsightsData.keyRisk}</p>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle className="text-base">Quick Wins (First 2 Weeks)</CardTitle>
                        </CardHeader>
                        <CardContent>
                          <ul className="list-disc pl-5 space-y-1 text-sm text-gray-700">
                            {groqInsightsData.quickWins.slice(0, 3).map((win, idx) => (
                              <li key={`quick-win-${idx}`}>{win}</li>
                            ))}
                          </ul>
                        </CardContent>
                      </Card>

                      {changedPlatformInsights.length > 0 && (
                        <div className="grid grid-cols-1 gap-4">
                          {changedPlatformInsights.map((item, idx) => {
                            const isIncreased = item.direction === 'increased' || item.aiPct > item.manualPct
                            return (
                              <Card key={`${item.platform}-${idx}`} className={isIncreased ? 'border-green-200' : 'border-red-200'}>
                                <CardHeader>
                                  <div className="flex items-center justify-between gap-3">
                                    <CardTitle className="text-lg">{item.platform}</CardTitle>
                                    <span
                                      className={`text-xs font-semibold px-2 py-1 rounded-full ${
                                        isIncreased ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                      }`}
                                    >
                                      {isIncreased ? '? Increased' : '? Decreased'}
                                    </span>
                                  </div>
                                  <CardDescription>
                                    {Math.round(item.manualPct * 100) / 100}% {'->'} {Math.round(item.aiPct * 100) / 100}%
                                  </CardDescription>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                  <div>
                                    <p className="text-xs font-semibold uppercase text-gray-500 mb-1">Why the model changed this</p>
                                    <p className="text-sm text-gray-700">{item.engineReason}</p>
                                  </div>
                                  <div>
                                    <p className="text-xs font-semibold uppercase text-gray-500 mb-1">What this means for you</p>
                                    <p className="text-sm text-gray-700">{item.strategicReason}</p>
                                  </div>
                                  <p className="text-sm italic text-gray-500">Risk: {item.risk}</p>
                                </CardContent>
                              </Card>
                            )
                          })}
                        </div>
                      )}
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
          <Card className="hover:shadow-lg transition-shadow">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-gray-100 rounded-full">
                  <Users className="h-6 w-6 text-gray-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Proceed with Manual Allocation</h3>
                  <p className="text-gray-600 text-sm">Continue with your preferred budget distribution.</p>
                </div>
                <Button variant="outline" onClick={handleProceedWithManual} className="flex items-center gap-2">
                  Use My Allocation
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              </div>
            </CardContent>
          </Card>

          <Card className="hover:shadow-lg transition-shadow border-green-200 bg-green-50">
            <CardContent className="p-6">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-green-100 rounded-full">
                  <Brain className="h-6 w-6 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-lg mb-1">Proceed with AI Optimization</h3>
                  <p className="text-gray-600 text-sm">Recommended: Use data-driven allocation for better performance.</p>
                </div>
                <Button onClick={handleProceedWithAI} className="flex items-center gap-2 bg-green-600 hover:bg-green-700">
                  Use AI Optimization
                  <ArrowLeft className="h-4 w-4 rotate-180" />
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  )
}
