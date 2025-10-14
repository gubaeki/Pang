let score = 0;
let highScore = localStorage.getItem('highScore') || 0;

const scoreText = document.getElementById('score');
const highScoreText = document.getElementById('highScore');
const addScoreBtn = document.getElementById('addScore');
const resetBtn = document.getElementById('resetScore');

function updateUI() {
  scoreText.textContent = `현재 점수: ${score}`;
  highScoreText.textContent = `최고 점수: ${highScore}`;
}

addScoreBtn.addEventListener('click', () => {
  score += 10;
  if (score > highScore) {
    highScore = score;
    localStorage.setItem('highScore', highScore);
  }
  updateUI();
});

resetBtn.addEventListener('click', () => {
  score = 0;
  localStorage.removeItem('highScore');
  highScore = 0;
  updateUI();
});

updateUI();
