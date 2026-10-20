COMP 2406 Assignment 2 - Pet Haven

RUNNING THE WEBSITE
1. Install Node.js if it is not already installed.
2. Open a terminal in this folder and run: node server.js
3. Visit http://localhost:3000/ in a modern browser.
The server loads every .json file in scripts/shelters before it begins listening.
Applications are stored in server memory and are cleared when the server restarts.

IMPLEMENTED REQUIREMENTS
- Extensionless page routes: /, /browse, /details, /apply, /about and /applications.
- Shelter summaries and complete shelter/pet details are served by JSON endpoints.
- The browse page fetches shelter summaries, then fetches full shelter data on selection.
- Application forms POST applicant information to the server.
- The applications page displays requests, updates status with PUT, and loads one
  application's details asynchronously when its View button is selected.
- Application statuses are Unprocessed, Pending, Rejected and Approved.

IMAGE AND TEXT ACKNOWLEDGEMENTS
The pet photos and shelter records were provided with the Assignment 1 materials.
The Pet Haven branding and site text are student-authored/adapted content. The About
page team and mission text were supplied in the existing Assignment 1 project.

AI USE
OpenAI ChatGPT/Codex was used to help interpret the assignment specification,
implement server routes and browser interactions, and update this documentation.
The student should review and understand the submitted code.

ADDITIONAL DESIGN DECISIONS
- Application status colors provide a quick visual indicator.
- Only one application detail panel can be open at a time; selecting its View
  button again closes it.
- Shelter and application records are kept in memory; no database is required.

NOTES FOR THE TA
Run the Node.js server and access the site through http://localhost:3000/ so the
fetch requests and server routes work. Opening index.html directly as a file will
not provide the server-side functionality. Applications submitted during a run
are available at /applications-data and disappear after the server restarts.
