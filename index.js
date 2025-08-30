document.addEventListener("DOMContentLoaded", () => {
  const resultsContainer = document.querySelector(".search-results");
  const searchInput = document.getElementById("search-bar");
  let allApps = []; // cache of all apps

  fetch("https://raw.githubusercontent.com/PWebGames/apps/refs/heads/main/apps.json")
    .then(response => response.json())
    .then(apps => {
      resultsContainer.innerHTML = ""; 

      const promises = apps.map(app =>
        fetch(new URL("manifest.json", app.url))
          .then(res => {
            if (!res.ok) throw new Error("Manifest not reachable");
            return res.json();
          })
          .then(manifest => {
            const appName = manifest.name || manifest.short_name || app.name;
            const icon = getCachedIcon(app.url) ||
              (manifest.icons && manifest.icons.length > 0
                ? new URL(manifest.icons[0].src, app.url).href
                : app.icon);

            // cache icon if new
            if (icon) cacheIcon(app.url, icon);

            return {
              name: appName,
              developer: app.developer,
              icon,
              url: app.url
            };
          })
          .catch(() => {
            // fallback to JSON-provided values
            const icon = getCachedIcon(app.url) || app.icon;
            return {
              name: app.name,
              developer: app.developer,
              icon,
              url: app.url
            };
          })
      );

      Promise.all(promises).then(appData => {
        allApps = appData;
        renderApps(allApps);
      });
    })
    .catch(error => console.error("Error loading apps.json:", error));

  function renderApps(apps) {
    resultsContainer.innerHTML = "";
    if (apps.length === 0) {
      resultsContainer.textContent = "No apps found.";
      return;
    }

    apps.forEach(app => {
      const item = document.createElement("div");
      item.classList.add("result-item");

      item.innerHTML = `
        <img src="${app.icon}" class="app-icon">
        <div class="app-info">
          <div class="app-name">${app.name}</div>
          <div class="developer">${app.developer}</div>
        </div>
        <a class="get-btn" href="${app.url}" target="_blank">OPEN</a>
      `;

      resultsContainer.appendChild(item);
    });
  }

  function cacheIcon(url, iconUrl) {
    try {
      const cache = JSON.parse(localStorage.getItem("appIcons")) || {};
      cache[url] = iconUrl;
      localStorage.setItem("appIcons", JSON.stringify(cache));
    } catch (e) {
      console.warn("Icon cache failed:", e);
    }
  }

  function getCachedIcon(url) {
    try {
      const cache = JSON.parse(localStorage.getItem("appIcons")) || {};
      return cache[url] || null;
    } catch {
      return null;
    }
  }

  // Search filter
  searchInput.addEventListener("input", e => {
    const query = e.target.value.toLowerCase();
    const filtered = allApps.filter(app =>
      app.name.toLowerCase().includes(query) ||
      app.developer.toLowerCase().includes(query)
    );
    renderApps(filtered);
  });
});