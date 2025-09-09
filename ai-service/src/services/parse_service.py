import base64
from typing import Tuple
from src.models.parse import ParseResumeRequest, ParsedResume

ALLOWED_MIME = {
 "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

def decode_base64(content_b64 : str)->bytes :
    try:
        return base64.b64decode(content_b64,validate=True)
    except Exception:
        raise ValueError("Invlaid base64 content")

def validate_mime(mime_type :str)->None:
    if mime_type not in ALLOWED_MIME:
        raise ValueError(f"Unsupported mime type: {mime_type}")

def parse_resume_scaffold(req : ParseResumeRequest)->ParsedResume:
    validate_mime(req.mime_type)
    raw_bytes = decode_base64(req.file_content)
    print(raw_bytes)
    text_placeholder = f"(received {len(raw_bytes)} bytes from {req.file_name})"
    return ParsedResume(
        name= None,
        email= None,
        phone=None,
        skills=[],
        experience=None,
        education=None,
        raw_text=text_placeholder
    )