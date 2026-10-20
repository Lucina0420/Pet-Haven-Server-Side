// Load compact shelter summaries first; fetch full pet data only after a shelter is selected.
const shelterSelect = document.getElementById('shelterSelect');
const typeSection = document.getElementById('petTypeSection');
const petGrid = document.getElementById('petGrid');
const typeButtons = [...document.querySelectorAll('.pet-type-buttons button')];
const typeMap = { All: null, Cats: 'Cat', Dogs: 'Dog', Birds: 'Bird', Reptiles: 'Reptile', Other: 'Other' };
let selectedShelter = null;
let selectedType = 'All';
let shelterRequestNumber = 0;

function renderPets() {
  petGrid.replaceChildren();
  if (!selectedShelter) return;
  const wantedType = typeMap[selectedType];
  const visiblePets = selectedShelter.pets.filter((pet) => !wantedType || pet.type === wantedType || (wantedType === 'Bird' && pet.type === 'Parrot'));
  visiblePets.forEach((pet) => {
    const card = document.createElement('article');
    card.className = 'pet-card';
    const image = document.createElement('img');
    image.className = 'pet-img';
    image.src = pet.image;
    image.alt = pet.name;
    image.addEventListener('error', () => { image.src = 'images/dog1.jpg'; }, { once: true });
    const name = document.createElement('h3');
    name.textContent = pet.name;
    const details = document.createElement('button');
    details.type = 'button';
    details.textContent = 'View Details';
    details.addEventListener('click', () => {
      const query = new URLSearchParams({ petId: pet.id, shelterId: selectedShelter.id });
      window.location.href = `/details?${query}`;
    });
    card.append(image, name, details);
    petGrid.appendChild(card);
  });
}

function updateTypeButtons() {
  if (!selectedShelter) return;
  const availableTypes = new Set(selectedShelter.pets.map((pet) => pet.type));
  typeButtons.forEach((button) => {
    const category = typeMap[button.dataset.type];
    const hasMatchingPets = button.dataset.type === 'All' || availableTypes.has(category) || (button.dataset.type === 'Birds' && availableTypes.has('Parrot'));
    button.disabled = !hasMatchingPets;
    button.classList.toggle('active', button.dataset.type === selectedType);
    button.setAttribute('aria-pressed', String(button.dataset.type === selectedType));
  });
}

function loadShelter(shelterId) {
  const requestNumber = ++shelterRequestNumber;
  selectedShelter = null;
  petGrid.replaceChildren();
  typeSection.hidden = true;
  if (!shelterId) return;
  fetch(`/shelters?id=${encodeURIComponent(shelterId)}`)
    .then((response) => {
      if (!response.ok) throw new Error('Unable to load this shelter.');
      return response.json();
    })
    .then((shelter) => {
      if (requestNumber !== shelterRequestNumber) return;
      selectedShelter = shelter;
      selectedType = 'All';
      typeSection.hidden = false;
      updateTypeButtons();
      renderPets();
    })
    .catch((error) => {
      if (requestNumber === shelterRequestNumber) petGrid.textContent = error.message;
    });
}

fetch('/shelters')
  .then((response) => {
    if (!response.ok) throw new Error('Unable to load the shelter list.');
    return response.json();
  })
  .then((summaries) => {
    summaries.forEach((shelter) => {
      const option = document.createElement('option');
      option.value = shelter.id;
      option.textContent = `${shelter.name} (${shelter.city})`;
      shelterSelect.appendChild(option);
    });
    const requestedShelter = new URLSearchParams(window.location.search).get('shelterId');
    if (requestedShelter && summaries.some((shelter) => shelter.id === requestedShelter)) {
      shelterSelect.value = requestedShelter;
      loadShelter(requestedShelter);
    }
  })
  .catch((error) => { petGrid.textContent = error.message; });

shelterSelect.addEventListener('change', () => loadShelter(shelterSelect.value));
typeButtons.forEach((button) => button.addEventListener('click', () => {
  if (!selectedShelter || button.disabled) return;
  selectedType = button.dataset.type;
  updateTypeButtons();
  renderPets();
}));
