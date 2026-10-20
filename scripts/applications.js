// Display server-side application summaries, update statuses, and toggle one detail view.
const applicationsBody = document.getElementById('applicationsBody');
const applicationsMessage = document.getElementById('applicationsMessage');
const applicationDetails = document.getElementById('applicationDetails');
const statuses = ['Unprocessed', 'Pending', 'Rejected', 'Approved'];
let activeApplicationId = null;

function formatDate(value) {
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? value : date.toLocaleString();
}

function setStatusStyle(select) {
  select.className = `status-select status-${select.value}`;
}

function createCell(text) {
  const cell = document.createElement('td');
  cell.textContent = text;
  return cell;
}

function renderApplication(application) {
  const row = document.createElement('tr');
  row.appendChild(createCell(formatDate(application.submittedDate)));

  const idCell = document.createElement('td');
  idCell.appendChild(document.createTextNode(application.applicationId));
  const viewButton = document.createElement('button');
  viewButton.type = 'button';
  viewButton.className = 'view-button';
  viewButton.textContent = 'View';
  viewButton.setAttribute('aria-pressed', 'false');
  viewButton.addEventListener('click', () => toggleDetails(application.applicationId, viewButton));
  idCell.appendChild(viewButton);
  row.appendChild(idCell);

  row.appendChild(createCell(application.shelterId));
  row.appendChild(createCell(application.petId));
  row.appendChild(createCell(application.petType));

  const statusCell = document.createElement('td');
  const select = document.createElement('select');
  select.setAttribute('aria-label', `Status for ${application.applicationId}`);
  statuses.forEach((status) => {
    const option = document.createElement('option');
    option.value = status;
    option.textContent = status;
    select.appendChild(option);
  });
  select.value = application.status;
  setStatusStyle(select);
  select.addEventListener('change', () => {
    const previousStatus = application.status;
    setStatusStyle(select);
    select.disabled = true;
    fetch('/applications-update', {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ applicationId: application.applicationId, status: select.value })
    })
      .then((response) => response.json().then((data) => {
        if (!response.ok) throw new Error(data.error || 'Could not update the application status.');
        return data;
      }))
      .then(() => {
        application.status = select.value;
        applicationsMessage.textContent = `Status updated for ${application.applicationId}.`;
      })
      .catch((error) => {
        applicationsMessage.textContent = error.message;
        select.value = previousStatus;
        setStatusStyle(select);
      })
      .finally(() => { select.disabled = false; });
  });
  statusCell.appendChild(select);
  row.appendChild(statusCell);
  applicationsBody.appendChild(row);
}

function addDetailSection(title, paragraphs) {
  const sectionTitle = document.createElement('h3');
  sectionTitle.textContent = title;
  applicationDetails.appendChild(sectionTitle);
  paragraphs.forEach(([label, value]) => {
    const paragraph = document.createElement('p');
    const strong = document.createElement('strong');
    strong.textContent = `${label}: `;
    paragraph.append(strong, document.createTextNode(value == null ? '' : String(value)));
    applicationDetails.appendChild(paragraph);
  });
}

function toggleDetails(applicationId, selectedButton) {
  if (activeApplicationId === applicationId) {
    activeApplicationId = null;
    applicationDetails.replaceChildren();
    applicationDetails.hidden = true;
    selectedButton.setAttribute('aria-pressed', 'false');
    return;
  }
  document.querySelectorAll('.view-button').forEach((button) => button.setAttribute('aria-pressed', 'false'));
  selectedButton.setAttribute('aria-pressed', 'true');
  activeApplicationId = applicationId;
  applicationDetails.replaceChildren();
  applicationDetails.hidden = false;
  applicationDetails.textContent = 'Loading application details…';
  loadApplicationDetails(applicationId, selectedButton);
}

async function loadApplicationDetails(applicationId, selectedButton) {
  try {
    const response = await fetch(`/applications-details?id=${encodeURIComponent(applicationId)}`);
    if (!response.ok) throw new Error('Unable to load these application details.');
    const { application, pet } = await response.json();
    if (activeApplicationId !== applicationId) return;
    applicationDetails.replaceChildren();
    addDetailSection('Application Information', [
      ['Date Submitted', formatDate(application.submittedDate)],
      ['Status', application.status], ['Pet ID', application.petId], ['Shelter ID', application.shelterId]
    ]);
    addDetailSection('Pet Requested', [
      ['Name', pet.name], ['Type', pet.type], ['Breed', pet.breed],
      ['Age', `${pet.age} years`], ['Days at Shelter', pet.daysAtShelter]
    ]);
    const image = document.createElement('img');
    image.src = pet.image;
    image.alt = `${pet.name}, ${pet.type}`;
    image.addEventListener('error', () => { image.src = 'images/dog1.jpg'; }, { once: true });
    applicationDetails.appendChild(image);
    addDetailSection('Applicant Information', [
      ['Name', application.name], ['Email', application.email], ['Phone', application.phone], ['Address', application.address]
    ]);
    addDetailSection('Household Details', [
      ['Residents', application.residents], ['Current Pets', application.currentPets],
      ['Experience Level', application.experience], ['Pet Location', application.location]
    ]);
  } catch (error) {
    if (activeApplicationId !== applicationId) return;
    applicationDetails.replaceChildren();
    const message = document.createElement('p');
    message.className = 'details-error';
    message.textContent = error.message;
    applicationDetails.appendChild(message);
  }
}

fetch('/applications-data')
  .then((response) => {
    if (!response.ok) throw new Error('Unable to retrieve applications.');
    return response.json();
  })
  .then((applications) => {
    if (applications.length === 0) {
      applicationsMessage.textContent = 'No applications have been submitted yet.';
      return;
    }
    applications.forEach(renderApplication);
  })
  .catch((error) => { applicationsMessage.textContent = error.message; });
