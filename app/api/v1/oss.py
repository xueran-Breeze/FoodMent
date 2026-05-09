import alibabacloud_oss_v2 as oss
from fastapi import APIRouter, HTTPException
from datetime import timedelta
import os
from dotenv import load_dotenv  # 新增：加载环境变量

# 必须最先加载 .env 文件！！
load_dotenv()

router = APIRouter()

# ===================== 从环境变量读取凭证 =====================
access_key_id = os.getenv("OSS_ACCESS_KEY_ID")
access_key_secret = os.getenv("OSS_ACCESS_KEY_SECRET")

if not access_key_id or not access_key_secret:
    raise HTTPException(status_code=500, detail="请配置 ALIBABA_CLOUD_ACCESS_KEY_ID 和 ALIBABA_CLOUD_ACCESS_KEY_SECRET")

# 手动创建凭证（最稳定，不会出现 CredentialsEmptyError）
credentials_provider = oss.credentials.StaticCredentialsProvider(
    access_key_id=access_key_id,
    access_key_secret=access_key_secret
)

# ===================== OSS配置 =====================
cfg = oss.config.load_default()
cfg.credentials_provider = credentials_provider
cfg.region = "cn-hangzhou"

# 创建客户端
client = oss.Client(cfg)
OSS_ENDPOINT = os.getenv("OSS_ENDPOINT", "oss-cn-beijing.aliyuncs.com")
OSS_BUCKET = os.getenv("OSS_BUCKET")

if not OSS_BUCKET:
    raise HTTPException(status_code=500, detail="请配置 OSS_BUCKET 环境变量")

# ===================== 接口不变 =====================
@router.get("/oss/presign")
def chat_endpoint(filename: str):
    content_type_map = {
        "jpg": "image/jpeg",
        "jpeg": "image/jpeg",
        "png": "image/png",
        "gif": "image/gif",
        "webp": "image/webp",
    }
    ext = filename.split(".")[-1].lower() if "." in filename else "jpg"
    content_type = content_type_map.get(ext, "application/octet-stream")

    pre_result = client.presign(
        oss.PutObjectRequest(
            bucket=OSS_BUCKET,
            key=filename,
            content_type=content_type,
        ),
        expires=timedelta(seconds=3600)
    )

    return {
        "uploadUrl": pre_result.url.strip('"'),
        "contentType": content_type,
        "accessUrl": f"https://{OSS_BUCKET}.{OSS_ENDPOINT}/{filename}"
    }