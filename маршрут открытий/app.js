/* данные каталога */
const ROUTES = [
  {
    id:"sunrise", title:"Набережная рассветов", emoji:"🌅", tag:"Набережная",
    hours:1.5, km:4, level:"Легко", c1:"#f7c07a", c2:"#d1603d",
    short:"Плоская прогулка вдоль воды: маяк, мосты и утренний город без спешки.",
    desc:"Маршрут начинается у старого маяка и идёт по широкой набережной в сторону центра. Покрытие ровное, асфальт и деревянные настилы, поэтому прогулка подойдёт даже для коляски. По пути — четыре смотровых точки на воду и несколько кофеен, открывающихся с семи утра.",
    highlights:["Старый маяк и его винтовая лестница","Мост влюблённых с лентами на перилах","Рыбацкий причал с лодками","Кофейня «Причал» с видом на реку"],
    stops:[["07:00","Старый маяк"],["07:25","Мост влюблённых"],["07:50","Рыбацкий причал"],["08:15","Кофейня «Причал»"]]
  },
  {
    id:"oldtown", title:"Старый город: семь ворот", emoji:"🏛", tag:"История",
    hours:2.5, km:6, level:"Средне", c1:"#c8a97e", c2:"#7b5e3b",
    short:"Семь исторических ворот, мощёные переулки и дворики купеческих домов.",
    desc:"Кольцевой маршрут по историческому центру. Вы последовательно проходите через семь сохранившихся городских ворот, каждые из которых отмечены табличкой с годом постройки. Между воротами — тихие переулки, внутренние дворики и маленькие музеи, куда можно зайти бесплатно.",
    highlights:["Семь аутентичных городских ворот","Купеческие дворики XVIII века","Дом с флюгером-драконом","Бесплатный музей городского быта"],
    stops:[["10:00","Северные ворота"],["10:40","Купеческий двор"],["11:20","Дом с флюгером"],["12:00","Южные ворота"]]
  },
  {
    id:"pine", title:"Тихая тропа соснового бора", emoji:"🌲", tag:"Природа",
    hours:2, km:5.5, level:"Легко", c1:"#7fb069", c2:"#2f6b46",
    short:"Лесная тропа по мягкому грунту: сосны, белки и запах хвои.",
    desc:"Прогулочная тропа по краю соснового бора с выходом к небольшому озеру. Грунтовое покрытие с корнями — удобно в кроссовках, но не для колясок. На маршруте есть три скамейки с навесом и кормушки для белок: их можно покормить нежареными орехами.",
    highlights:["Вековые сосны и лесной воздух","Озеро с деревянным настилом","Кормушки для белок","Тихие скамейки с навесом"],
    stops:[["09:00","Вход в бор"],["09:35","Скамейка у ручья"],["10:10","Озеро и настил"],["10:45","Выход к парковке"]]
  },
  {
    id:"hills", title:"Смотровые площадки трёх холмов", emoji:"⛰", tag:"Панорамы",
    hours:3.5, km:9, level:"Сложно", c1:"#7f9fd4", c2:"#2d4a7a",
    short:"Самый длинный маршрут: три холма, три панорамы и 9 километров пути.",
    desc:"Маршрут для тех, кто готов к подъёмам: три холма с перепадом высот до 90 метров. На каждом — оборудованная смотровая площадка с описанием видимых объектов. Между холмами тропа идёт через лесопарк с питьевыми фонтанчиками. Рекомендуем треккинговые кроссовки и воду.",
    highlights:["Три смотровые площадки с панорамой города","Перепад высот до 90 метров","Питьевые фонтанчики на тропе","Лесопарк с вековыми дубами"],
    stops:[["11:00","Первый холм"],["12:00","Второй холм"],["13:00","Привал у родника"],["13:45","Третий холм"]]
  },
  {
    id:"botan", title:"Ботанический квартал", emoji:"🌸", tag:"Парк",
    hours:1, km:2.5, level:"Легко", c1:"#f0a6c8", c2:"#9c4a7e",
    short:"Самый короткий маршрут: цветники, оранжерея и тихие аллеи.",
    desc:"Компактный маршрут по ботаническому саду квартала. За час вы проходите через четыре тематические зоны: розарий, японский сад, оранжерею с тропическими растениями и аллею сирени. Вход свободный, оранжерея работает до 18:00.",
    highlights:["Розарий с 60 сортами","Японский сад с прудом","Оранжерея тропических растений","Аллея сирени"],
    stops:[["12:00","Розарий"],["12:20","Японский сад"],["12:40","Оранжерея"],["12:55","Аллея сирени"]]
  },
  {
    id:"art", title:"Арт-переулки и стрит-арт", emoji:"🎨", tag:"Искусство",
    hours:1.5, km:3.5, level:"Легко", c1:"#b48ce0", c2:"#5b3d8f",
    short:"Муралы, галереи в подворотнях и самая фотогеничная стена города.",
    desc:"Маршрут по кварталу, где фабричные стены превратились в галерею стрит-арта. Каждый мурал снабжён QR-кодом с историей создания. По пути — три маленькие галереи с бесплатным входом и кофейня с виниловыми пластинками.",
    highlights:["12 муралов с QR-историями","Галерея в бывшем цеху","Самая фотогеничная стена города","Кофейня с винилом"],
    stops:[["15:00","Мурал «Полёт»"],["15:25","Галерея в цеху"],["15:50","Переулок зеркал"],["16:15","Кофейня с винилом"]]
  },
  {
    id:"bridges", title:"Кольцо старых мостов", emoji:"🌉", tag:"Архитектура",
    hours:2.5, km:7, level:"Средне", c1:"#84b8c9", c2:"#2a5f73",
    short:"Пять мостов XIX века, чугунные перила и лучшие виды на реку.",
    desc:"Кольцевой маршрут по пяти историческим мостам города. Каждый мост — свой стиль: чугунное литьё, каменные арки, клёпаные фермы. Между мостами маршрут идёт по набережным с удобными спусками. Часть пути — лестницы, поэтому маршрут не подходит для колясок.",
    highlights:["Пять мостов XIX–XX веков","Чугунные перила с узором","Спуски к воде","Вид на город с середины реки"],
    stops:[["14:00","Чугунный мост"],["14:35","Каменная арка"],["15:10","Клёпаная ферма"],["15:50","Мост с фонарями"]]
  },
  {
    id:"sunset", title:"Закатная тропа над рекой", emoji:"🌇", tag:"Панорамы",
    hours:2, km:5, level:"Средне", c1:"#f6a15c", c2:"#8e3b5e",
    short:"Вечерний маршрут по высокому берегу — встречать закат над водой.",
    desc:"Маршрут рассчитан на вечер: тропа идёт по высокому берегу реки и выводит к двум площадкам, откуда открывается лучший в городе вид на закат. Покрытие — грунт и деревянные настилы, есть перила на опасных участках. Возьмите с собой плед: на верхней площадке есть настил для сидения.",
    highlights:["Две закатные площадки","Деревянные настилы с перилами","Тихий высокий берег","Настил для пикника наверху"],
    stops:[["19:00","Спуск к реке"],["19:30","Нижняя площадка"],["20:00","Верхняя площадка"],["20:30","Обратный путь"]]
  },
  {
    id:"fairy", title:"Тропа сказок для всей семьи", emoji:"🧚", tag:"Семья",
    hours:1, km:2, level:"Легко", c1:"#8ed6a5", c2:"#2f8a63",
    short:"Короткий маршрут с деревянными скульптурами и заданиями для детей.",
    desc:"Самый короткий и самый семейный маршрут: два километра по парку с девятью деревянными скульптурами сказочных персонажей. У каждой скульптуры — табличка с маленьким заданием для ребёнка. Покрытие ровное, есть лавочки и туалет на входе.",
    highlights:["9 деревянных скульптур","Задания для детей у каждой точки","Ровное покрытие для коляски","Лавочки и туалет на входе"],
    stops:[["11:00","Вход в парк"],["11:20","Скульптура Лешего"],["11:40","Поляна Русалки"],["12:00","Финиш у фонтана"]]
  },
  {
    id:"night", title:"Ночная подсветка центра", emoji:"✨", tag:"Вечер",
    hours:1.5, km:4, level:"Легко", c1:"#7b7fd4", c2:"#2b2b5e",
    short:"Город после заката: подсвеченные фасады, фонари и пустые площади.",
    desc:"Вечерний маршрут по центру, когда включается архитектурная подсветка. За полтора часа вы проходите через пять подсвеченных объектов: театр, ратушу, старую водонапорную башню, собор и городскую площадь. Тротуары освещены, маршрут безопасен и подходит для неспешной прогулки.",
    highlights:["Архитектурная подсветка фасадов","Пять объектов в вечернем свете","Тихие площади без толпы","Освещённые тротуары"],
    stops:[["21:00","Театральная площадь"],["21:20","Ратуша"],["21:40","Водонапорная башня"],["22:00","Собор и площадь"]]
  }
];

const DURS = [
  {k:"all", t:"Любая длительность"},
  {k:"up1", t:"До 1 часа"},
  {k:"1-2", t:"1–2 часа"},
  {k:"2-3", t:"2–3 часа"},
  {k:"3p",  t:"Более 3 часов"}
];

/* состояние + localstorage */
const state = { view:"home", id:null, q:"", dur:"all", sort:"default", favOnly:false };

let favs = new Set();
try {
  const raw = JSON.parse(localStorage.getItem("mro-favs") || "[]");
  if (Array.isArray(raw)) favs = new Set(raw.filter(x => ROUTES.some(r => r.id === x)));
} catch (e) { favs = new Set(); }

function saveFavs(){
  try { localStorage.setItem("mro-favs", JSON.stringify([...favs])); }
  catch (e) { /* приватный режим — просто игнорируем */ }
}

/* хелперы */
const $ = s => document.querySelector(s);
const esc = s => String(s).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");
const fmtH = h => String(h).replace(".", ",") + " ч";
const lvlCls = l => l === "Легко" ? "easy" : l === "Средне" ? "med" : "hard";

/* SVG-обложка из цветов маршрута - без внешних картинок */
function cover(r){
  const svg =
  `<svg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 400 240' preserveAspectRatio='xMidYMid slice'>
     <defs>
       <linearGradient id='g' x1='0' y1='0' x2='0.5' y2='1'>
         <stop offset='0' stop-color='${r.c1}'/><stop offset='1' stop-color='${r.c2}'/>
       </linearGradient>
     </defs>
     <rect width='400' height='240' fill='url(#g)'/>
     <circle cx='316' cy='58' r='30' fill='#ffffff' opacity='0.22'/>
     <path d='M0 172 C 60 132 112 154 162 144 C 222 132 262 164 322 148 C 362 138 382 152 400 144 L400 240 L0 240 Z' fill='rgba(255,255,255,0.10)'/>
     <path d='M0 198 C 70 170 122 192 182 184 C 252 174 302 198 400 178 L400 240 L0 240 Z' fill='rgba(0,0,0,0.16)'/>
   </svg>`;
  return `url("data:image/svg+xml,${encodeURIComponent(svg)}")`;
}

/* тема */
function setTheme(t){
  document.documentElement.setAttribute("data-theme", t);
  try { localStorage.setItem("mro-theme", t); } catch (e) {}
  const btn = $("#themeBtn");
  if (btn) btn.setAttribute("aria-label", t === "dark" ? "Включить светлую тему" : "Включить тёмную тему");
}
function initTheme(){
  /* Тема уже применена в theme-init.js; здесь только синхронизируем aria-подпись кнопки */
  const cur = document.documentElement.getAttribute("data-theme") || "light";
  setTheme(cur);
}

/* фильтрация и сортировка */
function getList(){
  const q = state.q.trim().toLowerCase();
  let list = ROUTES.filter(r => {
    if ((state.view === "favorites" || state.favOnly) && !favs.has(r.id)) return false;

    if (state.dur !== "all") {
      const h = r.hours;
      const ok =
        state.dur === "up1" ? h <= 1 :
        state.dur === "1-2" ? (h > 1 && h <= 2) :
        state.dur === "2-3" ? (h > 2 && h <= 3) : h > 3;
      if (!ok) return false;
    }

    if (q) {
      const hay = (r.title + " " + r.tag + " " + r.short + " " + r.desc + " " +
                   r.highlights.join(" ") + " " + r.level + " " + r.km).toLowerCase();
      if (!hay.includes(q)) return false;
    }
    return true;
  });

  if (state.sort === "asc")  list.sort((a,b) => a.hours - b.hours);
  if (state.sort === "desc") list.sort((a,b) => b.hours - a.hours);
  if (state.sort === "name") list.sort((a,b) => a.title.localeCompare(b.title, "ru"));
  return list;
}

/* шаблоны */
function cardHTML(r, animate, index){
  const on = favs.has(r.id);
  const anim = animate ? " card-anim" : "";
  const styleAttr = animate ? ` style="--i:${index}"` : "";
  return `
  <article class="card${anim}"${styleAttr} tabindex="0" data-act="open" data-id="${r.id}" aria-label="${esc(r.title)}">
    <div class="cover">
      <div class="bg" style="background-image:${cover(r)}"></div>
      <span class="emoji" aria-hidden="true">${r.emoji}</span>
      <span class="tagbadge">${esc(r.tag)}</span>
      <button class="fav-btn ${on?"on":""}" data-act="fav" data-id="${r.id}"
              aria-label="${on?"Убрать из избранного":"Добавить в избранное"}"
              title="${on?"Убрать из избранного":"Добавить в избранное"}">${on?"♥":"♡"}</button>
    </div>
    <div class="body">
      <h3>${esc(r.title)}</h3>
      <p class="short">${esc(r.short)}</p>
      <div class="meta">
        <span>⏱ ${fmtH(r.hours)}</span>
        <span>📍 ${String(r.km).replace(".",",")} км</span>
        <span class="lvl ${lvlCls(r.level)}">${esc(r.level)}</span>
      </div>
    </div>
  </article>`;
}

function resultsHTML(animate){
  const list = getList();
  if (!list.length) {
    const favView = state.view === "favorites";
    return `<div class="empty" style="grid-column:1/-1">
      <div class="big">${favView ? "💔" : "🔍"}</div>
      <h3>${favView ? "В избранном пока пусто" : "Ничего не нашлось"}</h3>
      <p>${favView
          ? "Нажмите на сердечко у маршрута в каталоге — он появится здесь."
          : "Попробуйте изменить запрос или выбрать другую длительность."}</p>
      <button class="btn primary" data-act="${favView ? "nav" : "reset"}" ${favView ? 'data-view="catalog"' : ""}>
        ${favView ? "Перейти в каталог" : "Сбросить фильтры"}
      </button>
    </div>`;
  }
  return list.map((r, i) => cardHTML(r, animate, i)).join("");
}

/* главная */
function homeHTML(){
  const featured = ["sunrise", "hills", "art"]
    .map(id => ROUTES.find(r => r.id === id))
    .filter(Boolean);

  return `<div class="wrap">
    <section class="hero">
      <h1>Маршрут открытий</h1>
      <p>Десять прогулочных маршрутов по городу и его окрестностям: от часа до трёх с половиной,
         от ровной набережной до трёх холмов. Выбирайте по длительности, сохраняйте в избранное.</p>
      <div class="hero-actions">
        <button class="btn light" data-act="nav" data-view="catalog">Открыть каталог</button>
        <button class="btn ghost" data-act="random">🎲 Случайный маршрут</button>
      </div>
    </section>

    <div class="stats">
      <div class="stat"><b>${ROUTES.length}</b><span>маршрутов</span></div>
      <div class="stat"><b>${ROUTES.reduce((s,r)=>s+r.km,0).toFixed(1).replace(".",",")}</b><span>км троп</span></div>
      <div class="stat"><b>${new Set(ROUTES.map(r=>r.tag)).size}</b><span>тем прогулок</span></div>
      <div class="stat"><b>0 ₽</b><span>всегда бесплатно</span></div>
    </div>

    <div class="section-title">
      <h2>Популярные маршруты</h2>
      <button class="link" data-act="nav" data-view="catalog">Весь каталог →</button>
    </div>
    <div class="grid">
      ${featured.map((r, i) => cardHTML(r, true, i)).join("")}
    </div>

    <div class="section-title" style="margin-top:36px"><h2>Как выбрать маршрут</h2></div>
    <div class="steps">
      <div class="step">
        <div class="n">1</div>
        <h3>Задайте время</h3>
        <p>В каталоге есть фильтр по длительности: до часа, 1–2, 2–3 и больше трёх часов.</p>
      </div>
      <div class="step">
        <div class="n">2</div>
        <h3>Найдите по интересу</h3>
        <p>Поиск ищет по названию, теме, сложности и описанию — например, «мосты» или «закат».</p>
      </div>
      <div class="step">
        <div class="n">3</div>
        <h3>Сохраните в избранное</h3>
        <p>Сердечко на карточке запомнит маршрут — регистрация не нужна.</p>
      </div>
    </div>
  </div>`;
}

/* каталог/избранное */
function listHTML(){
  const isFav = state.view === "favorites";
  return `<div class="wrap">
    <div class="pagehead">
      <h1>${isFav ? "Избранное" : "Каталог маршрутов"}</h1>
      <p class="sub">${isFav
        ? "Маршруты, которые вы сохранили. Список хранится в этом браузере."
        : "Найдите прогулку по длительности и интересам. Все маршруты бесплатные и без записи."}</p>
    </div>

    <div class="toolbar">
      <div class="search">
        <span class="sicon" aria-hidden="true">🔍</span>
        <input id="q" type="search" data-act="search" autocomplete="off"
               placeholder="Поиск: название, тема, «мосты», «закат», «семья»…"
               aria-label="Поиск маршрутов" value="${esc(state.q)}">
      </div>

      <div class="chips" role="group" aria-label="Фильтр по длительности">
        ${DURS.map(d => `<button class="chip ${state.dur===d.k?"on":""}"
            data-act="dur" data-k="${d.k}" aria-pressed="${state.dur===d.k}">${d.t}</button>`).join("")}
      </div>

      <div class="controls">
        <select data-act="sort" aria-label="Сортировка маршрутов">
          <option value="default"${state.sort==="default"?" selected":""}>По умолчанию</option>
          <option value="asc"${state.sort==="asc"?" selected":""}>Длительность ↑</option>
          <option value="desc"${state.sort==="desc"?" selected":""}>Длительность ↓</option>
          <option value="name"${state.sort==="name"?" selected":""}>По названию</option>
        </select>

        ${isFav ? "" : `<button class="toggle ${state.favOnly?"on":""}" data-act="favonly" aria-pressed="${state.favOnly}">
            ♥ Только избранное</button>`}

        <span class="rescount" id="rescount"></span>
      </div>
    </div>

    <div class="grid" id="results"></div>
  </div>`;
}

/* деталь */
function detailHTML(){
  const r = ROUTES.find(x => x.id === state.id);
  if (!r) {
    return `<div class="wrap"><div class="empty" style="margin:40px 0">
      <div class="big">🧭</div><h3>Маршрут не найден</h3>
      <p>Возможно, ссылка устарела.</p>
      <button class="btn primary" data-act="nav" data-view="catalog">В каталог</button></div></div>`;
  }

  const on = favs.has(r.id);
  return `<div class="wrap"><div class="detail">
    <button class="back" data-act="nav" data-view="catalog">← Назад в каталог</button>

    <div class="dcover">
      <div class="bg" style="background-image:${cover(r)}"></div>
      <span class="emoji" aria-hidden="true">${r.emoji}</span>
    </div>

    <div class="dhead">
      <span class="tagbadge">${esc(r.tag)}</span>
      <h1>${esc(r.title)}</h1>
      <p class="lead">${esc(r.short)}</p>
      <div class="meta big">
        <span>⏱ ${fmtH(r.hours)}</span>
        <span>📍 ${String(r.km).replace(".",",")} км</span>
        <span class="lvl ${lvlCls(r.level)}">${esc(r.level)}</span>
        <span>🆓 Бесплатно</span>
      </div>
      <button class="btn-fav ${on?"on":""}" data-act="fav" data-id="${r.id}" data-variant="btn">
        <span aria-hidden="true">${on?"♥":"♡"}</span> ${on?"В избранном":"В избранное"}
      </button>
    </div>

    <section class="dsec">
      <h2>О маршруте</h2>
      <p>${esc(r.desc)}</p>
    </section>

    <section class="dsec">
      <h2>Что вы увидите</h2>
      <ul class="hl">${r.highlights.map(h => `<li>${esc(h)}</li>`).join("")}</ul>
    </section>

    <section class="dsec">
      <h2>Точки маршрута</h2>
      <ol class="tl">
        ${r.stops.map(s => `<li><div class="t">${esc(s[0])}</div><div class="nm">${esc(s[1])}</div></li>`).join("")}
      </ol>
    </section>
  </div></div>`;
}

/* рендер */
function render(){
  const app = $("#app");
  if (state.view === "home") app.innerHTML = homeHTML();
  else if (state.view === "catalog" || state.view === "favorites") app.innerHTML = listHTML();
  else app.innerHTML = detailHTML();

  if (state.view === "catalog" || state.view === "favorites") updateResults(true);

  app.classList.remove("view-enter");
  void app.offsetWidth;
  app.classList.add("view-enter");

  syncAllFavs();
  updateFavBadge();
  setNav();
  window.scrollTo(0, 0);
}

function updateResults(animate){
  const box = $("#results");
  if (!box) return;
  box.innerHTML = resultsHTML(!!animate);
  const cnt = $("#rescount");
  if (cnt) {
    const n = getList().length;
    cnt.textContent = n ? `Найдено: ${n}` : "";
  }
  syncAllFavs();
}

function setNav(){
  document.querySelectorAll('.nav button').forEach(b => {
    const v = b.dataset.view;
    const active = state.view === v || (state.view === "detail" && v === "catalog");
    b.classList.toggle("on", active);
  });
}

function updateFavBadge(){
  const b = $("#favbadge");
  if (!b) return;
  b.textContent = favs.size;
  b.classList.toggle("zero", favs.size === 0);
}

function syncAllFavs(){
  document.querySelectorAll('[data-act="fav"]').forEach(btn => {
    const id = btn.dataset.id;
    const on = favs.has(id);
    btn.classList.toggle("on", on);
    if (btn.dataset.variant === "btn") {
      btn.innerHTML = `<span aria-hidden="true">${on ? "♥" : "♡"}</span> ${on ? "В избранном" : "В избранное"}`;
      btn.setAttribute("aria-pressed", on);
    } else {
      btn.textContent = on ? "♥" : "♡";
      const label = on ? "Убрать из избранного" : "Добавить в избранное";
      btn.setAttribute("aria-label", label);
      btn.setAttribute("title", label);
    }
  });
}

function toggleFav(id){
  if (favs.has(id)) favs.delete(id);
  else favs.add(id);
  saveFavs();
  updateFavBadge();

  if (state.view === "favorites") {
    render();
  } else {
    syncAllFavs();
    if (state.view === "catalog" && state.favOnly) updateResults(false);
  }
}

/* события */
document.addEventListener("click", e => {
  if (e.target.closest("#themeBtn")) {
    const cur = document.documentElement.getAttribute("data-theme");
    setTheme(cur === "dark" ? "light" : "dark");
    return;
  }

  const el = e.target.closest("[data-act]");
  if (!el) return;
  const act = el.dataset.act;

  if (act === "fav") {
    e.stopPropagation();
    toggleFav(el.dataset.id);
    return;
  }

  if (act === "open") {
    state.id = el.dataset.id;
    state.view = "detail";
    render();
    return;
  }

  if (act === "nav") {
    state.view = el.dataset.view;
    state.id = null;
    if (state.view !== "catalog") state.favOnly = false;
    render();
    return;
  }

  if (act === "random") {
    const r = ROUTES[Math.floor(Math.random() * ROUTES.length)];
    state.id = r.id;
    state.view = "detail";
    render();
    return;
  }

  if (act === "dur") {
    state.dur = el.dataset.k;
    document.querySelectorAll('[data-act="dur"]').forEach(c => {
      const on = c.dataset.k === state.dur;
      c.classList.toggle("on", on);
      c.setAttribute("aria-pressed", on);
    });
    updateResults(false);
    return;
  }

  if (act === "favonly") {
    state.favOnly = !state.favOnly;
    el.classList.toggle("on", state.favOnly);
    el.setAttribute("aria-pressed", state.favOnly);
    updateResults(false);
    return;
  }

  if (act === "reset") {
    state.q = ""; state.dur = "all"; state.sort = "default"; state.favOnly = false;
    render();
    return;
  }
});

document.addEventListener("input", e => {
  const el = e.target.closest('[data-act="search"]');
  if (!el) return;
  state.q = el.value;
  updateResults(false);
});

document.addEventListener("change", e => {
  const el = e.target.closest('[data-act="sort"]');
  if (!el) return;
  state.sort = el.value;
  updateResults(false);
});

document.addEventListener("keydown", e => {
  if (e.key !== "Enter" && e.key !== " ") return;
  const card = e.target.closest('.card[data-act="open"]');
  if (card && e.target === card) {
    e.preventDefault();
    state.id = card.dataset.id;
    state.view = "detail";
    render();
  }
});

/* старт */
initTheme();
render();