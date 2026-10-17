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

      </div>

      <div class="tomato-sign">
        <div>Vous croyez voir une tomate ?</div>
        <div class="tomato-egg" aria-hidden="true">🥚</div>
      </div>
    `;

    document.body.appendChild(stage);

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