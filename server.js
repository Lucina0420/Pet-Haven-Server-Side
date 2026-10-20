const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = 3000;
const DATA_DIRECTORY = path.join(__dirname, 'scripts', 'shelters');
const APPLICATION_STATUSES = ['Unprocessed', 'Pending', 'Rejected', 'Approved'];
const mimeTypes = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.svg': 'image/svg+xml'
};

let shelters = [];
const applications = [];
let nextApplicationNumber = 1;

function sendJson(response, statusCode, value) {
  response.writeHead(statusCode, { 'Content-Type': 'application/json; charset=utf-8' });
  response.end(JSON.stringify(value));
}

function sendText(response, statusCode, value) {
  response.writeHead(statusCode, { 'Content-Type': 'text/plain; charset=utf-8' });
  response.end(value);
}

function getShelterSummary(shelter) {
  return { id: shelter.id, name: shelter.name, city: shelter.city, processingFee: shelter.processingFee };
}

function findShelter(shelterId) {
  return shelters.find((shelter) => shelter.id === shelterId);
}

function readJsonBody(request) {
  return new Promise((resolve, reject) => {
    let body = '';
    request.on('data', (chunk) => {
      body += chunk;
      if (body.length > 1024 * 1024) {
        reject(new Error('Request body is too large.'));
        request.destroy();
      }
    });
    request.on('end', () => {
      try {
        resolve(JSON.parse(body || '{}'));
      } catch (error) {
        reject(new Error('Request body must contain valid JSON.'));
      }
    });
    request.on('error', reject);
  });
}

function serveStaticFile(response, filename) {
  fs.readFile(filename, (error, data) => {
    if (error) return sendText(response, 404, 'Not Found');
    response.writeHead(200, { 'Content-Type': mimeTypes[path.extname(filename).toLowerCase()] || 'application/octet-stream' });
    response.end(data);
  });
}

async function handleRequest(request, response) {
  const parsedUrl = url.parse(request.url, true);
  const pathname = decodeURIComponent(parsedUrl.pathname);

  if (request.method === 'GET' && pathname === '/shelters') {
    if (parsedUrl.query.id) {
      const shelter = findShelter(parsedUrl.query.id);
      return shelter ? sendJson(response, 200, shelter) : sendText(response, 404, 'Not Found');
    }
    return sendJson(response, 200, shelters.map(getShelterSummary));
  }

  if (request.method === 'GET' && pathname === '/shelters/pets') {
    const shelter = findShelter(parsedUrl.query.shelterId);
    const pet = shelter && shelter.pets.find((candidate) => candidate.id === parsedUrl.query.petId);
    return pet ? sendJson(response, 200, pet) : sendText(response, 404, 'Not Found');
  }

  if (request.method === 'POST' && pathname === '/submit-application') {
    try {
      const submitted = await readJsonBody(request);
      const shelter = findShelter(String(submitted.shelterId || ''));
      const pet = shelter && shelter.pets.find((candidate) => candidate.id === String(submitted.petId || ''));
      if (!shelter || !pet) return sendJson(response, 404, { error: 'The selected pet or shelter could not be found.' });
      const application = {
        ...submitted,
        petId: pet.id,
        shelterId: shelter.id,
        petType: pet.type,
        applicationId: `a${nextApplicationNumber++}`,
        submittedDate: new Date().toISOString(),
        status: 'Unprocessed'
      };
      applications.push(application);
      return sendJson(response, 201, { message: 'Application received.', applicationId: application.applicationId });
    } catch (error) {
      return sendJson(response, 400, { error: error.message });
    }
  }

  if (request.method === 'GET' && pathname === '/applications-data') {
    const summary = applications.map(({ submittedDate, applicationId, shelterId, petId, petType, status }) =>
      ({ submittedDate, applicationId, shelterId, petId, petType, status }));
    return sendJson(response, 200, summary);
  }

  if (request.method === 'PUT' && pathname === '/applications-update') {
    try {
      const update = await readJsonBody(request);
      if (!APPLICATION_STATUSES.includes(update.status)) return sendJson(response, 400, { error: 'Invalid application status.' });
      const application = applications.find((candidate) => candidate.applicationId === update.applicationId);
      if (!application) return sendJson(response, 404, { error: 'Application not found.' });
      application.status = update.status;
      return sendJson(response, 200, { message: 'Application status updated.' });
    } catch (error) {
      return sendJson(response, 400, { error: error.message });
    }
  }

  if (request.method === 'GET' && pathname === '/applications-details') {
    const application = applications.find((candidate) => candidate.applicationId === parsedUrl.query.id);
    if (!application) return sendText(response, 404, 'Not Found');
    const shelter = findShelter(application.shelterId);
    const pet = shelter && shelter.pets.find((candidate) => candidate.id === application.petId);
    return sendJson(response, 200, { application, pet, shelter: shelter ? getShelterSummary(shelter) : null });
  }

  if (request.method !== 'GET' && request.method !== 'HEAD') return sendText(response, 404, 'Not Found');

  const pageRoutes = {
    '/': 'index.html',
    '/browse': 'browse.html',
    '/about': 'about.html',
    '/details': 'pet.html',
    '/apply': 'apply.html',
    '/applications': 'applications.html'
  };
  const relativePath = pageRoutes[pathname] || pathname.replace(/^\/+/, '');
  const filename = path.resolve(__dirname, relativePath);
  if (!filename.startsWith(`${__dirname}${path.sep}`) && filename !== path.join(__dirname, 'index.html')) {
    return sendText(response, 404, 'Not Found');
  }
  return serveStaticFile(response, filename);
}

async function startServer() {
  const filenames = (await fs.promises.readdir(DATA_DIRECTORY)).filter((filename) => filename.endsWith('.json'));
  shelters = await Promise.all(filenames.map(async (filename) =>
    JSON.parse(await fs.promises.readFile(path.join(DATA_DIRECTORY, filename), 'utf8'))));
  http.createServer((request, response) => {
    handleRequest(request, response).catch((error) => {
      console.error('Request failed:', error);
      if (!response.headersSent) sendText(response, 500, 'Internal Server Error');
      else response.end();
    });
  }).listen(PORT, () => console.log(`Pet Adoption Server running on http://localhost:${PORT}`));
}

startServer().catch((error) => {
  console.error('Unable to load shelter data; server was not started:', error);
  process.exitCode = 1;
});
