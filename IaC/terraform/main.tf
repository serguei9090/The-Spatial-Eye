terraform {
  required_providers {
    google = {
      source  = "hashicorp/google"
      version = ">= 5.0"
    }
  }
}

provider "google" {
  project = var.project_id
  region  = var.region
}

# Artifact Registry Repository
resource "google_artifact_registry_repository" "repo" {
  location      = var.region
  repository_id = "${var.service_name}-repo"
  description   = "Docker repository for ${var.service_name}"
  format        = "DOCKER"
}

# Unified Cloud Run Service
resource "google_cloud_run_v2_service" "default" {
  name     = var.service_name
  location = var.region
  ingress  = "INGRESS_TRAFFIC_ALL"

  template {
    # CRITICAL FOR WEBSOCKETS: Cloud Run has a default timeout of 5 minutes.
    # Setting it to 3600s (1 hour) allows for long-running Live Agent sessions.
    timeout = "3600s"

    # CRITICAL FOR WEBSOCKETS: Session affinity ensures WebSocket traffic hits the same container
    session_affinity = true

    # Allows concurrent connections up to limits
    max_instance_request_concurrency = 80

    containers {
      image = "${var.region}-docker.pkg.dev/${var.project_id}/${var.service_name}-repo/${var.service_name}:latest"
      
      env {
        name  = "NODE_ENV"
        value = "production"
      }
      
      # Next.js (and our orchestrator) listens on 3000
      ports {
        container_port = 3000
      }
      
      resources {
        limits = {
          cpu    = "2000m" # Increased for running dual-stack (Node + Python ADK)
          memory = "2Gi"   # 2Gi recommended for multi-process multimodal processing
        }
      }
    }
  }
}


# Allow unauthenticated access
resource "google_cloud_run_service_iam_binding" "public" {
  location = google_cloud_run_v2_service.default.location
  service  = google_cloud_run_v2_service.default.name
  role     = "roles/run.invoker"
  members = [
    "allUsers"
  ]
}

# Firebase Project
resource "google_firebase_project" "default" {
  provider = google
  project  = var.project_id

  depends_on = [
    google_project_service.firebase
  ]
}

# Enable Firebase API
resource "google_project_service" "firebase" {
  provider = google
  project  = var.project_id
  service  = "firebase.googleapis.com"
}

# Firestore Database (Free Tier compliant: Native mode)
resource "google_firestore_database" "database" {
  provider                    = google
  project                     = var.project_id
  name                        = "(default)"
  location_id                 = var.region
  type                        = "FIRESTORE_NATIVE"
  concurrency_mode            = "OPTIMISTIC"
  app_engine_integration_mode = "DISABLED"

  depends_on = [
    google_project_service.firestore
  ]
}

# Enable Firestore API
resource "google_project_service" "firestore" {
  provider = google
  project  = var.project_id
  service  = "firestore.googleapis.com"
}
