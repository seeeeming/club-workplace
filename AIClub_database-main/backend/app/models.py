from datetime import datetime

from sqlalchemy import (
    Column,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Table,
    Text,
)
from sqlalchemy.orm import declarative_base, relationship

Base = declarative_base()

# 资料-标签 多对多关联表
material_tags = Table(
    "material_tags",
    Base.metadata,
    Column("material_id", Integer, ForeignKey("materials.id"), primary_key=True),
    Column("tag_id", Integer, ForeignKey("tags.id"), primary_key=True),
)


class Activity(Base):
    """活动档案"""

    __tablename__ = "activities"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), nullable=False)
    date = Column(String(50), nullable=False, default="")  # 活动时间（字符串，便于灵活）
    type = Column(String(100), nullable=False, default="")  # 活动类型
    description = Column(Text, nullable=False, default="")  # 活动描述
    ai_summary = Column(Text, nullable=False, default="")  # AI 生成的活动摘要
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)  # 软删除（回收站）

    materials = relationship(
        "Material",
        back_populates="activity",
        cascade="all, delete-orphan",
    )


class Material(Base):
    """活动资料文件"""

    __tablename__ = "materials"

    id = Column(Integer, primary_key=True, index=True)
    activity_id = Column(Integer, ForeignKey("activities.id"), nullable=False)
    original_name = Column(String(255), nullable=False)  # 原始文件名
    optimized_name = Column(String(255), nullable=False)  # AI 优化后文件名
    file_type = Column(String(100), nullable=False, default="")  # 文件类型（策划案/预算表/...）
    file_path = Column(String(500), nullable=False)  # 存储相对路径
    mime_type = Column(String(100), nullable=False, default="")
    file_size = Column(Integer, nullable=False, default=0)  # 字节
    key_info = Column(Text, nullable=False, default="")  # AI 提取的关键信息（JSON 字符串）
    created_at = Column(DateTime, default=datetime.utcnow)
    deleted_at = Column(DateTime, nullable=True)  # 软删除（回收站）

    activity = relationship("Activity", back_populates="materials")
    tags = relationship(
        "Tag",
        secondary=material_tags,
        back_populates="materials",
    )


class Tag(Base):
    """标签"""

    __tablename__ = "tags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False, unique=True)

    materials = relationship(
        "Material",
        secondary=material_tags,
        back_populates="tags",
    )


class User(Base):
    """成员用户（MVP 阶段不做注册登录，仅用于权限模拟）"""

    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(100), nullable=False, unique=True)
    role = Column(String(50), nullable=False, default="member")  # admin / member
    created_at = Column(DateTime, default=datetime.utcnow)
