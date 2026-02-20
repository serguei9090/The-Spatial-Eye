import * as gcp from "@pulumi/gcp";
import * as pulumi from "@pulumi/pulumi";

// Config
const config = new pulumi.Config();
const location = config.get("location") || "us-central1";
const serviceName = config.get("serviceName") || "spatial-eye";

// Artifact Registry Repository
const repo = new gcp.artifactregistry.Repository("repo", {
  location: location,
  repositoryId: `${serviceName}-repo`,
  format: "DOCKER",
  description: `Docker repository for ${serviceName}`,
});

// Cloud Run Service
const service = new gcp.cloudrunv2.Service("default", {
  name: serviceName,
  location: location,
  ingress: "INGRESS_TRAFFIC_ALL",
  template: {
    containers: [
      {
        image: pulumi.interpolate`${location}-docker.pkg.dev/${gcp.config.project}/${repo.name}/${serviceName}:latest`,
        envs: [
          {
            name: "NODE_ENV",
            value: "production",
          },
        ],
        resources: {
          limits: {
            cpu: "1000m",
            memory: "512Mi",
          },
        },
      },
    ],
  },
});

// Allow unauthenticated access
const iam = new gcp.cloudrunv2.ServiceIamBinding("public", {
  location: service.location,
  name: service.name,
  role: "roles/run.invoker",
  members: ["allUsers"],
});

// Enable Firebase API
const firebaseService = new gcp.projects.Service("firebase", {
  service: "firebase.googleapis.com",
  disableOnDestroy: false,
});

// Firebase Project
const firebaseProject = new gcp.firebase.Project(
  "default",
  {
    project: gcp.config.project,
  },
  { dependsOn: [firebaseService] },
);

// Enable Firestore API
const firestoreService = new gcp.projects.Service("firestore", {
  service: "firestore.googleapis.com",
  disableOnDestroy: false,
});

// Firestore Database (Free Tier compliant: Native mode)
const database = new gcp.firestore.Database(
  "database",
  {
    project: gcp.config.project,
    name: "(default)",
    locationId: location,
    type: "FIRESTORE_NATIVE",
    concurrencyMode: "OPTIMISTIC",
    appEngineIntegrationMode: "DISABLED",
  },
  { dependsOn: [firestoreService] },
);

// Exports
export const serviceUrl = service.uri;
export const repoUrl = pulumi.interpolate`${location}-docker.pkg.dev/${gcp.config.project}/${repo.name}`;
