"""Setting（设置）相关 API：回收站 + 成员权限。"""
from datetime import datetime
from typing import List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Activity, Material, User
from ..schemas import ActivityOut, MaterialOut, UserOut, UserUpdate
from ..services import file_storage

router = APIRouter(prefix="/api/settings", tags=["settings"])


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


# ---------- 回收站 ----------
@router.get("/recycle-bin/materials", response_model=List[MaterialOut])
def list_deleted_materials(db: Session = Depends(get_db)):
    """获取最近删除的资料。"""
    materials = (
        db.query(Material)
        .filter(Material.deleted_at.is_not(None))
        .order_by(Material.deleted_at.desc())
        .all()
    )
    return [_material_to_out(m) for m in materials]


@router.get("/recycle-bin/activities", response_model=List[ActivityOut])
def list_deleted_activities(db: Session = Depends(get_db)):
    """获取最近删除的活动。"""
    return (
        db.query(Activity)
        .filter(Activity.deleted_at.is_not(None))
        .order_by(Activity.deleted_at.desc())
        .all()
    )


@router.post("/recycle-bin/materials/{material_id}/restore", response_model=MaterialOut)
def restore_material(material_id: int, db: Session = Depends(get_db)):
    """恢复误删的资料。"""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="资料不存在")
    material.deleted_at = None
    db.commit()
    db.refresh(material)
    return _material_to_out(material)


@router.delete("/recycle-bin/materials/{material_id}")
def permanent_delete_material(material_id: int, db: Session = Depends(get_db)):
    """永久删除资料（物理删除文件 + 数据库记录）。"""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material:
        raise HTTPException(status_code=404, detail="资料不存在")
    file_storage.delete_file(material.file_path)
    db.delete(material)
    db.commit()
    return {"message": "资料已永久删除"}


@router.post("/recycle-bin/activities/{activity_id}/restore", response_model=ActivityOut)
def restore_activity(activity_id: int, db: Session = Depends(get_db)):
    """恢复误删的活动及其资料。"""
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="活动不存在")
    activity.deleted_at = None
    for m in activity.materials:
        m.deleted_at = None
    db.commit()
    db.refresh(activity)
    return activity


@router.delete("/recycle-bin/activities/{activity_id}")
def permanent_delete_activity(activity_id: int, db: Session = Depends(get_db)):
    """永久删除活动及其所有资料。"""
    activity = db.query(Activity).filter(Activity.id == activity_id).first()
    if not activity:
        raise HTTPException(status_code=404, detail="活动不存在")
    for m in activity.materials:
        file_storage.delete_file(m.file_path)
    db.delete(activity)
    db.commit()
    return {"message": "活动已永久删除"}


# ---------- 成员权限 ----------
@router.get("/members", response_model=List[UserOut])
def list_members(db: Session = Depends(get_db)):
    """获取成员列表。"""
    return db.query(User).all()


@router.put("/members/{user_id}", response_model=UserOut)
def update_member_role(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)):
    """更新成员角色（admin/member）。"""
    user = db.query(User).filter(User.id == user_id).first()
    if not user:
        raise HTTPException(status_code=404, detail="成员不存在")
    if payload.role is not None:
        user.role = payload.role
    db.commit()
    db.refresh(user)
    return user
