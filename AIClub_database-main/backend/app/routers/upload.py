"""上传资料 + AI 整理相关 API。"""
import json
import os
from typing import Optional

from fastapi import APIRouter, Depends, File, Form, HTTPException, UploadFile
from sqlalchemy.orm import Session

from ..ai.analyzer import analyze_file
from ..database import get_db
from ..models import Activity, Material
from ..schemas import AIAnalysisResult, MaterialOut, UploadConfirm
from ..services import file_storage
from ..services.tag_service import get_or_create_tags

router = APIRouter(prefix="/api/upload", tags=["upload"])

# 允许的图片扩展名（用于在线预览）
IMAGE_EXTENSIONS = {"jpg", "jpeg", "png", "gif", "webp", "bmp", "svg"}


def _material_to_out(m: Material) -> MaterialOut:
    return MaterialOut(
        id=m.id,
        activity_id=m.activity_id,
        original_name=m.original_name,
        optimized_name=m.optimized_name,
        file_type=m.file_type,
        file_path=m.file_path,
        mime_type=m.mime_type,
        file_size=m.file_size,
        key_info=m.key_info,
        created_at=m.created_at,
        tags=m.tags,
    )


def _read_text_preview(file: UploadFile, max_chars: int = 2000) -> str:
    """尝试读取文本类文件内容预览（用于 AI 分析）。

    支持 txt/md/csv/json 等文本文件，自动尝试多种编码（utf-8、gbk 等）。
    """
    ext = (
        (file.filename or "").rsplit(".", 1)[-1].lower()
        if "." in (file.filename or "")
        else ""
    )
    if ext not in ("txt", "md", "csv", "json"):
        return ""
    try:
        raw = file.file.read(max_chars)
        file.file.seek(0)
        for encoding in ("utf-8", "gbk", "gb2312", "latin-1"):
            try:
                return raw.decode(encoding)
            except (UnicodeDecodeError, LookupError):
                continue
        return raw.decode("utf-8", errors="ignore")
    except Exception:
        return ""


@router.post("/analyze", response_model=AIAnalysisResult)
async def analyze_upload(
    file: UploadFile = File(...),
    activity_name: str = Form(""),
    db: Session = Depends(get_db),
):
    """上传文件并返回 AI 整理建议（文件名/类型/标签），供用户确认。

    图片文件会读取其内容交给 AI 进行视觉识别，自动生成标签。
    """
    if not file.filename:
        raise HTTPException(status_code=400, detail="未选择文件")

    content_preview = _read_text_preview(file)
    image_bytes = None
    if is_image(file.filename):
        image_bytes = file.file.read()
        file.file.seek(0)
    result = analyze_file(file.filename, activity_name, content_preview, image_bytes)
    return result


@router.post("", response_model=MaterialOut)
async def confirm_upload(
    file: UploadFile = File(...),
    activity_id: int = Form(...),
    optimized_name: str = Form(...),
    file_type: str = Form(""),
    tags: str = Form("[]"),  # JSON 数组字符串
    key_info: str = Form(""),
    db: Session = Depends(get_db),
):
    """用户确认 AI 整理结果后，归档资料到对应活动。"""
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity or activity.deleted_at is not None:
        raise HTTPException(status_code=404, detail="活动不存在")

    # 保存文件
    relative_path, _ = file_storage.save_upload(file, activity_id)

    # 解析标签
    try:
        tag_names = json.loads(tags) if tags else []
    except json.JSONDecodeError:
        tag_names = []

    # 创建资料记录
    material = Material(
        activity_id=activity_id,
        original_name=file.filename or "unnamed",
        optimized_name=optimized_name or file.filename or "unnamed",
        file_type=file_type,
        file_path=relative_path,
        mime_type=file.content_type or "",
        file_size=os.path.getsize(file_storage.get_absolute_path(relative_path)),
        key_info=key_info,
    )
    material.tags = get_or_create_tags(db, tag_names)
    db.add(material)
    db.commit()
    db.refresh(material)
    return _material_to_out(material)


def is_image(filename: str) -> bool:
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in IMAGE_EXTENSIONS
