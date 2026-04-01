const API = "https://api.fbi.gov/wanted/v1/list";

let data = [];
let page = 1;
let totalPages = 1;
let fav = JSON.parse(localStorage.getItem("fav")) || [];
let currentView = "home";


document.getElementById("nav").innerHTML = `
  <h2>TraceX</h2>

  <div>
    <button onclick="switchView('home')">Home</button>
    <button onclick="switchView('fav')">Favorites</button>
    <button onclick="switchView('about')">About</button>

    <input id="search" placeholder="Search">

    <select id="sort">
      <option value="">Sort</option>
      <option value="az">A-Z</option>
      <option value="za">Z-A</option>
    </select>

    <select id="country">
      <option value="">All Nationalities</option>
    </select>

    <button id="theme">🌙</button>
  </div>
`;


async function load() {
  let main = document.getElementById("main");
  main.innerHTML = "<h2>Loading...</h2>";

  try {
    let res = await fetch(`${API}?page=${page}`);
    let json = await res.json();

    data = json.items;
    totalPages = Math.ceil(json.total / 50);

    fillCountries();
    render(data);
  } catch {
    main.innerHTML = "<h2>Error loading data</h2>";
  }
}

load();


function render(arr) {
  if (currentView !== "home") return;

  let main = document.getElementById("main");

  main.innerHTML = `
    <div class="grid"></div>
    <div class="pagination">
      <button onclick="prev()">⬅</button>
      Page ${page} / ${totalPages}
      <button onclick="next()">➡</button>
    </div>
  `;

  let grid = main.querySelector(".grid");

  arr.map(i => {
    let card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `
      <img src="${i.images?.[0]?.original || ''}">
      <h4>${i.title}</h4>
      <p>${i.subjects?.join(", ") || ""}</p>

      <button onclick='openModal(${JSON.stringify(i)})'>More Info</button>
      <button onclick='pdf("${i.files?.[0]?.url || ""}")'>PDF</button>
      <button onclick='addFav(${JSON.stringify(i)})'>❤️</button>
    `;

    grid.appendChild(card);
  });
}


document.getElementById("search").oninput = e => {
  let v = e.target.value.toLowerCase();

  let filtered = data.filter(i =>
    i.title?.toLowerCase().includes(v) ||
    i.subjects?.join().toLowerCase().includes(v) ||
    i.nationality?.toLowerCase().includes(v)
  );

  render(filtered);
};


document.getElementById("sort").onchange = e => {
  let val = e.target.value;

  let sorted = [...data].sort((a,b)=>
    val === "az"
      ? a.title.localeCompare(b.title)
      : b.title.localeCompare(a.title)
  );

  render(sorted);
};


function fillCountries() {
  let c = document.getElementById("country");

  let list = [...new Set(data.map(i=>i.nationality).filter(Boolean))];

  c.innerHTML = `<option value="">All Nationalities</option>`;

  list.map(n=>{
    let o = document.createElement("option");
    o.value = n;
    o.textContent = n;
    c.appendChild(o);
  });
}

document.getElementById("country").onchange = e => {
  let val = e.target.value;

  let filtered = val
    ? data.filter(i=>i.nationality===val)
    : data;

  render(filtered);
};


function next() {
  if (page < totalPages) {
    page++;
    load();
  }
}

function prev() {
  if (page > 1) {
    page--;
    load();
  }
}


function openModal(i) {
  document.getElementById("modal").style.display = "flex";

  document.getElementById("modalBox").innerHTML = `
    <button onclick="closeModal()">X</button>
    <img src="${i.images?.[0]?.original || ''}">
    <h2>${i.title}</h2>
    <p><b>Crime:</b> ${i.subjects?.join(", ")}</p>
    <p>${i.description || ""}</p>
    <p><b>Reward:</b> ${i.reward_text || "N/A"}</p>
  `;
}

function closeModal() {
  document.getElementById("modal").style.display = "none";
}


function pdf(url) {
  if (url) window.open(url);
}


function addFav(i) {
  if (!fav.find(f => f.uid === i.uid)) {
    fav.push(i);
    localStorage.setItem("fav", JSON.stringify(fav));
  }
}


function switchView(v) {
  currentView = v;
  let main = document.getElementById("main");

  if (v === "fav") {
    main.innerHTML = "<h2>Favorites</h2>";

    fav.map(i=>{
      let d = document.createElement("div");
      d.className = "card";
      d.innerHTML = `<h4>${i.title}</h4>`;
      main.appendChild(d);
    });
  }
  else if (v === "about") {
    main.innerHTML = "<h2>About</h2><p>FBI Wanted Tracker Project</p>";
  }
  else {
    render(data);
  }
}


document.getElementById("theme").onclick = () => {
  document.body.classList.toggle("light");
};