import asyncio
from src.get_episodes import get_episodes
from src.get_shows_list import get_shows_list
from src.query_playbacks import query_playbacks


async def process_show(show):
    episodes, total_size = await get_episodes(show["Id"], calculate_size=True)
    playbacks = await query_playbacks(show["Name"])
    if playbacks:
        print(f'"{show["Name"]}" has {len(playbacks)} playbacks.')
    else:
        print(
            f'"{show["Name"]}" has never been played. {total_size:.2f}GB could be deleted???'
        )
        date_created = min([episode["DateCreated"] for episode in episodes["Items"]])
        return {
            "name": show["Name"],
            "total_size": total_size,
            "date_created": date_created,
        }
    return None


async def main():
    shows = await get_shows_list()

    can_delete = []
    chunk_size = 20
    for i in range(0, len(shows["Items"]), chunk_size):
        chunk = shows["Items"][i : i + chunk_size]
        tasks = [process_show(show) for show in chunk]
        results = await asyncio.gather(*tasks)
        for result in results:
            if result:
                can_delete.append(result)

    print("\n\n\n")
    print("Shows that can be deleted:")

    for show in sorted(can_delete, key=lambda x: x["date_created"]):
        print(f"{show['name']} - {show['total_size']:.2f}GB - {show['date_created']}")

    delete_size = sum([show["total_size"] for show in can_delete])
    print(f"Total size that can be deleted: {delete_size:.2f}GB")


if __name__ == "__main__":
    asyncio.run(main())
