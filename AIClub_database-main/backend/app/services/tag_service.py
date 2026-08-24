"""标签服务：根据标签名获取或创建 Tag 对象。"""
from typing import List

from sqlalchemy.orm import Session

from ..models import Tag


def get_or_create_tags(db: Session, tag_names: List[str]) -> List[Tag]:
    """根据标签名列表获取或创建标签对象。"""
    tags: List[Tag] = []
    for name in tag_names:
        name = name.strip()
        if not name:
            continue
        tag = db.query(Tag).filter(Tag.name == name).first()
        if not tag:
            tag = Tag(name=name)
            db.add(tag)
            db.flush()
        tags.append(tag)
    return tags
