import os
import subprocess

os.chdir(r"E:\snake")

# Set git config
subprocess.run(["git", "config", "--global", "user.email", "cici@github.com"], shell=True)
subprocess.run(["git", "config", "--global", "user.name", "ciccicicii"], shell=True)

# Init git
subprocess.run(["git", "init"], shell=True)
subprocess.run(["git", "add", "."], shell=True)
subprocess.run(["git", "commit", "-m", "feat: add snake game"], shell=True)

print("Git initialized!")
