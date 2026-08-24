from datetime import datetime
from typing import List, Optional

from pydantic import BaseModel


# ---------- 活动 ----------
class ActivityBase(BaseModel):
    name: str
    date: str = ""
    type: str = ""  # 兼容旧字段（存储 JSON 数组字符串）
    description: str = ""


class ActivityCreate(ActivityBase):
    activity_types: List[str] = []  # 活动类型标签（可多选）


class ActivityUpdate(BaseModel):
    name: Optional[str] = None
    date: Optional[str] = None
    type: Optional[str] = None
    activity_types: Optional[List[str]] = None
    description: Optional[str] = None


class ActivityOut(ActivityBase):
    id: int
    ai_summary: str
    created_at: datetime
    activity_types: List[str] = []  # 解析后的活动类型标签列表

    class Config:
        from_attributes = True


# ---------- 标签 ----------
class TagOut(BaseModel):
    id: int
    name: str

    class Config:
        from_attributes = True


# ---------- 资料 ----------
class MaterialOut(BaseModel):
    id: int
    activity_id: int
    original_name: str
    optimized_name: str
    file_type: str
    file_path: str
    mime_type: str
    file_size: int
    key_info: str
    created_at: datetime
    tags: List[TagOut] = []

    class Config:
        from_attributes = True


class MaterialDetail(MaterialOut):
    activity_name: str = ""
    activity_date: str = ""
    activity_types: List[str] = []  # 所属活动的类型标签


# ---------- AI 分析结果 ----------
class AIAnalysisResult(BaseModel):
    optimized_name: str
    file_type: str
    tags: List[str] = []
    key_info: str = ""


# ---------- 上传确认 ----------
class UploadConfirm(BaseModel):
    activity_id: int
    optimized_name: str
    file_type: str
    tags: List[str] = []
    key_info: str = ""


# ---------- 检索 ----------
class SearchResult(BaseModel):
    materials: List[MaterialDetail]
    total: int


# ---------- 用户 ----------
class UserOut(BaseModel):
    id: int
    username: str
    role: str

    class Config:
        from_attributes = True


class UserUpdate(BaseModel):
    role: Optional[str] = None
