from datetime import datetime
from typing import NamedTuple


class MediaItem(NamedTuple):
    date_created: datetime
    root_folder: str
    title: str
    size_gb: float
    media_type: str
