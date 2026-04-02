import os
import subprocess
import requests

token = "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"
username = "ciccicicii"
repo_name = "snake-game"

os.chdir(r"E:\snake")

# Create repository via API
print("Creating GitHub repository...")
url = "https://api.github.com/user/repos"
headers = {"Authorization": f"token {token}"}
data = {"name": repo_name, "private": False}

response = requests.post(url, headers=headers, json=data)
if response.status_code == 201:
    print(f"Repository created: https://github.com/{username}/{repo_name}")
elif response.status_code == 422:
    print("Repository already exists, using existing one")
else:
    print(f"Error: {response.text}")

# Add remote and push
remote_url = f"https://{username}:{token}@github.com/{username}/{repo_name}.git"

subprocess.run(["git", "remote", "add", "origin", remote_url], shell=True, capture_output=True)
subprocess.run(["git", "branch", "-M", "main"], shell=True)
result = subprocess.run(["git", "push", "-u", "origin", "main"], shell=True, capture_output=True, text=True)

if result.returncode == 0:
    print("\n✅ 代码已推送到 GitHub!")
    print(f"   仓库地址: https://github.com/{username}/{repo_name}")
else:
    print(f"Error: {result.stderr}")
