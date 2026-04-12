const API = "https://trace-api-quqk.onrender.com/api/data"; 

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
`
fillCountries()
async function load() {
  let main = document.getElementById("main")
  main.innerHTML = "<h2>Loading all data...</h2>"

  try {
    data = []
    let currentPage = 1
    let hasMore = true

    while (hasMore) {
      let res = await fetch(`${API}?page=${currentPage}`)
      let json = await res.json()
      let pageData = json.data || json.items || []
      if (pageData.length === 0) {
        hasMore = false;  
      } else {
        data = data.concat(pageData)
        currentPage++
      }
    }
    data = Array.from(new Map(data.map(i => [i.uid || i.title, i])).values())
    console.log("TOTAL LOADED:", data.length)
    totalPages = Math.ceil(data.length / 102)
    page = 1
    render(data.slice(0, 102))
    } catch (err) {
    console.error(err)
    main.innerHTML = "<h2>Error loading data</h2>"
  }
}
load();

function render(arr) {
  let main = document.getElementById("main")
  main.innerHTML = `
    <div class="grid"></div>
    <div class="pagination">
      <button onclick="prev()">⬅</button>
      Page ${page} / ${totalPages}
      <button onclick="next()">➡</button>
    </div>
  `
  let grid = main.querySelector(".grid");

  arr = arr.filter(i => i.title && typeof i.title === "string");
  arr.forEach((i) => {
    let card = document.createElement("div");
    card.className = "card";

    card.innerHTML = `  <h4>${(i.title || "No Title").slice(0, 40)}</h4>
                        <p>${Array.isArray(i.subjects) ? i.subjects.join(", ") : ""}</p>  
                        <button class="infoBtn">More Info</button>
                        <button onclick='pdf("${i.files?.[0]?.url || ""}")'>PDF</button>
                        <button class="favBtn">❤️</button>`

      card.querySelector(".infoBtn").onclick = () => openModal(i)
      card.querySelector(".favBtn").onclick = () => toggleFav(i)
      grid.appendChild(card)
  })
}
document.getElementById("search").oninput = e => {
  let v = e.target.value.toLowerCase();
  let filtered = data.filter(i =>
  i.title &&
  (
    i.title.toLowerCase().includes(v) ||
    i.subjects?.join().toLowerCase().includes(v) ||
    i.nationality?.toLowerCase().includes(v)
  )
);
page = 1;
totalPages = Math.ceil(filtered.length / 102)
render(filtered.slice(0, 102))
};

document.getElementById("sort").onchange = e => {
  let val = e.target.value
  let sorted = [...data].sort((a, b) =>
    val === "az"
      ? (a.title || "").localeCompare(b.title || "")
      : (b.title || "").localeCompare(a.title || "")
  )
    render(sorted)
}

function fillCountries() {
  let c = document.getElementById("country")
  let countries = [
    "Indian", "United States", "United Kingdom", "Canada", "Australia",
    "Germany", "France", "Italy", "Spain", "Netherlands",
    "Brazil", "Mexico", "Argentina", "South Africa", "Nigeria",
    "China", "Japan", "South Korea", "Russia", "Turkey",
    "Saudi Arabia", "UAE", "Indonesia", "Pakistan", "Bangladesh"
  ]
  c.innerHTML = `<option value="">All Nationalities</option>`

  countries.forEach(n => {
    let o = document.createElement("option")
    o.value = n
    o.textContent = n
    c.appendChild(o)
  })
}
function getNationality(i) {
  return (
    i.nationality ||
    i.country ||
    i.place_of_birth ||
    i.description ||
    ""
  ).toLowerCase();
}
document.getElementById("country").onchange = e => {
  let val = e.target.value

  let filtered = val
    ? data.filter(i => {
  let n = getNationality(i)

  let map = {
    "india": ["india", "indian"],   "united states": ["united states", "usa", "us", "american"],
    "united kingdom": ["uk", "british", "england"], "canada": ["canada", "canadian"],
    "australia": ["australia", "australian"], "germany": ["germany", "german"],
    "france": ["france", "french"], "italy": ["italy", "italian"], "spain": ["spain", "spanish"],
    "netherlands": ["netherlands", "dutch"],
    "brazil": ["brazil", "brazilian"],
    "mexico": ["mexico", "mexican"],
    "argentina": ["argentina", "argentinian"],
    "south africa": ["south africa"],
    "nigeria": ["nigeria", "nigerian"],
    "china": ["china", "chinese"],
    "japan": ["japan", "japanese"],
    "south korea": ["korea", "korean"],
    "russia": ["russia", "russian"],
    "turkey": ["turkey", "turkish"],
    "saudi arabia": ["saudi"],
    "uae": ["uae", "emirati"],
    "indonesia": ["indonesia", "indonesian"],
    "pakistan": ["pakistan", "pakistani"],
    "bangladesh": ["bangladesh", "bangladeshi"]
  }
  return map[val.toLowerCase()]?.some(x => n.includes(x))
})
    : data
  page = 1
  totalPages = Math.ceil(filtered.length / 102)
  render(filtered.slice(0, 102))
  }
function next() {
  if (page < totalPages) {
    page++
    let start = (page - 1) * 102;
    let source = currentView === "fav" ? fav : data
    render(source.slice(start, start + 102))
  }
}
function prev() {
  if (page > 1) {
    page--
    let start = (page - 1) * 102
    let source = currentView === "fav" ? fav : data
    render(source.slice(start, start + 102))
  }
}
function openModal(i) {
  document.getElementById("modal").style.display = "flex"

  document.getElementById("modalBox").innerHTML = `
    <button onclick="closeModal()">X</button>
    
    <h2>${i.title}</h2>
    <p><b>Crime:</b> ${i.subjects?.join(", ")}</p>
    <p>${i.description || ""}</p>
    <p><b>Reward:</b> ${i.reward_text || "N/A"}</p>`
}
function closeModal() {
  document.getElementById("modal").style.display = "none"
}
function pdf(url) {
  if (!url) {
    alert("No PDF available");
    return;
  }
  window.open(url, "_blank", "noopener,noreferrer")
}
function toggleFav(i) {
  let index = fav.findIndex(f => f.uid === i.uid);
  if (index !== -1) {
    fav.splice(index, 1);
  } else {
    fav.push(i);
  }
  localStorage.setItem("fav", JSON.stringify(fav));
}

function switchView(v) {
  currentView = v;
  let main = document.getElementById("main");

  if (v === "fav") {
  page = 1;
  totalPages = Math.ceil(fav.length / 102) || 1;
  render(fav.slice(0, 102));
  } else {
    page = 1;
    render(data.slice(0, 102));
  }
}

document.getElementById("theme").onclick = () => {
  document.body.classList.toggle("light");
};