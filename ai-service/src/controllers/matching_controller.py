from fastapi import APIRouter, Body
from src.models.responses import SuccessResponse
from src.models.matching import BatchMatchRequest
from src.services.matching_service import score_batch
from src.services.matching_insights import make_rule_based_insight_fn

router = APIRouter(prefix="/match", tags=["match"])

@router.post("/batch")
def match_batch(req: BatchMatchRequest = Body(...)):
    opts = req.options or {}
    topN = int(opts.get("topN")) if opts.get("topN") is not None else None
    weights = opts.get("weights") or None
    insightsTopK = int(opts.get("insightsTopK") or 0)

    try:
        insight_fn = make_rule_based_insight_fn()
    except Exception:
        insight_fn = None
    
    matched = score_batch(req.job, req.resumes, topN, weights, insight_fn, insightsTopK)
    return SuccessResponse(
        message="Matched", 
        data={
            "topN": topN or len(matched), 
            "matched": [m.model_dump() for m in matched]
        }
    )