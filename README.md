# Data Branch
 
This branch holds the JSON data files consumed by the Boulder Rides website.
 
## Files
 
| File | Description |
|------|-------------|
| `weather.json` | Weather forecast for Boulder, CO fetched from the National Weather Service |
| `club_rides.json` | Upcoming club rides fetched from Strava and Ride With GPS |
| `races.json` | Upcoming races fetched from BikeReg |
 
## How it works
 
A backend process running in a server fetches fresh data and pushes updates to this branch. The backend commits **by amending the single existing commit** (`git commit --amend`) rather than adding a new one. 
This keeps the branch permanently at 1 commit, so the repository size never grows no matter how many times the JSON files are updated.
 
## Branches
 
| Branch | Purpose |
|--------|---------|
| `main` | Website source code (HTML, JS, CSS) |
| `data` | JSON data files only (this branch) |
 
The backend process only interacts with the `data` branch and has no access to `main`.
