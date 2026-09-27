(function () {
  "use strict";

  var HISTORY_KEY = "maListeCourses_historique_v2";

  var history = loadHistory();
  var emptyEl = document.getElementById("historyEmpty");
  var priceSection = document.getElementById("priceSection");
  var tripsSection = document.getElementById("tripsSection");
  var productSelect = document.getElementById("productSelect");
  var chartEl = document.getElementById("chart");
  var detailsEl = document.getElementById("priceDetails");
  var tripsEl = document.getElementById("trips");

  var oldTicketButton = document.getElementById("oldTicketButton");
  var oldTicketFile = document.getElementById("oldTicketFile");

  function loadHistory() {
    try {
      return JSON.parse(localStorage.getItem(HISTORY_KEY) || "[]");
    } catch (e) {
      return [];
    }
  }

  function escapeHtml(text) {
    return String(text).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
  }

  function money(value) {
    return (Number(value) || 0).toFixed(2).replace(".", ",") + " €";
  }

  function dateFr(value) {
    var p = String(value || "").split("-");
    return p.length === 3 ? p[2] + "/" + p[1] + "/" + p[0] : value;
  }

  function productKey(name, unit) {
    return String(name || "").toLowerCase() + "|" + (unit === "g" ? "g" : "u");
  }

  function productLabel(name, unit) {
    return name + (unit === "g" ? " (prix/kg)" : " (prix/unité)");
  }

  function buildProducts() {
    var map = {};
    var list = [];
    var i, j, item, key;
    for (i = 0; i < history.length; i++) {
      for (j = 0; j < history[i].items.length; j++) {
        item = history[i].items[j];
        key = productKey(item.name, item.unit);
        if (!map[key]) {
          map[key] = { key: key, name: item.name, unit: item.unit };
          list.push(map[key]);
        }
      }
    }
    list.sort(function (a, b) {
      var aa = a.name.toLowerCase(), bb = b.name.toLowerCase();
      return aa < bb ? -1 : aa > bb ? 1 : 0;
    });
    return list;
  }

  function renderTrips() {
    var html = "";
    var i, j, trip, item;
    for (i = history.length - 1; i >= 0; i--) {
      trip = history[i];
      html += '<article class="trip-card">';
      html += '<button type="button" class="trip-head" aria-expanded="false">';
      html += '<strong>' + escapeHtml(dateFr(trip.date)) + '</strong>';
      html += '<span class="trip-head-right"><strong>' + money(trip.total) + '</strong><span class="trip-arrow">▼</span></span>';
      html += '</button>';
      html += '<ul class="trip-items">';
      for (j = 0; j < trip.items.length; j++) {
        item = trip.items[j];
        html += '<li><span>' + escapeHtml(item.name) + ' — ' + escapeHtml(String(item.quantity).replace(".", ",")) + ' ' + escapeHtml(item.unit) + '</span><span>' + money(item.paid) + '</span></li>';
      }
      html += '</ul></article>';
    }
    tripsEl.innerHTML = html;

    var heads = tripsEl.getElementsByClassName("trip-head");

    for (i = 0; i < heads.length; i++) {
      heads[i].onclick = function () {
        var items = this.nextSibling;
        var arrow = this.getElementsByClassName("trip-arrow")[0];
        var isOpen = this.getAttribute("aria-expanded") === "true";

        if (isOpen) {
          items.style.display = "none";
          this.setAttribute("aria-expanded", "false");
          arrow.innerHTML = "▼";
        } else {
          items.style.display = "block";
          this.setAttribute("aria-expanded", "true");
          arrow.innerHTML = "▲";
        }
      };
    }
    
  }

  function annualSeries(key) {
    var years = {};
    var result = [];
    var i, j, trip, item, year;
    for (i = 0; i < history.length; i++) {
      trip = history[i];
      year = String(trip.date).substring(0, 4);
      for (j = 0; j < trip.items.length; j++) {
        item = trip.items[j];
        if (productKey(item.name, item.unit) === key && Number(item.unitPrice) > 0) {
          if (!years[year]) { years[year] = { sum: 0, count: 0 }; }
          years[year].sum += Number(item.unitPrice) || 0;
          years[year].count += 1;
        }
      }
    }
    for (year in years) {
      if (years.hasOwnProperty(year)) {
        result.push({ year: year, value: years[year].sum / years[year].count, count: years[year].count });
      }
    }
    result.sort(function (a, b) { return Number(a.year) - Number(b.year); });
    return result;
  }

  function renderChart() {
    var key = productSelect.value;
    var series = annualSeries(key);
    var w = 520, h = 230, left = 52, right = 18, top = 20, bottom = 42;
    var plotW = w - left - right, plotH = h - top - bottom;
    var min = Infinity, max = -Infinity, i, x, y, points = "", svg = "", range;

    if (!series.length) {
      chartEl.innerHTML = "";
      detailsEl.innerHTML = "";
      return;
    }

    for (i = 0; i < series.length; i++) {
      min = Math.min(min, series[i].value);
      max = Math.max(max, series[i].value);
    }
    if (min === max) { min = Math.max(0, min - 1); max += 1; }
    range = max - min;
    min = Math.max(0, min - range * 0.15);
    max = max + range * 0.15;

    svg += '<svg viewBox="0 0 ' + w + ' ' + h + '" role="img" aria-label="Évolution annuelle du prix">';
    svg += '<line x1="' + left + '" y1="' + top + '" x2="' + left + '" y2="' + (h-bottom) + '" class="axis" />';
    svg += '<line x1="' + left + '" y1="' + (h-bottom) + '" x2="' + (w-right) + '" y2="' + (h-bottom) + '" class="axis" />';
    svg += '<text x="6" y="' + (top+5) + '" class="chart-label">' + money(max) + '</text>';
    svg += '<text x="6" y="' + (h-bottom) + '" class="chart-label">' + money(min) + '</text>';

    for (i = 0; i < series.length; i++) {
      x = series.length === 1 ? left + plotW / 2 : left + (i * plotW / (series.length - 1));
      y = top + ((max - series[i].value) / (max - min)) * plotH;
      points += x + ',' + y + ' ';
      svg += '<circle cx="' + x + '" cy="' + y + '" r="5" class="chart-point" />';
      svg += '<text x="' + x + '" y="' + (h-17) + '" text-anchor="middle" class="chart-year">' + escapeHtml(series[i].year) + '</text>';
    }
    if (series.length > 1) {
      svg += '<polyline points="' + points + '" class="chart-line" />';
    }
    svg += '</svg>';
    chartEl.innerHTML = svg;

    var html = "";
    for (i = 0; i < series.length; i++) {
      html += '<div><strong>' + escapeHtml(series[i].year) + '</strong><span>' + money(series[i].value) + (series[i].count > 1 ? ' (moyenne de ' + series[i].count + ' achats)' : '') + '</span></div>';
    }
    detailsEl.innerHTML = html;
  }

  function saveHistory() {
    localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  }

  function sameTicketAlreadyExists(ticket) {
    var i;
    var j;
    var trip;
    var a;
    var b;

    for (i = 0; i < history.length; i++) {
      trip = history[i];

      if (trip.date !== ticket.date) {
        continue;
      }

      if (!trip.items || trip.items.length !== ticket.items.length) {
        continue;
      }

      for (j = 0; j < trip.items.length; j++) {
        a = trip.items[j];
        b = ticket.items[j];

        if (
          a.name !== b.name ||
          Number(a.quantity) !== Number(b.quantity) ||
          a.unit !== b.unit ||
          Number(a.unitPrice) !== Number(b.unitPrice) ||
          Number(a.paid) !== Number(b.paid)
        ) {
          break;
        }
      }

      if (j === trip.items.length) {
        return true;
      }
    }

    return false;
  }  

  function importOldTicket(ticket) {
    var i;
    var item;
    var total = 0;
    var cleanItems = [];

    if (!ticket || !ticket.date || !ticket.items || !ticket.items.length) {
      throw new Error("Format de ticket invalide.");
    }

    if (sameTicketAlreadyExists(ticket)) {
      throw new Error("Ce ticket a déjà été importé.");
    }    

    for (i = 0; i < ticket.items.length; i++) {
      item = ticket.items[i];

      if (
        !item.name ||
        typeof item.quantity !== "number" ||
        typeof item.unitPrice !== "number" ||
        typeof item.paid !== "number"
      ) {
        throw new Error("Un article du ticket est invalide.");
      }

      cleanItems.push({
        name: item.name,
        quantity: item.quantity,
        unit: item.unit === "g" ? "g" : "u",
        unitPrice: item.unitPrice,
        paid: item.paid
      });

      total += item.paid;
    }

    total = Math.round(total * 100) / 100;

    history.push({
      id: "import-" + new Date().getTime(),
      date: ticket.date,
      items: cleanItems,
      total: total
    });

    saveHistory();
  }


  oldTicketButton.onclick = function () {
    oldTicketFile.value = "";
    oldTicketFile.click();
  };


  oldTicketFile.onchange = function () {
    var file = oldTicketFile.files[0];
    var reader;

    if (!file) {
      return;
    }

    reader = new FileReader();

    reader.onload = function () {
      var ticket;

      try {
        ticket = JSON.parse(reader.result);

        importOldTicket(ticket);

        alert(
          "Ticket du " +
          dateFr(ticket.date) +
          " importé avec succès."
        );

        history = loadHistory();
        init();

      } catch (error) {
        alert(
          "Impossible d'importer ce ticket.\n\n" +
          error.message
        );
      }
    };

    reader.onerror = function () {
      alert("Impossible de lire le fichier sélectionné.");
    };

    reader.readAsText(file);
  };

  function init() {
    var products, html = "", i;
    if (!history.length) {
      emptyEl.style.display = "block";
      priceSection.style.display = "none";
      tripsSection.style.display = "none";
      return;
    }
    emptyEl.style.display = "none";
    products = buildProducts();
    for (i = 0; i < products.length; i++) {
      html += '<option value="' + escapeHtml(products[i].key) + '">' + escapeHtml(productLabel(products[i].name, products[i].unit)) + '</option>';
    }
    productSelect.innerHTML = html;
    productSelect.onchange = renderChart;
    renderTrips();
    renderChart();
  }

  init();
}());
