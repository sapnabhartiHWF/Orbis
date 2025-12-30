import os
from werkzeug.utils import secure_filename

BASE_UPLOAD_DIR = os.path.join(os.getcwd(), "uploads")


def save_uploaded_file(file, subdir: str) -> dict:
    """
    Saves file and returns DB-safe relative path + filename.
    """
    filename = secure_filename(file.filename)

    if not filename or "." not in filename:
        raise ValueError("Invalid file name")

    relative_dir = subdir.strip("/")

    full_dir = os.path.join(BASE_UPLOAD_DIR, relative_dir)
    os.makedirs(full_dir, exist_ok=True)

    full_path = os.path.join(full_dir, filename)
    file.save(full_path)

    return {
        "file_name": filename,
        "relative_path": f"{relative_dir}/{filename}"
    }
