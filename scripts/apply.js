// Populate the application summary and submit applicant details to the server.
const applicationParams = new URLSearchParams(window.location.search);
const applicationForm = document.getElementById('adoptForm');
const petSummary = document.getElementById('petSummary');
const applicationMessage = document.getElementById('applicationMessage');
const dollars = (value) => Number.isFinite(Number(value)) ? `$${Number(value)}` : 'Not provided';
const adoptionFee = Number(applicationParams.get('adoptionFee'));
const processingFee = Number(applicationParams.get('processingFee'));

const summaryTitle = document.createElement('h3');
summaryTitle.textContent = 'Pet You Are Applying For';
const summaryPet = document.createElement('p');
summaryPet.textContent = `Pet Name: ${applicationParams.get('petName') || 'Not provided'} | Type: ${applicationParams.get('petType') || 'Not provided'} | Breed: ${applicationParams.get('petBreed') || 'Not provided'}`;
const summaryFees = document.createElement('p');
summaryFees.textContent = `Adoption Fee: ${dollars(adoptionFee)} | Processing Fee: ${dollars(processingFee)} | Total before taxes: ${dollars(adoptionFee + processingFee)}`;
petSummary.append(summaryTitle, summaryPet, summaryFees);

const submitButton = document.getElementById('submitApp');
const agreements = [...applicationForm.querySelectorAll('input[type="checkbox"]')];
function updateSubmitState() {
  submitButton.disabled = !agreements.every((checkbox) => checkbox.checked);
}
agreements.forEach((checkbox) => checkbox.addEventListener('change', updateSubmitState));
updateSubmitState();

applicationForm.addEventListener('submit', (event) => {
  event.preventDefault();
  if (!applicationForm.reportValidity() || !agreements.every((checkbox) => checkbox.checked)) return;
  const applicant = {
    petId: applicationParams.get('petId'),
    shelterId: applicationParams.get('shelterId'),
    name: document.getElementById('fullName').value.trim(),
    email: document.getElementById('email').value.trim(),
    phone: document.getElementById('phone').value.trim(),
    address: document.getElementById('address').value.trim(),
    residents: document.getElementById('residents').value,
    currentPets: document.getElementById('currentPets').value.trim(),
    experience: document.getElementById('experience').value,
    location: document.getElementById('livingPlace').value,
    donation: document.getElementById('donation').value.replace('$', '')
  };

  submitButton.disabled = true;
  applicationMessage.textContent = 'Submitting your application…';
  fetch('/submit-application', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(applicant)
  })
    .then((response) => response.json().then((data) => {
      if (!response.ok) throw new Error(data.error || 'The application could not be submitted.');
      return data;
    }))
    .then(() => {
      const message = document.createElement('section');
      message.className = 'submission-success';
      const heading = document.createElement('h2');
      heading.textContent = 'Application submitted successfully!';
      const thanks = document.createElement('p');
      thanks.textContent = 'Thank you for applying. We will review your application and contact you soon.';
      const homeButton = document.createElement('button');
      homeButton.type = 'button';
      homeButton.textContent = 'Return to Home';
      homeButton.addEventListener('click', () => { window.location.href = '/'; });
      message.append(heading, thanks, homeButton);
      applicationMessage.replaceChildren();
      applicationForm.replaceWith(message);
    })
    .catch((error) => {
      applicationMessage.textContent = error.message;
      submitButton.disabled = false;
      updateSubmitState();
    });
});
