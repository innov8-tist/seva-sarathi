import os
import io
import shutil
from mimetypes import MimeTypes
from google.oauth2.credentials import Credentials
from googleapiclient.discovery import build
from googleapiclient.http import MediaIoBaseDownload, MediaFileUpload
from PIL import Image
import pytesseract
# Replace with your own credentials
CLIENT_ID = '322605619365-nbtc3nmmsoq5lpu1rpssfklq185sv001.apps.googleusercontent.com'
CLIENT_SECRET = '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'
REFRESH_TOKEN = "1//0gybau-OHJ5kCCgYIARAAGBASNwF-L9IrtSTsM8KKDDlj9wm7_AuCec-yBUcUlCZoffDe1ns_UKTzA2_KrrEbUGakJry00xBFwfI"
TOKEN_URI = 'https://oauth2.googleapis.com/token'

def get_drive_service():
    creds = Credentials(
        None,
        refresh_token=REFRESH_TOKEN,
        client_id=CLIENT_ID,
        client_secret=CLIENT_SECRET,
        token_uri=TOKEN_URI
    )
    return build('drive', 'v3', credentials=creds)

def list_all_documents():
    """List all documents in Google Drive (Google Docs and other doc types)."""
    try:
        service = get_drive_service()
        query = "mimeType contains 'application/vnd.google-apps.' or mimeType='application/pdf'"

        results = service.files().list(q=query, pageSize=1000, fields="files(id, name, mimeType)").execute()
        files = results.get('files', [])

        if not files:
            print("No files found.")
            return []

        print("Files:")
        for file in files:
            print(f"{file['name']} ({file['id']}) - {file['mimeType']}")

        return files

    except Exception as e:
        print(f"Error fetching files: {e}")
        return []

def file_download(file_id: str, file_name: str) -> str:
    """Download a file using its ID from Google Drive."""
    try:
        service = get_drive_service()
        request = service.files().get_media(fileId=file_id)
        fh = io.BytesIO()
        downloader = MediaIoBaseDownload(fh, request)
        done = False

        while not done:
            status, done = downloader.next_chunk()
            if status:
                print(f"Download Progress: {int(status.progress() * 100)}%")

        fh.seek(0)
        destination_dir = "./download"
        os.makedirs(destination_dir, exist_ok=True)
        destination_path = os.path.join(destination_dir, file_name)

        with open(destination_path, 'wb') as f:
            shutil.copyfileobj(fh, f)

        print("File Downloaded Successfully")
        return "File downloaded successfully."
    except Exception as e:
        print(f"Error during file download: {e}")
        return f"Error: {e}"

def file_upload(filepath: str) -> str:
    """Upload a file to Google Drive."""
    try:
        service = get_drive_service()

        if not os.path.exists(filepath):
            return "Error: File not found."

        name = os.path.basename(filepath)
        mimetype = MimeTypes().guess_type(name)[0] or 'application/octet-stream'
        file_metadata = {'name': name}
        media = MediaFileUpload(filepath, mimetype=mimetype)

        uploaded_file = service.files().create(body=file_metadata, media_body=media, fields='id').execute()
        print(f"File Uploaded: {uploaded_file.get('id')}")
        return f"File uploaded successfully. ID: {uploaded_file.get('id')}"
    except Exception as e:
        print(f"Error during file upload: {e}")
        return f"Error: {e}"
def save_text_from_image(file_path, output_path):
    try:
        img = Image.open(file_path)
        text = pytesseract.image_to_string(img)
        with open(output_path, 'w', encoding='utf-8') as f:
            f.write(text)
        print(f"OCR text saved to {output_path}")
    except Exception as e:
        print(f"OCR error: {e}")


def Download_Function():
    files = list_all_documents()
    for file in files:
        if file['mimeType'] == 'application/vnd.google-apps.folder':
            continue  # skip folders

        file_name = file['name']
        file_id = file['id']
        mime_type = file['mimeType']

        # Define download path
        download_dir = "./download"
        os.makedirs(download_dir, exist_ok=True)
        download_path = os.path.join(download_dir, file_name)

        # Extension check
        ext = os.path.splitext(file_name)[-1].lower()

        if mime_type == 'application/pdf':
            print(f"Downloading PDF: {file_name}")
            file_download(file_id, file_name)

        elif ext in ['.jpg', '.jpeg', '.png']:
            print(f"Downloading image for OCR: {file_name}")
            #file_download(file_id, file_name)
            txt_filename = os.path.splitext(file_name)[0] + ".txt"
            txt_path = os.path.join(download_dir, txt_filename)
            save_text_from_image(download_path, txt_path)
        else:
            print(f"Skipping unsupported file type: {file_name}")
            