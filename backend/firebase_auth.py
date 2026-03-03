import os

import firebase_admin
from firebase_admin import auth, credentials
from loguru import logger


def initialize_firebase():
    """
    Initializes Firebase Admin SDK using environment variables.
    """
    if firebase_admin._apps:
        return

    try:
        project_id = os.getenv("FIREBASE_ADMIN_PROJECT_ID")
        client_email = os.getenv("FIREBASE_ADMIN_CLIENT_EMAIL")
        private_key = os.getenv("FIREBASE_ADMIN_PRIVATE_KEY")

        if not all([project_id, client_email, private_key]):
            logger.warning(
                "Firebase Admin environment variables missing. Auth verification may fail."
            )
            return

        # Handle escaped newlines in the private key string
        formatted_private_key = private_key.replace("\\n", "\n")

        cred = credentials.Certificate(
            {
                "project_id": project_id,
                "client_email": client_email,
                "private_key": formatted_private_key,
                "type": "service_account",
                "token_uri": "https://oauth2.googleapis.com/token",
            }
        )

        firebase_admin.initialize_app(cred)
        logger.success(f"Firebase Admin initialized for project: {project_id}")
    except Exception as e:
        logger.error(f"Failed to initialize Firebase Admin: {e}")


def verify_token(token: str):
    """
    Verifies a Firebase ID token and returns the decoded claims.
    Returns None if verification fails.
    """
    try:
        decoded_token = auth.verify_id_token(token)
        return decoded_token
    except Exception as e:
        logger.error(f"Firebase Token Verification Failed: {e}")
        return None
