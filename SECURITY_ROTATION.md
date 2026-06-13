# Security Rotation & Git History Purge

If secrets were committed to the repository, follow these steps immediately.

1) Rotate exposed secrets in all systems (DB, JWT, Redis, encryption keys).

2) Remove secrets from git history (example using `git filter-repo`):

```bash
# Install git-filter-repo (recommended)
pip install git-filter-repo

# Make a fresh clone of the repository
git clone --mirror git@github.com:your-org/SSDMS.git
cd SSDMS.git

# Example: remove a file from all history
git filter-repo --path ssdms-backend/.env --invert-paths

# Push back to remote (force)
git push --force
```

Alternative using BFG (simpler):
```bash
# Create a bare mirror
git clone --mirror git@github.com:your-org/SSDMS.git
java -jar bfg.jar --delete-files ".env" SSDMS.git
cd SSDMS.git
git reflog expire --expire=now --all && git gc --prune=now --aggressive
git push --force
```

3) Invalidate old credentials and add new ones to your secret manager (GitHub Secrets, Vault, AWS Secrets Manager).

4) Update CI to read secrets from the secret manager and do NOT store secrets in repository files.

5) Notify stakeholders if production credentials were exposed.

If you want, I can prepare the exact `git filter-repo` commands for your repository and run them (this will rewrite history and requires your approval and remote push permissions).