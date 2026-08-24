"""AI 分析服务。

MVP 阶段默认使用规则/关键词模拟 AI 能力（AI_ENABLED=false）。
当配置了 DeepSeek API Key 且 AI_ENABLED=true 时，接入真实大模型。

统一规则（硬性约束）：
- 标签：1-2 个，全部为业务属性标签（不包含品类标签，避免与文件类型重复冗余），禁用泛化词（策划/文档/资料/文件）。
- 文件名：年份 + 活动主题 + 资料品类，保留原生后缀。
- 关联性校验：比对所选活动与文件主题/合作方/业务场景，匹配度过低时输出固定提醒。
"""
import json
import re
from typing import Dict, List

from ..config import settings
from ..schemas import AIAnalysisResult

# 常见文件类型关键词映射（品类标签规范取值）
FILE_TYPE_KEYWORDS: Dict[str, List[str]] = {
    "策划案": ["策划", "方案", "plan", "proposal"],
    "预算表": ["预算", "经费", "财务", "budget", "cost", "核算"],
    "宣传海报": ["海报", "宣传", "poster", "宣传图"],
    "活动照片": ["照片", "photo", "图片", "合影", "现场"],
    "会议纪要": ["会议纪要", "纪要", "会议记录", "minutes", "meeting"],
    "复盘总结": ["复盘", "总结", "反思", "reflection", "review"],
    "报名表": ["报名", "报名表", "登记表", "signup", "registration"],
    "物资清单": ["物资", "清单", "物料", "list", "inventory"],
    "规章制度": ["制度", "规章", "章程", "规范", "rule", "regulation"],
    "视频": ["视频", "video", "录像", "record"],
    "反馈问卷": ["问卷", "反馈", "survey", "feedback"],
    "新闻稿": ["新闻", "稿", "报道", "news", "推文"],
    "PPT": ["ppt", "pptx", "演示", "slides"],
    "文档": ["doc", "docx", "文档", "word", "说明", "通知"],
}

# 品类标签规范取值（标签第一类，必须精准对应文件品类，禁止简写）
CATEGORY_TAGS: List[str] = [
    "策划案",
    "预算表",
    "宣传海报",
    "活动照片",
    "会议纪要",
    "复盘总结",
    "报名表",
    "物资清单",
    "规章制度",
]

# 禁用清单：检索价值极低的泛化词，禁止单独或优先使用
FORBIDDEN_TAGS: List[str] = ["策划", "文档", "资料", "文件"]

# 业务属性标签关键词（从活动名/主题/合作方/场景中提取）
TAG_KEYWORDS: Dict[str, List[str]] = {
    "招新": ["招新", "纳新", "招募", "新生"],
    "迎新": ["迎新", "新生", "入学"],
    "宣传": ["宣传", "推广", "推文", "海报"],
    "讲座": ["讲座", "分享会", "沙龙", "论坛"],
    "比赛": ["比赛", "竞赛", "歌手", "辩论", "竞技"],
    "志愿": ["志愿", "公益", "服务", "支教", "社区"],
    "团建": ["团建", "聚餐", "出游", "联谊", "破冰"],
    "培训": ["培训", "教学", "课程", "训练"],
    "合作": ["合作", "联合", "协办", "学生会", "社联"],
    "美食": ["美食", "食研", "烹饪", "烘焙", "餐饮"],
    "音乐": ["音乐", "歌手", "乐队", "演唱", "live"],
    "体育": ["体育", "运动", "篮球", "足球", "跑步", "健身"],
    "学术": ["学术", "科研", "论文", "研究", "课题"],
    "文化": ["文化", "传统", "节日", "民俗", "汉服"],
    "科技": ["科技", "编程", "代码", "AI", "人工智能", "机器人"],
    "公益": ["公益", "募捐", "义卖", "环保", "支教"],
    "户外": ["户外", "露营", "徒步", "登山", "郊游"],
}


def _detect_file_type(filename: str, content_preview: str = "") -> str:
    """根据文件名与内容预览关键词识别文件类型（品类标签规范取值）。"""
    text = f"{filename} {content_preview}".lower()
    for ftype, keywords in FILE_TYPE_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text:
                return ftype
    # 根据扩展名兜底
    lower = filename.lower()
    ext = lower.rsplit(".", 1)[-1] if "." in lower else ""
    if ext in ("jpg", "jpeg", "png", "gif", "webp", "bmp"):
        return "活动照片"
    if ext in ("mp4", "mov", "avi", "mkv", "webm"):
        return "视频"
    if ext in ("pdf",):
        return "文档"
    return "其他"


def _category_tag_for(file_type: str) -> str:
    """将识别出的文件类型映射为品类标签（规范取值）。

    视频/反馈问卷/新闻稿/PPT/文档 等不在规范取值内的类型，回退到最接近的品类。
    """
    if file_type in CATEGORY_TAGS:
        return file_type
    mapping = {
        "视频": "活动照片",
        "反馈问卷": "报名表",
        "新闻稿": "宣传海报",
        "PPT": "策划案",
        "文档": "会议纪要",
    }
    return mapping.get(file_type, "策划案")


def _extract_business_tags(
    activity_name: str, filename: str, content_preview: str = ""
) -> List[str]:
    """从活动名称、文件名、文档正文中提取业务属性标签。

    信息来源优先级：所属活动信息 > 文件名 > 文档正文。
    """
    text = f"{activity_name} {filename} {content_preview}"
    tags: List[str] = []
    for tag, keywords in TAG_KEYWORDS.items():
        for kw in keywords:
            if kw.lower() in text.lower():
                tags.append(tag)
                break
    return tags


def _detect_tags(
    filename: str,
    file_type: str,
    activity_name: str = "",
    content_preview: str = "",
    image_tags: List[str] = None,
) -> List[str]:
    """生成 1-2 个业务属性标签（不再包含品类标签，避免与文件类型重复冗余）。

    - 业务属性标签：从活动名/文件名/正文提取专属关键词。
    - 过滤禁用泛化词，保证每个标签都能单独检索命中。
    """
    business = _extract_business_tags(activity_name, filename, content_preview)

    # 图片内容识别标签（业务属性方向）
    if image_tags:
        for t in image_tags:
            if t not in business and t not in FORBIDDEN_TAGS:
                business.append(t)

    # 组装：仅业务属性标签（最多 2 个）
    result: List[str] = []
    for t in business:
        if t in FORBIDDEN_TAGS:
            continue
        if t not in result:
            result.append(t)
        if len(result) >= 2:
            break

    # 兜底：若业务属性标签为空，补充一个贴合文件品类的业务方向标签
    if len(result) < 1:
        fallback = {
            "策划案": "活动",
            "预算表": "经费",
            "宣传海报": "宣传",
            "活动照片": "现场",
            "会议纪要": "会议",
            "复盘总结": "总结",
            "报名表": "报名",
            "物资清单": "物资",
            "规章制度": "制度",
        }.get(file_type, "活动")
        if fallback not in result:
            result.append(fallback)
    return result[:2]


def _extract_year(text: str) -> str:
    """从文本中提取年份（如 2025）。"""
    m = re.search(r"(20\d{2})", text)
    return m.group(1) if m else ""


def _extract_partner(activity_name: str) -> str:
    """提取合作主体（如 "食研社 x 学生会" 中的 "食研社"）。"""
    m = re.search(r"^([^x×\-—]+)[x×\-—]", activity_name)
    return m.group(1).strip() if m else ""


def _extract_theme(activity_name: str, filename: str) -> str:
    """提取活动主题（去除年份与冗余修饰词，保留合作主体与主题）。

    例如 "2025食研社x学生会活动" → "食研社x学生会"；
    "2025迎新交流会" → "迎新交流会"。
    """
    theme = activity_name or ""
    # 去除年份
    theme = re.sub(r"20\d{2}", "", theme)
    # 去除常见冗余修饰词
    theme = theme.replace("活动", "").strip()
    theme = re.sub(r"[\s\-—]+", "", theme).strip()
    if theme:
        return theme
    # 活动名为空时，从文件名提取主题
    fname = re.sub(r"20\d{2}", "", filename)
    fname = re.sub(r"\.\w+$", "", fname)
    fname = re.sub(r"(策划案|预算表|宣传海报|活动照片|会议纪要|复盘总结|报名表|物资清单|规章制度|方案|海报|照片|预算|总结|纪要|清单|报名表|登记表)$", "", fname)
    return fname.strip()


def _optimize_name(filename: str, activity_name: str, file_type: str) -> str:
    """生成规范文件名：年份 + 活动主题（含合作主体）+ 资料品类（保留原生后缀）。

    字段空缺时不虚构内容，预留编辑空间。
    """
    ext = filename.rsplit(".", 1)[-1] if "." in filename else ""
    year = _extract_year(f"{activity_name} {filename}")
    theme = _extract_theme(activity_name, filename)
    category = _category_tag_for(file_type)

    parts: List[str] = []
    if year:
        parts.append(year)
    if theme:
        parts.append(theme)
    parts.append(category)

    base = "-".join(parts)
    if not base:
        base = filename.rsplit(".", 1)[0] if "." in filename else filename
    if ext:
        return f"{base}.{ext}"
    return base


def _extract_key_info(filename: str) -> str:
    """从文件名提取关键信息（规则模拟）。"""
    info: Dict[str, str] = {}
    # 尝试提取年份
    year_match = re.search(r"(20\d{2})", filename)
    if year_match:
        info["年份"] = year_match.group(1)
    # 尝试提取活动类型关键词
    for ftype, keywords in FILE_TYPE_KEYWORDS.items():
        for kw in keywords:
            if kw in filename:
                info["资料类型"] = ftype
                break
    return json.dumps(info, ensure_ascii=False) if info else ""


def _is_image_file(filename: str) -> bool:
    """判断是否为图片文件。"""
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    return ext in ("jpg", "jpeg", "png", "gif", "webp", "bmp", "svg")


def _detect_image_tags(filename: str, activity_name: str) -> List[str]:
    """规则模拟图片内容识别：根据文件名与活动上下文生成业务属性标签。"""
    text = f"{filename} {activity_name}"
    tags: List[str] = []
    for tag, keywords in TAG_KEYWORDS.items():
        for kw in keywords:
            if kw in text:
                tags.append(tag)
                break
    # 图片专属补充标签
    if "海报" in filename or "宣传" in filename:
        tags.append("宣传")
    if "照片" in filename or "合影" in filename or "现场" in filename:
        tags.append("现场")
    # 去重
    seen = set()
    result = []
    for t in tags:
        if t not in seen:
            seen.add(t)
            result.append(t)
    return result


def analyze_with_rules(
    filename: str,
    activity_name: str = "",
    content_preview: str = "",
    image_bytes: bytes = None,
) -> AIAnalysisResult:
    """规则模拟 AI 分析。"""
    file_type = _detect_file_type(filename, content_preview)

    # 图片：结合活动上下文进行"内容识别"打 tag
    image_tags = None
    if _is_image_file(filename):
        image_tags = _detect_image_tags(filename, activity_name or "")
    tags = _detect_tags(
        filename, file_type, activity_name or "", content_preview, image_tags
    )
    optimized_name = _optimize_name(filename, activity_name or "", file_type)
    key_info = _extract_key_info(filename)
    return AIAnalysisResult(
        optimized_name=optimized_name,
        file_type=file_type,
        tags=tags,
        key_info=key_info,
    )


def _analyze_with_deepseek(
    filename: str,
    activity_name: str,
    content_preview: str,
) -> AIAnalysisResult:
    """调用 DeepSeek 大模型进行 AI 分析。"""
    from openai import OpenAI

    client = OpenAI(
        api_key=settings.DEEPSEEK_API_KEY,
        base_url=settings.DEEPSEEK_BASE_URL,
    )

    prompt = f"""你是一个大学社团资料库的智能整理助手。请根据以下信息对上传的资料进行分析。

文件名：{filename}
所属活动：{activity_name or "未知"}
文件内容预览（可能为空）：{content_preview[:2000]}

请返回严格的 JSON（不要包含其他文字），格式如下：
{{
  "optimized_name": "规范文件名（格式：年份+活动主题+资料品类.扩展名）",
  "file_type": "资料品类（规范取值：策划案/预算表/宣传海报/活动照片/会议纪要/复盘总结/报名表/物资清单/规章制度）",
  "tags": ["业务属性标签1", "业务属性标签2"],
  "key_info": ""
}}
标签规则：1-2 个，全部为业务属性标签（从活动名/合作方/主题/场景提取），不要包含品类标签（如策划案/海报/照片等，避免与文件类型重复）；禁止使用策划、文档、资料、文件等泛化词。"""

    response = client.chat.completions.create(
        model=settings.DEEPSEEK_MODEL,
        messages=[
            {"role": "system", "content": "你是大学社团资料库的智能整理助手，只输出 JSON。"},
            {"role": "user", "content": prompt},
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    data = json.loads(content)
    return AIAnalysisResult(
        optimized_name=data.get("optimized_name", filename),
        file_type=data.get("file_type", "其他"),
        tags=data.get("tags", []),
        key_info=data.get("key_info", ""),
    )


def _analyze_image_with_deepseek(
    filename: str, activity_name: str, image_bytes: bytes
) -> AIAnalysisResult:
    """调用支持视觉的大模型识别图片内容并生成标签。"""
    import base64

    from openai import OpenAI

    client = OpenAI(
        api_key=settings.DEEPSEEK_API_KEY,
        base_url=settings.DEEPSEEK_BASE_URL,
    )
    b64 = base64.b64encode(image_bytes).decode("utf-8")
    mime = "image/png"
    ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
    if ext in ("jpg", "jpeg"):
        mime = "image/jpeg"
    elif ext == "gif":
        mime = "image/gif"
    elif ext == "webp":
        mime = "image/webp"

    prompt = f"""你是一个大学社团资料库的智能整理助手。请识别这张图片的内容，并为它生成合适的标签。

文件名：{filename}
所属活动：{activity_name or "未知"}

请返回严格的 JSON（不要包含其他文字），格式如下：
{{
  "optimized_name": "规范文件名（格式：年份+活动主题+资料品类.扩展名）",
  "file_type": "资料品类（如：宣传海报/活动照片）",
  "tags": ["业务属性标签1", "业务属性标签2"],
  "key_info": ""
}}
标签规则：1-2 个，全部为业务属性标签（从活动名/合作方/主题/场景提取），不要包含品类标签（如海报/照片等，避免与文件类型重复）；禁止使用策划、文档、资料、文件等泛化词。"""

    response = client.chat.completions.create(
        model=settings.DEEPSEEK_MODEL,
        messages=[
            {
                "role": "user",
                "content": [
                    {"type": "text", "text": prompt},
                    {
                        "type": "image_url",
                        "image_url": {"url": f"data:{mime};base64,{b64}"},
                    },
                ],
            }
        ],
        temperature=0.3,
        response_format={"type": "json_object"},
    )

    content = response.choices[0].message.content
    data = json.loads(content)
    return AIAnalysisResult(
        optimized_name=data.get("optimized_name", filename),
        file_type=data.get("file_type", "其他"),
        tags=data.get("tags", []),
        key_info=data.get("key_info", ""),
    )


def analyze_file(
    filename: str,
    activity_name: str = "",
    content_preview: str = "",
    image_bytes: bytes = None,
) -> AIAnalysisResult:
    """统一入口：根据配置选择规则模拟或真实大模型。

    图片文件会额外进行内容识别（真实视觉模型或规则模拟）以生成标签。
    """
    if settings.AI_ENABLED and settings.DEEPSEEK_API_KEY:
        try:
            if _is_image_file(filename) and image_bytes:
                return _analyze_image_with_deepseek(filename, activity_name, image_bytes)
            return _analyze_with_deepseek(filename, activity_name, content_preview)
        except Exception:
            # 大模型调用失败时回退到规则模拟
            return analyze_with_rules(filename, activity_name, content_preview, image_bytes)
    return analyze_with_rules(filename, activity_name, content_preview, image_bytes)


def generate_activity_summary(activity_name: str, materials: List[Dict]) -> str:
    """生成活动摘要（MVP 用规则模拟）。"""
    if not materials:
        return f"「{activity_name}」暂无归档资料，尚未生成摘要。"
    types = [m.get("file_type", "其他") for m in materials]
    type_summary = "、".join(sorted(set(types)))
    return (
        f"「{activity_name}」共归档 {len(materials)} 份资料，"
        f"涵盖：{type_summary}。"
        "（MVP 阶段为规则生成摘要，接入 DeepSeek 后可生成更详细的活动总结。）"
    )
