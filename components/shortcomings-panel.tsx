'use client'

import { useEffect, useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AlertTriangle, TrendingUp, Users, DollarSign, Globe } from 'lucide-react'

interface ShortcomingsPanelProps {
  campaignData: {
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
    creativeFormats?: string[]
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
  predictedMetrics: {
    impressions: number
    clicks: number
    conversions: number
    cac: number
    ctr: number
    roas: number
  }
  groqApiKey: string
}

type ShortcomingCategory = 'budget' | 'targeting' | 'creative' | 'timing' | 'regional' | 'performance'

interface ShortcomingCard {
  title: string
  category: ShortcomingCategory
  description: string
  impact: string
  recommendation: string
  caseStudy: {
    company: string
    situation: string
    solution: string
    result: string
  }
}

const FALLBACK_SHORTCOMINGS: ShortcomingCard[] = []

export function ShortcomingsPanel({ campaignData, predictedMetrics, groqApiKey }: ShortcomingsPanelProps) {
  const [shortcomings, setShortcomings] = useState<ShortcomingCard[]>(FALLBACK_SHORTCOMINGS)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    let cancelled = false

    const parseAllocation = (value: string | undefined) => {
      const parsed = parseFloat(value || '0')
      return Number.isFinite(parsed) ? parsed : 0
    }

    const buildPayloadContext = () => ({
      companyName: campaignData.companyName,
      productDescription: campaignData.productDescription,
      usp: campaignData.usp,
      targetAudience: campaignData.targetAudience,
      demographics: campaignData.demographics,
      industry: campaignData.industry,
      budget: parseFloat(campaignData.budget || '0') || 0,
      duration: campaignData.campaignDuration,
      region: campaignData.region,
      objective: campaignData.objective || '',
      businessSize: campaignData.businessSize || '',
      adFormats: campaignData.creativeFormats || [],
      currentPerformance: {
        impressions: predictedMetrics.impressions,
        clicks: predictedMetrics.clicks,
        conversions: predictedMetrics.conversions,
      },
      channelAllocation: {
        google: parseAllocation(campaignData.budgetAllocation?.google),
        facebook: parseAllocation(campaignData.budgetAllocation?.facebook),
        instagram: parseAllocation(campaignData.budgetAllocation?.instagram),
        linkedin: parseAllocation(campaignData.budgetAllocation?.linkedin),
        youtube: parseAllocation(campaignData.budgetAllocation?.youtube),
        tiktok: parseAllocation(campaignData.budgetAllocation?.tiktok),
        twitter: parseAllocation(campaignData.budgetAllocation?.twitter),
        other: parseAllocation(campaignData.budgetAllocation?.other),
      },
    })

    const parseGroqArray = (content: string): unknown[] => {
      try {
        const parsed = JSON.parse(content)
        return Array.isArray(parsed) ? parsed : []
      } catch {
        const match = content.match(/\[[\s\S]*\]/)
        if (!match) {
          return []
        }
        try {
          const parsed = JSON.parse(match[0])
          return Array.isArray(parsed) ? parsed : []
        } catch {
          return []
        }
      }
    }

    const normalizeCards = (items: unknown[]): ShortcomingCard[] => {
      const allowedCategories: ShortcomingCategory[] = [
        'budget',
        'targeting',
        'creative',
        'timing',
        'regional',
        'performance',
      ]

      const normalized = items
        .map((item) => {
          if (!item || typeof item !== 'object') {
            return null
          }
          const raw = item as Partial<ShortcomingCard>
          const caseStudy = raw.caseStudy && typeof raw.caseStudy === 'object' ? raw.caseStudy : null
          const category = allowedCategories.includes(raw.category as ShortcomingCategory)
            ? (raw.category as ShortcomingCategory)
            : 'performance'

          if (!caseStudy) {
            return null
          }

          const card: ShortcomingCard = {
            title: String(raw.title || '').trim(),
            category,
            description: String(raw.description || '').trim(),
            impact: String(raw.impact || '').trim(),
            recommendation: String(raw.recommendation || '').trim(),
            caseStudy: {
              company: String(caseStudy.company || '').trim(),
              situation: String(caseStudy.situation || '').trim(),
              solution: String(caseStudy.solution || '').trim(),
              result: String(caseStudy.result || '').trim(),
            },
          }

          if (
            !card.title ||
            !card.description ||
            !card.impact ||
            !card.recommendation ||
            !card.caseStudy.company ||
            !card.caseStudy.situation ||
            !card.caseStudy.solution ||
            !card.caseStudy.result
          ) {
            return null
          }

          return card
        })
        .filter((card): card is ShortcomingCard => card !== null)

      return normalized
    }

    const fetchShortcomings = async () => {
      if (!groqApiKey.trim()) {
        setShortcomings([])
        setError('Enter your Groq API key above to generate AI shortcomings.')
        return
      }

      setLoading(true)
      setError(null)

      const context = buildPayloadContext()
      const prompt = `You are an expert digital marketing analyst. Based on the following campaign data, identify EXACTLY 4 real problems this company is facing with their current budget and strategy. For each problem explain: what the problem is, what its impact is, how to solve it, and provide a REAL documented case study of a company that faced the same issue — what they did and the quantified result.

Campaign Data: ${JSON.stringify(context)}

Respond ONLY in raw JSON array, no markdown, no explanation:
[
  {
    "title": "Problem title specific to this campaign's data",
    "category": "budget|targeting|creative|timing|regional|performance",
    "description": "What the problem is, referencing actual numbers from the form",
    "impact": "What impact this is currently having",
    "recommendation": "How to solve it, with specific numbers/percentages",
    "caseStudy": {
      "company": "Real company name",
      "situation": "The similar problem they faced",
      "solution": "What they did to fix it",
      "result": "Quantified outcome e.g. increased ROAS by 85%"
    }
  }
]`

      try {
        const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${groqApiKey.trim()}`,
          },
          body: JSON.stringify({
            model: 'llama-3.3-70b-versatile',
            max_tokens: 3000,
            temperature: 0.65,
            messages: [{ role: 'user', content: prompt }],
          }),
        })

        if (!response.ok) {
          throw new Error('Failed to fetch AI shortcomings.')
        }

        const data = await response.json()
        const rawContent = data?.choices?.[0]?.message?.content
        if (typeof rawContent !== 'string') {
          throw new Error('Invalid AI response format.')
        }

        const parsedArray = parseGroqArray(rawContent)
        const normalized = normalizeCards(parsedArray)
        if (normalized.length === 0) {
          throw new Error('AI response could not be parsed into shortcomings cards.')
        }

        if (!cancelled) {
          setShortcomings(normalized)
        }
      } catch {
        if (!cancelled) {
          setShortcomings([])
          setError('Unable to generate AI shortcomings. Please check your API key and try again.')
        }
      } finally {
        if (!cancelled) {
          setLoading(false)
        }
      }
    }

    void fetchShortcomings()

    return () => {
      cancelled = true
    }
  }, [campaignData, predictedMetrics, groqApiKey])

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'border-red-200 bg-red-50'
      case 'medium': return 'border-yellow-200 bg-yellow-50'
      case 'low': return 'border-blue-200 bg-blue-50'
      default: return 'border-gray-200 bg-gray-50'
    }
  }

  const getSeverityIconColor = (severity: string) => {
    switch (severity) {
      case 'high': return 'text-red-600'
      case 'medium': return 'text-yellow-600'
      case 'low': return 'text-blue-600'
      default: return 'text-gray-600'
    }
  }

  const getCardConfigFromCategory = (category: ShortcomingCategory) => {
    switch (category) {
      case 'budget':
        return { icon: DollarSign, severity: 'high' }
      case 'targeting':
        return { icon: Users, severity: 'medium' }
      case 'regional':
        return { icon: Globe, severity: 'medium' }
      case 'timing':
        return { icon: TrendingUp, severity: 'low' }
      case 'creative':
        return { icon: TrendingUp, severity: 'medium' }
      case 'performance':
        return { icon: TrendingUp, severity: 'high' }
      default:
        return { icon: TrendingUp, severity: 'low' }
    }
  }

  return (
    <div className="space-y-6">
      <div className="text-center mb-8">
        <AlertTriangle className="h-12 w-12 text-orange-500 mx-auto mb-4" />
        <h2 className="text-2xl font-bold text-gray-900 mb-2">Campaign Analysis</h2>
        <p className="text-gray-600">
          Our AI has identified several areas where your campaign can be improved
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {loading
          ? Array.from({ length: 4 }, (_, idx) => (
              <Card key={`shortcoming-skeleton-${idx}`} className="border-2 animate-pulse">
                <CardHeader>
                  <div className="space-y-3">
                    <div className="h-5 w-3/4 bg-gray-200 rounded" />
                    <div className="h-4 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-5/6 bg-gray-200 rounded" />
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="h-4 w-full bg-gray-200 rounded" />
                  <div className="h-4 w-4/5 bg-gray-200 rounded" />
                  <div className="h-4 w-full bg-gray-200 rounded" />
                  <div className="h-px w-full bg-gray-200" />
                  <div className="h-4 w-full bg-gray-200 rounded" />
                  <div className="h-4 w-3/4 bg-gray-200 rounded" />
                </CardContent>
              </Card>
            ))
          : shortcomings.map((shortcoming, index) => {
          const { icon: IconComponent, severity } = getCardConfigFromCategory(shortcoming.category)
          return (
            <Card key={`${shortcoming.title}-${index}`} className={`border-2 ${getSeverityColor(severity)}`}>
              <CardHeader>
                <div className="flex items-start gap-3">
                  <IconComponent className={`h-6 w-6 mt-1 ${getSeverityIconColor(severity)}`} />
                  <div>
                    <CardTitle className="text-lg">{shortcoming.title}</CardTitle>
                    <CardDescription className="mt-2">
                      {shortcoming.description}
                    </CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">Impact:</h4>
                  <p className="text-sm text-gray-600">{shortcoming.impact}</p>
                </div>
                
                <div>
                  <h4 className="font-semibold text-sm text-gray-700 mb-1">Recommendation:</h4>
                  <p className="text-sm text-gray-600">{shortcoming.recommendation}</p>
                </div>

                <div className="border-t pt-4">
                  <h4 className="font-semibold text-sm text-gray-700 mb-2">Case Study: {shortcoming.caseStudy.company}</h4>
                  <div className="space-y-2 text-sm">
                    <div>
                      <span className="font-medium">Situation:</span> {shortcoming.caseStudy.situation}
                    </div>
                    <div>
                      <span className="font-medium">Solution:</span> {shortcoming.caseStudy.solution}
                    </div>
                    <div className="text-green-600 font-medium">
                      <span className="font-medium">Result:</span> {shortcoming.caseStudy.result}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {!loading && error && (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-4">
            <p className="text-sm text-red-700">{error}</p>
          </CardContent>
        </Card>
      )}

      <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
        <CardContent className="p-6">
          <div className="text-center">
            <TrendingUp className="h-12 w-12 text-blue-600 mx-auto mb-4" />
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              Ready to Optimize Your Campaign?
            </h3>
            <p className="text-gray-600 mb-4">
              Our AI optimizer can address these issues and generate an ideal marketing strategy for your business.
            </p>
            <div className="text-sm text-gray-500">
              Expected improvement: 40-80% better performance
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
