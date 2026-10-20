// Populate the About page from the supplied data object.

const missionText = document.getElementById("missionText")
missionText.textContent = aboutData.mission;

const teamDescription = document.getElementById("teamDescription");
teamDescription.textContent = aboutData.teamDescription;

const teamContainer = document.getElementById("teamContainer");
aboutData.team.forEach((member) => {
  const card = document.createElement("article");
  card.className = "team-card";

  const name = document.createElement("h3");
  name.textContent = member.name;

  const role = document.createElement("p");
  role.className = "role";
  role.textContent = member.role;
  
  const info = document.createElement("p");
  info.className = "info";
  info.textContent = `${member.experience} · ${member.qualifications}`;

  card.append(name, role, info);
  teamContainer.appendChild(card);
});
