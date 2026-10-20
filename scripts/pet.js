// Read route parameters and wait for both server responses before rendering the page.
const params = new URLSearchParams(window.location.search);
const petId = params.get('petId');
const shelterId = params.get('shelterId');
const detailsHost = document.getElementById('petDetails');
const backLink = document.getElementById('backLink');
backLink.href = `/browse?shelterId=${encodeURIComponent(shelterId || '')}`;

function requestJson(route) {
  return fetch(route).then((response) => {
    if (!response.ok) throw new Error('Unable to load the requested pet. Please return to browsing and try again.');
    return response.json();
  });
}

Promise.all([
  requestJson(`/shelters/pets?petId=${encodeURIComponent(petId || '')}&shelterId=${encodeURIComponent(shelterId || '')}`),
  requestJson(`/shelters?id=${encodeURIComponent(shelterId || '')}`)
])
  .then(([pet, shelter]) => {
    const image = document.createElement('img');
    image.className = 'pet-img';
    image.src = pet.image;
    image.alt = pet.name;
    image.addEventListener('error', () => { image.src = 'images/dog1.jpg'; }, { once: true });
    const heading = document.createElement('h2');
    heading.textContent = pet.name;
    const block = document.createElement('div');
    block.className = 'detail-block';
    const rows = [
      ['Age & Breed', `${pet.age} year old ${pet.breed} (${pet.type})`],
      ['Health', pet.health],
      ['Traits', pet.traits.join(', ')],
      ['Days at Shelter', `${pet.daysAtShelter} days`],
      ['Adoption Fee', `$${pet.adoptionFee}`],
      ['Shelter Processing Fee', `$${shelter.processingFee}`],
      ['Total (before taxes)', `$${pet.adoptionFee + shelter.processingFee}`]
    ];
    rows.forEach(([label, value]) => {
      const paragraph = document.createElement('p');
      const strong = document.createElement('strong');
      strong.textContent = `${label}: `;
      paragraph.append(strong, document.createTextNode(value));
      block.appendChild(paragraph);
    });
    const apply = document.createElement('button');
    apply.type = 'button';
    apply.textContent = 'Apply to Adopt this Pet';
    apply.addEventListener('click', () => {
      const query = new URLSearchParams({
        petId: pet.id, shelterId: shelter.id, petName: pet.name, petType: pet.type,
        petBreed: pet.breed, adoptionFee: pet.adoptionFee, processingFee: shelter.processingFee
      });
      window.location.href = `/apply?${query}`;
    });
    detailsHost.append(image, heading, block, apply);
  })
  .catch((error) => { detailsHost.textContent = error.message; });
