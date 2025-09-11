import os, json
from typing import Optional, List, Dict, Any
import math
import google.generativeai as genai
from sentence_transformers import SentenceTransformer, util
from src.models.matching import JobInput, ResumeInput, MatchScores, BatchMatchResponseItem
from src.utils.logger import logger

# Load model with error handling
try:
    _model = SentenceTransformer("sentence-transformers/all-MiniLM-L6-v2")
    logger.info("Sentence transformer model loaded successfully")
except Exception as e:
    logger.error(f"Failed to load sentence transformer model: {e}")
    _model = None

DEFAULT_WEIGHTS = {"skills":0.35,"experience":0.25,"education":0.10,"technical":0.30,"cultural":0.0,"bias":0.0}
_KEYS = ["skills","experience","education","technical","cultural","bias"]

def _norm_list(xs: List[str]) -> List[str]:
    return sorted(list({(x or "").strip().lower() for x in xs if x and isinstance(x,str)}))

def _jaccard(a: List[str], b: List[str]) -> float:
    A, B = set(a), set(b)
    if not A and not B: return 0.0
    return (len(A & B) / len(A | B)) * 100.0

def _education_match(job: Optional[str], edu: Optional[str]) -> tuple[float,str]:
    if not job or not edu: return 50.0, "unknown"
    j, e = job.lower(), edu.lower()
    if j in e: return 100.0, "match"
    if ("master" in e or "m." in e) and ("bachelor" in j or "b." in j): return 90.0, "higher"
    if any(k in e for k in ["b.tech","b.e","bsc","bachelor"]) and any(k in j for k in ["b.tech","b.e","bsc","bachelor"]): return 100.0, "match"
    return 60.0, "partial"

def _experience_score(job_exp: Optional[int], cand_exp: Optional[int]) -> tuple[float, Optional[int]]:
    if job_exp is None or cand_exp is None: return 50.0, None
    gap = max(0, job_exp - cand_exp)
    return max(0.0, 100.0 - 20.0*gap), gap

def _normalize_weights(w: Optional[Dict[str, float]]) -> Dict[str,float]:
    merged = {**DEFAULT_WEIGHTS, **(w or {})}
    v = {k: float(max(0.0, merged.get(k, 0.0))) for k in _KEYS}
    s = sum(v.values()) or 1.0
    return {k: v[k]/s for k in _KEYS}

def _join_job(job: JobInput) -> str:
    parts = [job.title or "", job.description or "", "skills: " + ", ".join(_norm_list(job.skills))]
    if job.experience is not None: parts.append(f"experience: {job.experience} years")
    if job.education: parts.append(f"education: {job.education}")
    return "\n".join([p for p in parts if p])

def _join_resume(r: ResumeInput) -> str:
    # Create summary from available fields since we don't have parsed summary
    summary_parts = []
    if r.name: summary_parts.append(f"Name: {r.name}")
    if r.email: summary_parts.append(f"Email: {r.email}")
    if r.experience is not None: summary_parts.append(f"Experience: {r.experience} years")
    if r.education: summary_parts.append(f"Education: {r.education}")
    
    parts = [r.summary or " ".join(summary_parts), "skills: " + ", ".join(_norm_list(r.skills))]
    if r.experience is not None: parts.append(f"experience: {r.experience} years")
    if r.education: parts.append(f"education: {r.education}")
    return "\n".join([p for p in parts if p])

def _embed(texts: List[str]):
    if _model is None:
        # Fallback: return random embeddings if model failed to load
        import torch
        return torch.randn(len(texts), 384)  # MiniLM-L6-v2 has 384 dimensions
    return _model.encode(texts, convert_to_tensor=True, normalize_embeddings=True)

def score_one(job: JobInput, r: ResumeInput, job_emb, weights: Dict[str,float]) -> MatchScores:
    js = _norm_list(job.skills); rs = _norm_list(r.skills)
    jacc = _jaccard(js, rs)
    exp_s, gap = _experience_score(job.experience, r.experience)
    edu_s, edu_m = _education_match(job.education, r.education)

    res_text = _join_resume(r)
    res_emb = _embed([res_text])[0]
    cos = float(util.cos_sim(job_emb, res_emb).item())
    tech_s = round(100.0 * max(0.0, min(1.0, cos)), 1)

    comps = {
        "skills": jacc,
        "experience": exp_s,
        "education": edu_s,
        "technical": tech_s,
        "cultural": 0.0,
        "bias": 0.0
    }
    overall = sum((comps[k] * weights[k]) for k in _KEYS)

    matched = sorted(list(set(rs) & set(js)))
    missing = sorted(list(set(js) - set(rs)))

    return MatchScores(
        overallMatchScore=round(overall,1),
        skillsMatchScore=round(jacc,1),
        experienceMatchScore=round(exp_s,1),
        educationMatchScore=round(edu_s,1),
        technicalMatchScore=tech_s,
        culturalFitMatchScore=None,
        biasMatchScore=None,
        matchedSkills=matched,
        missingSkills=missing,
        experienceGap=gap,
        educationMatch=edu_m,
        aiMatchInsights=None  # filled later
    )

def score_batch(job: JobInput, resumes: List[ResumeInput], topN: Optional[int], weights: Optional[Dict[str,float]], insight_fn=None, insightsTopK: int = 0) -> List[BatchMatchResponseItem]:
    W = _normalize_weights(weights)
    job_text = _join_job(job)
    job_emb = _embed([job_text])[0]

    items = []
    for r in resumes:
        s = score_one(job, r, job_emb, W)
        items.append(BatchMatchResponseItem(resumeId=r.id, scores=s))

    items.sort(key=lambda x: (x.scores.overallMatchScore or 0), reverse=True)
    items = items[: topN] if topN else items

    if insight_fn and insightsTopK > 0:
        for it in items[:insightsTopK]:
            it.scores.aiMatchInsights = insight_fn(job, it)  # short string

    return items

def make_gemini_insight_fn():
    def insight_fn(job: JobInput, match: BatchMatchResponseItem) -> Optional[str]:
        try:
            # Simple insight based on scores
            scores = match.scores
            insights = []
            
            if scores.skillsMatchScore and scores.skillsMatchScore > 80:
                insights.append("Excellent skills match")
            elif scores.skillsMatchScore and scores.skillsMatchScore > 60:
                insights.append("Good skills alignment")
            
            if scores.experienceMatchScore and scores.experienceMatchScore > 90:
                insights.append("Perfect experience level")
            elif scores.experienceGap and scores.experienceGap > 0:
                insights.append(f"Needs {scores.experienceGap} more years experience")
            
            if scores.technicalMatchScore and scores.technicalMatchScore > 85:
                insights.append("Strong technical fit")
            
            if scores.matchedSkills:
                insights.append(f"Key skills: {', '.join(scores.matchedSkills[:3])}")
            
            return "; ".join(insights) if insights else "Standard match"
            
        except Exception as e:
            logger.error(f"Insight generation failed: {e}")
            return "Match analysis unavailable"
    
    return insight_fn