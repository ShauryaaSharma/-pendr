'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import Logo from '@/components/Logo'
import { 
  Brain, 
  BarChart3, 
  ArrowRight, 
  Sparkles, 
  TrendingUp,
  Target,
  Zap,
  Users,
  Globe,
  Lightbulb,
  Eye,
  Star,
  Monitor,
  Check,
  ArrowUpRight,
  DollarSign,
  Shield,
  Clock,
  Crown
} from 'lucide-react'

// News clippings data
const newsClippings = [
  {
    id: 1,
    title: "💸 Tradie spends $20k on SEO, gets four monthly views, zero sales.",
    source: "news.com.au",
    time: "1h ago",
    color: "bg-red-100 border-red-200"
  },
  {
    id: 2,
    title: "📉 HUL raises ad spend to ₹1,586 crores, profits still dip 6%.",
    source: "storyboard18.com",
    time: "2h ago",
    color: "bg-yellow-100 border-yellow-200"
  },
  {
    id: 3,
    title: "💸 Indian banks’ ad spends up 160%, but efficiency and returns decline.",
    source: "financialexpress.com",
    time: "3h ago",
    color: "bg-orange-100 border-orange-200"
  },
  {
    id: 4,
    title: "📊 HUL boosts ads to revive sluggish demand, risking margins amid weak growth.",
    source: "ndtvprofit.com",
    time: "4h ago",
    color: "bg-blue-100 border-blue-200"
  },
  {
    id: 5,
    title: "📉 Heavy marketing spends escalate, but poor strategies drain growth and margins.",
    source: "storyboard18.com",
    time: "5h ago",
    color: "bg-purple-100 border-purple-200"
  },
  {
    id: 6,
    title: "🚨 Brands chase visibility with flawed models, losing money despite rising spends.",
    source: "storyboard18.com",
    time: "6h ago",
    color: "bg-pink-100 border-pink-200"
  }
]


export default function LandingPage() {
  const router = useRouter()
  const [currentNewsIndex, setCurrentNewsIndex] = useState(0)

  // Rotate news clippings (1 position at a time, displaying 2 boxes)
  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentNewsIndex((prev) => {
        const nextIndex = prev + 1
        // With 10 items, we have 5 slides (0-4), so loop back at position 5
        return nextIndex >= 5 ? 0 : nextIndex
      })
    }, 3000)
    return () => clearInterval(interval)
  }, [])

  const handleAIOptimization = () => {
    router.push('/ai-optimizer')
  }

  const handleComparison = () => {
    router.push('/campaign-setup')
  }

  const handlePaymentRedirect = (plan: string) => {
    // Redirect to signup first, then to payment
    router.push(`/signup?redirect=/payment?plan=${plan}`)
  }

  const scrollToSection = (sectionId: string) => {
    const element = document.getElementById(sectionId)
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            {/* Logo */}
            <div className="flex justify-center mb-8">
              <Logo size={120} variant="simple" />
            </div>
            
            <Badge className="mb-6 bg-blue-100 text-blue-800 border-blue-200">
              <Sparkles className="h-3 w-3 mr-1" />
              AI-Powered Marketing Platform
            </Badge>
            
            <h1 className="text-5xl md:text-6xl font-bold text-gray-900 mb-6">
              Stop Wasting Money on
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                {' '}Marketing
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-3xl mx-auto">
              $pendr uses AI to optimize your marketing budget, predict performance, and maximize ROI. 
              Stop guessing, start optimizing.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Button 
                size="lg" 
                className="px-8 py-4 text-lg"
                onClick={handleAIOptimization}
              >
                Get AI Optimization
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
              <Button 
                variant="outline" 
                size="lg" 
                className="px-8 py-4 text-lg"
                onClick={handleComparison}
              >
                Analyze My Campaign
              </Button>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
              <div className="text-center">
                <div className="text-3xl font-bold text-blue-600 mb-2">340%</div>
                <div className="text-gray-600">Average ROI Increase</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-green-600 mb-2">$2.3M</div>
                <div className="text-gray-600">Saved by Our Users</div>
              </div>
              <div className="text-center">
                <div className="text-3xl font-bold text-purple-600 mb-2">50K+</div>
                <div className="text-gray-600">Campaigns Optimized</div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Problem Section */}
      <section id="problem" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              The Marketing Problem is Real
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Every day, businesses waste millions on ineffective marketing. Here's what's happening right now:
            </p>
          </div>

          {/* News Clippings Slider */}
          <div className="relative overflow-hidden mb-12">
            <div 
              className="flex transition-transform duration-500 ease-in-out"
              style={{ 
                transform: `translateX(-${currentNewsIndex * 50}%)`,
                width: `${newsClippings.length * 50}%`
              }}
            >
              {newsClippings.map((news, index) => (
                <div key={news.id} className="w-1/2 px-3 flex-shrink-0">
                  <Card className={`transition-all duration-300 hover:shadow-lg ${news.color}`}>
                    <CardContent className="p-6">
                      <div className="flex items-start justify-between mb-3">
                        <Badge variant="outline" className="text-xs">
                          {news.source}
                        </Badge>
                        <span className="text-xs text-gray-500">{news.time}</span>
                      </div>
                      <h3 className="font-semibold text-gray-900 mb-2">
                        {news.title}
                      </h3>
                      <div className="flex items-center text-xs text-gray-500">
                        <Clock className="h-3 w-3 mr-1" />
                        Breaking News
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ))}
            </div>
            
            {/* Slider Indicators */}
            <div className="flex justify-center mt-6 space-x-2">
              {Array.from({ length: 5 }).map((_, index) => (
                <button
                  key={index}
                  onClick={() => setCurrentNewsIndex(index)}
                  className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                    currentNewsIndex === index 
                      ? 'bg-blue-600' 
                      : 'bg-gray-300'
                  }`}
                />
              ))}
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg text-gray-600 mb-6">
              These problems cost businesses an average of <span className="font-bold text-red-600">$50,000 per month</span> in wasted ad spend.
            </p>
            <Button 
              size="lg"
              onClick={() => scrollToSection('solution')}
              className="px-8"
            >
              See How We Solve This
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>
          </div>
        </div>
      </section>

      {/* Solution Section */}
      <section id="solution" className="py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              The $pendr Solution
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Our AI-powered platform eliminates guesswork and maximizes your marketing ROI
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16">
            <Card 
              className="text-center p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 border-2 hover:border-blue-300" 
              onClick={() => router.push('/ai-optimizer')}
            >
              <div className="mx-auto mb-4 p-4 bg-blue-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Brain className="h-8 w-8 text-blue-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">AI Optimization</h3>
              <p className="text-gray-600 mb-4">
                Get the perfect budget allocation across all channels using advanced AI algorithms
              </p>
              <Button variant="outline" size="sm" className="text-blue-600 border-blue-300 hover:bg-blue-50">
                Try AI Optimization
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>

            <Card 
              className="text-center p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 border-2 hover:border-green-300" 
              onClick={() => router.push('/campaign-setup')}
            >
              <div className="mx-auto mb-4 p-4 bg-green-100 rounded-full w-16 h-16 flex items-center justify-center">
                <BarChart3 className="h-8 w-8 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Real-time Analysis</h3>
              <p className="text-gray-600 mb-4">
                Monitor performance and get instant recommendations for improvement
              </p>
              <Button variant="outline" size="sm" className="text-green-600 border-green-300 hover:bg-green-50">
                Start Analysis
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>

            <Card 
              className="text-center p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 border-2 hover:border-purple-300" 
              onClick={() => router.push('/simulate')}
            >
              <div className="mx-auto mb-4 p-4 bg-purple-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Eye className="h-8 w-8 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Ad Simulation</h3>
              <p className="text-gray-600 mb-4">
                Preview your ads across platforms before spending a dime
              </p>
              <Button variant="outline" size="sm" className="text-purple-600 border-purple-300 hover:bg-purple-50">
                Simulate Ad
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>

            <Card 
              className="text-center p-6 hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105 border-2 hover:border-orange-300" 
              onClick={() => router.push('/rate-ad')}
            >
              <div className="mx-auto mb-4 p-4 bg-orange-100 rounded-full w-16 h-16 flex items-center justify-center">
                <Star className="h-8 w-8 text-orange-600" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Ad Rating</h3>
              <p className="text-gray-600 mb-4">
                Get AI-powered analysis and improvement suggestions for your creatives
              </p>
              <Button variant="outline" size="sm" className="text-orange-600 border-orange-300 hover:bg-orange-50">
                Rate My Ad
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Card>
          </div>

          {/* Try Solutions Section */}
          <div className="text-center mt-12">
            <h3 className="text-2xl font-bold text-gray-900 mb-6">
              Ready to Try Our Solutions?
            </h3>
            <p className="text-lg text-gray-600 mb-8">
              Click on any solution above or use these quick access buttons
            </p>
            <div className="flex flex-wrap justify-center gap-4">
              <Button 
                onClick={() => router.push('/ai-optimizer')}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white"
              >
                <Brain className="mr-2 h-5 w-5" />
                AI Optimization
              </Button>
              <Button 
                onClick={() => router.push('/campaign-setup')}
                className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white"
              >
                <BarChart3 className="mr-2 h-5 w-5" />
                Campaign Analysis
              </Button>
              <Button 
                onClick={() => router.push('/simulate')}
                className="px-6 py-3 bg-purple-600 hover:bg-purple-700 text-white"
              >
                <Eye className="mr-2 h-5 w-5" />
                Ad Simulation
              </Button>
              <Button 
                onClick={() => router.push('/rate-ad')}
                className="px-6 py-3 bg-orange-600 hover:bg-orange-700 text-white"
              >
                <Star className="mr-2 h-5 w-5" />
                Ad Rating
              </Button>
            </div>
          </div>

          {/* USP Section */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 rounded-2xl p-8">
            <div className="text-center mb-8">
              <h3 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose $pendr?
              </h3>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Proven Results</h4>
                    <p className="text-gray-600">Our users see an average 340% increase in ROI within 30 days</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">No Technical Skills Required</h4>
                    <p className="text-gray-600">Simple interface that anyone can use, no marketing degree needed</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">24/7 Optimization</h4>
                    <p className="text-gray-600">AI continuously monitors and optimizes your campaigns</p>
                  </div>
                </div>
              </div>
              
              <div className="space-y-6">
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Save Time & Money</h4>
                    <p className="text-gray-600">Reduce manual work by 80% and cut wasted ad spend by 60%</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Data-Driven Decisions</h4>
                    <p className="text-gray-600">Make informed choices based on real performance data</p>
                  </div>
                </div>
                
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Check className="h-5 w-5 text-green-600" />
                  </div>
                  <div>
                    <h4 className="font-semibold text-lg mb-2">Scalable Solution</h4>
                    <p className="text-gray-600">Grows with your business from startup to enterprise</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-gray-900 mb-4">
              Simple, Transparent Pricing
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Choose the plan that fits your business. No hidden fees, no surprises.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Playground Plan */}
            <Card className="relative">
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <Star className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Playground</CardTitle>
                <CardDescription>Perfect for solo founders and hobbyists</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">Free</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>1 campaign simulation per month</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Basic ROI dashboard</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>No optimizer</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Community support</span>
                  </div>
                </div>
                <Button className="w-full mt-6" onClick={() => handlePaymentRedirect('playground')}>
                  Get Started Free
                </Button>
              </CardContent>
            </Card>

            {/* Kickstarter Plan */}
            <Card className="relative border-2 border-blue-500">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                <Badge className="bg-blue-500 text-white px-4 py-1">
                  Most Popular
                </Badge>
              </div>
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                    <Zap className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Kickstarter</CardTitle>
                <CardDescription>Ideal for small teams and growing startups</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">₹2,999</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Unlimited simulations</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Budget optimizer unlocked</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>All industries available</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Export reports (PDF/CSV)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Priority support</span>
                  </div>
                </div>
                <Button className="w-full mt-6" onClick={() => handlePaymentRedirect('kickstarter')}>
                  Start Pro Trial
                </Button>
              </CardContent>
            </Card>

            {/* Overdrive Plan */}
            <Card className="relative">
              <CardHeader className="text-center pb-8">
                <div className="flex justify-center mb-4">
                  <div className="w-12 h-12 bg-purple-100 rounded-full flex items-center justify-center">
                    <Crown className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <CardTitle className="text-2xl">Overdrive</CardTitle>
                <CardDescription>Enterprise solution for agencies and large teams</CardDescription>
                <div className="mt-4">
                  <span className="text-4xl font-bold">₹17,999</span>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Unlimited simulations + API access</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>HubSpot, Salesforce, Google Ads integration</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>White-label reports with agency branding</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Team collaboration (up to 10 users)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Custom benchmarks upload</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Enterprise AI optimizer (multi-campaign)</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <Check className="h-5 w-5 text-green-600" />
                    <span>Dedicated manager + SLA-backed support</span>
                  </div>
                </div>
                <Button className="w-full mt-6" onClick={() => handlePaymentRedirect('overdrive')}>
                  Contact Sales
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="text-center mt-12">
            <p className="text-gray-600 mb-4">
              All plans include 14-day free trial. No credit card required.
            </p>
            <div className="flex items-center justify-center gap-6 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Shield className="h-4 w-4" />
                <span>Secure payments</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4" />
                <span>Cancel anytime</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-gradient-to-r from-blue-600 to-purple-600">
        <div className="max-w-4xl mx-auto text-center px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-white mb-4">
            Ready to Stop Wasting Money?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of businesses already saving money with $pendr
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button 
              size="lg" 
              variant="secondary"
              className="px-8 py-4 text-lg"
              onClick={handleAIOptimization}
            >
              Start Free Trial
              <ArrowRight className="ml-2 h-5 w-5" />
            </Button>

              
            
            
          </div>
        </div>
      </section>
    </div>
  )
}
