import os
from dotenv import load_dotenv

# Load environment variables from .env file
load_dotenv()


EMBY_TOKEN = os.getenv("EMBY_TOKEN")
EMBY_URL = os.getenv("EMBY_URL")

EMBY_DEVICE = {
    "X-Emby-Client": "Least Watched",
    "X-Emby-Device-Name": "Python",
    "X-Emby-Device-Id": "d40b36d8-7e85-4803-9243-e37202ea1533",
    "X-Emby-Client-Version": "0.0.1",
    "X-Emby-Token": EMBY_TOKEN,
    "X-Emby-Language": "en-us",
}

if __name__ == "__main__":
    print(EMBY_TOKEN)
