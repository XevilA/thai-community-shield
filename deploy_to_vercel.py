#!/usr/bin/env python3
"""
Direct Vercel Deployment Script for Community Shield
Uploads assets and triggers production build via Vercel REST API v13.
Zero npm/npx dependencies, fast and reliable.
"""

import os
import json
import hashlib
import time
import urllib.request
import urllib.error

ROOT_DIR = "/Volumes/MAC/Thai_Community"
AUTH_FILE = "/Users/dotmini/Library/Application Support/com.vercel.cli/auth.json"
PROJECT_ID = "prj_k2g1tqklNG5mW1N1esu0teigl7jB"
TEAM_ID = "team_YdaDMTIQNvmDUJUjLuQCFkMK"
PROJECT_NAME = "thai-community-shield"

# 1. Load Auth Token
with open(AUTH_FILE, "r") as f:
    auth_data = json.load(f)
TOKEN = auth_data["token"]

HEADERS_BASE = {
    "Authorization": f"Bearer {TOKEN}"
}

print(f"🚀 Deploying '{PROJECT_NAME}' to Vercel Production via REST API...")
print(f"   Project ID: {PROJECT_ID}")
print(f"   Team ID:    {TEAM_ID}")

# 2. Collect files to upload
IGNORE_PREFIXES = (
    ".git", ".tmp", ".bun_cache", "tmp", "bin", "node_modules",
    ".vercel", "._", "android", ".gradle"
)
IGNORE_EXTENSIONS = (
    ".blend", ".blend1", ".sqlite", ".sqlite-wal", ".sqlite-shm",
    ".log", ".pid"
)
EXCLUDE_FILES = {
    "public/tmp_fixed_index.html",
    "public/model_original_8.7mb.glb",
    "public/model_standard.glb",
    "public/model_meshopt.glb", # public/model.glb is the active one
    "thai_community_visible_low_areas_backup_8.7mb.glb"
}

files_to_deploy = []
for dirpath, dirnames, filenames in os.walk(ROOT_DIR):
    rel_dir = os.path.relpath(dirpath, ROOT_DIR)
    
    # Prune ignored directories in-place so os.walk does not traverse them
    dirnames[:] = [d for d in dirnames if not d.startswith(IGNORE_PREFIXES)]
    
    parts = rel_dir.split(os.sep)
    if any(p.startswith(IGNORE_PREFIXES) for p in parts if p != "."):
        continue
    
    for fname in filenames:
        if fname.startswith("._") or fname.startswith(".DS_Store"):
            continue
        if any(fname.endswith(ext) for ext in IGNORE_EXTENSIONS):
            continue
        
        full_path = os.path.join(dirpath, fname)
        rel_path = os.path.relpath(full_path, ROOT_DIR).replace("\\", "/")
        
        if rel_path in EXCLUDE_FILES:
            continue
        
        # Only include relevant production files
        # public/**, api/**, vendor/**, textures/**, vercel.json, package.json, tsconfig.json
        if not (rel_path.startswith("public/") or 
                rel_path.startswith("api/") or 
                rel_path.startswith("vendor/") or 
                rel_path.startswith("textures/") or
                rel_path in ("vercel.json", "package.json", "tsconfig.json", "README.md", "WALKTHROUGH.md")):
            continue
            
        with open(full_path, "rb") as f:
            content = f.read()
            digest = hashlib.sha1(content).hexdigest()
            size = len(content)
            
        files_to_deploy.append({
            "file": rel_path,
            "sha": digest,
            "size": size,
            "full_path": full_path
        })

print(f"📦 Total files to verify/deploy: {len(files_to_deploy)}")

# 3. Upload files to Vercel File Store
uploaded_count = 0
for idx, item in enumerate(files_to_deploy):
    digest = item["sha"]
    size = item["size"]
    rel_path = item["file"]
    
    with open(item["full_path"], "rb") as f:
        file_bytes = f.read()
        
    upload_url = f"https://api.vercel.com/v2/files?teamId={TEAM_ID}"
    req = urllib.request.Request(
        upload_url,
        data=file_bytes,
        headers={
            **HEADERS_BASE,
            "Content-Type": "application/octet-stream",
            "x-vercel-digest": digest,
            "Content-Length": str(size)
        },
        method="POST"
    )
    
    success = False
    for attempt in range(4):
        try:
            with urllib.request.urlopen(req, timeout=30) as resp:
                # 200 means uploaded or already exists
                uploaded_count += 1
                if (idx + 1) % 5 == 0 or idx == len(files_to_deploy) - 1:
                    print(f"   [{idx + 1}/{len(files_to_deploy)}] Verified: {rel_path} ({size:,} bytes)")
                success = True
                break
        except Exception as e:
            if attempt < 3:
                time.sleep(1 + attempt)
            else:
                print(f"❌ Error uploading {rel_path}: {e}")
                raise

print(f"✅ All {uploaded_count} files successfully verified in Vercel Storage.")

# 4. Trigger Deployment
deploy_url = f"https://api.vercel.com/v13/deployments?teamId={TEAM_ID}"
payload = {
    "name": PROJECT_NAME,
    "project": PROJECT_ID,
    "target": "production",
    "files": [
        {
            "file": item["file"],
            "sha": item["sha"],
            "size": item["size"]
        }
        for item in files_to_deploy
    ],
    "projectSettings": {
        "framework": None,
        "buildCommand": "echo 'Static and Serverless assets ready'",
        "installCommand": "echo 'Dependencies ready'",
        "outputDirectory": "public",
        "nodeVersion": "24.x"
    }
}

payload_bytes = json.dumps(payload).encode("utf-8")
req = urllib.request.Request(
    deploy_url,
    data=payload_bytes,
    headers={
        **HEADERS_BASE,
        "Content-Type": "application/json"
    },
    method="POST"
)

print("\n🚀 Initiating Vercel deployment...")
dep_data = None
for dep_attempt in range(5):
    try:
        req = urllib.request.Request(
            deploy_url,
            data=payload_bytes,
            headers={
                **HEADERS_BASE,
                "Content-Type": "application/json"
            },
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=30) as resp:
            dep_data = json.loads(resp.read().decode())
            dep_id = dep_data.get("id")
            dep_url = dep_data.get("url")
            print(f"✅ Deployment Created!")
            print(f"   Deployment ID:  {dep_id}")
            print(f"   Preview URL:    https://{dep_url}")
            break
    except urllib.error.HTTPError as e:
        err_body = e.read().decode()
        print(f"❌ Deployment creation failed: {e.code} - {err_body}")
        exit(1)
    except Exception as e:
        print(f"⚠️ Deployment attempt {dep_attempt + 1} transient error: {e}. Retrying in 2s...")
        time.sleep(2)

if not dep_data:
    print("❌ Failed to initiate deployment after 5 attempts.")
    exit(1)

# 5. Poll Deployment Status
print("\n⏳ Polling deployment build status...")
status_url = f"https://api.vercel.com/v13/deployments/{dep_id}?teamId={TEAM_ID}"
for attempt in range(60):
    time.sleep(3)
    req = urllib.request.Request(status_url, headers=HEADERS_BASE)
    with urllib.request.urlopen(req) as resp:
        cur_data = json.loads(resp.read().decode())
        state = cur_data.get("readyState") or cur_data.get("status")
        print(f"   Status [{attempt + 1}]: {state}")
        if state == "READY":
            print("\n🎉 PRODUCTION DEPLOYMENT SUCCEEDED!")
            print(f"   Direct Deployment URL: https://{cur_data.get('url')}")
            
            # Explicitly assign production alias
            print("   Assigning alias 'thai-community-shield.vercel.app'...")
            alias_url = f"https://api.vercel.com/v2/deployments/{dep_id}/aliases?teamId={TEAM_ID}"
            alias_payload = json.dumps({"alias": "thai-community-shield.vercel.app"}).encode("utf-8")
            alias_req = urllib.request.Request(
                alias_url,
                data=alias_payload,
                headers={**HEADERS_BASE, "Content-Type": "application/json"},
                method="POST"
            )
            try:
                with urllib.request.urlopen(alias_req, timeout=15) as aresp:
                    print("   ✅ Alias assigned successfully!")
            except Exception as aerr:
                print(f"   ⚠️ Alias assignment note: {aerr}")

            print(f"   Production URL: https://thai-community-shield.vercel.app")
            break
        elif state in ("ERROR", "CANCELED"):
            print(f"❌ Deployment ended with state: {state}")
            print(json.dumps(cur_data, indent=2))
            exit(1)
