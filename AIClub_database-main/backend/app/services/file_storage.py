"""本地文件存储服务。"""
import shutil
import uuid
from pathlib import Path

from fastapi import UploadFile

from ..config import settings


def _ensure_dir(path: Path) -> None:
    path.mkdir(parents=True, exist_ok=True)


def save_upload(file: UploadFile, activity_id: int) -> tuple[str, str]:
    """保存上传文件到本地存储，返回 (相对路径, 存储文件名)。

    目录结构：storage/activities/{activity_id}/{uuid}_{原始文件名}
    """
    storage_root = settings.storage_path
    activity_dir = storage_root / "activities" / str(activity_id)
    _ensure_dir(activity_dir)

    unique_id = uuid.uuid4().hex[:8]
    safe_name = file.filename or "unnamed"
    stored_name = f"{unique_id}_{safe_name}"
    dest = activity_dir / stored_name

    with dest.open("wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    relative_path = f"activities/{activity_id}/{stored_name}"
    return relative_path, stored_name


def get_absolute_path(relative_path: str) -> Path:
    """根据相对路径获取绝对路径。"""
    return settings.storage_path / relative_path


def delete_file(relative_path: str) -> None:
    """删除文件（物理删除）。"""
    path = get_absolute_path(relative_path)
    try:
        if path.exists():
            path.unlink()
    except OSError:
        pass
