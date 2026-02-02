---
description: How to deploy changes to Render after code updates
---

# Deploy to Render

After making code changes that need to be deployed to production, follow these steps:

## Steps

1. Stage and commit the changes:
```bash
git add -A && git commit -m "Your commit message"
```

2. Push to the remote repository:
```bash
git push
```

3. **IMPORTANT**: Trigger the Render deployment using the deploy hook:
```bash
curl -X POST "https://api.render.com/deploy/srv-d5v1tmggjchc7390j920?key=ySCnfTKuKpg"
```

> ⚠️ **Note**: Git push alone does NOT trigger a Render deployment. You MUST use the deploy hook to trigger the deployment.

## Verification

After triggering the deployment, you should receive a JSON response with a deploy ID, e.g.:
```json
{"deploy":{"id":"dep-xxxxx"}}
```

The deployment typically takes 1-2 minutes to complete.

## Production URL

The app is deployed at: https://hayvin-phone-number-list-creator.onrender.com/
