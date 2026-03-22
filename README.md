# Food_order_system

A secure, microservice-based food ordering application deployed on AWS ECS Fargate.

---


##  Service Endpoints Summary

| Service        | Port | Key Endpoints |
|----------------|------|---------------|
| User Service   | 4000 | POST /register, POST /login, GET /users/:id |
| Menu Service   | 4001 | GET /menu (public), POST/PUT/DELETE /menu (auth) |
| Order Service  | 4002 | POST /orders (orchestrates all services) |
| Payment Service| 4003 | POST /payments, GET /payments |

All services expose:
- `GET /health` — health check
- `GET /api-docs` — Swagger UI documentation

---

##  PHASE 1 — Account Setups

### Step 1.1 — Create repository
1. Go to **https://github.com**

### Step 1.2 — Create MongoDB Atlas Account

### Step 1.3 — Create AWS Account (Free Tier)
1. Go to **https://aws.amazon.com/free**
2. Click **Create a Free Account**
3. Enter email, password, account name
4. Choose **Personal** account type
5. Enter billing info (needed for verification — Free Tier won't charge you)
6. Choose **Basic Support** (free)
7. Sign in to the **AWS Console** at https://console.aws.amazon.com
8. **Create an IAM user for CI/CD** (more secure than using root):
   - Search for **IAM** in the top search bar
   - Left menu → **Users** → **Create user**
   - Username: `github-actions-user`
   - Check **Provide user access to the AWS Management Console** → No
   - Click **Next** → **Attach policies directly**
   - Add these policies:
     - `AmazonEC2ContainerRegistryFullAccess`
     - `AmazonECS_FullAccess`
     - `SecretsManagerReadWrite`
     - `CloudWatchLogsFullAccess`
   - Click **Create user**
   - Click on the user → **Security credentials** tab → **Create access key**
   - Use case: **Command Line Interface (CLI)**
   - Click through → **Download .csv file** (save this — you get the keys ONCE)
   - Note down: `Access key ID` and `Secret access key`

---

### Step 1.4 — Create SonarCloud Account (Free SAST)
1. Go to **https://sonarcloud.io**
2. Click **Log in with GitHub** → Authorize SonarCloud
3. Click **+ Create new organization** → **Import from GitHub**
4. Select your `food-order-microservices` repository
5. Choose **Free plan**
6. **Get your token:**
   - Top right → Your name → **My Account** → **Security**
   - Generate a token named `github-actions`
   - **Copy and save the token immediately** (shown only once)
7. Note down your:
   - **Organization key** (shown in your org settings)
   - **Project key** (shown in project settings)

---

### Step 1.5 — Create Snyk Account (Free CVE Scanning)
1. Go to **https://snyk.io**
2. Click **Sign up** → **Sign up with GitHub**
3. Authorize Snyk
4. **Get your token:**
   - Click your name (top right) → **Account settings**
   - Under **Auth Token** → click **click to show**
   - Copy your token

---

## 🔧 PHASE 2 — Local Setup

### Step 2.1 — Install Required Tools

**On Windows:**
```bash
# 1. Install Node.js 20 from https://nodejs.org (LTS version)
# 2. Install Docker Desktop from https://www.docker.com/products/docker-desktop
# 3. Install Git from https://git-scm.com
# 4. Install AWS CLI
# Download: https://awscli.amazonaws.com/AWSCLIV2.msi
```

**On Mac:**
```bash
# Install Homebrew first (if not installed)
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# Install everything
brew install node@20 git awscli
brew install --cask docker
```

**Verify installations:**
```bash
node --version        # Should show v20.x.x
npm --version         # Should show 10.x.x
docker --version      # Should show Docker version 24+
git --version         # Should show git version 2+
aws --version         # Should show aws-cli/2.x.x
```

---

### Step 2.2 — Configure AWS CLI
```bash
aws configure
# AWS Access Key ID:     (paste your Access key ID from Step 1.3)
# AWS Secret Access Key: (paste your Secret access key from Step 1.3)
# Default region name:   us-east-1
# Default output format: json
```

---

### Step 2.3 — Clone / Set Up the Project

```bash
# Navigate to where you want the project
cd ~/Desktop

# Initialize the project (if starting fresh from downloaded zip)
# OR if cloning from GitHub:
git clone https://github.com/YOUR_USERNAME/food-order-microservices.git
cd food-order-microservices
```

---

### Step 2.4 — Install Dependencies for Each Service

```bash
# Install dependencies for all 4 services
cd services/user_service    && npm install && cd ../..
cd services/menu_service    && npm install && cd ../..
cd services/order_service   && npm install && cd ../..
cd services/payment_service && npm install && cd ../..
```

---

## 🧪 PHASE 3 — Running Tests

### Step 3.1 — Run Unit Tests (Each Service)

```bash
# Test User Service
cd services/user_service
npm test
# Expected: 8 tests passing

# Test Menu Service
cd ../menu_service
npm test
# Expected: 7 tests passing

# Test Order Service
cd ../order_service
npm test
# Expected: 9 tests passing

# Test Payment Service
cd ../payment_service
npm test
# Expected: 8 tests passing
```

### Step 3.2 — Run All Tests at Once

```bash
# From the root project folder
cd services/user_service    && npm test --silent && cd ../..
cd services/menu_service    && npm test --silent && cd ../..
cd services/order_service   && npm test --silent && cd ../..
cd services/payment_service && npm test --silent && cd ../..
echo "✅ All tests passed!"
```

---

## 🐳 PHASE 4 — Run Locally with Docker

### Step 4.1 — Start All Services

```bash
# From the root project folder (where docker-compose.yml is)
docker-compose up --build

# OR run in background:
docker-compose up --build -d
```

Wait about 30 seconds for all databases to start, then verify:

```bash
# Check all containers are running
docker-compose ps

# View logs
docker-compose logs -f user-service
docker-compose logs -f order-service
```

### Step 4.2 — Test the Running Services

Open your browser or use these curl commands:

```bash
# 1. Check health of all services
curl http://localhost:4000/health
curl http://localhost:4001/health
curl http://localhost:4002/health
curl http://localhost:4003/health

# 2. Register a new user
curl -X POST http://localhost:4000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Alice Smith","email":"alice@example.com","password":"Secret123!"}'

# 3. Login to get JWT token
curl -X POST http://localhost:4000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"alice@example.com","password":"Secret123!"}'
# Copy the "token" value from the response — you need it for the next steps

# Set the token as a variable (replace YOUR_TOKEN with actual token)
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

# 4. Create a menu item
curl -X POST http://localhost:4001/menu \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Margherita Pizza","price":12.99,"category":"main","description":"Classic tomato and cheese"}'
# Copy the "_id" value from the response — this is your itemId

# 5. Get all menu items (public — no auth needed)
curl http://localhost:4001/menu

# 6. Place an order (replace USER_ID and ITEM_ID with real values from above)
curl -X POST http://localhost:4002/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"userId":"USER_ID_FROM_STEP_2","itemId":"ITEM_ID_FROM_STEP_4","quantity":2}'

# 7. View Swagger UI in browser
# http://localhost:4000/api-docs  (User Service)
# http://localhost:4001/api-docs  (Menu Service)
# http://localhost:4002/api-docs  (Order Service)
# http://localhost:4003/api-docs  (Payment Service)
```

### Step 4.3 — Stop Services
```bash
docker-compose down

# Remove volumes too (clears all data):
docker-compose down -v
```

---

## ☁️ PHASE 5 — Push to GitHub

### Step 5.1 — Initialize Git and Push

```bash
# From the root project folder
git init
git add .
git commit -m "Initial commit: Food Order microservices with CI/CD"

# Connect to your GitHub repository
git remote add origin https://github.com/YOUR_USERNAME/food-order-microservices.git
git branch -M main
git push -u origin main
```

---

## 🔐 PHASE 6 — Add GitHub Secrets

Go to your GitHub repository → **Settings** → **Secrets and variables** → **Actions** → **New repository secret**

Add each of these secrets:

| Secret Name | Where to get it | Example value |
|-------------|-----------------|---------------|
| `AWS_ACCESS_KEY_ID` | AWS IAM (Step 1.3) | `AKIAIOSFODNN7EXAMPLE` |
| `AWS_SECRET_ACCESS_KEY` | AWS IAM (Step 1.3) | `wJalrXUtnFEMI/K7MDENG...` |
| `AWS_ACCOUNT_ID` | AWS Console → top right (12-digit number) | `123456789012` |
| `SONAR_TOKEN` | SonarCloud account (Step 1.4) | `abc123def456...` |
| `SONAR_PROJECT_KEY` | SonarCloud project settings | `myorg_food-order` |
| `SONAR_ORGANIZATION` | SonarCloud org settings | `myorg` |
| `SNYK_TOKEN` | Snyk account settings (Step 1.5) | `12345678-abcd-...` |
| `USER_SERVICE_URL` | (Add after deployment) | `http://54.x.x.x:4000` |
| `MENU_SERVICE_URL` | (Add after deployment) | `http://54.x.x.x:4001` |
| `ORDER_SERVICE_URL` | (Add after deployment) | `http://54.x.x.x:4002` |
| `PAYMENT_SERVICE_URL` | (Add after deployment) | `http://54.x.x.x:4003` |

---

## ☁️ PHASE 7 — AWS Setup & Cloud Deployment

### Step 7.1 — Create ECR Repositories (Container Registry)

Run these commands in your terminal (AWS CLI must be configured):

```bash
# Create one ECR repo per service
aws ecr create-repository --repository-name food-order-user-service    --region us-east-1 --image-scanning-configuration scanOnPush=true
aws ecr create-repository --repository-name food-order-menu-service    --region us-east-1 --image-scanning-configuration scanOnPush=true
aws ecr create-repository --repository-name food-order-order-service   --region us-east-1 --image-scanning-configuration scanOnPush=true
aws ecr create-repository --repository-name food-order-payment-service --region us-east-1 --image-scanning-configuration scanOnPush=true

echo "✅ ECR repos created"
```

---

### Step 7.2 — Create ECS Cluster

```bash
aws ecs create-cluster \
  --cluster-name food-order-cluster \
  --capacity-providers FARGATE \
  --region us-east-1

echo "✅ ECS cluster created"
```

---

### Step 7.3 — Create IAM Roles

```bash
# Create the trust policy file
cat > /tmp/ecs-trust.json << 'EOF'
{
  "Version": "2012-10-17",
  "Statement": [{"Effect":"Allow","Principal":{"Service":"ecs-tasks.amazonaws.com"},"Action":"sts:AssumeRole"}]
}
EOF

# Create ecsTaskExecutionRole
aws iam create-role --role-name ecsTaskExecutionRole --assume-role-policy-document file:///tmp/ecs-trust.json
aws iam attach-role-policy --role-name ecsTaskExecutionRole --policy-arn arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy

# Add Secrets Manager access to the role
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
cat > /tmp/secrets-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [{"Effect":"Allow","Action":["secretsmanager:GetSecretValue"],"Resource":"arn:aws:secretsmanager:us-east-1:${ACCOUNT_ID}:secret:food-order/*"}]
}
EOF
aws iam put-role-policy --role-name ecsTaskExecutionRole --policy-name SecretsAccess --policy-document file:///tmp/secrets-policy.json

# Create ecsTaskRole (minimal permissions — least privilege)
aws iam create-role --role-name ecsTaskRole --assume-role-policy-document file:///tmp/ecs-trust.json
cat > /tmp/task-policy.json << EOF
{
  "Version": "2012-10-17",
  "Statement": [{"Effect":"Allow","Action":["logs:CreateLogStream","logs:PutLogEvents"],"Resource":"arn:aws:logs:us-east-1:${ACCOUNT_ID}:log-group:/ecs/food-order/*"}]
}
EOF
aws iam put-role-policy --role-name ecsTaskRole --policy-name LogsAccess --policy-document file:///tmp/task-policy.json

echo "✅ IAM roles created"
```

---

### Step 7.4 — Create CloudWatch Log Groups

```bash
aws logs create-log-group --log-group-name /ecs/food-order/user-service    --region us-east-1
aws logs create-log-group --log-group-name /ecs/food-order/menu-service    --region us-east-1
aws logs create-log-group --log-group-name /ecs/food-order/order-service   --region us-east-1
aws logs create-log-group --log-group-name /ecs/food-order/payment-service --region us-east-1

echo "✅ CloudWatch log groups created"
```

---

### Step 7.5 — Store Secrets in AWS Secrets Manager

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Replace <YOUR_JWT_SECRET> with a random string (e.g. run: openssl rand -base64 32)
# Replace each <MONGO_URI_*> with your MongoDB Atlas connection strings from Step 1.2

# Shared JWT secret (used by ALL services — must be the SAME value)
aws secretsmanager create-secret \
  --name "food-order/shared" \
  --secret-string '{"JWT_SECRET":"your_very_long_random_jwt_secret_here"}' \
  --region us-east-1

# Individual MongoDB URIs per service
aws secretsmanager create-secret \
  --name "food-order/user-service" \
  --secret-string '{"MONGO_URI":"mongodb+srv://foodorderuser:PASSWORD@cluster0.xxxxx.mongodb.net/userdb?retryWrites=true&w=majority"}' \
  --region us-east-1

aws secretsmanager create-secret \
  --name "food-order/menu-service" \
  --secret-string '{"MONGO_URI":"mongodb+srv://foodorderuser:PASSWORD@cluster0.xxxxx.mongodb.net/menudb?retryWrites=true&w=majority"}' \
  --region us-east-1

aws secretsmanager create-secret \
  --name "food-order/order-service" \
  --secret-string '{"MONGO_URI":"mongodb+srv://foodorderuser:PASSWORD@cluster0.xxxxx.mongodb.net/orderdb?retryWrites=true&w=majority"}' \
  --region us-east-1

aws secretsmanager create-secret \
  --name "food-order/payment-service" \
  --secret-string '{"MONGO_URI":"mongodb+srv://foodorderuser:PASSWORD@cluster0.xxxxx.mongodb.net/paymentdb?retryWrites=true&w=majority"}' \
  --region us-east-1

echo "✅ Secrets stored in AWS Secrets Manager"
```

---

### Step 7.6 — Update Task Definition Files with Your Account ID

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)

# Replace the placeholder ACCOUNT_ID in all task definition files
sed -i "s/ACCOUNT_ID/${ACCOUNT_ID}/g" infrastructure/ecs/user-service-task-def.json
sed -i "s/ACCOUNT_ID/${ACCOUNT_ID}/g" infrastructure/ecs/menu-service-task-def.json
sed -i "s/ACCOUNT_ID/${ACCOUNT_ID}/g" infrastructure/ecs/order-service-task-def.json
sed -i "s/ACCOUNT_ID/${ACCOUNT_ID}/g" infrastructure/ecs/payment-service-task-def.json

# On Mac use:  sed -i '' "s/ACCOUNT_ID/${ACCOUNT_ID}/g" infrastructure/ecs/*.json

echo "✅ Task definitions updated with Account ID: $ACCOUNT_ID"
```

---

### Step 7.7 — Manually Build & Push Docker Images to ECR (First Time)

```bash
ACCOUNT_ID=$(aws sts get-caller-identity --query Account --output text)
REGION=us-east-1

# Login to ECR
aws ecr get-login-password --region $REGION | docker login --username AWS --password-stdin $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com

# Build and push each service
for SVC in user-service menu-service order-service payment-service; do
  FOLDER=$(echo $SVC | tr '-' '_')
  echo "Building $SVC..."
  docker build -t food-order-$SVC ./services/$FOLDER
  docker tag food-order-$SVC:latest $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/food-order-$SVC:latest
  docker push $ACCOUNT_ID.dkr.ecr.$REGION.amazonaws.com/food-order-$SVC:latest
  echo "✅ $SVC pushed to ECR"
done
```

---

### Step 7.8 — Register ECS Task Definitions

```bash
for SVC in user-service menu-service order-service payment-service; do
  aws ecs register-task-definition \
    --cli-input-json file://infrastructure/ecs/${SVC}-task-def.json \
    --region us-east-1
  echo "✅ Registered task definition: $SVC"
done
```

---

### Step 7.9 — Create Security Group

```bash
# Get your default VPC ID
VPC_ID=$(aws ec2 describe-vpcs --filters Name=isDefault,Values=true --query "Vpcs[0].VpcId" --output text --region us-east-1)
echo "VPC: $VPC_ID"

# Create security group
SG_ID=$(aws ec2 create-security-group \
  --group-name food-order-sg \
  --description "Security group for Food Order services" \
  --vpc-id $VPC_ID \
  --region us-east-1 \
  --query GroupId --output text)
echo "Security Group: $SG_ID"

# Open ports 4000-4003 for inbound traffic
for PORT in 4000 4001 4002 4003; do
  aws ec2 authorize-security-group-ingress \
    --group-id $SG_ID --protocol tcp --port $PORT --cidr 0.0.0.0/0 \
    --region us-east-1
done
echo "✅ Security group configured"
```

---

### Step 7.10 — Create and Deploy ECS Services

```bash
# Get subnets from your default VPC
SUBNETS=$(aws ec2 describe-subnets \
  --filters Name=vpc-id,Values=$VPC_ID \
  --query "Subnets[*].SubnetId" --output text --region us-east-1 | tr '\t' ',')
echo "Subnets: $SUBNETS"

# Deploy each service to ECS Fargate
for SVC in user-service menu-service order-service payment-service; do
  aws ecs create-service \
    --cluster food-order-cluster \
    --service-name $SVC \
    --task-definition $SVC \
    --desired-count 1 \
    --launch-type FARGATE \
    --network-configuration "awsvpcConfiguration={subnets=[$SUBNETS],securityGroups=[$SG_ID],assignPublicIp=ENABLED}" \
    --region us-east-1
  echo "✅ ECS service created: $SVC"
done
```

---

### Step 7.11 — Find Your Public IP Addresses

```bash
# Wait 2 minutes for tasks to start, then run:
for SVC in user-service menu-service order-service payment-service; do
  TASK_ARN=$(aws ecs list-tasks --cluster food-order-cluster --service-name $SVC --query "taskArns[0]" --output text --region us-east-1)
  ENI=$(aws ecs describe-tasks --cluster food-order-cluster --tasks $TASK_ARN --region us-east-1 --query "tasks[0].attachments[0].details[?name=='networkInterfaceId'].value" --output text)
  PUBLIC_IP=$(aws ec2 describe-network-interfaces --network-interface-ids $ENI --query "NetworkInterfaces[0].Association.PublicIp" --output text --region us-east-1)
  echo "$SVC: http://$PUBLIC_IP:$(echo $SVC | grep -o '[0-9]*' || echo '400X')/health"
done
```

> 📝 **Copy the public IPs** and go to GitHub → Settings → Secrets and update the `USER_SERVICE_URL`, `MENU_SERVICE_URL`, `ORDER_SERVICE_URL`, `PAYMENT_SERVICE_URL` secrets.

---

## 🔄 PHASE 8 — Verify CI/CD Pipeline

After completing Phase 5 (push to GitHub), every push to `main` will automatically:
1. Run unit tests
2. Run SonarCloud SAST scan
3. Run Snyk vulnerability scan
4. Build Docker images
5. Push to Amazon ECR
6. Deploy to ECS Fargate
7. Run health check smoke tests

**To trigger it manually:**
```bash
# Make any small change and push
echo "# trigger CI" >> README.md
git add .
git commit -m "Trigger CI/CD pipeline"
git push origin main
```

**Watch it run:**
- Go to your GitHub repository → **Actions** tab
- You'll see the workflow running in real time

---

## 📊 PHASE 9 — SonarCloud Setup (SAST)

1. Go to **https://sonarcloud.io**
2. Click **+** (top right) → **Analyze new project**
3. Select your `food-order-microservices` repo
4. Click **Set Up**
5. Choose **With GitHub Actions** (it's already set up in the workflow!)
6. The pipeline will automatically create 4 project analyses (one per service)
7. View results at: `https://sonarcloud.io/organizations/YOUR_ORG`

---

## 🧪 Testing Commands Reference

### Test Individual Services Locally
```bash
# Health checks
curl http://localhost:4000/health
curl http://localhost:4001/health
curl http://localhost:4002/health
curl http://localhost:4003/health

# Register user
curl -X POST http://localhost:4000/register \
  -H "Content-Type: application/json" \
  -d '{"name":"Test User","email":"test@example.com","password":"Test1234!"}'

# Login (save the token!)
curl -X POST http://localhost:4000/login \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234!"}'

# Use this in Postman or set TOKEN=<your_token>
TOKEN="paste_token_here"

# Add menu item
curl -X POST http://localhost:4001/menu \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"name":"Pepperoni Pizza","price":14.99,"category":"main"}'

# Place order (replace IDs with real values from responses above)
curl -X POST http://localhost:4002/orders \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer $TOKEN" \
  -d '{"userId":"<userId>","itemId":"<itemId>","quantity":1}'

# View all my orders
curl http://localhost:4002/orders \
  -H "Authorization: Bearer $TOKEN"

# View my payments
curl http://localhost:4003/payments \
  -H "Authorization: Bearer $TOKEN"
```

### Test Against Deployed AWS Services (replace with real IPs)
```bash
BASE_USER="http://54.x.x.x:4000"
BASE_MENU="http://54.x.x.x:4001"
BASE_ORDER="http://54.x.x.x:4002"

curl $BASE_USER/health
curl $BASE_MENU/menu
```

---

## 🎯 Demonstration Checklist (10 Minutes)

Follow this script during your demo:

**[2 min] Show Architecture**
- Open `architecture-diagram.svg` in a browser
- Explain the 4 microservices and how they communicate

**[3 min] Live Service Demo**
1. Open browser → `http://<user-ip>:4000/api-docs` — show Swagger UI
2. Register a user using Swagger UI
3. Login — copy the JWT token
4. Add a menu item (Menu Service Swagger: `http://<menu-ip>:4001/api-docs`)
5. Place an order (Order Service Swagger: `http://<order-ip>:4002/api-docs`)
6. Show the full response (includes order + user + menuItem + payment)

**[2 min] Show CI/CD Pipeline**
- Open GitHub → **Actions** tab
- Show the last pipeline run
- Walk through the stages: Test → SonarCloud → Snyk → Docker Build → ECR Push → ECS Deploy

**[2 min] Show Security**
- AWS Console → **Secrets Manager** — show secrets stored (not the values)
- AWS Console → **IAM** → show `ecsTaskExecutionRole` with least-privilege policy
- SonarCloud → show your project scan results
- Try hitting a protected endpoint without a token → show 401

**[1 min] Show ECS Cluster**
- AWS Console → **ECS** → `food-order-cluster`
- Show all 4 running services
- Click a service → Tasks → show the running task

---

## ❓ Common Issues & Fixes

| Problem | Solution |
|---------|----------|
| `docker-compose up` fails — port already in use | Run `docker-compose down` first, or change ports in docker-compose.yml |
| MongoDB connection fails locally | MongoDB containers need ~20s to start; wait and retry |
| JWT token expired | Login again to get a fresh token (2hr expiry) |
| ECS task keeps stopping | Check CloudWatch logs: AWS Console → CloudWatch → Log groups → /ecs/food-order/service-name |
| Secrets Manager permission denied | Ensure ecsTaskExecutionRole has SecretsManagerReadWrite |
| SonarCloud scan fails | Verify SONAR_TOKEN secret is set correctly in GitHub |
