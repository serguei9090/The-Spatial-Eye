# Deployment Guide: The Spatial Eye

This document outlines the automated deployment process for **The Spatial Eye** and provides a step-by-step guide for reproducing the deployment environment in Google Cloud Platform (GCP).

## Automating Cloud Deployment (Bonus Points)

We have fully automated the cloud deployment process using Infrastructure-as-Code (Terraform) and Continuous Integration/Continuous Deployment (GitHub Actions).

### Infrastructure as Code (Terraform)

We use Terraform to define and provision our GCP infrastructure, which ensures consistency and reproducibility.

- **Location:** [`../../IaC/terraform/`](../../IaC/terraform/)
- **Core Configuration:** [`../../IaC/terraform/main.tf`](../../IaC/terraform/main.tf) defines the primary resources, including:
  - Google Artifact Registry repository for storing Docker images.
  - A unified Google Cloud Run (v2) service running the application.
  - IAM bindings to allow public, unauthenticated access (with commented instructions on how to instantly block public access via `terraform apply`).
- **Variables:** [`../../IaC/terraform/variables.tf`](../../IaC/terraform/variables.tf) contains the required configuration variables.

### CI/CD Pipeline (GitHub Actions)

Our deployment pipeline is fully automated via GitHub Actions, triggering on every push to the `main` branch.

- **Location:** [`../../.github/workflows/deploy.yml`](../../.github/workflows/deploy.yml)
- **Process:** The workflow authenticates with Google Cloud using Workload Identity Federation, builds a unified Docker container for the Next.js and FastAPI stack, pushes the image to Artifact Registry, and deploys the new revision to Cloud Run.

---

## Step-by-Step Deployment Reproduction

If you wish to independently deploy and reproduce this project on your own GCP environment, please follow these steps:

### Prerequisites

1. A **Google Cloud Platform (GCP)** Account with a created Project.
2. Formatted **Google Cloud CLI (`gcloud`)** installed and authenticated.
3. **Terraform** installed.
4. **Docker** installed.
5. A GitHub repository for hosting the code.
6. A **Firebase** Project (for Auth and Firestore).

### Step 1: Provision Infrastructure with Terraform

1. Open a terminal and navigate to the Terraform directory:
   ```bash
   cd IaC/terraform
   ```
2. Initialize Terraform:
   ```bash
   terraform init
   ```
3. Set your project ID variable and review the infrastructure plan:
   ```bash
   export TF_VAR_project_id="YOUR_GCP_PROJECT_ID"
   terraform plan
   ```
4. **Crucial Initial Setup:** Because GitHub Actions hasn't built the real Docker image yet, Terraform must deploy a placeholder image to successfully create the Cloud Run service. Open `IaC/terraform/main.tf` and ensure the `image` inside the `containers` block is set to a public dummy image (e.g., `us-docker.pkg.dev/cloudrun/container/hello`).

5. Apply the configuration to create the Artifact Registry and the initial Cloud Run service placeholder.
   ```bash
   terraform apply
   ```

_(Note: Once GitHub Actions runs successfully for the first time, it will push the real application container and update the Cloud Run revision. For future Terraform runs, you can update `main.tf` to point to the real Artifact Registry image if desired)._

### Step 2: Configure Workload Identity Federation

To allow GitHub Actions to securely deploy to your GCP project without long-lived service account keys:

1. Create a Workload Identity Pool and Provider in your GCP console (IAM & Admin -> Workload Identity Federation).
2. Connect it to your GitHub repository.
3. Grant the required permissions (Artifact Registry Writer, Cloud Run Admin, Service Account User) to the associated GCP Service Account.

### Step 3: Configure GitHub Secrets

Navigate to your GitHub repository's **Settings > Secrets and variables > Actions**, and add the following repository secrets:

- `GCP_PROJECT_ID`: Your Google Cloud Project ID.
- `WIF_PROVIDER`: The full identifier of the Workload Identity Provider.
- `WIF_SERVICE_ACCOUNT`: The email of the service account used for Workload Identity Federation.
- `NEXT_PUBLIC_FIREBASE_API_KEY`: Firebase Web API Key.
- `NEXT_PUBLIC_FIREBASE_PROJECT_ID`: Firebase Project ID.
- `NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN`: Firebase Auth Domain.
- `NEXT_PUBLIC_FIREBASE_APP_ID`: Firebase App ID.
- `NEXT_PUBLIC_GEMINI_LIVE_MODEL`: Gemini Live Model identifier (e.g., `gemini-2.5-flash`).
- `FIREBASE_ADMIN_PROJECT_ID`: Firebase Admin SDK Project ID.
- `FIREBASE_ADMIN_CLIENT_EMAIL`: Firebase Admin SDK Client Email.
- `FIREBASE_ADMIN_PRIVATE_KEY`: Firebase Admin SDK Private Key (stored in Google Secret Manager or directly, depending on setup).

_(Note: The deployment workflow assumes that `GOOGLE_API_KEY` and `FIREBASE_ADMIN_PRIVATE_KEY` are mounted via Google Cloud Secret Manager for the Cloud Run service instance, mapped to `latest`)._

### Step 4: Trigger the Deployment

1. Make sure your local repository is tied to your GitHub remote.
2. Commit your changes and push to the `main` branch.
   ```bash
   git commit -m "Trigger deployment"
   git push origin main
   ```
3. Navigate to the **Actions** tab in your GitHub repository to monitor the `Deploy Unified Spatial Eye` workflow.
4. Once the action successfully completes, it will output the live URL of your unified Cloud Run service in the GCP console. Visit this URL to interact with the application.
