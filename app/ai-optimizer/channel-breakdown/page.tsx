'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Slider } from '@/components/ui/slider'
import {
  ArrowLeft,
  DollarSign,
  TrendingUp,
  Target,
  BarChart3,
  Lightbulb,
  CheckCircle,
} from 'lucide-react'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from 'recharts'

interface AllocationRow {
  channel: string
  budget: number
  percentage: number
  color: string
}

interface ChannelCaseStudy {
  company: string
  industry: string
  situation: string
  solution: string
  result: string
  connection: string
}

interface ChannelCardData {
  channel: string
  percentage: number
  allocationReason: string
  caseStudy: ChannelCaseStudy
}

interface AIOptimizationResult {
  totalBudget: number
  channelAllocation: AllocationRow[]
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
  explanations?: ChannelCardData[]
}

interface CampaignContext {
  productDescription?: string
  usp?: string
  targetAudience?: string
  demographics?: string
  objective?: string
  industry?: string
  businessSize?: string
}

interface ChannelData {
  id: string
  name: string
  percentage: number
  budget: number
  color: string
}

interface ChannelCardsApiResponse {
  success: boolean
  result?: {
    channelCards?: ChannelCardData[]
  }
  error?: string
}

function toChannelId(name: string): string {
  return name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function defaultCaseStudy(channel: string): ChannelCaseStudy {
  return {
    company: 'Reference Brand',
    industry: 'Digital Marketing',
    situation: `Needed to improve ${channel} performance under budget constraints.`,
    solution: `Rebalanced spend and optimized creative/offer alignment on ${channel}.`,
    result: 'Improved efficiency and conversion quality after optimization cycles.',
    connection: 'This informed your allocation as a safe benchmark fallback when live AI enrichment is unavailable.',
  }
}

function buildLocalFallbackCards(allocation: AllocationRow[], context: CampaignContext): ChannelCardData[] {
  const objective = context.objective || 'performance growth'
  const audience = context.targetAudience || 'target audience'
  const usp = context.usp || 'the product differentiator'

  return allocation.map((row) => ({
    channel: row.channel,
    percentage: row.percentage,
    allocationReason: `${row.channel} receives ${row.percentage}% to support ${objective}, aligned to ${audience} and messaging around ${usp}.`,
    caseStudy: defaultCaseStudy(row.channel),
  }))
}

function normalizeChannelCards(cards: unknown, fallback: ChannelCardData[]): ChannelCardData[] {
  if (!Array.isArray(cards)) {
    return fallback
  }

  const normalized = cards
    .map((item) => {
      if (!item || typeof item !== 'object') {
        return null
      }
      const raw = item as Partial<ChannelCardData>
      if (!raw.channel || typeof raw.channel !== 'string') {
        return null
      }
      const caseStudy = raw.caseStudy && typeof raw.caseStudy === 'object' ? raw.caseStudy : defaultCaseStudy(raw.channel)
      return {
        channel: raw.channel,
        percentage: typeof raw.percentage === 'number' ? raw.percentage : 0,
        allocationReason: raw.allocationReason || 'Allocation explanation unavailable.',
        caseStudy: {
          company: caseStudy.company || 'N/A',
          industry: caseStudy.industry || 'N/A',
          situation: caseStudy.situation || 'N/A',
          solution: caseStudy.solution || 'N/A',
          result: caseStudy.result || 'N/A',
          connection: caseStudy.connection || 'N/A',
        },
      }
    })
    .filter((card): card is ChannelCardData => card !== null)

  return normalized.length > 0 ? normalized : fallback
}

export default function ChannelBreakdownPage() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalBudget, setTotalBudget] = useState(0)
  const [channels, setChannels] = useState<ChannelData[]>([])
  const [expectedMetrics, setExpectedMetrics] = useState<AIOptimizationResult['expectedMetrics'] | null>(null)
  const [improvements, setImprovements] = useState<AIOptimizationResult['improvements']>([])
  const [channelCards, setChannelCards] = useState<ChannelCardData[]>([])
  const [channelCardsLoading, setChannelCardsLoading] = useState(false)
  const [isSliderModalOpen, setIsSliderModalOpen] = useState(false)

  useEffect(() => {
    const rawResult = localStorage.getItem('spendr_ai_optimization_result')
    if (!rawResult) {
      setError('No optimization result found. Run AI optimization first.')
      setLoading(false)
      return
    }

    try {
      const parsed = JSON.parse(rawResult) as AIOptimizationResult
      if (!parsed.channelAllocation || parsed.channelAllocation.length === 0) {
        throw new Error('Empty channel allocation.')
      }

      const campaignRaw = localStorage.getItem('spendr_campaign_data')
      const campaignData = campaignRaw ? (JSON.parse(campaignRaw) as CampaignContext) : {}

      setTotalBudget(parsed.totalBudget)
      setExpectedMetrics(parsed.expectedMetrics)
      setImprovements(parsed.improvements || [])

      const initialChannels = parsed.channelAllocation.map((row) => ({
        id: toChannelId(row.channel),
        name: row.channel,
        percentage: row.percentage,
        budget: row.budget,
        color: row.color,
      }))
      setChannels(initialChannels)

      const fallbackCards = normalizeChannelCards(
        parsed.explanations,
        buildLocalFallbackCards(parsed.channelAllocation, campaignData)
      )
      setChannelCards(fallbackCards)

      const fetchChannelCards = async () => {
        setChannelCardsLoading(true)
        try {
          const response = await fetch('/api/budget-optimizer', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              mode: 'channel_cards',
              input: {
                companyContext: {
                  productDescription: campaignData.productDescription || '',
                  usp: campaignData.usp || '',
                  targetAudience: campaignData.targetAudience || '',
                  demographics: campaignData.demographics || '',
                  objective: campaignData.objective || '',
                  industry: campaignData.industry || '',
                  businessSize: campaignData.businessSize || '',
                },
                channelAllocation: parsed.channelAllocation.map((row) => ({
                  channel: row.channel,
                  percentage: row.percentage,
                })),
                explanations: fallbackCards,
              },
            }),
          })

          const payload = (await response.json()) as ChannelCardsApiResponse
          if (!response.ok || !payload.success) {
            throw new Error(payload.error || 'Failed to load channel cards.')
          }

          const nextCards = normalizeChannelCards(payload.result?.channelCards, fallbackCards)
          setChannelCards(nextCards)
        } catch {
          setChannelCards(fallbackCards)
        } finally {
          setChannelCardsLoading(false)
        }
      }

      void fetchChannelCards()
    } catch {
      setError('Saved optimization result is invalid. Please run optimization again.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    if (totalBudget <= 0 || channels.length === 0) {
      return
    }

    setChannels((prev) =>
      prev.map((channel) => ({
        ...channel,
        budget: Math.round((channel.percentage / 100) * totalBudget),
      }))
    )
  }, [totalBudget])

  const handleSliderChange = (channelId: string, newPercentage: number) => {
    setChannels((prev) => {
      const changed = prev.find((channel) => channel.id === channelId)
      if (!changed) {
        return prev
      }

      const others = prev.filter((channel) => channel.id !== channelId)
      const oldOtherTotal = others.reduce((sum, channel) => sum + channel.percentage, 0)
      const newOtherTotal = Math.max(0, 100 - newPercentage)

      const next = prev.map((channel) => {
        if (channel.id === channelId) {
          return {
            ...channel,
            percentage: newPercentage,
            budget: Math.round((newPercentage / 100) * totalBudget),
          }
        }

        const scaled = oldOtherTotal > 0 ? (channel.percentage / oldOtherTotal) * newOtherTotal : 0
        const percentage = Math.round(scaled * 100) / 100
        return {
          ...channel,
          percentage,
          budget: Math.round((percentage / 100) * totalBudget),
        }
      })

      setChannelCards((prevCards) => {
        const pctByChannel = new Map(next.map((channel) => [channel.name, channel.percentage]))
        return prevCards.map((card) => ({
          ...card,
          percentage: Math.round((pctByChannel.get(card.channel) ?? card.percentage) * 100) / 100,
        }))
      })

      return next
    })
  }

  if (loading) {
    return <div className="flex items-center justify-center min-h-screen">Loading channel breakdown...</div>
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-4 flex items-center justify-center">
        <Card className="max-w-xl w-full">
          <CardHeader>
            <CardTitle>Channel Breakdown</CardTitle>
            <CardDescription>{error}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button onClick={() => router.push('/ai-optimizer')}>Back to AI Optimizer</Button>
          </CardContent>
        </Card>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={() => router.push('/ai-optimizer')} className="flex items-center gap-2">
                <ArrowLeft className="h-4 w-4" />
                Back to AI Optimizer
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-gray-900 mb-2">Channel Breakdown Analysis</h1>
                <p className="text-gray-600">Detailed output from the Python optimization engine</p>
              </div>
            </div>
            <Button onClick={() => setIsSliderModalOpen(true)} className="flex items-center gap-2">
              <BarChart3 className="h-4 w-4" />
              Adjust Budget
            </Button>
          </div>
        </div>

        {expectedMetrics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expected Impressions</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expectedMetrics.impressions.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expected Clicks</CardTitle>
                <TrendingUp className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expectedMetrics.clicks.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expected Conversions</CardTitle>
                <CheckCircle className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expectedMetrics.conversions.toLocaleString()}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Expected ROAS</CardTitle>
                <DollarSign className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{expectedMetrics.roas}x</div>
              </CardContent>
            </Card>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Target className="h-5 w-5" />
                Budget Distribution
              </CardTitle>
              <CardDescription>Channel split generated by optimization output</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={channels}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percentage }) => `${name} ${percentage}%`}
                      outerRadius={120}
                      fill="#8884d8"
                      dataKey="percentage"
                    >
                      {channels.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} style={{ cursor: 'pointer' }} />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value: number, _name: string, props: { payload?: { budget?: number } }) => {
                        const budget = props.payload?.budget ?? 0
                        return [`${value}% ($${budget.toLocaleString()})`, 'Budget']
                      }}
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
              <CardDescription>Total budget: ${totalBudget.toLocaleString()}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {channels.map((channel) => (
                  <div key={channel.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded" style={{ backgroundColor: channel.color }} />
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

        <div className="mt-8 space-y-6">
          {channelCardsLoading
            ? channels.map((channel) => (
                <Card key={`skeleton-${channel.id}`} className="animate-pulse">
                  <CardHeader>
                    <div className="h-6 w-1/3 bg-gray-200 rounded" />
                    <div className="h-4 w-2/3 bg-gray-200 rounded" />
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="h-4 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-5/6 bg-gray-200 rounded" />
                    <div className="h-px w-full bg-gray-200" />
                    <div className="h-4 w-3/4 bg-gray-200 rounded" />
                    <div className="h-4 w-full bg-gray-200 rounded" />
                    <div className="h-4 w-4/5 bg-gray-200 rounded" />
                  </CardContent>
                </Card>
              ))
            : channelCards.map((card) => (
                <Card key={card.channel} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-center justify-between gap-3">
                      <CardTitle className="text-xl">{card.channel}</CardTitle>
                      <span className="text-sm font-semibold bg-gray-100 px-3 py-1 rounded-full">{card.percentage}%</span>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    <div>
                      <h4 className="font-semibold mb-2 flex items-center gap-2">
                        <TrendingUp className="h-4 w-4 text-green-600" />
                        Why This Allocation
                      </h4>
                      <p className="text-sm text-gray-600">{card.allocationReason}</p>
                    </div>

                    <div className="border-t pt-4">
                      <h4 className="font-semibold mb-3 flex items-center gap-2">
                        <Lightbulb className="h-4 w-4 text-purple-600" />
                        Case Study: {card.caseStudy.company}
                      </h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-700">Company & Industry:</span>
                          <p className="text-gray-600 mt-1">{card.caseStudy.company} ({card.caseStudy.industry})</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Situation:</span>
                          <p className="text-gray-600 mt-1">{card.caseStudy.situation}</p>
                        </div>
                        <div>
                          <span className="font-medium text-gray-700">Solution:</span>
                          <p className="text-gray-600 mt-1">{card.caseStudy.solution}</p>
                        </div>
                        <div>
                          <span className="font-medium text-green-700">Result:</span>
                          <p className="text-green-600 mt-1 font-bold">{card.caseStudy.result}</p>
                        </div>
                      </div>
                      <div className="mt-3 text-sm">
                        <span className="font-medium text-gray-700">Connection:</span>
                        <p className="text-gray-600 mt-1">{card.caseStudy.connection}</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
        </div>

        {improvements.length > 0 && (
          <Card className="mt-8">
            <CardHeader>
              <CardTitle>Optimization Improvements</CardTitle>
              <CardDescription>Directly from the optimization output</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                {improvements.map((item) => (
                  <div key={item.metric} className="p-3 rounded-lg bg-green-50 border border-green-200">
                    <p className="text-sm text-gray-600">{item.metric}</p>
                    <p className="text-lg font-bold text-green-700">{item.improvement}%</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {isSliderModalOpen && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <Card className="w-full max-w-2xl mx-4">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  Adjust Budget Allocation
                </CardTitle>
                <CardDescription>
                  Modify channel percentages. Other channels auto-rebalance to keep total at 100%.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {channels.map((channel) => (
                  <div key={channel.id} className="space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-4 h-4 rounded" style={{ backgroundColor: channel.color }} />
                        <span className="font-medium">{channel.name}</span>
                      </div>
                      <div className="text-right">
                        <span className="font-bold">{channel.percentage}%</span>
                        <div className="text-sm text-gray-600">${channel.budget.toLocaleString()}</div>
                      </div>
                    </div>
                    <Slider
                      value={[channel.percentage]}
                      onValueChange={(value) => handleSliderChange(channel.id, value[0])}
                      max={60}
                      min={0}
                      step={1}
                      className="w-full"
                    />
                  </div>
                ))}
                <div className="flex justify-end gap-3 pt-4 border-t">
                  <Button variant="outline" onClick={() => setIsSliderModalOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={() => setIsSliderModalOpen(false)}>Apply Changes</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  )
}
