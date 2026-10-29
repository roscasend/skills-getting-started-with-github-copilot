document.addEventListener("DOMContentLoaded", () => {
  const activitiesList = document.getElementById("activities-list");
  const activitySelect = document.getElementById("activity");
  const signupForm = document.getElementById("signup-form");
  const messageDiv = document.getElementById("message");

  function createDetail(label, value) {
    const paragraph = document.createElement("p");
    const labelElement = document.createElement("strong");
    labelElement.textContent = `${label}:`;
    paragraph.append(labelElement, ` ${value}`);
    return paragraph;
  }

  // Function to fetch activities from API
  async function fetchActivities() {
    try {
      const response = await fetch("/activities", { cache: "no-store" });
      if (!response.ok) {
        throw new Error("Failed to fetch activities");
      }
      const activities = await response.json();

      // Clear loading message
      activitiesList.replaceChildren();
      while (activitySelect.options.length > 1) {
        activitySelect.remove(1);
      }

      // Populate activities list
      Object.entries(activities).forEach(([name, details]) => {
        const activityCard = document.createElement("div");
        activityCard.className = "activity-card";

        const spotsLeft = details.max_participants - details.participants.length;
        const title = document.createElement("h4");
        title.textContent = name;
        const description = document.createElement("p");
        description.textContent = details.description;

        const participantSection = document.createElement("div");
        participantSection.className = "participant-section";
        const participantHeading = document.createElement("h5");
        participantHeading.textContent = `Participants (${details.participants.length})`;
        const participantList = document.createElement("ul");
        participantList.className = "participant-list";
        details.participants.forEach((email) => {
          const participant = document.createElement("li");
          const participantName = document.createElement("span");
          participantName.className = "participant-name";
          participantName.textContent = email;

          const removeButton = document.createElement("button");
          removeButton.className = "remove-participant";
          removeButton.type = "button";
          removeButton.textContent = "\u{1F5D1}";
          removeButton.setAttribute("aria-label", `Remove ${email} from ${name}`);
          removeButton.title = `Remove ${email}`;
          removeButton.addEventListener("click", async () => {
            try {
              const response = await fetch(
                `/activities/${encodeURIComponent(name)}/signup?email=${encodeURIComponent(email)}`,
                { method: "DELETE" }
              );
              const result = await response.json();

              if (!response.ok) {
                throw new Error(result.detail || "Failed to remove participant");
              }

              messageDiv.textContent = result.message;
              messageDiv.className = "success";
              messageDiv.classList.remove("hidden");
              await fetchActivities();
            } catch (error) {
              messageDiv.textContent = error.message || "Failed to remove participant";
              messageDiv.className = "error";
              messageDiv.classList.remove("hidden");
              console.error("Error removing participant:", error);
            }
          });

          participant.append(participantName, removeButton);
          participantList.appendChild(participant);
        });
        participantSection.append(participantHeading, participantList);
        if (details.participants.length === 0) {
          const emptyState = document.createElement("p");
          emptyState.className = "empty-participants";
          emptyState.textContent = "No students signed up yet";
          participantSection.appendChild(emptyState);
        }

        activityCard.append(
          title,
          description,
          createDetail("Schedule", details.schedule),
          createDetail("Availability", `${spotsLeft} spots left`),
          participantSection
        );

        activitiesList.appendChild(activityCard);

        // Add option to select dropdown
        const option = document.createElement("option");
        option.value = name;
        option.textContent = name;
        activitySelect.appendChild(option);
      });
    } catch (error) {
      activitiesList.innerHTML = "<p>Failed to load activities. Please try again later.</p>";
      console.error("Error fetching activities:", error);
    }
  }

  // Handle form submission
  signupForm.addEventListener("submit", async (event) => {
    event.preventDefault();

    const email = document.getElementById("email").value;
    const activity = document.getElementById("activity").value;

    try {
      const response = await fetch(
        `/activities/${encodeURIComponent(activity)}/signup?email=${encodeURIComponent(email)}`,
        {
          method: "POST",
        }
      );

      const result = await response.json();

      if (response.ok) {
        messageDiv.textContent = result.message;
        messageDiv.className = "success";
        signupForm.reset();
        await fetchActivities();
      } else {
        messageDiv.textContent = result.detail || "An error occurred";
        messageDiv.className = "error";
      }

      messageDiv.classList.remove("hidden");

      // Hide message after 5 seconds
      setTimeout(() => {
        messageDiv.classList.add("hidden");
      }, 5000);
    } catch (error) {
      messageDiv.textContent = "Failed to sign up. Please try again.";
      messageDiv.className = "error";
      messageDiv.classList.remove("hidden");
      console.error("Error signing up:", error);
    }
  });

  // Initialize app
  fetchActivities();
});
