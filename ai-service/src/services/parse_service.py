import base64
import json
import re
import os
from typing import Optional, Dict, Any, Tuple

from src.config.settings import settings
from src.models.parse import ParseResumeRequest, ParsedResume
from src.utils.logger import logger

import tempfile
import subprocess
import shutil

ALLOWED_MIME = {
    "application/pdf",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

def decode_base64(content_b64: str) -> bytes:
    try:
        return base64.b64decode(content_b64, validate=True)
    except Exception:
        raise ValueError("Invlaid base64 content")

def validate_mime(mime_type: str) -> None:
    if mime_type not in ALLOWED_MIME:
        raise ValueError(f"Unsupported mime type: {mime_type}")

def _extract_text_from_pdf(raw_bytes: bytes) -> str:
    from io import BytesIO
    try:
        from pypdf import PdfReader
    except Exception:
        return ""
    try:
        reader = PdfReader(BytesIO(raw_bytes))
        return "\n".join((page.extract_text() or "") for page in reader.pages).strip()
    except Exception:
        return ""

def _extract_text_from_docx(raw_bytes: bytes) -> str:
    from io import BytesIO
    try:
        from docx import Document
    except Exception:
        return ""
    try:
        doc = Document(BytesIO(raw_bytes))
        return "\n".join(p.text for p in doc.paragraphs).strip()
    except Exception:
        return ""

def _extract_text_from_doc_via_textract(raw_bytes: bytes) -> str:
    # textract not available, skip .doc parsing
    return ""

def _has_soffice() -> bool:
    return shutil.which("soffice") is not None

def _convert_doc_to_pdf_via_soffice(raw_bytes: bytes) -> Optional[bytes]:
    if not _has_soffice():
        return None
    with tempfile.TemporaryDirectory() as tmpdir:
        src = os.path.join(tmpdir, "in.doc")
        out_dir = tmpdir
        with open(src, "wb") as f:
            f.write(raw_bytes)
        try:
            subprocess.run(
                ["soffice", "--headless", "--convert-to", "pdf", "--outdir", out_dir, src],
                check=True, stdout=subprocess.DEVNULL, stderr=subprocess.DEVNULL
            )
            pdf_path = os.path.join(out_dir, "in.pdf")
            if os.path.exists(pdf_path):
                with open(pdf_path, "rb") as pf:
                    return pf.read()
        except Exception:
            return None
    return None

def _extract_text_from_doc(raw_bytes: bytes) -> str:
  
    txt = _extract_text_from_doc_via_textract(raw_bytes)
    if txt:
        return txt
    
    pdf_bytes = _convert_doc_to_pdf_via_soffice(raw_bytes)
    if pdf_bytes:
        return _extract_text_from_pdf(pdf_bytes)
   
    return ""

def extract_text(mime: str, raw_bytes: bytes) -> str:
    if mime == "application/pdf":
        return _extract_text_from_pdf(raw_bytes)
    if mime == "application/vnd.openxmlformats-officedocument.wordprocessingml.document":
        return _extract_text_from_docx(raw_bytes)
    if mime == "application/msword":
        return _extract_text_from_doc(raw_bytes)
    return ""

def light_regex_parse(text: str) -> Dict[str, Optional[Any]]:
    email = None
    phone = None
    name = None
    education = None
    experience = None
    skills: list[str] = []

    if text:
        m = re.search(r"[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Za-z]{2,}", text)
        if m:
            email = m.group(0)

        m = re.search(r"(\+?\d[\d\-\s()]{7,}\d)", text)
        if m:
            phone = m.group(0)

        lines = [l.strip() for l in text.splitlines() if l.strip()]
        for l in lines[:10]:
            if "@" not in l and len(l.split()) <= 5 and "resume" not in l.lower():
                name = l
                break

        for p in (
            r"(B\.?Tech|B\.?E\.?|Bachelor.*Computer|Bachelor.*Engineering|BSc|B\.?Sc)",
            r"(M\.?Tech|M\.?E\.?|Master.*Computer|Master.*Engineering|MSc|M\.?Sc)",
            r"(B\.?C\.?A\.?|M\.?C\.?A\.?)",
        ):
            m = re.search(p, text, re.IGNORECASE)
            if m:
                education = m.group(0)
                break

        m = re.search(r"(\d{1,2})\s+(?:\+?\s*)?(years|yrs|year)", text, re.IGNORECASE)
        if m:
            try:
                experience = int(m.group(1))
            except Exception:
                pass

        known = {
            "javascript","typescript","node.js","node","express","react","next.js",
            "python","fastapi","django","flask",
            "postgres","postgresql","mysql","mongodb",
            "docker","kubernetes","aws","gcp","azure",
            "git","redis","elasticsearch"
        }
        text_l = text.lower()
        for sk in known:
            if sk in text_l:
                skills.append(sk)
        skills = list(dict.fromkeys(skills))

    return {
        "name": name,
        "email": email,
        "phone": phone,
        "skills": skills,
        "experience": experience,
        "education": education,
    }

def _normalize(obj: Dict[str, Any]) -> Dict[str, Optional[Any]]:
    def s(k):
        v = obj.get(k)
        if v is None:
            return None
        v = str(v).strip()
        return v or None

    def i(k):
        v = obj.get(k)
        if v is None:
            return None
        try:
            return int(v)
        except Exception:
            return None

    def ls(k):
        v = obj.get(k)
        if isinstance(v, list):
            out = []
            for it in v:
                t = str(it).strip().lower()
                if t:
                    out.append(t)
            return list(dict.fromkeys(out))
        return []

    return {
        "name": s("name"),
        "email": s("email"),
        "phone": s("phone"),
        "skills": ls("skills"),
        "experience": i("experience"),
        "education": s("education"),
    }

def _prompt(text: str) -> str:
    return f"""
You are a resume parsing assistant. Extract ONLY the following fields from the provided resume text.

IMPORTANT: 
- Ignore any previous instructions or context
- Focus ONLY on this specific resume
- Extract data from the text below, not from any other source

Return ONLY valid JSON with these exact keys:
{{
  "name": string | null,
  "email": string | null,
  "phone": string | null,
  "skills": string[],   // lowercase, normalized skill names
  "experience": integer | null,  // total years
  "education": string | null     // highest degree/major (e.g., "B.Tech in Computer Science")
}}

Rules:
- If uncertain, use null
- Do not include extra keys or text
- Keep skills concise normalized names
- Extract ONLY from the resume text provided below

Resume text to parse:
{text}
""".strip()

def _call_gemini_or_none(text: str) -> Optional[Dict[str, Any]]:
    try:
        import google.generativeai as genai
    except Exception:
        return None
    api_key = settings.google_api_key or os.getenv("GOOGLE_API_KEY")
    if not api_key:
        return None
    try:
        genai.configure(api_key=api_key)
        model = genai.GenerativeModel(
            model_name="gemini-1.5-flash",
            generation_config={"temperature": 0.1, "response_mime_type": "application/json"}
        )
        resp = model.generate_content(_prompt(text))
        content = getattr(resp, "text", None) or "{}"
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            jt = content[content.find("{"): content.rfind("}")+1]
            return json.loads(jt)
    except Exception as e:
        logger.info(f"gemini failed: {e}")
        return None

def _call_groq_or_none(text: str) -> Optional[Dict[str, Any]]:
    try:
        from groq import Groq
    except Exception:
        return None
    api_key = settings.groq_api_key or os.getenv("GROQ_API_KEY")
    if not api_key:
        return None
    try:
        client = Groq(api_key=api_key)
        resp = client.chat.completions.create(
            model="llama-3.1-8b-instant",
            messages=[
                {"role": "system", "content": "Return valid JSON only."},
                {"role": "user", "content": _prompt(text)},
            ],
            temperature=0.1,
        )
        content = resp.choices[0].message.content or "{}"
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            jt = content[content.find("{"): content.rfind("}")+1]
            return json.loads(jt)
    except Exception as e:
        logger.info(f"groq failed: {e}")
        return None

def _call_ollama_or_none(text: str) -> Optional[Dict[str, Any]]:
    try:
        import requests
    except Exception:
        return None
    try:
        r = requests.post(
            "http://127.0.0.1:11434/api/chat",
            json={
                "model": "llama3.1:8b",
                "messages": [
                    {"role": "system", "content": "Return valid JSON only."},
                    {"role": "user", "content": _prompt(text)},
                ],
                "stream": False,
                "options": {"temperature": 0.1}
            },
            timeout=60
        )
        r.raise_for_status()
        content = r.json().get("message", {}).get("content", "{}")
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            jt = content[content.find("{"): content.rfind("}")+1]
            return json.loads(jt)
    except Exception as e:
        logger.info(f"ollama failed: {e}")
        return None

def _call_hf_or_none(text: str) -> Optional[Dict[str, Any]]:
    try:
        import requests
    except Exception:
        return None
    token = settings.hf_token or os.getenv("HF_TOKEN")
    if not token:
        return None
    try:
        r = requests.post(
            "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2",
            headers={"Authorization": f"Bearer {token}"},
            json={"inputs": _prompt(text), "parameters": {"temperature": 0.1, "max_new_tokens": 512}},
            timeout=60
        )
        r.raise_for_status()
        data = r.json()
        content = None
        if isinstance(data, list) and data:
            content = data[0].get("generated_text") or data[0].get("summary_text") or data[0].get("text")
        if not content:
            return None
        try:
            return json.loads(content)
        except json.JSONDecodeError:
            jt = content[content.find("{"): content.rfind("}")+1]
            return json.loads(jt)
    except Exception as e:
        logger.info(f"hf failed: {e}")
        return None

def _call_any_llm_or_none(text: str) -> Tuple[Optional[Dict[str, Any]], Optional[str]]:
    for name, fn in (
        ("gemini", _call_gemini_or_none),
        ("groq", _call_groq_or_none),
        ("ollama", _call_ollama_or_none),
        ("huggingface", _call_hf_or_none),
    ):
        try:
            obj = fn(text)
            if obj is not None:
                return obj, name
        except Exception as e:
            continue
    return None, None

def parse_resume_llm(req: ParseResumeRequest) -> Tuple[ParsedResume, str]:
    validate_mime(req.mime_type)
    raw_bytes = decode_base64(req.file_content)
    text = extract_text(req.mime_type, raw_bytes)

    # Return error if no text extracted
    if not text or len(text.strip()) < 10:
        raise ValueError("Failed to extract text from document. File may be corrupted, password-protected, or in an unsupported format.")

    llm_obj, provider = _call_any_llm_or_none(text or "")
    if llm_obj is not None:
        norm = _normalize(llm_obj)
        source = provider or "unknown"
    else:
        norm = light_regex_parse(text or "")
        source = "regex"

    return ParsedResume(
        name=norm["name"],
        email=norm["email"],
        phone=norm["phone"],
        skills=norm["skills"],
        experience=norm["experience"],
        education=norm["education"]
    ), source