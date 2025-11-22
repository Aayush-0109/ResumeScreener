from typing import List, Dict, Any, Optional, Tuple
import json
import time
from src.models.matching import JobInput, ResumeInput, MatchScores, BatchMatchResponseItem
from src.utils.logger import logger
from src.config.settings import settings

def _call_gemini_for_matching(job: JobInput, resumes: List[ResumeInput], weights: Dict[str, float]) -> Optional[List[Dict[str, Any]]]:
    try:
        import google.generativeai as genai
    except Exception as e:
        logger.warning(f"Gemini library not available: {e}")
        return None
    
    import os
    api_key = settings.google_api_key or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        logger.warning("🔑 Gemini API key not configured")
        return None
    
    try:
        logger.info("🤖 Attempting Gemini matching...")
        genai.configure(api_key=api_key)
        
        # Use stable model name
        model = genai.GenerativeModel(
            model_name=settings.gemini_model_name,
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
You are an expert recruiter and technical interviewer. Analyze the job requirements against each resume and provide detailed matching scores. Treat each request as completely independent; never reuse knowledge from earlier prompts or prior candidates.

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

def _call_groq_for_matching(job: JobInput, resumes: List[ResumeInput], weights: Dict[str, float]) -> Optional[List[Dict[str, Any]]]:
    """Call Groq API for matching"""
    try:
        from groq import Groq
    except Exception as e:
        logger.warning(f"Groq library not available: {e}")
        return None
    
    import os
    api_key = settings.groq_api_key or os.getenv("GROQ_API_KEY")
    if not api_key:
        logger.warning("🔑 Groq API key not configured")
        return None
    
    try:
        logger.info("🤖 Attempting Groq matching...")
        client = Groq(api_key=api_key)
        
        prompt = _create_matching_prompt(job, resumes, weights)
        
        logger.info(f"📤 Sending {len(resumes)} resumes to Groq for matching")
        # Use higher max_tokens for matching multiple resumes
        max_tokens_for_matching = max(4000, settings.llm_max_tokens * len(resumes))
        resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "You are an expert recruiter. Return ONLY a valid JSON array, no additional text."},
                {"role": "user", "content": prompt}
            ],
            temperature=0.1,
            max_tokens=max_tokens_for_matching,
            timeout=settings.llm_timeout
        )
        
        content = resp.choices[0].message.content or "[]"
        
        try:
            # First try direct parsing
            result = json.loads(content)
            if isinstance(result, list):
                logger.info(f"✅ GROQ responded successfully with {len(result)} matches")
                return result
        except json.JSONDecodeError:
            pass
        
        # Try to extract JSON array from response
        try:
            start = content.find('[')
            end = content.rfind(']') + 1
            if start != -1 and end != 0:
                json_str = content[start:end]
                result = json.loads(json_str)
                if isinstance(result, list):
                    logger.info(f"✅ GROQ responded (extracted JSON) with {len(result)} matches")
                    return result
        except Exception as e:
            logger.error(f"Failed to extract JSON array: {e}")
        
        logger.error("Failed to parse Groq JSON response")
        return None
            
    except Exception as e:
        logger.error(f"❌ Groq matching failed: {e}")
        return None

def _call_hf_for_matching(job: JobInput, resumes: List[ResumeInput], weights: Dict[str, float]) -> Optional[List[Dict[str, Any]]]:
    """Call HuggingFace API for matching"""
    try:
        import requests
    except Exception:
        logger.warning("Requests library not available")
        return None
    
    import os
    token = settings.hf_token or os.getenv("HF_TOKEN")
    if not token:
        logger.warning("🔑 HuggingFace token not configured")
        return None
    
    try:
        logger.info("🤖 Attempting HuggingFace matching...")
        
        prompt = _create_matching_prompt(job, resumes, weights)
        
        logger.info(f"📤 Sending {len(resumes)} resumes to HuggingFace for matching")
        # Use higher max_tokens for matching multiple resumes
        max_tokens_for_matching = max(3000, settings.llm_max_tokens * len(resumes))
        r = requests.post(
            "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
            headers={"Authorization": f"Bearer {token}"},
            json={
                "inputs": prompt,
                "parameters": {"temperature": 0.1, "max_new_tokens": max_tokens_for_matching}
            },
            timeout=60
        )
        r.raise_for_status()
        data = r.json()
        
        content = None
        if isinstance(data, list) and data:
            content = data[0].get("generated_text") or data[0].get("text", "")
        
        if not content:
            logger.error("HuggingFace returned empty content")
            return None
        
        try:
            # First try direct parsing
            result = json.loads(content)
            if isinstance(result, list):
                logger.info(f"✅ HUGGINGFACE responded successfully with {len(result)} matches")
                return result
        except json.JSONDecodeError:
            pass
        
        # Try to extract JSON array
        try:
            start = content.find('[')
            end = content.rfind(']') + 1
            if start != -1 and end != 0:
                json_str = content[start:end]
                result = json.loads(json_str)
                if isinstance(result, list):
                    logger.info(f"✅ HUGGINGFACE responded (extracted JSON) with {len(result)} matches")
                    return result
        except Exception as e:
            logger.error(f"Failed to extract JSON array: {e}")
        
        logger.error("Failed to parse HuggingFace JSON response")
        return None
            
    except Exception as e:
        logger.error(f"❌ HuggingFace matching failed: {e}")
        return None

def _call_any_llm_for_matching(job: JobInput, resumes: List[ResumeInput], weights: Dict[str, float]) -> Tuple[Optional[List[Dict[str, Any]]], Optional[str]]:
    """Try multiple LLM providers in order with retries"""
    llm_provider_order = settings.llm_provider_order
    logger.info(f"🔄 Trying LLM providers in order: {llm_provider_order}")
    
    for provider_name in llm_provider_order:
        logger.info(f"🤖 Attempting provider: {provider_name.upper()}")
        result = None
        
        if provider_name == 'gemini':
            for attempt in range(3):
                result = _call_gemini_for_matching(job, resumes, weights)
                if result is not None:
                    logger.info(f"✅ GEMINI succeeded on attempt {attempt + 1}")
                    return result, 'gemini'
                elif attempt < 2:
                    logger.warning(f"⚠️ Gemini attempt {attempt + 1}/3 failed, retrying...")
                    time.sleep(1 * (2 ** attempt))
        
        elif provider_name == 'groq':
            for attempt in range(3):
                result = _call_groq_for_matching(job, resumes, weights)
                if result is not None:
                    logger.info(f"✅ GROQ succeeded on attempt {attempt + 1}")
                    return result, 'groq'
                elif attempt < 2:
                    logger.warning(f"⚠️ Groq attempt {attempt + 1}/3 failed, retrying...")
                    time.sleep(1 * (2 ** attempt))
        
        elif provider_name == 'huggingface':
            for attempt in range(3):
                result = _call_hf_for_matching(job, resumes, weights)
                if result is not None:
                    logger.info(f"✅ HUGGINGFACE succeeded on attempt {attempt + 1}")
                    return result, 'huggingface'
                elif attempt < 2:
                    logger.warning(f"⚠️ HuggingFace attempt {attempt + 1}/3 failed, retrying...")
                    time.sleep(1 * (2 ** attempt))
        
        if result is None:
            logger.warning(f"❌ {provider_name.upper()} failed after all attempts")
    
    logger.error("❌ All LLM providers failed")
    return None, None

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
    
    # Try multiple LLM providers with fallbacks
    llm_results, successful_provider = _call_any_llm_for_matching(job, resumes, W)
    
    if llm_results:
        logger.info(f"🎉 Using results from: {successful_provider.upper()}")
        items = []
        for result in llm_results:
            try:
                scores = MatchScores(**result["scores"])
                items.append(BatchMatchResponseItem(resumeId=result["resumeId"], scores=scores))
            except Exception as e:
                logger.error(f"Failed to parse LLM result: {e}")
                continue
    else:
        logger.warning("⚠️ All LLM providers failed, using fallback algorithm")
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