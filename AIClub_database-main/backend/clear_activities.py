"""删除所有活动档案示例数据（连同其资料、标签关联，并清理孤立标签）。

运行方式（在 backend 目录下）：
    python -X utf8 clear_activities.py
"""
import sys

sys.stdout.reconfigure(encoding="utf-8")

from app.database import SessionLocal
from app.models import Activity, Material, Tag, material_tags


def main() -> None:
    db = SessionLocal()
    try:
        activities = db.query(Activity).all()
        materials = db.query(Material).all()
        print(f"待删除活动档案数: {len(activities)}")
        print(f"待删除资料数: {len(materials)}")

        # 删除资料-标签关联
        db.query(material_tags).delete()
        # 删除资料
        db.query(Material).delete()
        # 删除活动
        db.query(Activity).delete()
        db.commit()

        # 清理孤立标签（不再被任何资料引用）
        orphan_count = 0
        for t in db.query(Tag).all():
            if len(t.materials) == 0:
                print(f"删除孤立标签: {t.name}")
                db.delete(t)
                orphan_count += 1
        db.commit()

        print("\n===== 清理完成 =====")
        print(f"剩余活动档案数: {db.query(Activity).count()}")
        print(f"剩余资料数: {db.query(Material).count()}")
        print(f"剩余标签数: {db.query(Tag).count()}")
    finally:
        db.close()


if __name__ == "__main__":
    main()
