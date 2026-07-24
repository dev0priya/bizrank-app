# API Documentation

## `/api/jobs`
- **POST**: Initiates a new `CollectionJob`. Requires `country`, `state`, `city`, `area`, `category`. Begins the background Apify scrape.
- **GET**: Returns paginated history of executed jobs.

## `/api/jobs/[id]`
- **GET**: Polling endpoint. Returns the current status (`Pending`, `Running`, `Completed`, `Failed`) of a specific job and triggers processing/auditing upon completion.

## `/api/businesses`
- **GET**: Retrieves leads. Accepts query parameters for filtering (`category_id`, `area_id`, `rating`, `reviews`, `website`) and outputs paginated responses for UI display.

## `/api/master`
- **GET**: Fetches pre-seeded master tables (countries, states, categories) for frontend dropdowns.
