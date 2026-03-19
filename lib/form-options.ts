export const INDUSTRY_OPTIONS = [
  { value: 'technology', label: 'Technology' },
  { value: 'finance', label: 'Finance' },
  { value: 'manufacturing', label: 'Manufacturing' },
  { value: 'real-estate', label: 'Real Estate' },
  { value: 'healthcare', label: 'Healthcare' },
  { value: 'retail', label: 'Retail' },
  { value: 'food-beverage', label: 'Food & Beverage' },
  { value: 'automotive', label: 'Automotive' },
  { value: 'education', label: 'Education' },
  { value: 'travel', label: 'Travel' },
  { value: 'gaming', label: 'Gaming' },
  { value: 'non-profit', label: 'Non-Profit' },
  { value: 'fashion-apparel', label: 'Fashion & Apparel' },
  { value: 'financial-services', label: 'Financial Services' },
  { value: 'telecommunications', label: 'Telecommunications' },
  { value: 'other', label: 'Other' },
] as const

export const REGION_OPTIONS = [
  { value: 'north-america', label: 'North America' },
  { value: 'europe', label: 'Europe' },
  { value: 'asia-pacific', label: 'Asia-Pacific' },
  { value: 'latin-america', label: 'Latin America' },
  { value: 'middle-east-africa', label: 'Middle East & Africa' },
  { value: 'south-asia', label: 'South Asia' },
  { value: 'southeast-asia', label: 'Southeast Asia' },
  { value: 'sub-saharan-africa', label: 'Sub-Saharan Africa' },
  { value: 'global', label: 'Global' },
] as const

export const CAMPAIGN_DURATION_OPTIONS = [
  { value: '1-month', label: '1 Month' },
  { value: '3-months', label: '3 Months' },
  { value: '6-months', label: '6 Months' },
  { value: '12-months', label: '12 Months' },
] as const

export const CAMPAIGN_OBJECTIVE_OPTIONS = [
  { value: 'brand-awareness', label: 'Brand Awareness' },
  { value: 'lead-generation', label: 'Lead Generation' },
  { value: 'direct-sales', label: 'Direct Sales' },
  { value: 'app-installs', label: 'App Installs' },
  { value: 'retention', label: 'Retention / Re-engagement' },
] as const

export const BUSINESS_SIZE_OPTIONS = [
  { value: 'startup', label: 'Startup (< $1M revenue)' },
  { value: 'smb', label: 'SMB ($1M\u2013$50M)' },
  { value: 'mid-market', label: 'Mid-Market ($50M\u2013$500M)' },
  { value: 'enterprise', label: 'Enterprise (> $500M)' },
] as const

export const AD_CREATIVE_FORMAT_OPTIONS = [
  { value: 'video', label: 'Video' },
  { value: 'static-image', label: 'Static Image' },
  { value: 'carousel', label: 'Carousel' },
  { value: 'story', label: 'Story' },
  { value: 'search-text', label: 'Search Text' },
  { value: 'native-article', label: 'Native Article' },
  { value: 'influencer', label: 'Influencer' },
] as const

export const TARGET_AUDIENCE_GROUPS = [
  {
    label: 'Age-Based',
    options: [
      { value: 'Gen Z \u2014 Early (13\u201317)', label: 'Gen Z \u2014 Early (13\u201317)' },
      { value: 'Gen Z \u2014 Core (18\u201324)', label: 'Gen Z \u2014 Core (18\u201324)' },
      { value: 'Young Millennials (25\u201330)', label: 'Young Millennials (25\u201330)' },
      { value: 'Older Millennials (31\u201338)', label: 'Older Millennials (31\u201338)' },
      { value: 'Gen X (39\u201354)', label: 'Gen X (39\u201354)' },
      { value: 'Baby Boomers (55\u201364)', label: 'Baby Boomers (55\u201364)' },
      { value: 'Seniors (65+)', label: 'Seniors (65+)' },
    ],
  },
  {
    label: 'Professional / B2B',
    options: [
      { value: 'B2B \u2014 Small Business Owners', label: 'B2B \u2014 Small Business Owners' },
      { value: 'B2B \u2014 Mid-Market Decision Makers', label: 'B2B \u2014 Mid-Market Decision Makers' },
      { value: 'B2B \u2014 Enterprise / C-Suite', label: 'B2B \u2014 Enterprise / C-Suite' },
      { value: 'Freelancers & Solopreneurs', label: 'Freelancers & Solopreneurs' },
      { value: 'Healthcare Professionals', label: 'Healthcare Professionals' },
      { value: 'Legal & Finance Professionals', label: 'Legal & Finance Professionals' },
      { value: 'Tech & Engineering Professionals', label: 'Tech & Engineering Professionals' },
      { value: 'HR & Recruitment Professionals', label: 'HR & Recruitment Professionals' },
    ],
  },
  {
    label: 'Lifestyle & Interest',
    options: [
      { value: 'Travelers & Adventure Seekers', label: 'Travelers & Adventure Seekers' },
      { value: 'Fitness & Wellness Enthusiasts', label: 'Fitness & Wellness Enthusiasts' },
      { value: 'Gamers', label: 'Gamers' },
      { value: 'Parents (Young Children 0\u201310)', label: 'Parents (Young Children 0\u201310)' },
      { value: 'Parents (Teens 11\u201317)', label: 'Parents (Teens 11\u201317)' },
      { value: 'Students (College / University)', label: 'Students (College / University)' },
      {
        value: 'Eco-Conscious / Sustainability Focused',
        label: 'Eco-Conscious / Sustainability Focused',
      },
      { value: 'Luxury & Premium Shoppers', label: 'Luxury & Premium Shoppers' },
      { value: 'Budget-Conscious Shoppers', label: 'Budget-Conscious Shoppers' },
    ],
  },
  {
    label: 'Income-Based',
    options: [
      { value: 'Low Income (Under $30K)', label: 'Low Income (Under $30K)' },
      { value: 'Middle Income ($30K\u2013$75K)', label: 'Middle Income ($30K\u2013$75K)' },
      { value: 'Upper Middle Income ($75K\u2013$150K)', label: 'Upper Middle Income ($75K\u2013$150K)' },
      { value: 'High Income ($150K+)', label: 'High Income ($150K+)' },
    ],
  },
] as const
