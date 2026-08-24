"""活动档案相关 API。"""
import json
from datetime import datetime
from typing import List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Activity, Material
from ..schemas import ActivityCreate, ActivityOut, ActivityUpdate, MaterialOut
from ..services.tag_service import get_or_create_tags


class MaterialUpdate(BaseModel):
    """资料更新请求（可更新标签等字段）。"""

    tags: Optional[List[str]] = None
    file_type: Optional[str] = None
    key_info: Optional[str] = None

router = APIRouter(prefix="/api/activities", tags=["activities"])


def _parse_activity_types(activity: Activity) -> List[str]:
    """从 Activity.type 字段解析出活动类型标签列表。"""
    if not activity.type:
        return []
    try:
        parsed = json.loads(activity.type)
        if isinstance(parsed, list):
            return [str(t) for t in parsed]
    except (ValueError, TypeError):
        pass
    # 兼容旧数据：type 为普通字符串时当作单个类型
    return [activity.type]


def _activity_to_out(a: Activity) -> ActivityOut:
    return ActivityOut(
        id=a.id,
        name=a.name,
        date=a.date,
        type=a.type,
        description=a.description,
        ai_summary=a.ai_summary,
        created_at=a.created_at,
        activity_types=_parse_activity_types(a),
    )


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


@router.get("", response_model=List[ActivityOut])
def list_activities(db: Session = Depends(get_db)):
    """获取所有未删除的活动列表。"""
    activities = (
        db.query(Activity)
        .filter(Activity.deleted_at.is_(None))
        .order_by(Activity.date.desc())
        .all()
    )
    return [_activity_to_out(a) for a in activities]


@router.post("", response_model=ActivityOut)
def create_activity(payload: ActivityCreate, db: Session = Depends(get_db)):
    """创建新的活动档案。"""
    activity_types = payload.activity_types or []
    if payload.type and not activity_types:
        activity_types = [payload.type]
    activity = Activity(
        name=payload.name,
        date=payload.date,
        type=json.dumps(activity_types, ensure_ascii=False),
        description=payload.description,
    )
    db.add(activity)
    db.commit()
    db.refresh(activity)
    return _activity_to_out(activity)


@router.get("/{activity_id}", response_model=ActivityOut)
def get_activity(activity_id: int, db: Session = Depends(get_db)):
    """获取活动详情。"""
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity or activity.deleted_at is not None:
        raise HTTPException(status_code=404, detail="活动不存在")
    return _activity_to_out(activity)


@router.put("/{activity_id}", response_model=ActivityOut)
def update_activity(
    activity_id: int, payload: ActivityUpdate, db: Session = Depends(get_db)
):
    """更新活动信息。"""
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity or activity.deleted_at is not None:
        raise HTTPException(status_code=404, detail="活动不存在")
    data = payload.model_dump(exclude_unset=True)
    if "activity_types" in data:
        activity_types = data.pop("activity_types") or []
        data["type"] = json.dumps(activity_types, ensure_ascii=False)
    for field, value in data.items():
        setattr(activity, field, value)
    db.commit()
    db.refresh(activity)
    return _activity_to_out(activity)


@router.delete("/{activity_id}")
def delete_activity(activity_id: int, db: Session = Depends(get_db)):
    """软删除活动（进入回收站）。"""
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity or activity.deleted_at is not None:
        raise HTTPException(status_code=404, detail="活动不存在")
    activity.deleted_at = datetime.utcnow()
    # 同时软删除其下资料
    for m in activity.materials:
        if m.deleted_at is None:
            m.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "活动已删除"}


@router.get("/{activity_id}/materials", response_model=List[MaterialOut])
def list_activity_materials(activity_id: int, db: Session = Depends(get_db)):
    """获取某活动的所有资料。"""
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity or activity.deleted_at is not None:
        raise HTTPException(status_code=404, detail="活动不存在")
    materials = (
        db.query(Material)
        .filter(Material.activity_id == activity_id, Material.deleted_at.is_(None))
        .all()
    )
    return [_material_to_out(m) for m in materials]


@router.put("/{activity_id}/materials/{material_id}", response_model=MaterialOut)
def update_material(
    activity_id: int,
    material_id: int,
    payload: MaterialUpdate,
    db: Session = Depends(get_db),
):
    """更新资料信息（标签、类型、关键信息）。"""
    material = (
        db.query(Material)
        .filter(
            Material.id == material_id,
            Material.activity_id == activity_id,
            Material.deleted_at.is_(None),
        )
        .first()
    )
    if not material:
        raise HTTPException(status_code=404, detail="资料不存在")
    if payload.tags is not None:
        material.tags = get_or_create_tags(db, payload.tags)
    if payload.file_type is not None:
        material.file_type = payload.file_type
    if payload.key_info is not None:
        material.key_info = payload.key_info
    db.commit()
    db.refresh(material)
    return _material_to_out(material)
