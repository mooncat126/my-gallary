# Data Source Rules

### Purpose
Ensure all artwork and artist data is sourced legally and cached efficiently.

### Rules
- Use open/public APIs only (e.g. The Met Museum API).
- Store only image URLs and metadata.
- Cache images in App Group container for widgets.
- Include proper attribution in all UI.
- Backoff API calls if request fails more than 3 times.