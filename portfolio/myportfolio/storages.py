from cloudinary_storage.storage import (
    MediaCloudinaryStorage,
    RawMediaCloudinaryStorage
)

class ImageStorage(MediaCloudinaryStorage):
    def url(self, name):
        # Return unsigned public URL so it never expires
        url = super().url(name)
        # Strip any expiry/signature query params if present
        if '?' in url:
            url = url.split('?')[0]
        return url