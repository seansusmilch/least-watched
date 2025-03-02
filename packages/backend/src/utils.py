def determine_share(path: str) -> str:
    """Extract the share name from a path."""
    return path.split("/")[1]
