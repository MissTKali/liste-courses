/******************************************************************************
 * Ma liste de courses
 * Easter Egg : la tomate acrobate 🍅
 *
 * 3 appuis rapides sur le titre : apparition de la tomate.
 * 4e appui pendant le spectacle : révélation de l'œuf.
 *
 * Aucun accès aux données de l'application.
 ******************************************************************************/

(function () {
  "use strict";

  var title = document.getElementById("tomatoSecret");

  if (!title) return;

  var clicks = 0;
  var lastClick = 0;
  var playing = false;
  var eggRevealed = false;
  var stage = null;
  var closeTimer = null;

  title.addEventListener("click", function () {

    // Pendant le spectacle : révéler l'œuf.
    if (playing) {
      if (!eggRevealed) {
        revealEgg();
      }
      return;
    }

    var now = Date.now();

    // Les 3 appuis doivent être rapprochés.
    if (now - lastClick > 650) {
      clicks = 0;
    }

    clicks++;
    lastClick = now;

    if (clicks === 3) {
      clicks = 0;
      startShow();
    }
  });

  function startShow() {

    playing = true;
    eggRevealed = false;

    stage = document.createElement("div");
    stage.className = "tomato-stage";

    stage.innerHTML = `
      <div class="tomato-character">

        <div class="tomato-leaves">
          <span></span><span></span><span></span>
        </div>

        <div class="tomato-body">
          <div class="tomato-eyes">
            <span></span><span></span>
          </div>

          <div class="tomato-smile"></div>
        </div>

        <div class="tomato-legs">
          <span></span><span></span>
        </div>

      <div class="tomato-arm"></div>

      <div class="tomato-sign">
        <div class="tomato-board">
          <div class="tomato-question">
            Vous croyez voir une tomate ?
          </div>

          <div class="tomato-egg" aria-hidden="true">
            <svg viewBox="0 0 100 130" width="55" height="72">
              <defs>
                <clipPath id="eggShape">
                  <path d="M50 5 C25 5 8 55 8 85
                           C8 110 25 125 50 125
                           C75 125 92 110 92 85
                           C92 55 75 5 50 5Z"/>
                </clipPath>
              </defs>

              <g clip-path="url(#eggShape)">
                <rect width="100" height="130" fill="#ffe7a0"/>
                <path d="M0 35 H100 V52 H0Z" fill="#f26b7a"/>
                <path d="M0 75 H100 V92 H0Z" fill="#68b8dc"/>
                <path d="M0 60 L15 50 L30 60 L45 50
                         L60 60 L75 50 L100 60"
                      fill="none" stroke="#48a75a" stroke-width="7"/>
                <circle cx="50" cy="23" r="7" fill="#68b8dc"/>
                <circle cx="30" cy="83" r="5" fill="#fff"/>
                <circle cx="70" cy="83" r="5" fill="#fff"/>
                <circle cx="50" cy="108" r="7" fill="#f26b7a"/>
              </g>

              <path d="M50 5 C25 5 8 55 8 85
                       C8 110 25 125 50 125
                       C75 125 92 110 92 85
                       C92 55 75 5 50 5Z"
                    fill="none" stroke="#b78a50" stroke-width="3"/>
            </svg>
          </div>
        </div>

        <div class="tomato-stick"></div>
        <div class="tomato-hand"></div>
      </div>
    </div> 
     
    `;

    document.body.appendChild(stage);

    // Fermer les yeux pendant les pirouettes.
    stage.classList.add("tomato-eyes-closed");

    // Rouvrir les yeux après 1,6 seconde.
    setTimeout(function () {
      if (stage) {
        stage.classList.remove("tomato-eyes-closed");
      }
    }, 1600);

    closeTimer = setTimeout(endShow, 6500);
  }

  function revealEgg() {

    if (!stage || eggRevealed) return;

    eggRevealed = true;

    stage.classList.add("tomato-reveal");

    // L'œuf reste visible jusqu'à la fin du spectacle.
  }

  function endShow() {

    if (!stage) return;

    stage.classList.add("tomato-exit");

    setTimeout(function () {
      if (stage) {
        stage.remove();
        stage = null;
      }

      playing = false;
      eggRevealed = false;
      closeTimer = null;
    }, 600);
  }

})();