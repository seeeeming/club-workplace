"""文件下载、预览与删除相关 API。"""
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from ..database import get_db
from ..models import Material
from ..services import file_storage

router = APIRouter(prefix="/api/files", tags=["files"])


@router.get("/{material_id}/download")
def download_file(material_id: int, db: Session = Depends(get_db)):
    """下载文件。"""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material or material.deleted_at is not None:
        raise HTTPException(status_code=404, detail="资料不存在")
    path = file_storage.get_absolute_path(material.file_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="文件不存在")
    return FileResponse(
        path,
        filename=material.optimized_name,
        media_type=material.mime_type or "application/octet-stream",
    )


@router.get("/{material_id}/preview")
def preview_file(material_id: int, db: Session = Depends(get_db)):
    """预览文件（图片直接展示，其他类型返回下载）。"""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material or material.deleted_at is not None:
        raise HTTPException(status_code=404, detail="资料不存在")
    path = file_storage.get_absolute_path(material.file_path)
    if not path.exists():
        raise HTTPException(status_code=404, detail="文件不存在")
    # 图片以内联方式展示，其他类型作为附件下载
    media_type = material.mime_type or "application/octet-stream"
    disposition = "inline" if media_type.startswith("image/") else "attachment"
    return FileResponse(
        path,
        filename=material.optimized_name,
        media_type=media_type,
        content_disposition_type=disposition,
    )


@router.delete("/{material_id}")
def delete_material(material_id: int, db: Session = Depends(get_db)):
    """软删除单个资料（移入回收站，可恢复）。"""
    material = db.query(Material).filter(Material.id == material_id).first()
    if not material or material.deleted_at is not None:
        raise HTTPException(status_code=404, detail="资料不存在")
    material.deleted_at = datetime.utcnow()
    db.commit()
    return {"message": "资料已移入回收站"}
