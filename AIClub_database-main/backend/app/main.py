"""社团活动资料库 - FastAPI 后端入口。"""
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from . import models
from .database import engine
from .routers import activities, files, search, settings, upload

# 创建数据库表
models.Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="社团活动资料库 API",
    description="AI+大学社团管理平台 - 活动资料库板块后端",
    version="0.1.0",
)

# 允许前端跨域访问（本地开发）
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# 注册路由
app.include_router(activities.router)
app.include_router(upload.router)
app.include_router(search.router)
app.include_router(settings.router)
app.include_router(files.router)


@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "activity-archive"}
