(function () {
  "use strict";

  var STORAGE_KEY = "maListeCourses_v1";
  var items = [];

  var listEl = document.getElementById("list");
  var emptyEl = document.getElementById("emptyMessage");
  var totalEl = document.getElementById("total");
  var addForm = document.getElementById("addForm");
  var newName = document.getElementById("newName");
  var newTrip = document.getElementById("newTrip");
  var deleteChecked = document.getElementById("deleteChecked");
  var statusEl = document.getElementById("status");

  function load() {
    var saved;
    try {
      saved = localStorage.getItem(STORAGE_KEY);
      if (saved) {
        items = JSON.parse(saved);
      }
    } catch (e) {
      items = [];
      statusEl.innerHTML = "Attention : stockage local indisponible";
    }
  }

  function save() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
      statusEl.innerHTML = "Liste enregistrée sur ce téléphone";
    } catch (e) {
      statusEl.innerHTML = "Attention : impossible d'enregistrer";
    }
  }

  function escapeHtml(text) {
    return String(text)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;");
  }

  function money(value) {
    var n = Number(value) || 0;
    return n.toFixed(2).replace(".", ",") + " €";
  }

  function normalizePrice(value) {
    var s = String(value || "").replace(",", ".").replace(/[^0-9.]/g, "");
    var n = parseFloat(s);
    return isNaN(n) ? 0 : n;
  }

  function render() {
    var html = "";
    var total = 0;
    var i, item, checkedClass, checkedAttr, priceValue;

    for (i = 0; i < items.length; i++) {
      item = items[i];
      checkedClass = item.checked ? " checked" : "";
      checkedAttr = item.checked ? " checked" : "";
      priceValue = item.price ? String(item.price).replace(".", ",") : "";
      total += Number(item.price) || 0;

      html += '<li class="item' + checkedClass + '" data-index="' + i + '">';
      html += '<div class="item-check"><input class="check" type="checkbox"' + checkedAttr + ' aria-label="Article pris"></div>';
      html += '<div class="item-name">' + escapeHtml(item.name) + '</div>';
      html += '<div class="item-price"><input class="price" type="text" inputmode="decimal" value="' + escapeHtml(priceValue) + '" placeholder="0,00" aria-label="Prix"><span class="euro">€</span></div>';
      html += '<div class="item-delete"><button class="delete-one" type="button" title="Supprimer" aria-label="Supprimer">×</button></div>';
      html += '</li>';
    }

    listEl.innerHTML = html;
    emptyEl.style.display = items.length ? "none" : "block";
    totalEl.innerHTML = money(total);
    bindRows();
  }

  function bindRows() {
    var rows = listEl.getElementsByTagName("li");
    var i;

    for (i = 0; i < rows.length; i++) {
      bindRow(rows[i], i);
    }
  }

  function bindRow(row, index) {
    var check = row.getElementsByClassName("check")[0];
    var price = row.getElementsByClassName("price")[0];
    var del = row.getElementsByClassName("delete-one")[0];

    check.onclick = function () {
      items[index].checked = check.checked;
      save();
      render();
    };

    price.onchange = function () {
      items[index].price = normalizePrice(price.value);
      save();
      render();
    };

    del.onclick = function () {
      if (window.confirm('Supprimer "' + items[index].name + '" ?')) {
        items.splice(index, 1);
        save();
        render();
      }
    };
  }

  addForm.onsubmit = function (event) {
    var name;
    if (event && event.preventDefault) {
      event.preventDefault();
    }

    name = newName.value.replace(/^\s+|\s+$/g, "");
    if (!name) {
      return false;
    }

    items.push({
      name: name,
      price: 0,
      checked: false
    });

    newName.value = "";
    save();
    render();
    newName.focus();
    return false;
  };

  newTrip.onclick = function () {
    var i;
    if (!items.length) {
      return;
    }

    if (window.confirm("Décocher tous les articles et remettre tous les prix à zéro ?")) {
      for (i = 0; i < items.length; i++) {
        items[i].checked = false;
        items[i].price = 0;
      }
      save();
      render();
    }
  };

  deleteChecked.onclick = function () {
    var remaining = [];
    var found = false;
    var i;

    for (i = 0; i < items.length; i++) {
      if (items[i].checked) {
        found = true;
      } else {
        remaining.push(items[i]);
      }
    }

    if (!found) {
      window.alert("Aucun article n'est coché.");
      return;
    }

    if (window.confirm("Supprimer tous les articles cochés ?")) {
      items = remaining;
      save();
      render();
    }
  };

  load();
  render();

  /* Service Worker pour les navigateurs qui le permettent.
     Les anciens navigateurs peuvent utiliser offline.appcache. */
  if ("serviceWorker" in navigator) {
    window.addEventListener("load", function () {
      navigator.serviceWorker.register("sw.js");
    });
  }
}());
