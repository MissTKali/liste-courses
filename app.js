(function () {
  "use strict";

  var STORAGE_KEY = "maListeCourses_v1";
  var HISTORY_KEY = "maListeCourses_historique_v2";
  var TRIP_KEY = "maListeCourses_course_v2";
  var LISTS_KEY = "maListeCourses_listes_v1";
  var items = [];
  var trip = { selected: [], checked: {} };
  var habitualListsData = [];
  var activeListId = null;
  var habitualListsTouchLocked = false;

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
  var restoreButton = document.getElementById("restoreButton");
  var statusEl = document.getElementById("status");
  var optionsButton = document.getElementById("optionsButton");
  var optionsPanel = document.getElementById("optionsPanel");
  var listsSection = document.getElementById("listsSection");
  var habitualLists = document.getElementById("habitualLists");
  var newHabitualList = document.getElementById("newHabitualList");
  var catalogSection = document.getElementById("catalogSection");
  var activeListHeader = document.getElementById("activeListHeader");
  var activeListName = document.getElementById("activeListName");
  var backToLists = document.getElementById("backToLists");
  

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

  function createFirstHabitualList() {
    var firstList = {
      id: "liste_" + new Date().getTime(),
      name: "Ma liste habituelle",
      items: items,
      trip: trip
    };

    habitualListsData = [firstList];
    activeListId = firstList.id;
  }

  function saveHabitualLists() {
    try {
      localStorage.setItem(
        LISTS_KEY,
        JSON.stringify({
          activeListId: activeListId,
          lists: habitualListsData
        })
      );
    } catch (e) {
      statusEl.innerHTML = "Attention : impossible d'enregistrer les listes";
    }
  }

  function createHabitualList(name) {
    var newList = {
      id: "liste_" + new Date().getTime(),
      name: name,
      items: [],
      trip: {
        selected: [],
        checked: {}
      }
    };

    habitualListsData.push(newList);
    activeListId = newList.id;

    items = [];
    trip = {
      selected: [],
      checked: {}
    };

    saveHabitualLists();
    showActiveHabitualList();
  }

  function getActiveHabitualList() {
    var i;

    for (i = 0; i < habitualListsData.length; i++) {
      if (habitualListsData[i].id === activeListId) {
        return habitualListsData[i];
      }
    }

    return null;
  }

  function openHabitualListMenu(habitualList) {
    var overlay, menu, title, modifyButton, deleteButton, cancelButton;

    overlay = document.createElement("div");
    overlay.className = "article-menu-overlay";

    overlay.style.top =
      (window.pageYOffset ||
       document.documentElement.scrollTop ||
       document.body.scrollTop || 0) + "px";

    menu = document.createElement("div");
    menu.className = "article-menu";

    title = document.createElement("div");
    title.className = "article-menu-title";
    title.appendChild(document.createTextNode(habitualList.name));

    modifyButton = document.createElement("button");
    modifyButton.type = "button";
    modifyButton.appendChild(document.createTextNode("Modifier le nom"));

    deleteButton = document.createElement("button");
    deleteButton.type = "button";
    deleteButton.appendChild(document.createTextNode("Supprimer la liste"));

    cancelButton = document.createElement("button");
    cancelButton.type = "button";
    cancelButton.appendChild(document.createTextNode("Annuler"));

    menu.appendChild(title);
    menu.appendChild(modifyButton);
    menu.appendChild(deleteButton);
    menu.appendChild(cancelButton);

    overlay.appendChild(menu);
    document.body.appendChild(overlay);

    function closeMenu() {
      if (overlay && overlay.parentNode) {
        overlay.parentNode.removeChild(overlay);
      }
    }

    modifyButton.onclick = function () {
      var newName;

      closeMenu();

      newName = window.prompt(
        "Modifier le nom de la liste :",
        habitualList.name
      );

      if (newName !== null) {
        newName = newName.replace(/^\s+|\s+$/g, "");

        if (newName) {
          habitualList.name = newName;
          saveHabitualLists();
          renderHabitualLists();
        }
      }
    };

    deleteButton.onclick = function () {
      var i;

      closeMenu();

      if (habitualListsData.length === 1) {
        alert("Vous devez conserver au moins une liste habituelle.");
        return;
      }

      if (!window.confirm(
        'Supprimer définitivement la liste "' +
        habitualList.name +
        '" et tous ses articles ?'
      )) {
        return;
      }

      for (i = 0; i < habitualListsData.length; i++) {
        if (habitualListsData[i].id === habitualList.id) {
          habitualListsData.splice(i, 1);
          break;
        }
      }

      if (activeListId === habitualList.id) {
        activeListId = habitualListsData[0].id;
      }

      habitualListsTouchLocked = true;

      saveHabitualLists();
      renderHabitualLists();

      window.setTimeout(function () {
        habitualListsTouchLocked = false;
      }, 500);
    };

    cancelButton.onclick = function () {
      closeMenu();
    };

    overlay.onclick = function (event) {
      if (event.target === overlay) {
        closeMenu();
      }
    };
  }

  function bindHabitualListLongPress(button) {
    var listId = button.getAttribute("data-list-id");
    var timer = null;
    var longPressTriggered = false;
    var habitualList = null;
    var i;

    for (i = 0; i < habitualListsData.length; i++) {
      if (habitualListsData[i].id === listId) {
        habitualList = habitualListsData[i];
        break;
      }
    }

    if (!habitualList) {
      return;
    }

    function cancelLongPress() {
      if (timer) {
        window.clearTimeout(timer);
        timer = null;
      }
    }
    
    button.ontouchstart = function () {
      if (habitualListsTouchLocked) {
        return;
      }

      longPressTriggered = false;
      cancelLongPress();

      timer = window.setTimeout(function () {
        openHabitualListMenu(habitualList);
      }, 600);
    };

    button.ontouchmove = function () {
      cancelLongPress();
    };

    button.ontouchend = button.ontouchcancel = function (event) {
      cancelLongPress();

      if (longPressTriggered) {
        if (event && event.preventDefault) {
          event.preventDefault();
        }

        longPressTriggered = false;
      }
    };

    /* Pour tester aussi facilement sur ordinateur */
    button.oncontextmenu = function (event) {
      if (event.preventDefault) {
        event.preventDefault();
      }

      openHabitualListMenu(habitualList);
      return false;
    };

    button.onclick = function (event) {
      if (longPressTriggered) {
        if (event.preventDefault) {
          event.preventDefault();
        }

        return false;
      }
    };
  }  

  function renderHabitualLists() {
    var html = "";
    var i, buttons;

    for (i = 0; i < habitualListsData.length; i++) {
      html +=
        '<button type="button" class="habitual-list-button" data-list-id="' +
        escapeHtml(habitualListsData[i].id) +
        '">' +
        '<span>' +
        escapeHtml(habitualListsData[i].name) +
        '</span>' +
        '<span class="habitual-list-arrow">›</span>' +
        '</button>';
    }

    habitualLists.innerHTML = html;

    buttons = habitualLists.getElementsByClassName("habitual-list-button");

    for (i = 0; i < buttons.length; i++) {
      bindHabitualListLongPress(buttons[i]);
    }
  }

  function showHabitualLists() {
    renderHabitualLists();

    listsSection.style.display = "block";
    activeListHeader.style.display = "none";
    currentTripSection.style.display = "none";
    catalogSection.style.display = "none";
  }

  function showActiveHabitualList() {
    var activeList = getActiveHabitualList();

    listsSection.style.display = "none";
    activeListHeader.style.display = "block";
    catalogSection.style.display = "block";

    if (activeList) {
      activeListName.innerHTML = escapeHtml(activeList.name);
    }

    render();
  } 

  function load() {
    var saved, savedTrip, savedLists, data, firstList;

    try {
      /*
       * Nouveau stockage déjà créé :
       * on charge les listes habituelles.
       */
      savedLists = localStorage.getItem(LISTS_KEY);

      if (savedLists) {
        data = JSON.parse(savedLists);

        habitualListsData = data.lists || [];
        activeListId = data.activeListId || null;

        /*
         * Pour l'instant, on recharge la liste active
         * dans les variables utilisées par l'application actuelle.
         */
        if (activeListId) {
          firstList = null;

          habitualListsData.forEach(function (habitualList) {
            if (habitualList.id === activeListId) {
              firstList = habitualList;
            }
          });

          if (firstList) {
            items = normalizeItems(firstList.items || []);
            trip = normalizeTrip(firstList.trip || null);
          }
        }

      } else {
        /*
         * Première utilisation du nouveau système :
         * récupération de l'ancienne liste et de sa course.
         */
        saved = localStorage.getItem(STORAGE_KEY);

        if (saved) {
          items = normalizeItems(JSON.parse(saved));
        }

        savedTrip = localStorage.getItem(TRIP_KEY);
        trip = normalizeTrip(savedTrip ? JSON.parse(savedTrip) : null);

        /*
         * Transformation en première liste habituelle.
         */
        createFirstHabitualList();
        saveHabitualLists();
      }

      save();

    } catch (e) {
      items = [];
      trip = { selected: [], checked: {} };
      statusEl.innerHTML = "Attention : stockage local indisponible";
    }
  }

  function save() {
    var activeList;

    try {
      /*
       * Enregistrement dans la liste habituelle active.
       */
      activeList = getActiveHabitualList();

      if (activeList) {
        activeList.items = items;
        activeList.trip = trip;
        saveHabitualLists();
      }

      /*
       * Ancien stockage conservé provisoirement
       * comme filet de sécurité.
       */
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
      html += '<div class="drag-handle" draggable="true" title="Maintenir et glisser pour déplacer" aria-label="Déplacer">≡</div>';
      html += '<div class="course-select"><button class="select-course" type="button" aria-label="' + (isSelected ? 'Retirer de la course' : 'Ajouter à la course') + '">' + (isSelected ? '●' : '○') + '</button></div>';
      html += '<div class="item-name">' + escapeHtml(item.name) + '</div>';
      html += '<div class="catalog-price-summary">' + escapeHtml(qtyValue) + ' ' + escapeHtml(item.unit) + '<br><strong>' + (priceValue || '—') + (item.unit === 'g' ? ' €/kg' : ' €') + '</strong></div>';
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
    for (i = 0; i < rows.length; i++) { bindCatalogRow(rows[i]); }
  }

  function moveItemById(dragId, targetId) {
    var from = -1, to = -1, i, moved;
    if (!dragId || !targetId || dragId === targetId) { return; }
    for (i = 0; i < items.length; i++) {
      if (items[i].id === dragId) { from = i; }
      if (items[i].id === targetId) { to = i; }
    }
    if (from < 0 || to < 0) { return; }
    moved = items.splice(from, 1)[0];
    if (from < to) { to--; }
    items.splice(to, 0, moved);
    save();
    render();
  }

  function bindCatalogRow(row) {
    var id = row.getAttribute("data-id"), item = findItem(id);
    var toggle = row.getElementsByClassName("select-course")[0];
    var handle = row.getElementsByClassName("drag-handle")[0];
    var nameEl = row.getElementsByClassName("item-name")[0];
    var touchStarted = false, lastTargetId = null;
    var longPressTimer = null, longPressTriggered = false;
    var autoScrollTimer = null, autoScrollDirection = 0;
    if (!item) { return; }

    function stopAutoScroll() {
      if (autoScrollTimer) {
        window.clearInterval(autoScrollTimer);
        autoScrollTimer = null;
      }

      autoScrollDirection = 0;
    }

    function startAutoScroll(direction) {
      if (autoScrollTimer && autoScrollDirection === direction) {
        return;
      }

      stopAutoScroll();
      autoScrollDirection = direction;

      autoScrollTimer = window.setInterval(function () {
        window.scrollBy(0, direction * 10);
      }, 30);
    }

    toggle.onclick = function () {
      var pos = trip.selected.indexOf(item.id);
      if (pos === -1) { trip.selected.push(item.id); trip.checked[item.id] = false; }
      else { trip.selected.splice(pos, 1); delete trip.checked[item.id]; }
      save(); render();
    };

    function deleteArticle() {
      if (window.confirm('Supprimer définitivement "' + item.name + '" de Mes articles habituels ?')) {
        var pos = trip.selected.indexOf(item.id), i;

        if (pos !== -1) {
          trip.selected.splice(pos, 1);
          delete trip.checked[item.id];
        }

        for (i = 0; i < items.length; i++) {
          if (items[i].id === item.id) {
            items.splice(i, 1);
            break;
          }
        }

        save();
        render();
      }
    }

    function cancelLongPress() {
      if (longPressTimer) {
        window.clearTimeout(longPressTimer);
        longPressTimer = null;
      }
    }

    function openArticleMenu() {
      var overlay, menu, title, modifyButton, deleteButton, cancelButton;

      longPressTriggered = true;

      overlay = document.createElement("div");
      overlay.className = "article-menu-overlay";

      overlay.style.top =
        (window.pageYOffset || document.documentElement.scrollTop || document.body.scrollTop || 0) + "px";

      menu = document.createElement("div");
      menu.className = "article-menu";

      title = document.createElement("div");
      title.className = "article-menu-title";
      title.appendChild(document.createTextNode(item.name));

      modifyButton = document.createElement("button");
      modifyButton.type = "button";
      modifyButton.appendChild(document.createTextNode("Modifier"));

      deleteButton = document.createElement("button");
      deleteButton.type = "button";
      deleteButton.appendChild(document.createTextNode("Supprimer"));

      cancelButton = document.createElement("button");
      cancelButton.type = "button";
      cancelButton.appendChild(document.createTextNode("Annuler"));

      menu.appendChild(title);
      menu.appendChild(modifyButton);
      menu.appendChild(deleteButton);
      menu.appendChild(cancelButton);

      overlay.appendChild(menu);
      document.body.appendChild(overlay);

      function closeMenu() {
        if (overlay && overlay.parentNode) {
          overlay.parentNode.removeChild(overlay);
        }
      }

      modifyButton.onclick = function () {
        var newArticleName;

        closeMenu();

        newArticleName = window.prompt(
          "Modifier l'article :",
          item.name
        );

        if (newArticleName !== null) {
          newArticleName = newArticleName.replace(/^\s+|\s+$/g, "");

          if (newArticleName) {
            item.name = newArticleName;
            save();
            render();
          }
        }
      };

      deleteButton.onclick = function () {
        closeMenu();
        deleteArticle();
      };

      cancelButton.onclick = function () {
        closeMenu();
      };

      overlay.onclick = function (event) {
        if (event.target === overlay) {
          closeMenu();
        }
      };
    }

    nameEl.ontouchstart = function () {
      longPressTriggered = false;
      cancelLongPress();

      longPressTimer = window.setTimeout(function () {
        openArticleMenu();
      }, 600);
    };

    nameEl.ontouchmove = function () {
      cancelLongPress();
    };

    nameEl.ontouchend = nameEl.ontouchcancel = function () {
      cancelLongPress();
    };

    /* Souris / ordinateur */
    handle.ondragstart = function (event) {
      row.className += " dragging";
      if (event.dataTransfer) { event.dataTransfer.setData("text/plain", item.id); event.dataTransfer.effectAllowed = "move"; }
    };
    handle.ondragend = function () { row.className = row.className.replace(/\s*dragging/g, ""); };
    row.ondragover = function (event) { if (event.preventDefault) { event.preventDefault(); } return false; };
    row.ondrop = function (event) {
      var dragId;
      if (event.preventDefault) { event.preventDefault(); }
      dragId = event.dataTransfer ? event.dataTransfer.getData("text/plain") : "";
      moveItemById(dragId, item.id);
      return false;
    };

    /* Tactile ancien Android : déplacement continu par la poignée ≡. */
    handle.ontouchstart = function (event) {
      touchStarted = true;
      lastTargetId = item.id;

      if (row.className.indexOf("dragging") === -1) {
        row.className += " dragging";
      }

      if (event.preventDefault) {
        event.preventDefault();
      }
    };

    handle.ontouchmove = function (event) {
      var touch, target, targetRow, targetId;
      var from = -1, to = -1, i, moved;

      if (!touchStarted || !event.touches || !event.touches.length) {
        return;
      }

      if (event.preventDefault) {
        event.preventDefault();
      }

      touch = event.touches[0];

      if (touch.clientY < 70) {
        startAutoScroll(-1);
      } else if (touch.clientY > window.innerHeight - 70) {
        startAutoScroll(1);
      } else {
        stopAutoScroll();
      }

      target = document.elementFromPoint(touch.clientX, touch.clientY);

      while (
        target &&
        target !== listEl &&
        !(target.className &&
          (" " + target.className + " ").indexOf(" catalog-item ") !== -1)
      ) {
        target = target.parentNode;
      }

      targetRow = target && target !== listEl ? target : null;
      targetId = targetRow ? targetRow.getAttribute("data-id") : null;

      if (!targetId || targetId === lastTargetId || targetId === item.id) {
        return;
      }

      lastTargetId = targetId;

      /*
       * On réordonne directement le tableau,
       * mais surtout SANS render().
       */
      for (i = 0; i < items.length; i++) {
        if (items[i].id === item.id) {
          from = i;
        }
        if (items[i].id === targetId) {
          to = i;
        }
      }

      if (from < 0 || to < 0) {
        return;
      }

      moved = items.splice(from, 1)[0];
      items.splice(to, 0, moved);

      /*
       * On déplace aussi la ligne existante dans le DOM.
       * Ainsi le doigt reste attaché au même élément.
       */
      if (from < to) {
        listEl.insertBefore(row, targetRow.nextSibling);
      } else {
        listEl.insertBefore(row, targetRow);
      }
    };

    handle.ontouchend = handle.ontouchcancel = function () {
      stopAutoScroll();
      
      if (!touchStarted) {
        return;
      }

      touchStarted = false;
      lastTargetId = null;

      row.className = row.className.replace(/\s*dragging/g, "");

      /*
       * Une seule sauvegarde et un seul render :
       * lorsque le doigt est relâché.
       */
      save();
      render();
    };
  }

  /* Sticky du formulaire "Nouvel article" - compatible ancien Android */
  var addFormTop = 0;
  var addFormPlaceholder = null;

  function prepareAddFormSticky() {
    var rect;

    if (!addForm) {
      return;
    }

    rect = addForm.getBoundingClientRect();
    addFormTop = rect.top +
      (window.pageYOffset ||
       document.documentElement.scrollTop ||
       document.body.scrollTop ||
       0);
  }

  function updateAddFormSticky() {
    var scrollTop, rect;

    if (!addForm || !addFormTop) {
      return;
    }

    scrollTop =
      window.pageYOffset ||
      document.documentElement.scrollTop ||
      document.body.scrollTop ||
      0;

    if (scrollTop >= addFormTop) {

      if (!addFormPlaceholder) {
        addFormPlaceholder = document.createElement("div");
        addFormPlaceholder.style.height = addForm.offsetHeight + "px";
        addForm.parentNode.insertBefore(addFormPlaceholder, addForm);
      }

      rect = addFormPlaceholder.getBoundingClientRect();

      addForm.className = "add-form is-sticky";
      addForm.style.left = rect.left + "px";
      addForm.style.width = rect.width + "px";

    } else {

      addForm.className = "add-form";
      addForm.style.left = "";
      addForm.style.width = "";

      if (addFormPlaceholder && addFormPlaceholder.parentNode) {
        addFormPlaceholder.parentNode.removeChild(addFormPlaceholder);
      }

      addFormPlaceholder = null;
    }
  }

  window.onscroll = function () {
    updateAddFormSticky();
  };

  window.onresize = function () {
    if (addForm.className.indexOf("is-sticky") === -1) {
      prepareAddFormSticky();
    }

    updateAddFormSticky();
  };  

  addForm.onsubmit = function (event) {
    var name;
    if (event && event.preventDefault) { event.preventDefault(); }
    name = newName.value.replace(/^\s+|\s+$/g, "");
    if (!name) { return false; }
    items.push({ id: makeId(), name: name, price: 0, quantity: 1, unit: "u" });
    newName.value = ""; save(); render(); newName.focus(); return false;
  };

  restoreButton.onclick = function () {
    restoreFile.click();
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

    var activeList = getActiveHabitualList();

    history.push({
      id: now.getTime(),
      date: now.getFullYear() + "-" + pad2(now.getMonth() + 1) + "-" + pad2(now.getDate()),
      listId: activeList ? activeList.id : null,
      listName: activeList ? activeList.name : "",
      items: bought,
      total: total
    });
    
    try { setHistory(history); save(); window.alert("Course enregistrée.\n\nMes articles habituels, leurs derniers prix et la course affichée restent intacts."); optionsPanel.className = "options-panel"; }
    catch (e) { window.alert("Impossible d'enregistrer cette course."); }
  };

  function pad2(n) { return n < 10 ? "0" + n : String(n); }

  backupData.onclick = function () {
    var data, text, blob, url, link;

    /*
     * S'assure que les dernières modifications
     * de la liste active sont bien enregistrées.
     */
    save();

    data = {
      version: 4,
      exportedAt: new Date().toISOString ?
        new Date().toISOString() :
        String(new Date()),

      habitualLists: habitualListsData,
      activeListId: activeListId,
      history: getHistory()
    };

    text = JSON.stringify(data, null, 2);

    try {
      blob = new Blob([text], { type: "application/json" });

      if (window.navigator && window.navigator.msSaveBlob) {
        window.navigator.msSaveBlob(
          blob,
          "liste-courses-sauvegarde.json"
        );
        return;
      }

      url = (window.URL || window.webkitURL).createObjectURL(blob);

      link = document.createElement("a");
      link.href = url;
      link.download = "liste-courses-sauvegarde.json";

      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      window.setTimeout(function () {
        (window.URL || window.webkitURL).revokeObjectURL(url);
      }, 1000);

    } catch (e) {
      window.alert(
        "Ce navigateur ne permet pas l'export automatique. " +
        "Les données restent enregistrées sur le téléphone."
      );
    }
  };

  restoreFile.onchange = function () {
    var file = restoreFile.files && restoreFile.files[0];
    var reader;

    if (!file) {
      return;
    }

    if (!window.confirm(
      "Restaurer cette sauvegarde remplacera toutes les listes habituelles, " +
      "les courses en cours et l'historique présents sur ce téléphone. Continuer ?"
    )) {
      restoreFile.value = "";
      return;
    }

    reader = new FileReader();

    reader.onload = function (event) {
      var data;
      var restoredLists;
      var activeList;

      try {
        data = JSON.parse(event.target.result);

        /*
         * Nouvelle sauvegarde version 4 :
         * plusieurs listes habituelles.
         */
        if (
          data &&
          data.version === 4 &&
          data.habitualLists &&
          data.habitualLists.length
        ) {
          restoredLists = data.habitualLists;

          habitualListsData = restoredLists;
          activeListId = data.activeListId || restoredLists[0].id;

          activeList = getActiveHabitualList();

          /*
           * Si l'identifiant de la liste active n'existe plus,
           * on prend simplement la première liste.
           */
          if (!activeList) {
            activeListId = restoredLists[0].id;
            activeList = restoredLists[0];
          }

          items = normalizeItems(activeList.items || []);
          trip = normalizeTrip(activeList.trip || null);

          saveHabitualLists();

        /*
         * Anciennes sauvegardes :
         * une seule liste habituelle.
         */
        } else if (data && data.items) {
          items = normalizeItems(data.items);
          trip = normalizeTrip(data.currentTrip || null);

          habitualListsData = [{
            id: "liste_" + new Date().getTime(),
            name: "Ma liste habituelle",
            items: items,
            trip: trip
          }];

          activeListId = habitualListsData[0].id;

          saveHabitualLists();

        } else {
          throw new Error("format");
        }

        /*
         * Historique commun à toutes les listes.
         */
        localStorage.setItem(
          HISTORY_KEY,
          JSON.stringify(data.history || [])
        );

        /*
         * Ancien stockage conservé comme filet de sécurité.
         */
        localStorage.setItem(
          STORAGE_KEY,
          JSON.stringify(items)
        );

        localStorage.setItem(
          TRIP_KEY,
          JSON.stringify(trip)
        );

        showHabitualLists();

        window.alert("Sauvegarde restaurée.");

      } catch (e) {
        window.alert(
          "Ce fichier n'est pas une sauvegarde valide de l'application."
        );
      }

      restoreFile.value = "";
      optionsPanel.className = "options-panel";
    };

    reader.readAsText(file);
  };

  load();
  render();
  prepareAddFormSticky();
  updateAddFormSticky();

  newHabitualList.onclick = function () {
    var name = prompt("Nom de la nouvelle liste :");

    if (name === null) {
      return;
    }

    name = name.replace(/^\s+|\s+$/g, "");

    if (!name) {
      alert("Donnez un nom à cette liste.");
      return;
    }

    createHabitualList(name);
  };

  backToLists.onclick = function () {
    showHabitualLists();
  };

  habitualLists.onclick = function (event) {
    var button = event.target;

    while (button && button !== habitualLists) {
      if (button.getAttribute("data-list-id")) {
        var activeList;

        activeListId = button.getAttribute("data-list-id");
        activeList = getActiveHabitualList();

        if (activeList) {
          items = normalizeItems(activeList.items || []);
          trip = normalizeTrip(activeList.trip || null);

          saveHabitualLists();
          showActiveHabitualList();
        }

        return;
      }

      button = button.parentNode;
    }
  };

  showHabitualLists();

  if ("serviceWorker" in navigator) { window.addEventListener("load", function () { navigator.serviceWorker.register("sw.js"); }); }
}());
