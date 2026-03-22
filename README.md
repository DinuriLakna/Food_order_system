# Food Order Microservices Platform
SE4010 Cloud Computing Assignment — SLIIT 2026

## Architecture
4 microservices deployed on Microsoft Azure Container Apps:

| Service | Port | URL |
|---|---|---|
| User Service | 4000 | https://user-service.greenhill-3759a5f1.eastus.azurecontainerapps.io |
| Menu Service | 4001 | https://menu-service.greenhill-3759a5f1.eastus.azurecontainerapps.io |
| Order Service | 4002 | https://order-service.greenhill-3759a5f1.eastus.azurecontainerapps.io |
| Payment Service | 4003 | https://payment-service.greenhill-3759a5f1.eastus.azurecontainerapps.io |

## Tech Stack
- Runtime: Node.js 20 + Express
- Database: MongoDB Atlas
- Container Registry: Azure Container Registry (ACR)
- Hosting: Azure Container Apps
- CI/CD: GitHub Actions
- Security: JWT Auth + bcrypt + SonarCloud + Snyk + Azure Key Vault

## Run Locally
```bash
docker-compose up --build
```

## API Documentation
Each service has Swagger UI at `/api-docs`

## CI/CD Pipeline
Every push to main triggers:
1. Unit tests (Jest)
2. SonarCloud SAST scan
3. Snyk dependency scan
4. Docker image build
5. Health check on live Azure services

## Security
- JWT authentication on all protected endpoints
- bcrypt password hashing (cost factor 12)
- Secrets stored in Azure Key Vault
- SonarCloud static analysis
- Snyk CVE vulnerability scanning
- Non-root Docker containers
```

Open Swagger UI:
```
https://user-service.greenhill-3759a5f1.eastus.azurecontainerapps.io/api-docs