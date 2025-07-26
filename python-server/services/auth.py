# auth.py

import google.auth.transport.requests
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
import os
class GoogleDriveClient:
    def __init__(self):
        self.drive_service = None
        self.docs_service = None

        # Your credentials
        self.client_id = os.environ.get("GOOGLE_CLIENT_ID")
        self.client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
        self.refresh_token = os.environ.get("GOOGLE_REFRESH_TOKEN")
        self.token_uri = "https://oauth2.googleapis.com/token"

    def authenticate(self):
        creds = Credentials(
            token=None,
            refresh_token=self.refresh_token,
            token_uri=self.token_uri,
            client_id=self.client_id,
            client_secret=self.client_secret,
            scopes=[
                "https://www.googleapis.com/auth/drive",
                "https://www.googleapis.com/auth/documents"
            ]
        )

        # Refresh the access token using the refresh token
        request = google.auth.transport.requests.Request()
        creds.refresh(request)

        # Set up the Drive and Docs services
        self.drive_service = build("drive", "v3", credentials=creds)
        self.docs_service = build("docs", "v1", credentials=creds)
