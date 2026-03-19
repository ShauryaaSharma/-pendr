#!/usr/bin/env python3
"""
Budget optimization engine for Spendr frontend.

Input JSON over stdin:
{
  "mode": "ai_optimization" | "compare_analyze" | "channel_cards" | "campaign_analysis",
  "input": {
    "budget": number|string,
    "industry": "technology" | "finance" | "manufacturing" | "real-estate" |
                "healthcare" | "retail" | "food-beverage" | "automotive" |
                "education" | "travel" | "gaming" | "non-profit" |
                "fashion-apparel" | "financial-services" | "telecommunications" | "other",
    "region": "north-america" | "europe" | "asia-pacific" | "latin-america" |
              "middle-east-africa" | "south-asia" | "southeast-asia" |
              "sub-saharan-africa" | "global",
    "targetAudience": one dropdown value from the grouped audience selector,
    "companyName": string,
    "productDescription": string,
    "usp": string,
    "demographics": string,
    "keywords": [string, ...],
    "objective": "brand-awareness" | "lead-generation" | "direct-sales" |
                 "app-installs" | "retention",
    "businessSize": "startup" | "smb" | "mid-market" | "enterprise",
    "creativeFormats": ["video" | "static-image" | "carousel" | "story" |
                        "search-text" | "native-article" | "influencer", ...],
    "impressions": number|string (optional current metrics),
    "clicks": number|string (optional current metrics),
    "conversions": number|string (optional current metrics),
    "aov": number|string,
    "budgetAllocation": {"facebook": pct, "google": pct, "instagram": pct, "tiktok": pct,
                         "linkedin": pct, "youtube": pct, "twitter": pct, "other": pct}
  }
}
"""

from __future__ import annotations

import json
import os
import re
from dataclasses import dataclass
from typing import Any, Dict, List, Tuple

try:
    from groq import Groq
except Exception:
    Groq = None

GROQ_MODEL = "llama3-70b-8192"
GROQ_SYSTEM_PROMPT = (
    "You are an expert digital marketing strategist. You are given a campaign brief "
    "and a mathematically computed budget allocation. Your job is to analyze the full "
    "context — including the product, USP, target demographics, and business size — "
    "and provide strategic insights that go beyond the numbers. Always return valid JSON only."
)

CHANNEL_CARDS_SYSTEM_PROMPT = (
    "You are a senior performance marketing strategist with deep knowledge "
    "of real advertising case studies across industries. Given a campaign "
    "brief and a budget allocation, explain why each channel received its "
    "share and pair it with a real, well-known company case study that "
    "mirrors the user's situation. Always use actual companies and real "
    "outcomes. Return only valid JSON."
)

CAMPAIGN_AUDIT_SYSTEM_PROMPT = (
    "You are an expert marketing consultant conducting a campaign audit. "
    "Given a full campaign brief, identify the 4 most important issues "
    "or opportunities. For each, provide a specific recommendation and "
    "a real company case study that demonstrates the impact of addressing "
    "or ignoring this issue. Prioritize specificity over generality and "
    "tailor every card to the actual campaign data provided. Return only "
    "valid JSON with no markdown."
)

CHANNEL_ORDER = [
    "GoogleAds",
    "Facebook",
    "Instagram",
    "TikTok",
    "LinkedIn",
    "YouTube",
    "Email",
    "Twitter",
]

DISPLAY_NAME = {
    "GoogleAds": "Google Ads",
    "Facebook": "Facebook Ads",
    "Instagram": "Instagram",
    "TikTok": "TikTok",
    "LinkedIn": "LinkedIn Ads",
    "YouTube": "YouTube",
    "Email": "Email Marketing",
    "Twitter": "Twitter/X",
}

CHANNEL_COLORS = {
    "GoogleAds": "#10B981",
    "Facebook": "#3B82F6",
    "Instagram": "#EC4899",
    "TikTok": "#111827",
    "LinkedIn": "#0077B5",
    "YouTube": "#FF0000",
    "Email": "#8B5CF6",
    "Twitter": "#0EA5E9",
}

BASE_CHANNEL_METRICS: Dict[str, Dict[str, float]] = {
    "GoogleAds": {"cpm": 18.0, "ctr": 0.031, "cvr": 0.039},
    "Facebook": {"cpm": 12.0, "ctr": 0.026, "cvr": 0.028},
    "Instagram": {"cpm": 11.0, "ctr": 0.024, "cvr": 0.022},
    "TikTok": {"cpm": 9.5, "ctr": 0.022, "cvr": 0.019},
    "LinkedIn": {"cpm": 24.0, "ctr": 0.018, "cvr": 0.032},
    "YouTube": {"cpm": 10.5, "ctr": 0.020, "cvr": 0.017},
    "Email": {"cpm": 4.8, "ctr": 0.029, "cvr": 0.041},
    "Twitter": {"cpm": 8.8, "ctr": 0.018, "cvr": 0.013},
}


def scaled_metrics(cpm_mult: float, ctr_mult: float, cvr_mult: float) -> Dict[str, Dict[str, float]]:
    result: Dict[str, Dict[str, float]] = {}
    for channel, metrics in BASE_CHANNEL_METRICS.items():
        result[channel] = {
            "cpm": round(metrics["cpm"] * cpm_mult, 2),
            "ctr": round(metrics["ctr"] * ctr_mult, 5),
            "cvr": round(metrics["cvr"] * cvr_mult, 5),
        }
    return result


BENCHMARKS: Dict[str, Dict[str, Dict[str, float]]] = {
    "Technology": scaled_metrics(1.12, 1.10, 1.08),
    "Finance": scaled_metrics(1.18, 1.02, 1.10),
    "Manufacturing": scaled_metrics(0.96, 0.90, 0.96),
    "RealEstate": scaled_metrics(1.14, 1.00, 1.12),
    "Healthcare": scaled_metrics(1.08, 0.96, 1.06),
    "Retail": scaled_metrics(1.00, 1.06, 1.12),
    "FoodBeverage": scaled_metrics(0.94, 1.04, 1.00),
    "Automotive": scaled_metrics(1.06, 0.94, 1.04),
    "Education": scaled_metrics(0.90, 1.02, 0.95),
    "Travel": scaled_metrics(1.04, 1.05, 0.98),
    "Gaming": scaled_metrics(1.08, 1.16, 1.05),
    "NonProfit": scaled_metrics(0.86, 0.94, 0.92),
    "Fashion": scaled_metrics(1.03, 1.12, 1.07),
    "FinancialServices": scaled_metrics(1.20, 1.03, 1.12),
    "Telecom": scaled_metrics(1.01, 0.98, 1.02),
    "Other": scaled_metrics(1.0, 1.0, 1.0),
}

BENCHMARKS["Gaming"]["TikTok"]["ctr"] = 0.031
BENCHMARKS["Gaming"]["YouTube"]["ctr"] = 0.028
BENCHMARKS["NonProfit"]["Email"]["cvr"] = 0.050
BENCHMARKS["Fashion"]["Instagram"]["ctr"] = 0.032
BENCHMARKS["FinancialServices"]["LinkedIn"]["cvr"] = 0.046
BENCHMARKS["Telecom"]["GoogleAds"]["cvr"] = 0.043

REGION_MULTIPLIERS = {
    "north-america": 1.00,
    "europe": 0.97,
    "asia-pacific": 0.94,
    "latin-america": 0.89,
    "middle-east-africa": 0.87,
    "south-asia": 0.88,
    "southeast-asia": 0.91,
    "sub-saharan-africa": 0.85,
    "global": 0.93,
}

AUDIENCE_MULTIPLIERS: Dict[str, Dict[str, float]] = {
    "GenZ_Early": {"TikTok": 1.25, "Instagram": 1.15, "YouTube": 1.10},
    "GenZ_Core": {"TikTok": 1.20, "Instagram": 1.12, "YouTube": 1.08},
    "YoungMillennials": {"Instagram": 1.12, "GoogleAds": 1.06, "Facebook": 1.05},
    "OlderMillennials": {"Facebook": 1.08, "GoogleAds": 1.06, "Email": 1.05},
    "GenX": {"Facebook": 1.10, "GoogleAds": 1.08, "Email": 1.07},
    "BabyBoomers": {"Facebook": 1.12, "Email": 1.10, "YouTube": 1.05},
    "Seniors": {"Facebook": 1.15, "Email": 1.12, "YouTube": 1.04},
    "B2B_SMB": {"LinkedIn": 1.20, "GoogleAds": 1.10, "Email": 1.08},
    "B2B_MidMarket": {"LinkedIn": 1.25, "GoogleAds": 1.12, "Email": 1.10},
    "B2B_Enterprise": {"LinkedIn": 1.35, "GoogleAds": 1.15, "Email": 1.12},
    "Freelancers": {"LinkedIn": 1.15, "Instagram": 1.08, "Twitter": 1.06},
    "HealthcarePros": {"GoogleAds": 1.12, "LinkedIn": 1.10, "Email": 1.08},
    "LegalFinancePros": {"LinkedIn": 1.20, "GoogleAds": 1.10, "Email": 1.08},
    "TechEngineering": {"LinkedIn": 1.18, "Twitter": 1.10, "YouTube": 1.08},
    "HRRecruitment": {"LinkedIn": 1.22, "Facebook": 1.08, "Email": 1.06},
    "Travelers": {"Instagram": 1.20, "TikTok": 1.15, "YouTube": 1.07},
    "FitnessWellness": {"Instagram": 1.18, "TikTok": 1.14, "YouTube": 1.08},
    "Gamers": {"TikTok": 1.20, "YouTube": 1.18, "Twitter": 1.10},
    "Parents_Young": {"Facebook": 1.15, "Instagram": 1.08, "YouTube": 1.06},
    "Parents_Teens": {"Facebook": 1.12, "Instagram": 1.10, "YouTube": 1.07},
    "Students": {"TikTok": 1.18, "Instagram": 1.14, "YouTube": 1.10},
    "EcoConscious": {"Instagram": 1.14, "TikTok": 1.10, "YouTube": 1.06},
    "LuxuryShopper": {"Instagram": 1.20, "GoogleAds": 1.12, "Facebook": 1.08},
    "BudgetShopper": {"Facebook": 1.12, "TikTok": 1.10, "GoogleAds": 1.06},
    "LowIncome": {"Facebook": 1.10, "TikTok": 1.08, "YouTube": 1.05},
    "MiddleIncome": {"Facebook": 1.08, "GoogleAds": 1.06, "YouTube": 1.05},
    "UpperMiddleIncome": {"GoogleAds": 1.10, "Instagram": 1.08, "LinkedIn": 1.06},
    "HighIncome": {"LinkedIn": 1.18, "GoogleAds": 1.12, "Instagram": 1.10},
}

INDUSTRY_MAP = {
    "technology": "Technology",
    "finance": "Finance",
    "manufacturing": "Manufacturing",
    "real-estate": "RealEstate",
    "healthcare": "Healthcare",
    "retail": "Retail",
    "food-beverage": "FoodBeverage",
    "automotive": "Automotive",
    "education": "Education",
    "travel": "Travel",
    "gaming": "Gaming",
    "non-profit": "NonProfit",
    "fashion-apparel": "Fashion",
    "financial-services": "FinancialServices",
    "telecommunications": "Telecom",
    "telecom": "Telecom",
    "other": "Other",
}

AUDIENCE_EXACT_MAP = {
    "Gen Z \u2014 Early (13\u201317)": "GenZ_Early",
    "Gen Z \u2014 Core (18\u201324)": "GenZ_Core",
    "Young Millennials (25\u201330)": "YoungMillennials",
    "Older Millennials (31\u201338)": "OlderMillennials",
    "Gen X (39\u201354)": "GenX",
    "Baby Boomers (55\u201364)": "BabyBoomers",
    "Seniors (65+)": "Seniors",
    "B2B \u2014 Small Business Owners": "B2B_SMB",
    "B2B \u2014 Mid-Market Decision Makers": "B2B_MidMarket",
    "B2B \u2014 Enterprise / C-Suite": "B2B_Enterprise",
    "Freelancers & Solopreneurs": "Freelancers",
    "Healthcare Professionals": "HealthcarePros",
    "Legal & Finance Professionals": "LegalFinancePros",
    "Tech & Engineering Professionals": "TechEngineering",
    "HR & Recruitment Professionals": "HRRecruitment",
    "Travelers & Adventure Seekers": "Travelers",
    "Fitness & Wellness Enthusiasts": "FitnessWellness",
    "Gamers": "Gamers",
    "Parents (Young Children 0\u201310)": "Parents_Young",
    "Parents (Teens 11\u201317)": "Parents_Teens",
    "Students (College / University)": "Students",
    "Eco-Conscious / Sustainability Focused": "EcoConscious",
    "Luxury & Premium Shoppers": "LuxuryShopper",
    "Budget-Conscious Shoppers": "BudgetShopper",
    "Low Income (Under $30K)": "LowIncome",
    "Middle Income ($30K\u2013$75K)": "MiddleIncome",
    "Upper Middle Income ($75K\u2013$150K)": "UpperMiddleIncome",
    "High Income ($150K+)": "HighIncome",
}


@dataclass
class ObjectiveConfig:
    reach_weight_boost: float = 0.0
    ctr_multiplier: float = 1.0
    cvr_multiplier: float = 1.0
    app_install_ctr_channels: float = 1.0
    email_multiplier: float = 1.0


def to_float(value: Any, default: float = 0.0) -> float:
    try:
        return float(value)
    except (TypeError, ValueError):
        return default


def map_industry(industry: Any) -> str:
    key = str(industry or "").strip().lower()
    return INDUSTRY_MAP.get(key, "Other")


def map_region(region: Any) -> str:
    key = str(region or "global").strip().lower()
    return key if key in REGION_MULTIPLIERS else "global"


def normalize_text(value: str) -> str:
    lowered = (value or "").strip().lower()
    lowered = lowered.replace("\u2014", "-").replace("\u2013", "-")
    lowered = lowered.replace("\u2019", "'")
    lowered = lowered.replace("—", "-").replace("–", "-")
    lowered = " ".join(lowered.split())
    return lowered


def map_audience(audience: Any) -> str:
    raw = str(audience or "")
    if raw in AUDIENCE_EXACT_MAP:
        return AUDIENCE_EXACT_MAP[raw]

    normalized_lookup = {
        normalize_text(label): key for label, key in AUDIENCE_EXACT_MAP.items()
    }

    ascii_aliases = {
        "gen z - early (13-17)": "GenZ_Early",
        "gen z - core (18-24)": "GenZ_Core",
        "young millennials (25-30)": "YoungMillennials",
        "older millennials (31-38)": "OlderMillennials",
        "b2b - small business owners": "B2B_SMB",
        "b2b - mid-market decision makers": "B2B_MidMarket",
        "b2b - enterprise / c-suite": "B2B_Enterprise",
        "parents (young children 0-10)": "Parents_Young",
        "parents (teens 11-17)": "Parents_Teens",
        "middle income ($30k-$75k)": "MiddleIncome",
        "upper middle income ($75k-$150k)": "UpperMiddleIncome",
    }

    normalized = normalize_text(raw)
    if normalized in normalized_lookup:
        return normalized_lookup[normalized]
    if normalized in ascii_aliases:
        return ascii_aliases[normalized]
    return "MiddleIncome"


def objective_multiplier(objective: Any) -> ObjectiveConfig:
    key = str(objective or "").strip().lower()
    if key == "brand-awareness":
        return ObjectiveConfig(reach_weight_boost=0.15)
    if key == "lead-generation":
        return ObjectiveConfig(cvr_multiplier=1.10)
    if key == "direct-sales":
        return ObjectiveConfig(ctr_multiplier=1.05, cvr_multiplier=1.20)
    if key == "app-installs":
        return ObjectiveConfig(app_install_ctr_channels=1.15)
    if key == "retention":
        return ObjectiveConfig(email_multiplier=1.25)
    return ObjectiveConfig()


def business_size_multiplier(size: Any) -> float:
    key = str(size or "").strip().lower()
    if key == "startup":
        return 0.92
    if key == "mid-market":
        return 1.05
    if key == "enterprise":
        return 1.12
    return 1.00


def creative_format_channel_boost(creative_formats: List[str], channel: str) -> float:
    formats = {str(item).strip().lower() for item in creative_formats if str(item).strip()}
    boost = 1.0
    if channel in {"Instagram", "TikTok", "YouTube"} and ("video" in formats or "story" in formats):
        boost *= 1.06
    if channel == "GoogleAds" and "search-text" in formats:
        boost *= 1.08
    if channel in {"Instagram", "Facebook"} and "carousel" in formats:
        boost *= 1.04
    if channel == "LinkedIn" and "native-article" in formats:
        boost *= 1.06
    if channel in {"Instagram", "TikTok", "YouTube"} and "influencer" in formats:
        boost *= 1.05
    return boost


def audience_channel_multiplier(audience_key: str, channel: str) -> float:
    return AUDIENCE_MULTIPLIERS.get(audience_key, {}).get(channel, 1.0)


def apply_objective_ctr(channel: str, ctr: float, objective_cfg: ObjectiveConfig) -> float:
    value = ctr * objective_cfg.ctr_multiplier
    if objective_cfg.app_install_ctr_channels > 1.0 and channel in {"TikTok", "Instagram", "YouTube"}:
        value *= objective_cfg.app_install_ctr_channels
    if channel == "Email":
        value *= objective_cfg.email_multiplier
    return value


def apply_objective_cvr(channel: str, cvr: float, objective_cfg: ObjectiveConfig) -> float:
    value = cvr * objective_cfg.cvr_multiplier
    if channel == "Email":
        value *= objective_cfg.email_multiplier
    return value


def score_channel(
    channel: str,
    benchmark: Dict[str, float],
    audience_key: str,
    region_factor: float,
    objective_cfg: ObjectiveConfig,
    business_factor: float,
    creative_formats: List[str],
) -> float:
    audience_factor = audience_channel_multiplier(audience_key, channel)
    creative_factor = creative_format_channel_boost(creative_formats, channel)

    cpm = max(1.0, benchmark["cpm"] * region_factor)
    ctr = apply_objective_ctr(channel, benchmark["ctr"] * audience_factor, objective_cfg)
    cvr = apply_objective_cvr(
        channel,
        benchmark["cvr"] * (1 + (audience_factor - 1) * 0.75),
        objective_cfg,
    )

    ctr *= 1 + ((business_factor - 1) * 0.35)
    cvr *= business_factor
    ctr *= creative_factor
    cvr *= 1 + ((creative_factor - 1) * 0.6)

    reach_weight = 0.20 + objective_cfg.reach_weight_boost
    ctr_weight = 0.35
    cvr_weight = max(0.20, 0.45 - objective_cfg.reach_weight_boost)

    score = (
        reach_weight * ((1 / cpm) * 100)
        + ctr_weight * (ctr * 100)
        + cvr_weight * (cvr * 100)
    )
    return max(score, 0.0001)


def simulate_channel(
    channel: str,
    budget: float,
    benchmark: Dict[str, float],
    audience_key: str,
    region_factor: float,
    objective_cfg: ObjectiveConfig,
    business_factor: float,
    creative_formats: List[str],
    aov: float,
) -> Dict[str, float]:
    audience_factor = audience_channel_multiplier(audience_key, channel)
    creative_factor = creative_format_channel_boost(creative_formats, channel)

    cpm = max(1.0, benchmark["cpm"] * region_factor)
    ctr = apply_objective_ctr(channel, benchmark["ctr"] * audience_factor, objective_cfg)
    cvr = apply_objective_cvr(
        channel,
        benchmark["cvr"] * (1 + (audience_factor - 1) * 0.75),
        objective_cfg,
    )

    ctr *= 1 + ((business_factor - 1) * 0.35)
    cvr *= business_factor
    ctr *= creative_factor
    cvr *= 1 + ((creative_factor - 1) * 0.6)

    impressions = max(0.0, (budget / cpm) * 1000)
    clicks = max(0.0, impressions * ctr)
    conversions = max(0.0, clicks * cvr)
    revenue = conversions * aov

    return {
        "impressions": impressions,
        "clicks": clicks,
        "conversions": conversions,
        "revenue": revenue,
    }


def optimize_allocation(
    total_budget: float,
    industry_key: str,
    region_key: str,
    audience_key: str,
    objective_key: str,
    business_size: str,
    creative_formats: List[str],
    top_n: int = 6,
) -> List[Dict[str, float]]:
    benchmarks = BENCHMARKS[industry_key]
    region_factor = REGION_MULTIPLIERS[region_key]
    objective_cfg = objective_multiplier(objective_key)
    business_factor = business_size_multiplier(business_size)

    channel_scores: List[Tuple[str, float]] = []
    for channel in CHANNEL_ORDER:
        score = score_channel(
            channel,
            benchmarks[channel],
            audience_key,
            region_factor,
            objective_cfg,
            business_factor,
            creative_formats,
        )
        channel_scores.append((channel, score))

    channel_scores.sort(key=lambda item: item[1], reverse=True)
    selected = channel_scores[: max(1, min(top_n, len(channel_scores)))]

    score_sum = sum(score for _, score in selected) or 1.0
    allocations: List[Dict[str, float]] = []
    running_budget = 0.0

    for idx, (channel, score) in enumerate(selected):
        if idx == len(selected) - 1:
            channel_budget = round(total_budget - running_budget, 2)
        else:
            share = score / score_sum
            channel_budget = round(total_budget * share, 2)
            running_budget += channel_budget

        percentage = round((channel_budget / total_budget) * 100, 2) if total_budget > 0 else 0.0
        allocations.append({
            "channel": channel,
            "budget": max(0.0, channel_budget),
            "percentage": max(0.0, percentage),
        })

    return allocations


def simulate_portfolio(
    allocations: List[Dict[str, float]],
    benchmarks: Dict[str, Dict[str, float]],
    audience_key: str,
    region_key: str,
    objective_key: str,
    business_size: str,
    creative_formats: List[str],
    aov: float,
) -> Dict[str, float]:
    totals = {"impressions": 0.0, "clicks": 0.0, "conversions": 0.0, "revenue": 0.0}
    region_factor = REGION_MULTIPLIERS[region_key]
    objective_cfg = objective_multiplier(objective_key)
    business_factor = business_size_multiplier(business_size)

    for row in allocations:
        channel = str(row["channel"])
        budget = to_float(row["budget"])
        channel_result = simulate_channel(
            channel,
            budget,
            benchmarks[channel],
            audience_key,
            region_factor,
            objective_cfg,
            business_factor,
            creative_formats,
            aov,
        )
        for metric in totals:
            totals[metric] += channel_result[metric]

    return totals


def percent_improvement(new_value: float, old_value: float, inverse: bool = False) -> float:
    if old_value == 0:
        return 0.0
    delta = (old_value - new_value) if inverse else (new_value - old_value)
    return (delta / abs(old_value)) * 100


def default_aov_for_industry(industry_key: str) -> float:
    industry_aov = {
        "Technology": 220.0,
        "Finance": 320.0,
        "Manufacturing": 270.0,
        "RealEstate": 950.0,
        "Healthcare": 260.0,
        "Retail": 110.0,
        "FoodBeverage": 75.0,
        "Automotive": 700.0,
        "Education": 140.0,
        "Travel": 180.0,
        "Gaming": 85.0,
        "NonProfit": 60.0,
        "Fashion": 120.0,
        "FinancialServices": 380.0,
        "Telecom": 210.0,
        "Other": 130.0,
    }
    return industry_aov.get(industry_key, 130.0)


def extract_json_object(text: str) -> Dict[str, Any]:
    cleaned = (text or "").strip()
    if not cleaned:
        raise ValueError("Empty AI response.")

    try:
        parsed = json.loads(cleaned)
        if isinstance(parsed, dict):
            return parsed
    except json.JSONDecodeError:
        pass

    match = re.search(r"\{[\s\S]*\}", cleaned)
    if not match:
        raise ValueError("No JSON object found in AI response.")

    parsed = json.loads(match.group(0))
    if not isinstance(parsed, dict):
        raise ValueError("AI response JSON is not an object.")
    return parsed


def ensure_string_list(value: Any, fallback: List[str]) -> List[str]:
    if not isinstance(value, list):
        return fallback
    output: List[str] = []
    for item in value:
        text = str(item).strip()
        if text:
            output.append(text)
    return output or fallback


def normalize_ai_insights_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    source = payload.get("aiInsights") if isinstance(payload.get("aiInsights"), dict) else payload
    summary = str(source.get("summary") or "").strip()
    audience_analysis = str(source.get("audienceAnalysis") or "").strip()
    budget_rationale = str(source.get("budgetRationale") or "").strip()
    risk_flags = ensure_string_list(source.get("riskFlags"), ["No critical risks flagged by AI."])
    quick_wins = ensure_string_list(source.get("quickWins"), ["Test creative and audience variants in week one."])

    return {
        "summary": summary or "Deterministic plan generated with available campaign inputs.",
        "audienceAnalysis": audience_analysis or "Channel mix aligns with provided audience and demographic profile.",
        "budgetRationale": budget_rationale or "Budgets are distributed from benchmark CPM/CTR/CVR and multiplier scoring.",
        "riskFlags": risk_flags,
        "quickWins": quick_wins,
    }


def deterministic_ai_insights(input_data: Dict[str, Any], result: Dict[str, Any]) -> Dict[str, Any]:
    company_name = str(input_data.get("companyName") or "This company")
    objective = str(input_data.get("objective") or "performance growth").replace("-", " ")
    audience = str(input_data.get("targetAudience") or "the target audience")
    channels = result.get("channelAllocation") if isinstance(result.get("channelAllocation"), list) else []
    top_channels = ", ".join(str(row.get("channel")) for row in channels[:3] if isinstance(row, dict))
    top_channels_text = top_channels or "the top scored channels"
    creative_formats = input_data.get("creativeFormats") if isinstance(input_data.get("creativeFormats"), list) else []
    creative_text = ", ".join(str(item) for item in creative_formats[:3]) if creative_formats else "current creative mix"

    return {
        "summary": (
            f"{company_name}'s allocation prioritizes {top_channels_text} to support {objective}. "
            f"The model balances reach efficiency and conversion probability based on industry and region benchmarks."
        ),
        "audienceAnalysis": (
            f"The selected audience segment ({audience}) and demographics are aligned to channels with stronger "
            "historical CTR/CVR multipliers for similar profiles."
        ),
        "budgetRationale": (
            f"Budget distribution is weighted by benchmark CPM/CTR/CVR, adjusted for business size, campaign objective, "
            f"and creative formats such as {creative_text}."
        ),
        "riskFlags": [
            "Performance can vary if market CPM rises above baseline assumptions.",
            "Low creative-message fit may reduce predicted CTR/CVR lift.",
            "Attribution delay can under-report conversions in early days.",
        ],
        "quickWins": [
            "Launch A/B tests for headlines and primary creatives in the first 7 days.",
            "Set weekly reallocation thresholds based on CAC and ROAS by channel.",
            "Retarget high-intent clickers with objective-aligned offers.",
        ],
    }


STATIC_CHANNEL_CASE_STUDIES: Dict[str, Dict[str, str]] = {
    "Google Ads": {
        "company": "Booking.com",
        "industry": "Travel",
        "situation": "Needed to capture high-intent users at global scale with strict efficiency targets.",
        "solution": "Scaled search-led acquisition and automated bidding on intent-heavy keyword clusters.",
        "result": "Sustained large-scale bookings growth with strong return on ad spend.",
    },
    "Facebook Ads": {
        "company": "AirAsia",
        "industry": "Airline / Travel",
        "situation": "Had to scale demand quickly across multiple markets with segmented audiences.",
        "solution": "Used Facebook and Instagram campaign segmentation with dynamic creative optimization.",
        "result": "Delivered stronger conversion efficiency and lower blended acquisition costs.",
    },
    "Instagram": {
        "company": "Gymshark",
        "industry": "Fashion & Apparel",
        "situation": "Wanted faster growth among younger audiences driven by visual-first storytelling.",
        "solution": "Prioritized creator-led video and feed creative with consistent testing cycles.",
        "result": "Scaled global revenue rapidly while maintaining strong social engagement.",
    },
    "TikTok": {
        "company": "Duolingo",
        "industry": "Education Technology",
        "situation": "Needed broad reach and app growth through culturally native short-form content.",
        "solution": "Built always-on TikTok creative with fast iteration and trend participation.",
        "result": "Expanded reach significantly and improved install momentum at scale.",
    },
    "LinkedIn Ads": {
        "company": "IBM",
        "industry": "B2B Technology",
        "situation": "Focused on enterprise decision-maker targeting for complex B2B offerings.",
        "solution": "Used account and job-function targeting with value-led thought leadership campaigns.",
        "result": "Improved qualified pipeline generation and enterprise lead quality.",
    },
    "YouTube": {
        "company": "Grammarly",
        "industry": "SaaS",
        "situation": "Needed top-funnel education and stronger conversion-assist behavior.",
        "solution": "Scaled YouTube video campaigns around product explainers and use-case storytelling.",
        "result": "Increased branded demand and improved conversion paths across channels.",
    },
    "Email Marketing": {
        "company": "Sephora",
        "industry": "Retail / Beauty",
        "situation": "Wanted to improve retention and repeat purchase among existing customers.",
        "solution": "Expanded lifecycle automation and personalized email merchandising.",
        "result": "Lifted repeat purchase behavior and improved customer lifetime value.",
    },
    "Twitter/X": {
        "company": "Wendy's",
        "industry": "Food & Beverage",
        "situation": "Aimed to increase brand salience and fast engagement in competitive cycles.",
        "solution": "Used real-time social voice and reactive campaign bursts around live trends.",
        "result": "Sustained high engagement rates and efficient awareness expansion.",
    },
}


def build_static_channel_explanations(
    input_data: Dict[str, Any], channel_allocation: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    product = str(input_data.get("productDescription") or "the product")
    usp = str(input_data.get("usp") or "its key differentiator")
    audience = str(input_data.get("targetAudience") or "the selected audience")
    objective = str(input_data.get("objective") or "performance growth").replace("-", " ")

    explanations: List[Dict[str, Any]] = []
    for row in channel_allocation:
        channel = str(row.get("channel") or "")
        percentage = round(to_float(row.get("percentage"), 0.0), 2)
        study = STATIC_CHANNEL_CASE_STUDIES.get(channel, STATIC_CHANNEL_CASE_STUDIES["Google Ads"])
        connection = (
            f"This allocation leans on the same channel dynamics for {objective}, with messaging centered on {usp} "
            f"for {audience} and the product context ({product})."
        )
        explanations.append(
            {
                "channel": channel,
                "percentage": percentage,
                "allocationReason": (
                    f"{channel} receives {percentage}% because it aligns with your objective ({objective}) and "
                    f"audience profile ({audience}). The channel supports communicating your USP ({usp}) for "
                    f"{product} while balancing efficiency and conversion intent."
                ),
                "caseStudy": {
                    "company": study["company"],
                    "industry": study["industry"],
                    "situation": study["situation"],
                    "solution": study["solution"],
                    "result": study["result"],
                    "connection": connection,
                },
            }
        )
    return explanations


def normalize_channel_cards_payload(
    payload: Dict[str, Any], fallback: List[Dict[str, Any]]
) -> List[Dict[str, Any]]:
    cards = payload.get("channelCards") if isinstance(payload.get("channelCards"), list) else payload.get("explanations")
    if not isinstance(cards, list):
        return fallback

    fallback_by_channel = {str(item.get("channel")): item for item in fallback if isinstance(item, dict)}
    normalized: List[Dict[str, Any]] = []
    for raw in cards:
        if not isinstance(raw, dict):
            continue
        channel = str(raw.get("channel") or "").strip()
        if not channel:
            continue

        base = fallback_by_channel.get(channel, {})
        base_case = base.get("caseStudy") if isinstance(base.get("caseStudy"), dict) else {}
        case_study_raw = raw.get("caseStudy") if isinstance(raw.get("caseStudy"), dict) else {}

        normalized.append(
            {
                "channel": channel,
                "percentage": round(to_float(raw.get("percentage"), to_float(base.get("percentage"), 0.0)), 2),
                "allocationReason": str(raw.get("allocationReason") or base.get("allocationReason") or "").strip()
                or "Allocation explanation unavailable.",
                "caseStudy": {
                    "company": str(case_study_raw.get("company") or base_case.get("company") or "N/A").strip(),
                    "industry": str(case_study_raw.get("industry") or base_case.get("industry") or "N/A").strip(),
                    "situation": str(case_study_raw.get("situation") or base_case.get("situation") or "N/A").strip(),
                    "solution": str(case_study_raw.get("solution") or base_case.get("solution") or "N/A").strip(),
                    "result": str(case_study_raw.get("result") or base_case.get("result") or "N/A").strip(),
                    "connection": str(case_study_raw.get("connection") or base_case.get("connection") or "N/A").strip(),
                },
            }
        )

    return normalized or fallback


def enrich_channel_cards_with_groq(input_data: Dict[str, Any], fallback_cards: List[Dict[str, Any]]) -> List[Dict[str, Any]]:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key or Groq is None:
        return fallback_cards

    company_context = input_data.get("companyContext") if isinstance(input_data.get("companyContext"), dict) else {}
    channel_allocation = input_data.get("channelAllocation") if isinstance(input_data.get("channelAllocation"), list) else []

    request_payload = {
        "companyContext": {
            "productDescription": str(company_context.get("productDescription") or ""),
            "usp": str(company_context.get("usp") or ""),
            "targetAudience": str(company_context.get("targetAudience") or ""),
            "demographics": str(company_context.get("demographics") or ""),
            "objective": str(company_context.get("objective") or ""),
            "industry": str(company_context.get("industry") or ""),
            "businessSize": str(company_context.get("businessSize") or ""),
        },
        "channelAllocation": [
            {
                "channel": str(item.get("channel") or ""),
                "percentage": round(to_float(item.get("percentage"), 0.0), 2),
            }
            for item in channel_allocation
            if isinstance(item, dict) and str(item.get("channel") or "").strip()
        ],
    }

    user_prompt = (
        "Use the provided request JSON and return ONLY valid JSON in this exact schema:\n"
        "{\n"
        '  "channelCards": [\n'
        "    {\n"
        '      "channel": "Google Ads",\n'
        '      "percentage": 28.4,\n'
        '      "allocationReason": "...",\n'
        '      "caseStudy": {\n'
        '        "company": "...",\n'
        '        "industry": "...",\n'
        '        "situation": "...",\n'
        '        "solution": "...",\n'
        '        "result": "...",\n'
        '        "connection": "..."\n'
        "      }\n"
        "    }\n"
        "  ]\n"
        "}\n\n"
        "Request JSON:\n"
        f"{json.dumps(request_payload, ensure_ascii=False)}"
    )

    try:
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": CHANNEL_CARDS_SYSTEM_PROMPT},
                {"role": "user", "content": user_prompt},
            ],
            temperature=0.2,
        )
        content = completion.choices[0].message.content if completion.choices else ""
        parsed = extract_json_object(content or "")
        return normalize_channel_cards_payload(parsed, fallback_cards)
    except Exception:
        return fallback_cards


def build_channel_cards_result(input_data: Dict[str, Any]) -> Dict[str, Any]:
    provided_explanations = input_data.get("explanations")
    if isinstance(provided_explanations, list):
        fallback_cards = normalize_channel_cards_payload({"channelCards": provided_explanations}, [])
    else:
        fallback_cards = []

    if not fallback_cards:
        synthetic_context = {
            "productDescription": str(input_data.get("companyContext", {}).get("productDescription", "")),
            "usp": str(input_data.get("companyContext", {}).get("usp", "")),
            "targetAudience": str(input_data.get("companyContext", {}).get("targetAudience", "")),
            "objective": str(input_data.get("companyContext", {}).get("objective", "")),
        }
        channel_allocation = input_data.get("channelAllocation") if isinstance(input_data.get("channelAllocation"), list) else []
        fallback_cards = build_static_channel_explanations(synthetic_context, channel_allocation)

    cards = enrich_channel_cards_with_groq(input_data, fallback_cards)
    return {"channelCards": cards}


VALID_ANALYSIS_ICONS = {"budget", "audience", "region", "duration", "creative", "channel", "objective"}
VALID_ANALYSIS_CARD_TYPES = {"warning", "opportunity", "info"}


def normalize_campaign_analysis_cards(payload: Dict[str, Any]) -> List[Dict[str, Any]]:
    raw_cards = payload.get("analysisCards")
    if not isinstance(raw_cards, list):
        raise ValueError("Groq response missing 'analysisCards'.")

    cards: List[Dict[str, Any]] = []
    for item in raw_cards:
        if not isinstance(item, dict):
            continue

        icon = str(item.get("icon") or "").strip().lower()
        card_type = str(item.get("cardType") or "").strip().lower()
        case_study_raw = item.get("caseStudy") if isinstance(item.get("caseStudy"), dict) else {}

        if icon not in VALID_ANALYSIS_ICONS:
            icon = "channel"
        if card_type not in VALID_ANALYSIS_CARD_TYPES:
            card_type = "info"

        card = {
            "title": str(item.get("title") or "").strip(),
            "icon": icon,
            "cardType": card_type,
            "description": str(item.get("description") or "").strip(),
            "impact": str(item.get("impact") or "").strip(),
            "recommendation": str(item.get("recommendation") or "").strip(),
            "caseStudy": {
                "company": str(case_study_raw.get("company") or "").strip(),
                "industry": str(case_study_raw.get("industry") or "").strip(),
                "situation": str(case_study_raw.get("situation") or "").strip(),
                "solution": str(case_study_raw.get("solution") or "").strip(),
                "result": str(case_study_raw.get("result") or "").strip(),
            },
        }

        if (
            card["title"]
            and card["description"]
            and card["impact"]
            and card["recommendation"]
            and card["caseStudy"]["company"]
            and card["caseStudy"]["result"]
        ):
            cards.append(card)

    if len(cards) != 4:
        raise ValueError("Groq campaign analysis must return exactly 4 valid cards.")

    return cards


def build_campaign_analysis_result(input_data: Dict[str, Any]) -> Dict[str, Any]:
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key or Groq is None:
        raise ValueError("Groq is unavailable for campaign analysis.")

    required = [
        "companyName",
        "productDescription",
        "usp",
        "targetAudience",
        "demographics",
        "industry",
        "budget",
        "duration",
        "region",
        "objective",
        "businessSize",
        "currentPerformance",
        "channelAllocation",
    ]
    context_payload: Dict[str, Any] = {}
    for key in required:
        context_payload[key] = input_data.get(key)

    user_prompt = (
        "Analyze the campaign context below and return ONLY valid JSON in this exact schema:\n"
        "{\n"
        '  "analysisCards": [\n'
        "    {\n"
        '      "title": "Short headline of the issue or opportunity",\n'
        '      "icon": "one of: budget | audience | region | duration | creative | channel | objective",\n'
        '      "cardType": "one of: warning | opportunity | info",\n'
        '      "description": "1-2 sentences describing the issue",\n'
        '      "impact": "Single line - what goes wrong if unaddressed",\n'
        '      "recommendation": "Specific, actionable recommendation",\n'
        '      "caseStudy": {\n'
        '        "company": "Real company name",\n'
        '        "industry": "...",\n'
        '        "situation": "...",\n'
        '        "solution": "...",\n'
        '        "result": "quantified outcome"\n'
        "      }\n"
        "    }\n"
        "  ]\n"
        "}\n"
        "Return exactly 4 cards.\n\n"
        "Campaign Context JSON:\n"
        f"{json.dumps(context_payload, ensure_ascii=False)}"
    )

    client = Groq(api_key=api_key)
    completion = client.chat.completions.create(
        model=GROQ_MODEL,
        messages=[
            {"role": "system", "content": CAMPAIGN_AUDIT_SYSTEM_PROMPT},
            {"role": "user", "content": user_prompt},
        ],
        temperature=0.2,
    )
    content = completion.choices[0].message.content if completion.choices else ""
    parsed = extract_json_object(content or "")
    cards = normalize_campaign_analysis_cards(parsed)
    return {"analysisCards": cards}


def enrich_with_groq_insights(input_data: Dict[str, Any], deterministic_result: Dict[str, Any]) -> Dict[str, Any]:
    fallback = deterministic_ai_insights(input_data, deterministic_result)
    api_key = os.getenv("GROQ_API_KEY", "").strip()
    if not api_key or Groq is None:
        return fallback

    context_payload = {
        "companyName": input_data.get("companyName", ""),
        "productDescription": input_data.get("productDescription", ""),
        "usp": input_data.get("usp", ""),
        "demographics": input_data.get("demographics", ""),
        "keywords": input_data.get("keywords", []) if isinstance(input_data.get("keywords"), list) else [],
        "objective": input_data.get("objective", ""),
        "businessSize": input_data.get("businessSize", ""),
        "creativeFormats": input_data.get("creativeFormats", []) if isinstance(input_data.get("creativeFormats"), list) else [],
        "impressions": to_float(input_data.get("impressions"), 0.0),
        "clicks": to_float(input_data.get("clicks"), 0.0),
        "conversions": to_float(input_data.get("conversions"), 0.0),
        "industry": input_data.get("industry", ""),
        "region": input_data.get("region", ""),
        "targetAudience": input_data.get("targetAudience", ""),
    }

    groq_prompt = (
        "Campaign context and deterministic optimization result are provided below.\n"
        "Return ONLY valid JSON matching this exact schema:\n"
        "{\n"
        '  "aiInsights": {\n'
        '    "summary": "2-3 sentence strategic summary of this campaign",\n'
        '    "audienceAnalysis": "How the product/USP/demographics align with the chosen channels",\n'
        '    "budgetRationale": "Why this specific budget distribution makes sense for this company\'s context",\n'
        '    "riskFlags": ["list", "of", "potential", "risks"],\n'
        '    "quickWins": ["list", "of", "actionable", "short-term", "tips"]\n'
        "  }\n"
        "}\n\n"
        "Campaign Context JSON:\n"
        f"{json.dumps(context_payload, ensure_ascii=False)}\n\n"
        "Deterministic Result JSON:\n"
        f"{json.dumps(deterministic_result, ensure_ascii=False)}"
    )

    try:
        client = Groq(api_key=api_key)
        completion = client.chat.completions.create(
            model=GROQ_MODEL,
            messages=[
                {"role": "system", "content": GROQ_SYSTEM_PROMPT},
                {"role": "user", "content": groq_prompt},
            ],
            temperature=0.2,
        )
        content = completion.choices[0].message.content if completion.choices else ""
        parsed = extract_json_object(content or "")
        return normalize_ai_insights_payload(parsed)
    except Exception:
        return fallback


def build_ai_optimization_result(input_data: Dict[str, Any]) -> Dict[str, Any]:
    total_budget = max(0.0, to_float(input_data.get("budget"), 0.0))
    if total_budget <= 0:
        raise ValueError("'budget' must be greater than 0.")

    industry_key = map_industry(input_data.get("industry"))
    region_key = map_region(input_data.get("region"))
    audience_key = map_audience(input_data.get("targetAudience"))
    objective_key = str(input_data.get("objective") or "").strip().lower()
    business_key = str(input_data.get("businessSize") or "smb").strip().lower()
    creative_formats = input_data.get("creativeFormats") or []
    if not isinstance(creative_formats, list):
        creative_formats = []

    aov_input = to_float(input_data.get("aov"), 0.0)
    aov = aov_input if aov_input > 0 else default_aov_for_industry(industry_key)

    allocations = optimize_allocation(
        total_budget,
        industry_key,
        region_key,
        audience_key,
        objective_key,
        business_key,
        creative_formats,
        top_n=6,
    )

    benchmarks = BENCHMARKS[industry_key]
    totals = simulate_portfolio(
        allocations,
        benchmarks,
        audience_key,
        region_key,
        objective_key,
        business_key,
        creative_formats,
        aov,
    )

    baseline_allocations = [
        {"channel": row["channel"], "budget": total_budget / len(allocations), "percentage": 100 / len(allocations)}
        for row in allocations
    ]
    baseline_totals = simulate_portfolio(
        baseline_allocations,
        benchmarks,
        "MiddleIncome",
        region_key,
        "",
        "smb",
        [],
        aov,
    )

    impressions = round(totals["impressions"])
    clicks = round(totals["clicks"])
    conversions = max(1, round(totals["conversions"]))
    ctr_pct = round((totals["clicks"] / totals["impressions"]) * 100, 2) if totals["impressions"] > 0 else 0.0
    roas = round(totals["revenue"] / total_budget, 2) if total_budget > 0 else 0.0
    cac = round(total_budget / conversions, 2)

    output_allocations = [
        {
            "channel": DISPLAY_NAME[row["channel"]],
            "budget": round(row["budget"]),
            "percentage": round(row["percentage"], 2),
            "color": CHANNEL_COLORS[row["channel"]],
        }
        for row in allocations
    ]

    improvements = [
        {
            "metric": "Impressions",
            "improvement": round(percent_improvement(totals["impressions"], baseline_totals["impressions"])),
        },
        {
            "metric": "Clicks",
            "improvement": round(percent_improvement(totals["clicks"], baseline_totals["clicks"])),
        },
        {
            "metric": "Conversions",
            "improvement": round(percent_improvement(totals["conversions"], baseline_totals["conversions"])),
        },
        {
            "metric": "ROAS",
            "improvement": round(percent_improvement(totals["revenue"], baseline_totals["revenue"])),
        },
        {
            "metric": "CTR",
            "improvement": round(
                percent_improvement(
                    (totals["clicks"] / totals["impressions"]) if totals["impressions"] else 0.0,
                    (baseline_totals["clicks"] / baseline_totals["impressions"]) if baseline_totals["impressions"] else 0.0,
                )
            ),
        },
        {
            "metric": "CAC",
            "improvement": round(
                percent_improvement(
                    total_budget / max(totals["conversions"], 1.0),
                    total_budget / max(baseline_totals["conversions"], 1.0),
                    inverse=True,
                )
            ),
        },
    ]

    explanation_context = {
        "productDescription": str(input_data.get("productDescription") or ""),
        "usp": str(input_data.get("usp") or ""),
        "targetAudience": str(input_data.get("targetAudience") or ""),
        "objective": objective_key,
    }
    explanations = build_static_channel_explanations(explanation_context, output_allocations)

    deterministic_result = {
        "totalBudget": round(total_budget),
        "channelAllocation": output_allocations,
        "expectedMetrics": {
            "impressions": impressions,
            "clicks": clicks,
            "conversions": conversions,
            "cac": cac,
            "ctr": ctr_pct,
            "roas": roas,
        },
        "improvements": improvements,
        "explanations": explanations,
    }
    deterministic_result["aiInsights"] = enrich_with_groq_insights(input_data, deterministic_result)
    return deterministic_result


def manual_allocations_from_input(input_data: Dict[str, Any], total_budget: float) -> List[Dict[str, float]]:
    raw = input_data.get("budgetAllocation") if isinstance(input_data.get("budgetAllocation"), dict) else {}

    raw_percent = {
        "Facebook": to_float(raw.get("facebook"), 0.0),
        "GoogleAds": to_float(raw.get("google"), 0.0),
        "Instagram": to_float(raw.get("instagram"), 0.0),
        "TikTok": to_float(raw.get("tiktok"), 0.0),
        "LinkedIn": to_float(raw.get("linkedin"), 0.0),
        "YouTube": to_float(raw.get("youtube"), 0.0),
        "Twitter": to_float(raw.get("twitter"), 0.0),
        "Email": 0.0,
    }

    total_pct = sum(value for value in raw_percent.values() if value > 0)
    if total_pct <= 0:
        defaults = {
            "GoogleAds": 24,
            "Facebook": 22,
            "Instagram": 16,
            "TikTok": 12,
            "LinkedIn": 12,
            "YouTube": 14,
            "Twitter": 0,
            "Email": 0,
        }
        raw_percent = defaults
        total_pct = 100

    allocations: List[Dict[str, float]] = []
    for channel in CHANNEL_ORDER:
        pct = raw_percent.get(channel, 0.0)
        budget = total_budget * (pct / total_pct)
        allocations.append({"channel": channel, "budget": budget, "percentage": pct})

    return allocations


def build_compare_result(input_data: Dict[str, Any]) -> Dict[str, Any]:
    total_budget = max(0.0, to_float(input_data.get("budget"), 0.0))
    if total_budget <= 0:
        raise ValueError("'budget' must be greater than 0.")

    industry_key = map_industry(input_data.get("industry"))
    region_key = map_region(input_data.get("region"))
    audience_key = map_audience(input_data.get("targetAudience"))
    objective_key = str(input_data.get("objective") or "").strip().lower()
    business_key = str(input_data.get("businessSize") or "smb").strip().lower()
    creative_formats = input_data.get("creativeFormats") or []
    if not isinstance(creative_formats, list):
        creative_formats = []

    aov_input = to_float(input_data.get("aov"), 0.0)
    aov = aov_input if aov_input > 0 else default_aov_for_industry(industry_key)

    benchmarks = BENCHMARKS[industry_key]

    manual_allocations = manual_allocations_from_input(input_data, total_budget)
    ai_allocations = optimize_allocation(
        total_budget,
        industry_key,
        region_key,
        audience_key,
        objective_key,
        business_key,
        creative_formats,
        top_n=6,
    )

    ai_budget_map = {row["channel"]: row["budget"] for row in ai_allocations}

    manual_totals = simulate_portfolio(
        manual_allocations,
        benchmarks,
        audience_key,
        region_key,
        objective_key,
        business_key,
        creative_formats,
        aov,
    )

    ai_full_allocations = [
        {
            "channel": channel,
            "budget": ai_budget_map.get(channel, 0.0),
            "percentage": (ai_budget_map.get(channel, 0.0) / total_budget * 100) if total_budget > 0 else 0.0,
        }
        for channel in CHANNEL_ORDER
    ]

    ai_totals = simulate_portfolio(
        ai_full_allocations,
        benchmarks,
        audience_key,
        region_key,
        objective_key,
        business_key,
        creative_formats,
        aov,
    )

    manual_roi = ((manual_totals["revenue"] - total_budget) / total_budget) * 100
    ai_roi = ((ai_totals["revenue"] - total_budget) / total_budget) * 100
    roi_improvement = percent_improvement(ai_roi, manual_roi)

    allocation_rows = []
    for channel in CHANNEL_ORDER:
        manual_budget = next((row["budget"] for row in manual_allocations if row["channel"] == channel), 0.0)
        ai_budget = ai_budget_map.get(channel, 0.0)
        if manual_budget <= 0 and ai_budget <= 0:
            continue
        allocation_rows.append(
            {
                "platform": DISPLAY_NAME[channel],
                "manual": round(manual_budget, 2),
                "aiOptimized": round(ai_budget, 2),
                "change": round(ai_budget - manual_budget, 2),
                "color": CHANNEL_COLORS[channel],
            }
        )

    increased = sorted((row for row in allocation_rows if row["change"] > 0), key=lambda row: row["change"], reverse=True)
    decreased = sorted((row for row in allocation_rows if row["change"] < 0), key=lambda row: row["change"])

    insights = {
        "increased": [
            f"{row['platform']}: increased by ${abs(row['change']):,.0f} for stronger modeled return."
            for row in increased[:3]
        ],
        "decreased": [
            f"{row['platform']}: reduced by ${abs(row['change']):,.0f} to improve efficiency mix."
            for row in decreased[:3]
        ],
    }

    return {
        "kpiData": {
            "projectedROI": {"manual": round(manual_roi, 1), "ai": round(ai_roi, 1)},
            "estimatedRevenue": {
                "manual": round(manual_totals["revenue"]),
                "ai": round(ai_totals["revenue"]),
            },
            "estimatedConversions": {
                "manual": round(manual_totals["conversions"]),
                "ai": round(ai_totals["conversions"]),
            },
            "improvement": round(roi_improvement, 1),
        },
        "allocationData": allocation_rows,
        "insights": insights,
    }


def process_payload(payload: Dict[str, Any]) -> Dict[str, Any]:
    mode = payload.get("mode")
    input_data = payload.get("input")

    if mode not in {"ai_optimization", "compare_analyze", "channel_cards", "campaign_analysis"}:
        raise ValueError("'mode' must be 'ai_optimization', 'compare_analyze', 'channel_cards', or 'campaign_analysis'.")
    if not isinstance(input_data, dict):
        raise ValueError("'input' must be an object.")

    if mode == "ai_optimization":
        return {"success": True, "result": build_ai_optimization_result(input_data)}
    if mode == "channel_cards":
        return {"success": True, "result": build_channel_cards_result(input_data)}
    if mode == "campaign_analysis":
        return {"success": True, "result": build_campaign_analysis_result(input_data)}
    return {"success": True, "result": build_compare_result(input_data)}


def main() -> None:
    try:
        import sys

        raw = sys.stdin.read().strip()
        payload = json.loads(raw) if raw else {}
        response = process_payload(payload)
    except Exception as exc:  # pylint: disable=broad-except
        response = {"success": False, "error": str(exc)}

    print(json.dumps(response))


if __name__ == "__main__":
    main()
