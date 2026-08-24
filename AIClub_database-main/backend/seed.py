"""种子数据脚本：填充示例活动、资料、标签、用户，便于演示。

运行方式：python -m seed
"""
import json
import os
from pathlib import Path

from app.ai.analyzer import analyze_with_rules, generate_activity_summary
from app.database import SessionLocal, engine
from app.models import Activity, Base, Material, Tag, User, material_tags
from app.services.tag_service import get_or_create_tags

STORAGE_ROOT = Path("./storage")


def _create_sample_file(activity_id: int, filename: str, content: str) -> str:
    """在存储目录创建一个示例文本文件，返回相对路径。"""
    activity_dir = STORAGE_ROOT / "activities" / str(activity_id)
    activity_dir.mkdir(parents=True, exist_ok=True)
    path = activity_dir / filename
    path.write_text(content, encoding="utf-8")
    return f"activities/{activity_id}/{filename}"


def seed():
    # 确保数据库表已创建
    Base.metadata.create_all(bind=engine)

    db = SessionLocal()

    # 清空旧数据（便于重复运行）
    db.query(material_tags).delete()
    db.query(Material).delete()
    db.query(Activity).delete()
    db.query(Tag).delete()
    db.query(User).delete()

    # 示例用户
    db.add_all(
        [
            User(username="社长", role="admin"),
            User(username="活动部长", role="admin"),
            User(username="成员小明", role="member"),
            User(username="成员小红", role="member"),
        ]
    )

    # 示例活动与资料
    sample_activities = [
        {
            "name": "2025迎新交流会",
            "date": "2025-09-15",
            "type": "招新迎新",
            "materials": [
                ("迎新交流会策划案.pdf", "策划案", "2025迎新交流会活动策划与流程安排。"),
                ("迎新预算表.xlsx", "预算表", "活动经费预算明细。"),
                ("招新宣传海报.png", "宣传海报", "迎新宣传海报设计稿。"),
                ("现场活动照片.jpg", "活动照片", "活动现场合影。"),
            ],
        },
        {
            "name": "2025校园歌手比赛",
            "date": "2025-11-20",
            "type": "竞赛比拼",
            "materials": [
                ("歌手比赛策划案.docx", "策划案", "比赛规则与赛程安排。"),
                ("比赛物资清单.xlsx", "物资清单", "音响、灯光、道具等物资清单。"),
                ("比赛宣传视频.mp4", "视频", "比赛宣传视频。"),
            ],
        },
        {
            "name": "2025志愿服务活动",
            "date": "2025-12-05",
            "type": "公益实践",
            "materials": [
                ("志愿服务策划案.pdf", "策划案", "志愿服务方案。"),
                ("志愿活动反馈问卷.csv", "反馈问卷", "参与者反馈问卷数据。"),
                ("活动照片集.zip", "活动照片", "活动照片合集。"),
            ],
        },
        {
            "name": "2024人工智能讲座",
            "date": "2024-10-18",
            "type": "讲座/交流",
            "materials": [
                ("人工智能讲座策划案.pdf", "策划案", "讲座策划与嘉宾邀请方案。"),
                ("讲座PPT.pptx", "PPT", "讲座演示文稿。"),
            ],
        },
        {
            "name": "2024职业规划讲座",
            "date": "2024-05-22",
            "type": "讲座/交流",
            "materials": [
                ("职业规划讲座策划案.pdf", "策划案", "职业规划讲座策划方案。"),
            ],
        },
        {
            "name": "2024学术分享会",
            "date": "2024-03-10",
            "type": "讲座/交流",
            "materials": [
                ("学术分享会策划案.pdf", "策划案", "学术分享会策划方案。"),
            ],
        },
        # ---- 新增 6 个不同示例活动（供参考筛选测试）----
        {
            "name": "2025社团文化节",
            "date": "2025-10-25",
            "type": "节日活动",
            "materials": [
                ("文化节策划案.docx", "策划案", "社团文化节整体策划与摊位安排。"),
                ("文化节宣传海报.png", "宣传海报", "文化节宣传海报。"),
                ("文化节活动照片.jpg", "活动照片", "文化节现场照片。"),
                ("文化节物资清单.xlsx", "物资清单", "摊位物资与道具清单。"),
            ],
        },
        {
            "name": "2025新生技能培训营",
            "date": "2025-10-08",
            "type": "讲座/交流",
            "materials": [
                ("技能培训营策划案.pdf", "策划案", "新生技能培训营课程安排。"),
                ("培训报名表.xlsx", "报名表", "培训营报名名单。"),
                ("培训课件.pptx", "PPT", "培训课程演示文稿。"),
            ],
        },
        {
            "name": "2025社团秋季团建",
            "date": "2025-11-02",
            "type": "内部团建",
            "materials": [
                ("秋季团建策划案.docx", "策划案", "团建活动方案与游戏安排。"),
                ("团建经费预算表.xlsx", "预算表", "团建经费预算明细。"),
                ("团建活动照片.zip", "活动照片", "团建现场照片合集。"),
            ],
        },
        {
            "name": "2025公益募捐活动",
            "date": "2025-12-20",
            "type": "公益实践",
            "materials": [
                ("公益募捐策划案.pdf", "策划案", "公益募捐活动方案。"),
                ("募捐物资清单.xlsx", "物资清单", "募捐物资登记清单。"),
                ("募捐活动照片.jpg", "活动照片", "募捐活动现场照片。"),
            ],
        },
        {
            "name": "2025校园篮球联赛",
            "date": "2025-04-18",
            "type": "竞赛比拼",
            "materials": [
                ("篮球联赛策划案.docx", "策划案", "篮球联赛赛程与规则。"),
                ("联赛报名表.xlsx", "报名表", "参赛队伍报名名单。"),
                ("联赛宣传海报.png", "宣传海报", "篮球联赛宣传海报。"),
                ("联赛比赛照片.jpg", "活动照片", "比赛现场照片。"),
            ],
        },
        {
            "name": "2025社团年度总结大会",
            "date": "2025-12-28",
            "type": "周常活动",
            "materials": [
                ("年度总结大会策划案.pdf", "策划案", "年度总结大会流程安排。"),
                ("年度总结会议纪要.docx", "会议纪要", "总结大会会议记录。"),
                ("年度总结复盘.docx", "复盘总结", "全年活动复盘总结。"),
            ],
        },
    ]

    for act in sample_activities:
        activity = Activity(
            name=act["name"],
            date=act["date"],
            type=act["type"],
        )
        db.add(activity)
        db.flush()

        material_dicts = []
        for fname, ftype, content in act["materials"]:
            # 用规则模拟 AI 分析
            result = analyze_with_rules(fname, activity.name)
            rel_path = _create_sample_file(activity.id, fname, content)
            material = Material(
                activity_id=activity.id,
                original_name=fname,
                optimized_name=result.optimized_name,
                file_type=result.file_type,
                file_path=rel_path,
                mime_type="application/octet-stream",
                file_size=os.path.getsize(STORAGE_ROOT / rel_path),
                key_info=result.key_info,
            )
            material.tags = get_or_create_tags(db, result.tags)
            db.add(material)
            material_dicts.append(
                {"file_type": material.file_type, "optimized_name": material.optimized_name}
            )

        activity.ai_summary = generate_activity_summary(activity.name, material_dicts)

    db.commit()
    db.close()
    print("种子数据填充完成！")


if __name__ == "__main__":
    seed()
