"""清理不符合新标签规则的现有标签。

新规则：仅保留业务属性标签（最多 2 个），不再使用品类标签。
本脚本会：
1. 从所有资料中移除品类标签（CATEGORY_TAGS）与禁用泛化词标签（FORBIDDEN_TAGS）
2. 清理不再被任何资料引用的孤立标签

运行方式（在 backend 目录下）：
    python -X utf8 cleanup_tags.py
"""
import sys

sys.stdout.reconfigure(encoding="utf-8")

from app.ai.analyzer import CATEGORY_TAGS, FORBIDDEN_TAGS
from app.database import SessionLocal
from app.models import Material, Tag

# 需要删除的不符合新规则的标签
NON_CONFORMING = set(CATEGORY_TAGS) | set(FORBIDDEN_TAGS)


def main() -> None:
    db = SessionLocal()
    try:
        # 1. 从所有资料中移除不符合规则的标签
        removed_count = 0
        materials = db.query(Material).all()
        for m in materials:
            before = [t.name for t in m.tags]
            kept = [t for t in m.tags if t.name not in NON_CONFORMING]
            removed = [t for t in m.tags if t.name in NON_CONFORMING]
            if removed:
                m.tags = kept
                removed_count += len(removed)
                print(
                    f"材料#{m.id} [{m.original_name}] 移除标签 {[t.name for t in removed]}，"
                    f"保留 {[t.name for t in kept]}"
                )
        db.commit()

        # 2. 清理孤立标签（不再被任何资料引用）
        orphan_count = 0
        all_tags = db.query(Tag).all()
        for t in all_tags:
            if len(t.materials) == 0:
                print(f"删除孤立标签: {t.name}")
                db.delete(t)
                orphan_count += 1
        db.commit()

        print("\n===== 清理完成 =====")
        print(f"移除的标签关联数: {removed_count}")
        print(f"删除的孤立标签数: {orphan_count}")

        # 3. 打印清理后的结果
        print("\n===== 清理后的资料标签 =====")
        for m in db.query(Material).all():
            print(f"材料#{m.id} [{m.original_name}] -> {[t.name for t in m.tags]}")

        print("\n===== 清理后的全部标签 =====")
        for t in db.query(Tag).all():
            print(f"{t.name} (count={len(t.materials)})")
    finally:
        db.close()


if __name__ == "__main__":
    main()
