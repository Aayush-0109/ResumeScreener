from typing import List, Dict, Any, Optional
import json
from src.models.matching import JobInput, ResumeInput, MatchScores, BatchMatchResponseItem
from src.utils.logger import logger
from src.config.settings import settings

def _call_gemini_for_matching(job: JobInput, resumes: List[ResumeInput], weights: Dict[str, float]) -> Optional[List[Dict[str, Any]]]:
    try:
        import google.generativeai as genai
    except Exception as e:
        logger.warning(f"Gemini library not available: {e}")
        return None
    
    api_key = settings.google_api_key
    if not api_key:
        logger.warning("🔑 Gemini API key not configured")
        return None
    
    try:
        logger.info("🤖 Attempting Gemini matching...")
        genai.configure(api_key=api_key)
        
        # Use the latest model name and API version
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash-latest",  # Updated model name
            generation_config={
                "temperature": 0.1,
                "response_mime_type": "application/json"
            }
        )
        
        # Create detailed prompt for matching
        prompt = _create_matching_prompt(job, resumes, weights)
        
        logger.info(f"📤 Sending {len(resumes)} resumes to Gemini for matching")
        resp = model.generate_content(prompt)
        content = getattr(resp, "text", None) or "{}"
        
        try:
            result = json.loads(content)
            logger.info(f"✅ GEMINI responded successfully with {len(result) if isinstance(result, list) else 0} matches")
            return result
        except json.JSONDecodeError:
            # Try to extract JSON from response
            start = content.find('[')
            end = content.rfind(']') + 1
            if start != -1 and end != 0:
                result = json.loads(content[start:end])
                logger.info(f"✅ GEMINI responded (extracted JSON) with {len(result)} matches")
                return result
            logger.error("Failed to parse Gemini JSON response")
            return None
            
    except Exception as e:
        logger.error(f"❌ Gemini matching failed: {e}")
        return None

def _create_matching_prompt(job: JobInput, resumes: List[ResumeInput], weights: Dict[str, float]) -> str:
    job_desc = f"""
Job Title: {job.title or 'N/A'}
Description: {job.description or 'N/A'}
Required Skills: {', '.join(job.skills)}
Experience Required: {job.experience or 'Not specified'} years
Education Required: {job.education or 'Not specified'}
"""
    
    resume_descriptions = []
    for i, resume in enumerate(resumes):
        resume_desc = f"""
Resume {i+1} (ID: {resume.id}):
- Name: {resume.name or 'N/A'}
- Email: {resume.email or 'N/A'}
- Skills: {', '.join(resume.skills)}
- Experience: {resume.experience or 'Not specified'} years
- Education: {resume.education or 'Not specified'}
"""
        resume_descriptions.append(resume_desc)
    
    weights_desc = f"""
Scoring Weights:
- Skills Match: {weights.get('skills', 0.35) * 100}%
- Experience Match: {weights.get('experience', 0.25) * 100}%
- Education Match: {weights.get('education', 0.10) * 100}%
- Technical Fit: {weights.get('technical', 0.30) * 100}%
"""
    
    return f"""
You are an expert recruiter and technical interviewer. Analyze the job requirements against each resume and provide detailed matching scores.

{job_desc}

{chr(10).join(resume_descriptions)}

{weights_desc}

For each resume, provide a JSON array with this exact structure:
[
  {{
    "resumeId": "resume-id-1",
    "scores": {{
      "overallMatchScore": 85.2,
      "skillsMatchScore": 80.0,
      "experienceMatchScore": 90.0,
      "educationMatchScore": 100.0,
      "technicalMatchScore": 75.5,
      "matchedSkills": ["react", "javascript", "typescript"],
      "missingSkills": ["node.js", "express"],
      "experienceGap": 0,
      "educationMatch": "perfect_match",
      "aiMatchInsights": "Strong technical background with excellent React skills. Perfect experience level and educational background matches requirements."
    }}
  }}
]

Scoring Guidelines:
- overallMatchScore: 0-100 (weighted average of all scores)
- skillsMatchScore: 0-100 (based on skill overlap and relevance)
- experienceMatchScore: 0-100 (consider years and quality of experience)
- educationMatchScore: 0-100 (degree level and field relevance)
- technicalMatchScore: 0-100 (overall technical competency)
- matchedSkills: Array of skills that match job requirements
- missingSkills: Array of required skills candidate lacks
- experienceGap: Years of experience candidate is short (0 if meets/exceeds)
- educationMatch: "perfect_match", "good_match", "partial_match", or "no_match"
- aiMatchInsights: 1-2 sentence explanation of the match quality

Be thorough and accurate in your analysis. Consider both exact matches and related/transferable skills.
"""

def _fallback_matching(job: JobInput, resumes: List[ResumeInput], weights: Dict[str, float]) -> List[Dict[str, Any]]:
    """Simple fallback matching if LLM fails"""
    results = []
    
    for resume in resumes:
        # Simple skill matching
        job_skills = set(skill.lower() for skill in job.skills)
        resume_skills = set(skill.lower() for skill in resume.skills)
        matched_skills = list(job_skills.intersection(resume_skills))
        missing_skills = list(job_skills - resume_skills)
        
        skills_score = (len(matched_skills) / len(job_skills)) * 100 if job_skills else 50
        
        # Experience scoring
        exp_gap = 0
        if job.experience and resume.experience:
            exp_gap = max(0, job.experience - resume.experience)
            exp_score = max(0, 100 - (exp_gap * 20))
        else:
            exp_score = 50
        
        # Education scoring
        edu_score = 50
        edu_match = "unknown"
        if job.education and resume.education:
            job_edu = job.education.lower()
            resume_edu = resume.education.lower()
            if job_edu in resume_edu:
                edu_score = 100
                edu_match = "perfect_match"
            elif any(term in resume_edu for term in ["master", "m.", "phd"]):
                edu_score = 90
                edu_match = "good_match"
            else:
                edu_score = 60
                edu_match = "partial_match"
        
        # Technical score (simple average of skills and experience)
        tech_score = (skills_score + exp_score) / 2
        
        # Overall score
        overall = (
            skills_score * weights.get('skills', 0.35) +
            exp_score * weights.get('experience', 0.25) +
            edu_score * weights.get('education', 0.10) +
            tech_score * weights.get('technical', 0.30)
        )
        
        results.append({
            "resumeId": resume.id,
            "scores": {
                "overallMatchScore": round(overall, 1),
                "skillsMatchScore": round(skills_score, 1),
                "experienceMatchScore": round(exp_score, 1),
                "educationMatchScore": round(edu_score, 1),
                "technicalMatchScore": round(tech_score, 1),
                "matchedSkills": matched_skills,
                "missingSkills": missing_skills,
                "experienceGap": exp_gap,
                "educationMatch": edu_match,
                "aiMatchInsights": f"Skills match: {len(matched_skills)}/{len(job_skills)}. Experience gap: {exp_gap} years."
            }
        })
    
    return results

def score_batch(job: JobInput, resumes: List[ResumeInput], topN: Optional[int], weights: Optional[Dict[str, float]], insight_fn=None, insightsTopK: int = 0) -> List[BatchMatchResponseItem]:
    if not resumes:
        return []
    
    # Normalize weights
    default_weights = {"skills": 0.35, "experience": 0.25, "education": 0.10, "technical": 0.30, "cultural": 0.0, "bias": 0.0}
    W = {**default_weights, **(weights or {})}
    
    # Try LLM-based matching first
    llm_results = _call_gemini_for_matching(job, resumes, W)
    
    if llm_results:
        items = []
        for result in llm_results:
            try:
                scores = MatchScores(**result["scores"])
                items.append(BatchMatchResponseItem(resumeId=result["resumeId"], scores=scores))
            except Exception as e:
                logger.error(f"Failed to parse LLM result: {e}")
                continue
    else:
        fallback_results = _fallback_matching(job, resumes, W)
        items = []
        for result in fallback_results:
            try:
                scores = MatchScores(**result["scores"])
                items.append(BatchMatchResponseItem(resumeId=result["resumeId"], scores=scores))
            except Exception as e:
                logger.error(f"Failed to parse fallback result: {e}")
                continue
    
    # Sort by overall score
    items.sort(key=lambda x: (x.scores.overallMatchScore or 0), reverse=True)
    
    # Apply topN limit
    if topN:
        items = items[:topN]
    
    # Generate insights for top matches if requested
    if insight_fn and insightsTopK > 0:
        for item in items[:insightsTopK]:
            if not item.scores.aiMatchInsights:
                item.scores.aiMatchInsights = insight_fn(job, item)
    
    return items