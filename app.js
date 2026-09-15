(function () {
  "use strict";

  var STORAGE_KEY = "maListeCourses_v1";
  var HISTORY_KEY = "maListeCourses_historique_v2";
  var TRIP_KEY = "maListeCourses_course_v2";
  var items = [];
  var trip = { selected: [], checked: {} };

  var listEl = document.getElementById("list");
  var tripListEl = document.getElementById("tripList");
  var currentTripSection = document.getElementById("currentTripSection");
  var emptyEl = document.getElementById("emptyMessage");
  var tripEmpty = document.getElementById("tripEmpty");
  var tripCount = document.getElementById("tripCount");
  var totalEl = document.getElementById("total");
  var addForm = document.getElementById("addForm");
  var newName = document.getElementById("newName");
  var newTrip = document.getElementById("newTrip");
  var saveTrip = document.getElementById("saveTrip");
  var backupData = document.getElementById("backupData");
  var restoreFile = document.getElementById("restoreFile");
  var statusEl = document.getElementById("status");
  var optionsButton = document.getElementById("optionsButton");
  var optionsPanel = document.getElementById("optionsPanel");

  function makeId() {
    return "a" + new Date().getTime() + "_" + Math.floor(Math.random() * 1000000);
  }

  function positiveNumber(value, fallback) {
    var n = Number(value);
    return isNaN(n) || n <= 0 ? fallback : n;
  }

  function normalizeNumber(value) {
    var s = String(value || "").replace(",", ".").replace(/[^0-9.]/g, "");
    var n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function normalizeItems(data) {
    var result = [], used = {}, i, item, id;
    if (!data || typeof data.length === "undefined") { return result; }
    for (i = 0; i < data.length; i++) {
      item = data[i] || {};
      id = String(item.id || makeId());
      while (used[id]) { id = makeId(); }
      used[id] = true;
      result.push({
        id: id,
        name: String(item.name || "Article"),
        price: Number(item.price) || 0,
        quantity: positiveNumber(item.quantity, 1),
        unit: item.unit === "g" ? "g" : "u"
      });
    }
    return result;
  }

  function normalizeTrip(data) {
    var result = { selected: [], checked: {} }, exists = {}, i, id;
    for (i = 0; i < items.length; i++) { exists[items[i].id] = true; }
    if (data && data.selected && typeof data.selected.length !== "undefined") {
      for (i = 0; i < data.selected.length; i++) {
        id = String(data.selected[i]);
        if (exists[id] && result.selected.indexOf(id) === -1) { result.selected.push(id); }
      }
    }
    if (data && data.checked) {
      for (i = 0; i < result.selected.length; i++) {
        id = result.selected[i];
        result.checked[id] = !!data.checked[id];
      }
    }
    return result;
  }

  function load() {
    var saved, savedTrip;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
      if (saved) { items = normalizeItems(JSON.parse(saved)); }
      savedTrip = localStorage.getItem(TRIP_KEY);
      trip = normalizeTrip(savedTrip ? JSON.parse(savedTrip) : null);
      save();
    } catch (e) {
      items = [];
      trip = { selected: [], checked: {} };
      statusEl.innerHTML = "Attention : stockage local indisponible";
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      localStorage.setItem(TRIP_KEY, JSON.stringify(trip));
      statusEl.innerHTML = "";
    } catch (e) {
      statusEl.innerHTML = "Attention : impossible d'enregistrer";
    }
  }

  function getHistory() {
    try { return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]"); }
    catch (e) { return []; }
  }

  function setHistory(history) { localStorage.setItem(HISTORY_KEY, JSON.stringify(history)); }

  function escapeHtml(text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function money(value) { return (Number(value) || 0).toFixed(2).replace(".", ",") + " €"; }

  function itemTotal(item) {
    var quantity = positiveNumber(item.quantity, 1), price = Number(item.price) || 0;
    return item.unit === "g" ? (quantity / 1000) * price : quantity * price;
  }

  function selected(id) { return trip.selected.indexOf(id) !== -1; }

  function findItem(id) {
    var i;
    for (i = 0; i < items.length; i++) { if (items[i].id === id) { return items[i]; } }
    return null;
  }

  function orderedTripItems() {
    var result = [], i;
    for (i = 0; i < items.length; i++) { if (selected(items[i].id)) { result.push(items[i]); } }
    return result;
  }

  function render() {
    renderTrip();
    renderCatalog();
  }

  function renderTrip() {
    var current = orderedTripItems(), html = "", boughtTotal = 0, boughtCount = 0;
    var i, item, checked, priceValue, qtyValue;

    for (i = 0; i < current.length; i++) {
      item = current[i];
      checked = !!trip.checked[item.id];
      if (checked) { boughtTotal += itemTotal(item); boughtCount++; }
      priceValue = item.price ? String(item.price).replace(".", ",") : "";
      qtyValue = String(positiveNumber(item.quantity, 1)).replace(".", ",");

      html += '<li class="item trip-item' + (checked ? ' checked' : '') + '" data-id="' + escapeHtml(item.id) + '">';
      html += '<div class="item-check"><input class="trip-check" type="checkbox"' + (checked ? ' checked' : '') + ' aria-label="Article acheté"></div>';
      html += '<div class="item-name">' + escapeHtml(item.name) + '</div>';
      html += '<div class="item-quantity"><input class="quantity" type="text" inputmode="decimal" value="' + escapeHtml(qtyValue) + '" aria-label="Quantité">';
      html += '<select class="unit" aria-label="Unité"><option value="u"' + (item.unit === "u" ? ' selected' : '') + '>u</option><option value="g"' + (item.unit === "g" ? ' selected' : '') + '>g</option></select></div>';
      html += '<div class="item-price"><input class="price" type="text" inputmode="decimal" value="' + escapeHtml(priceValue) + '" placeholder="0,00" aria-label="Prix"><span class="price-unit">' + (item.unit === "g" ? '€/kg' : '€') + '</span></div>';
      html += '</li>';
    }

    tripListEl.innerHTML = html;
    currentTripSection.style.display = current.length ? "block" : "none";
    tripEmpty.style.display = "none";
    tripCount.innerHTML = current.length ? boughtCount + " / " + current.length + " acheté" + (boughtCount > 1 ? "s" : "") : "";
    totalEl.innerHTML = money(boughtTotal);
    bindTripRows();
  }

  function renderCatalog() {
    var html = "", i, item, priceValue, qtyValue, isSelected;
    for (i = 0; i < items.length; i++) {
      item = items[i];
      isSelected = selected(item.id);
      priceValue = item.price ? String(item.price).replace(".", ",") : "";
      qtyValue = String(positiveNumber(item.quantity, 1)).replace(".", ",");
      html += '<li class="item catalog-item' + (isSelected ? ' selected' : '') + '" data-id="' + escapeHtml(item.id) + '">';
      html += '<div class="move-controls"><button class="move-up" type="button" aria-label="Monter"' + (i === 0 ? ' disabled' : '') + '>▲</button><button class="move-down" type="button" aria-label="Descendre"' + (i === items.length - 1 ? ' disabled' : '') + '>▼</button></div>';
      html += '<div class="course-select"><button class="select-course" type="button" aria-label="' + (isSelected ? 'Retirer de la course' : 'Ajouter à la course') + '">' + (isSelected ? '●' : '○') + '</button></div>';
      html += '<div class="item-name">' + escapeHtml(item.name) + '</div>';
      html += '<div class="catalog-price-summary">' + escapeHtml(qtyValue) + ' ' + escapeHtml(item.unit) + '<br><strong>' + (priceValue || '—') + (item.unit === 'g' ? ' €/kg' : ' €') + '</strong></div>';
      html += '<div class="item-delete"><button class="delete-one" type="button" title="Supprimer" aria-label="Supprimer">×</button></div>';
      html += '</li>';
    }
    listEl.innerHTML = html;
    emptyEl.style.display = items.length ? "none" : "block";
    bindCatalogRows();
  }

  function bindTripRows() {
    var rows = tripListEl.getElementsByTagName("li"), i;
    for (i = 0; i < rows.length; i++) { bindTripRow(rows[i]); }
  }

  function bindTripRow(row) {
    var id = row.getAttribute("data-id"), item = findItem(id);
    var check = row.getElementsByClassName("trip-check")[0];
    var price = row.getElementsByClassName("price")[0];
    var quantity = row.getElementsByClassName("quantity")[0];
    var unit = row.getElementsByClassName("unit")[0];
    if (!item) { return; }

    check.onclick = function () { trip.checked[id] = check.checked; save(); render(); };
    price.onchange = function () { item.price = normalizeNumber(price.value); save(); render(); };
    quantity.onchange = function () { item.quantity = positiveNumber(normalizeNumber(quantity.value), 1); save(); render(); };
    unit.onchange = function () { item.unit = unit.value === "g" ? "g" : "u"; save(); render(); };
  }

  function bindCatalogRows() {
    var rows = listEl.getElementsByTagName("li"), i;
    for (i = 0; i < rows.length; i++) { bindCatalogRow(rows[i], i); }
  }

  function bindCatalogRow(row, index) {
    var item = items[index], toggle = row.getElementsByClassName("select-course")[0];
    var del = row.getElementsByClassName("delete-one")[0];
    var up = row.getElementsByClassName("move-up")[0];
    var down = row.getElementsByClassName("move-down")[0];

    toggle.onclick = function () {
      var pos = trip.selected.indexOf(item.id);
      if (pos === -1) { trip.selected.push(item.id); trip.checked[item.id] = false; }
      else { trip.selected.splice(pos, 1); delete trip.checked[item.id]; }
      save(); render();
    };
    up.onclick = function () { var tmp; if (index <= 0) { return; } tmp = items[index - 1]; items[index - 1] = items[index]; items[index] = tmp; save(); render(); };
    down.onclick = function () { var tmp; if (index >= items.length - 1) { return; } tmp = items[index + 1]; items[index + 1] = items[index]; items[index] = tmp; save(); render(); };
    del.onclick = function () {
      if (window.confirm('Supprimer définitivement "' + item.name + '" de Mes articles habituels ?')) {
        var pos = trip.selected.indexOf(item.id);
        if (pos !== -1) { trip.selected.splice(pos, 1); delete trip.checked[item.id]; }
        items.splice(index, 1); save(); render();
      }
    };
  }

  addForm.onsubmit = function (event) {
    var name;
    if (event && event.preventDefault) { event.preventDefault(); }
    name = newName.value.replace(/^\s+|\s+$/g, "");
    if (!name) { return false; }
    items.push({ id: makeId(), name: name, price: 0, quantity: 1, unit: "u" });
    newName.value = ""; save(); render(); newName.focus(); return false;
  };

  optionsButton.onclick = function () { optionsPanel.className = optionsPanel.className.indexOf("open") !== -1 ? "options-panel" : "options-panel open"; };

  newTrip.onclick = function () {
    var catalog = document.getElementsByClassName("catalog-section")[0];
    if (trip.selected.length && !window.confirm("Créer une nouvelle liste de courses ?\n\nLa sélection actuelle sera vidée. Mes articles habituels et leurs derniers prix seront conservés.")) { return; }
    trip = { selected: [], checked: {} };
    save(); render(); optionsPanel.className = "options-panel";
    if (catalog && catalog.scrollIntoView) { catalog.scrollIntoView(); }
    if (!trip.selected.length) { newName.focus(); }
  };

  saveTrip.onclick = function () {
    var current = orderedTripItems(), bought = [], history, i, item, total = 0, checkedCount = 0, missingPrice = 0, now;
    if (!current.length) { window.alert("Votre nouvelle liste de courses est vide."); return; }
    for (i = 0; i < current.length; i++) {
      item = current[i];
      if (trip.checked[item.id]) {
        checkedCount++;
        if (!(Number(item.price) > 0)) { missingPrice++; }
        bought.push({ name: item.name, quantity: positiveNumber(item.quantity, 1), unit: item.unit, unitPrice: Number(item.price) || 0, paid: itemTotal(item) });
        total += itemTotal(item);
      }
    }
    if (!checkedCount) { window.alert("Aucun article n'est encore coché comme acheté."); return; }
    var message = checkedCount + " article" + (checkedCount > 1 ? "s achetés" : " acheté") + " sur " + current.length + ".\n\nEnregistrer la course ?";
    if (missingPrice) { message += "\n\nAttention : " + missingPrice + " article" + (missingPrice > 1 ? "s achetés n'ont" : " acheté n'a") + " pas de prix renseigné."; }
    if (!window.confirm(message)) { return; }
    now = new Date(); history = getHistory();
    history.push({ id: now.getTime(), date: now.getFullYear() + "-" + pad2(now.getMonth() + 1) + "-" + pad2(now.getDate()), items: bought, total: total });
    try { setHistory(history); save(); window.alert("Course enregistrée.\n\nMes articles habituels, leurs derniers prix et la course affichée restent intacts."); optionsPanel.className = "options-panel"; }
    catch (e) { window.alert("Impossible d'enregistrer cette course."); }
  };

  function pad2(n) { return n < 10 ? "0" + n : String(n); }

  backupData.onclick = function () {
    var data = { version: 3, exportedAt: new Date().toISOString ? new Date().toISOString() : String(new Date()), items: items, currentTrip: trip, history: getHistory() };
    var text = JSON.stringify(data, null, 2), blob, url, link;
    try {
      blob = new Blob([text], { type: "application/json" });
      if (window.navigator && window.navigator.msSaveBlob) { window.navigator.msSaveBlob(blob, "liste-courses-sauvegarde.json"); return; }
      url = (window.URL || window.webkitURL).createObjectURL(blob); link = document.createElement("a"); link.href = url; link.download = "liste-courses-sauvegarde.json";
      document.body.appendChild(link); link.click(); document.body.removeChild(link);
      window.setTimeout(function () { (window.URL || window.webkitURL).revokeObjectURL(url); }, 1000);
    } catch (e) { window.alert("Ce navigateur ne permet pas l'export automatique. Les données restent enregistrées sur le téléphone."); }
  };

  restoreFile.onchange = function () {
    var file = restoreFile.files && restoreFile.files[0], reader;
    if (!file) { return; }
    if (!window.confirm("Restaurer cette sauvegarde remplacera la liste, la course en cours et l'historique présents sur ce téléphone. Continuer ?")) { restoreFile.value = ""; return; }
    reader = new FileReader();
    reader.onload = function (event) {
      var data;
      try {
        data = JSON.parse(event.target.result); if (!data || !data.items) { throw new Error("format"); }
        items = normalizeItems(data.items); trip = normalizeTrip(data.currentTrip || null);
        localStorage.setItem(STORAGE_KEY, JSON.stringify(items)); localStorage.setItem(TRIP_KEY, JSON.stringify(trip)); localStorage.setItem(HISTORY_KEY, JSON.stringify(data.history || []));
        render(); window.alert("Sauvegarde restaurée.");
      } catch (e) { window.alert("Ce fichier n'est pas une sauvegarde valide de l'application."); }
      restoreFile.value = ""; optionsPanel.className = "options-panel";
    };
    reader.readAsText(file);
  };

  load(); render();
  if ("serviceWorker" in navigator) { window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js"); }); }
}());
