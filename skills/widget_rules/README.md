# Widget Timeline Rules

### Purpose
Define consistent widget refresh and caching behavior.

### Rules
- Refresh daily at 9:00 local time.
- Cache the last 7 days of data.
- Fallback to cached artworks if offline.
- Always include attribution (museum, artist, license).
- Respect iOS WidgetKit refresh budgets.

### Data Model
```ts
{
  date: string,
  artistId: string,
  artworkId: string,
  title: string,
  imageURL: string,
  attribution: string,
}
```