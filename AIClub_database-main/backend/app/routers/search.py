"""资料检索相关 API。"""
import json
from typing import List, Optional

from fastapi import APIRouter, Depends, Query
from sqlalchemy import or_
from sqlalchemy.orm import Session

from ..constants import ACTIVITY_TYPES
from ..database import get_db
from ..models import Activity, Material, Tag
from ..schemas import MaterialDetail, SearchResult

router = APIRouter(prefix="/api/search", tags=["search"])


def _parse_activity_types(activity: Activity) -> List[str]:
    """从 Activity.type 字段解析出活动类型标签列表。"""
    if not activity:
        return []
    if not activity.type:
        return []
    try:
        parsed = json.loads(activity.type)
        if isinstance(parsed, list):
            return [str(t) for t in parsed]
    except (ValueError, TypeError):
        pass
    return [activity.type]


def _material_to_detail(m: Material) -> MaterialDetail:
    activity = m.activity
    return MaterialDetail(
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
        activity_name=activity.name if activity else "",
        activity_date=activity.date if activity else "",
        activity_types=_parse_activity_types(activity),
    )


@router.get("", response_model=SearchResult)
def search_materials(
    q: Optional[str] = Query("", description="关键词"),
    tag: Optional[str] = Query("", description="标签"),
    file_type: Optional[str] = Query("", description="文件类型"),
    activity_type: Optional[str] = Query("", description="活动类型"),
    db: Session = Depends(get_db),
):
    """根据关键词、标签、文件类型、活动类型组合检索资料。"""
    query = db.query(Material).filter(Material.deleted_at.is_(None))

    # 关键词匹配：文件名、优化名、文件类型名、所属活动名、活动类型名、标签名
    if q:
        like = f"%{q}%"
        query = query.join(Activity).outerjoin(Material.tags).filter(
            or_(
                Material.original_name.like(like),
                Material.optimized_name.like(like),
                Material.file_type.like(like),
                Activity.name.like(like),
                Activity.type.like(like),
                Tag.name.like(like),
            )
        )

    # 标签匹配
    if tag:
        query = query.join(Material.tags).filter(Tag.name == tag)

    # 文件类型匹配
    if file_type:
        query = query.filter(Material.file_type == file_type)

    # 活动类型匹配：所属活动的 type 字段（JSON 数组）中包含该类型
    if activity_type:
        if activity_type == "其他":
            # "其他"：匹配所有不属于预定义类型（除"其他"外）的活动，
            # 即活动类型为自定义/未归类类型时归入"其他"范畴
            predefined = [t for t in ACTIVITY_TYPES if t != "其他"]
            not_conditions = []
            for t in predefined:
                # 兼容两种存储形式：纯字符串（如"招新迎新"）与 JSON 数组（如["招新迎新"]）
                not_conditions.append(Activity.type.like(f'%"{t}"%'))
                not_conditions.append(Activity.type == t)
            query = query.join(Activity).filter(
                ~or_(*not_conditions)
            )
        else:
            query = query.join(Activity).filter(
                or_(
                    Activity.type.like(f'%"{activity_type}"%'),
                    Activity.type == activity_type,
                )
            )

    materials = query.order_by(Material.created_at.desc()).all()
    return SearchResult(
        materials=[_material_to_detail(m) for m in materials],
        total=len(materials),
    )


@router.get("/tags", response_model=List[str])
def list_all_tags(db: Session = Depends(get_db)):
    """获取所有标签（用于筛选）。

    只返回当前活动档案中实际存在的标签（即仍挂在未删除资料上的标签），
    若某标签的资料全部被删除，则该标签不再出现在选项中。
    """
    tags = (
        db.query(Tag.name)
        .join(Material.tags)
        .filter(Material.deleted_at.is_(None))
        .distinct()
        .all()
    )
    return [t[0] for t in tags]


@router.get("/types", response_model=List[str])
def list_all_types(db: Session = Depends(get_db)):
    """获取所有文件类型（用于筛选）。"""
    types = (
        db.query(Material.file_type)
        .filter(Material.deleted_at.is_(None), Material.file_type != "")
        .distinct()
        .all()
    )
    return [t[0] for t in types]


@router.get("/activity-types", response_model=List[str])
def list_activity_types():
    """获取预定义的活动类型（用于筛选）。"""
    return ACTIVITY_TYPES
