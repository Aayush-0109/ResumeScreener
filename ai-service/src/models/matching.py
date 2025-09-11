from pydantic import BaseModel
from typing import List, Optional, Dict, Any

class JobInput(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    skills: List[str] = []
    experience: Optional[int] = None
    education: Optional[str] = None

class ResumeInput(BaseModel):
    id: str
    skills: List[str] = []
    experience: Optional[int] = None
    education: Optional[str] = None
    summary: Optional[str] = None
    name: Optional[str] = None  # Add these fields
    email: Optional[str] = None

class Weights(BaseModel):
    skills: Optional[float] = None
    experience: Optional[float] = None
    education: Optional[float] = None
    technical: Optional[float] = None
    cultural: Optional[float] = None
    bias: Optional[float] = None

class BatchMatchRequest(BaseModel):
    job: JobInput
    resumes: List[ResumeInput]
    options: Optional[Dict[str, Any]] = None  # { topN, weights, insightsTopK }

class MatchScores(BaseModel):
    overallMatchScore: Optional[float] = None
    skillsMatchScore: Optional[float] = None
    experienceMatchScore: Optional[float] = None
    educationMatchScore: Optional[float] = None
    culturalFitMatchScore: Optional[float] = None
    technicalMatchScore: Optional[float] = None
    biasMatchScore: Optional[float] = None
    matchedSkills: List[str] = []
    missingSkills: List[str] = []
    experienceGap: Optional[int] = None
    educationMatch: Optional[str] = None
    aiMatchInsights: Optional[str] = None  # short rationale

class BatchMatchResponseItem(BaseModel):
    resumeId: str
    scores: MatchScores