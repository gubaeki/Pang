let highScore = localStorage.getItem('highScore') || 0;

const scoreText = document.getElementById('score');
const highScoreText = document.getElementById('highScore');
const startBtn = document.getElementById('start');
const resetBtn = document.getElementById('resetScore');


function updateUI() {
  scoreText.textContent = `${score}`;
  highScoreText.textContent = `${highScore}`;
}

startBtn.addEventListener('click', () => {
  createBoard();
  startGameTimer();
});

resetBtn.addEventListener('click', () => {
  score = 0;
  localStorage.removeItem('highScore');
  highScore = 0;
  updateUI();
});


const boardSize = 8; // 8x8 보드
const types = 7; // cell 종류
const gameBoard = document.getElementById('game_board');

let score = 0;
// 드래그 상태 관리 변수
let isDragging = false;
let startCell = null; // 드래그 시작 셀
let startX = 0; // 마우스/터치 시작 X 좌표
let startY = 0;  // 마우스/터치 시작 Y 좌표
const DRAG_THRESHOLD = 20; // 스왑을 발생시키기 위한 최소 드래그 거리 (픽셀)
let grid = [];
let isAnimating = false;

// 60초 타이머
let timeLeft = 60;
let timerInterval = null;
const timerText = document.getElementById('timer');

// 콤보
let combo = 0;
let comboTimer = null;
const comboText = document.getElementById('combo'); // HTML에 표시할 요소 추가 필요


// 셀 하나의 위치 계산
function getCellPosition(x, y) {
  const size = gameBoard.clientWidth / boardSize;
  return { left: x * size  , top: y * size };
}

// 초기 보드 생성
function createBoard() {
  gameBoard.innerHTML = '';
  grid = [];

  for (let y = 0; y < boardSize; y++) {
    grid[y] = [];
    for (let x = 0; x < boardSize; x++) {
      const cell = document.createElement('div');
      cell.classList.add('cell');
      const type = Math.floor(Math.random() * types) + 1;
      cell.dataset.type = type;
      cell.dataset.x = x;
      cell.dataset.y = y;
      cell.style.backgroundImage = `url('images/char${type}.png')`;
      const pos = getCellPosition(x, y);
      cell.style.left = `${pos.left}px`;
      cell.style.top = `${pos.top}px`;
      
      //cell.addEventListener('click', () => handleClick(cell));

      gameBoard.appendChild(cell);
      grid[y][x] = cell;
    }
  }
  let initialMatches = getMatches();
  while (initialMatches.length > 0) {
    // 매칭된 셀들을 빈 셀로 표시 (dataset.type = 0)
    initialMatches.forEach(cell => {
      cell.dataset.type = 0;
      cell.style.backgroundImage = '';
    });
  createBoard(); // 🚨 매칭이 있으면 보드를 완전히 새로 생성
  return; // 새 보드 생성 후 현재 함수 종료
  }
}
// 클릭 처리
function handleClick(cell) {
  if (!selectedCell) {
    selectedCell = cell;
    cell.classList.add('hover');
  } else {
    const x1 = parseInt(selectedCell.dataset.x);
    const y1 = parseInt(selectedCell.dataset.y);
    const x2 = parseInt(cell.dataset.x);
    const y2 = parseInt(cell.dataset.y);

    selectedCell.classList.remove('hover');

    if ((Math.abs(x1 - x2) === 1 && y1 === y2) || (Math.abs(y1 - y2) === 1 && x1 === x2)) {
      swapCellsWithAnimation(selectedCell, cell);
    }
    selectedCell = null;
  }
}

// swap + 매끄러운 모션 + 매치 없으면 원상복구
function swapCellsWithAnimation(c1, c2) {
  isAnimating = true;

  const x1 = parseInt(c1.dataset.x), y1 = parseInt(c1.dataset.y);
  const x2 = parseInt(c2.dataset.x), y2 = parseInt(c2.dataset.y);

  // 실제 좌표 계산
  const pos1 = getCellPosition(x1, y1);
  const pos2 = getCellPosition(x2, y2);

  // transition 설정
  c1.style.transition = 'left 0.3s ease, top 0.3s ease';
  c2.style.transition = 'left 0.3s ease, top 0.3s ease';

  // 실제 좌표를 바꿔서 이동
  c1.style.left = `${pos2.left}px`;
  c1.style.top = `${pos2.top}px`;
  c2.style.left = `${pos1.left}px`;
  c2.style.top = `${pos1.top}px`;

  // 데이터 교환
  [c1.dataset.x, c2.dataset.x] = [c2.dataset.x, c1.dataset.x];
  [c1.dataset.y, c2.dataset.y] = [c2.dataset.y, c1.dataset.y];
  grid[y1][x1] = c2;
  grid[y2][x2] = c1;

  // 애니메이션 완료 후 transition 초기화
  setTimeout(() => {
    c1.style.transition = '';
    c2.style.transition = '';

    const matches = getMatches();
    if (matches.length === 0) {
      // 매치 없으면 원위치로 복귀 (다시 swap)
      revertSwapAnimation(c1, c2, x1, y1, x2, y2);
    } else {
      removeCells(matches);
    }
  }, 300);
}



// 매치 검사
function getMatches() {
  let toRemove = [];

  // 가로
  for (let y=0;y<boardSize;y++){
    let count=1;
    for (let x=1;x<boardSize;x++){
      if(grid[y][x].dataset.type === grid[y][x-1].dataset.type) count++;
      else {
        if(count>=3) for(let k=0;k<count;k++) toRemove.push(grid[y][x-1-k]);
        count=1;
      }
    }
    if(count>=3) for(let k=0;k<count;k++) toRemove.push(grid[y][boardSize-1-k]);
  }

  // 세로
  for (let x=0;x<boardSize;x++){
    let count=1;
    for (let y=1;y<boardSize;y++){
      if(grid[y][x].dataset.type===grid[y-1][x].dataset.type) count++;
      else {
        if(count>=3) for(let k=0;k<count;k++) toRemove.push(grid[y-1-k][x]);
        count=1;
      }
    }
    if(count>=3) for(let k=0;k<count;k++) toRemove.push(grid[boardSize-1-k][x]);
  }

  return toRemove;
}

// 제거 + 부드러운 fade-out + scale-down 효과
function removeCells(cells) {
  handleCombo(cells); 
  cells.forEach(cell => {
    cell.style.transition = 'transform 0.25s ease, opacity 0.25s ease';
    cell.style.transform = 'scale(0.3)';
    cell.style.opacity = '0';
  });

  // 점수 반영
  score += cells.length * 10 * (combo > 1 ? combo : 1);
  updateUI();
  
  // 애니메이션 끝난 후 제거 처리
  setTimeout(() => {
    cells.forEach(cell => {
      cell.style.transition = '';
      cell.style.transform = '';
      cell.style.opacity = '1';
      cell.dataset.type = 0;
      cell.style.backgroundImage = '';
    });

    dropCells(); // 낙하 호출
  }, 250);
}

// 낙하 + 위쪽 랜덤 생성 + 실제 좌표 이동 애니메이션
function dropCells() {
  const cellSize = gameBoard.clientWidth / boardSize;

  for (let x = 0; x < boardSize; x++) {
    let stackWithOriginalY = []; 
    for (let y = boardSize - 1; y >= 0; y--) {
      if (grid[y][x].dataset.type != 0) {
        stackWithOriginalY.push({ 
          type: grid[y][x].dataset.type, 
          originalY: y
        });
      }
    }

    let yIndex = boardSize - 1;
    
    // 기존 cell 낙하 애니메이션
    stackWithOriginalY.forEach(item => {
      const cell = grid[yIndex][x];
      const targetPosition = getCellPosition(x, yIndex); 
      const firstPosition = getCellPosition(x, item.originalY); // 
      const invertY = firstPosition.top - targetPosition.top;

      cell.dataset.type = item.type;
      cell.style.backgroundImage = `url('images/char${item.type}.png')`;

      cell.style.left = `${targetPosition.left}px`;
      cell.style.top = `${targetPosition.top}px`;

      cell.style.transform = `translateY(${invertY}px)`;
      
      requestAnimationFrame(() => {
        cell.style.transition = 'transform 0.4s ease';
        cell.style.transform = 'translateY(0)';
      });

      setTimeout(() => {
        cell.style.transition = '';
        cell.style.transform = '';
      }, 400);

      yIndex--;
    });
    
    const numNewCells = yIndex + 1; 
    const startOffsetPixels = numNewCells * cellSize;

    // 빈칸 채우기
    while (yIndex >= 0) {
      const type = Math.floor(Math.random() * types) + 1;
      const cell = grid[yIndex][x];
      const { left, top } = getCellPosition(x, yIndex);
      cell.dataset.type = type;
      cell.style.backgroundImage = `url('images/char${type}.png')`;
      cell.style.left = `${left}px`;
      cell.style.top = `${top}px`
   
      // 신규 cell 낙하 애니메이션
      cell.style.transform = `translateY(-${startOffsetPixels}px)`;
      cell.style.opacity = '0';

      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          cell.style.transition = 'opacity 0.4s cubic-bezier(0.8, 0, 1, 1), transform 0.4s ease';
          cell.style.transform = 'translateY(0)';
          cell.style.opacity = '1';
        });
      });

      
      setTimeout(() => {
        cell.style.transition = '';
        cell.style.transform = '';
        cell.style.opacity = '';
      }, 400);
      
      yIndex--;
    }
  }

  setTimeout(() => {
     const matches = getMatches();
     if (matches.length > 0) {
            removeCells(matches);
        } else {
            isAnimating = false; 
        }
  }, 400);
}

// swap + 매끄러운 모션 + 매치 없으면 원상복구
function revertSwapAnimation(c1, c2, x1, y1, x2, y2) {
  const pos1 = getCellPosition(x1, y1);
  const pos2 = getCellPosition(x2, y2);

  c1.style.transition = 'left 0.3s ease, top 0.3s ease';
  c2.style.transition = 'left 0.3s ease, top 0.3s ease';

  c1.style.left = `${pos1.left}px`;
  c1.style.top = `${pos1.top}px`;
  c2.style.left = `${pos2.left}px`;
  c2.style.top = `${pos2.top}px`;

  [c1.dataset.x, c2.dataset.x] = [x1.toString(), x2.toString()];
  [c1.dataset.y, c2.dataset.y] = [y1.toString(), y2.toString()];

  setTimeout(() => {
    c1.style.transition = '';
    c2.style.transition = '';
    grid[y1][x1] = c1;
    grid[y2][x2] = c2;

    isAnimating = false;

  }, 300);
}

// 3. 드래그 시작 처리
function handleDragStart(e) {
    if (isAnimating || isDragging) return;

    // 터치 이벤트 대응
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;
    
    // 클릭된 위치에 있는 셀을 찾습니다. (중요: e.target이 cell이어야 함)
    if (!e.target.classList.contains('cell')) return;

    isDragging = true;
    startCell = e.target;
    startX = clientX;
    startY = clientY;
    
    // 호버 효과 제거
    // startCell.classList.add('hover'); // 필요 시 주석 해제
}

// 4. 드래그 중 이동 처리
function handleDragMove(e) {
    if (!isDragging || !startCell) return;
    
    // 터치 이벤트 대응
    const clientX = e.clientX || e.touches[0].clientX;
    const clientY = e.clientY || e.touches[0].clientY;

    const dx = clientX - startX;
    const dy = clientY - startY;

    // 드래그 임계값(DRAG_THRESHOLD)을 넘었는지 확인
    if (Math.abs(dx) > DRAG_THRESHOLD || Math.abs(dy) > DRAG_THRESHOLD) {
        
        const x1 = parseInt(startCell.dataset.x);
        const y1 = parseInt(startCell.dataset.y);
        let x2 = x1;
        let y2 = y1;

        // 드래그 방향 결정
        if (Math.abs(dx) > Math.abs(dy)) {
            // 수평 이동
            x2 = x1 + (dx > 0 ? 1 : -1);
        } else {
            // 수직 이동
            y2 = y1 + (dy > 0 ? 1 : -1);
        }
        
        // 인접한 셀이 보드 안에 있는지 확인
        if (x2 >= 0 && x2 < boardSize && y2 >= 0 && y2 < boardSize) {
            const endCell = grid[y2][x2];
            
            // 스왑 애니메이션 호출
            swapCellsWithAnimation(startCell, endCell);

            // 스왑이 완료되면 드래그 상태를 초기화하고 리스너 제거
            handleDragEnd();
        }
        
        // 유효 드래그 후에는 드래그 상태를 즉시 종료
        handleDragEnd();
    }
}

// 5. 드래그 종료 처리
function handleDragEnd() {
    if (startCell) {
        // startCell.classList.remove('hover'); // 필요 시 주석 해제
    }
    isDragging = false;
    startCell = null;
    startX = 0;
    startY = 0;
}

function startGameTimer() {
  // 이미 돌고 있는 타이머 있으면 초기화
  clearInterval(timerInterval);
  timeLeft = 60;
  timerText.textContent = timeLeft;
  score = 0;
  updateUI();

  startBtn.disabled = true; // 시작 버튼 비활성화

  timerInterval = setInterval(() => {
    timeLeft--;
    timerText.textContent = timeLeft;

    if (timeLeft <= 0) {
      clearInterval(timerInterval);
      timerText.textContent = '0';
      startBtn.disabled = false; // 타이머 끝나면 버튼 활성화

      // 최고점수 갱신
      if (score > highScore) {
        highScore = score;
        localStorage.setItem('highScore', highScore);
      }

      alert(`⏰ 시간 종료! 최종 점수: ${score}`);
      score = 0;
      updateUI();
    }
  }, 1000);
}

function handleCombo(cells) {
  combo++;
  clearTimeout(comboTimer);

  // 콤보 표시할 위치 계산 (매칭된 셀 중 중앙 셀 기준)
  const targetCell = cells[Math.floor(cells.length / 2)];
  const rect = targetCell.getBoundingClientRect();

  const comboDiv = document.createElement('div');
  comboDiv.classList.add('combo-popup');
  comboDiv.textContent = `${combo} Combo!`;

  comboDiv.style.position = 'fixed'; // ✅ body 기준으로 고정
  comboDiv.style.left = rect.left + rect.width / 2 + 'px';
  comboDiv.style.top = rect.top - 20 + 'px';
  comboDiv.style.transform = 'translate(-50%, -100%) scale(1)';
  comboDiv.style.fontSize = '22px';
  comboDiv.style.fontWeight = 'bold';
  comboDiv.style.color = '#ff4444';
  comboDiv.style.textShadow = '0 0 8px rgba(255, 80, 80, 0.8)';
  comboDiv.style.opacity = '1';
  comboDiv.style.transition = 'transform 0.6s ease-out, opacity 0.6s ease-out';
  comboDiv.style.pointerEvents = 'none';
  comboDiv.style.zIndex = '9999';
  console.log(comboDiv);
  document.body.appendChild(comboDiv);

  // 위로 떠오르면서 사라지는 애니메이션
  requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          comboDiv.style.transform = 'translate(-50%, -150%) scale(1.3)';
          comboDiv.style.opacity = '0';
        });
      });
  

  // 일정 시간 뒤 제거
  setTimeout(() => comboDiv.remove(), 1000);

  // 3초 동안 다음 매칭이 없으면 콤보 초기화
  comboTimer = setTimeout(() => {
    combo = 0;
  }, 3000);
}


// changeBoard 버튼 클릭
document.getElementById('changeBoard').addEventListener('click', () => {
  // 60 초기화
  clearInterval(timerInterval);
  timeLeft = 60;
  timerText.textContent = timeLeft;
  // 스코어 초기화
  score = 0;
  // 콤보 초기화
  clearTimeout(comboTimer);
  combo = 0;
  comboText.textContent = '';

  updateUI();
  createBoard();
  startBtn.disabled = false;
});



// 이벤트 리스너 등록
gameBoard.addEventListener('mousedown', handleDragStart);
gameBoard.addEventListener('mousemove', handleDragMove);
gameBoard.addEventListener('mouseup', handleDragEnd);
gameBoard.addEventListener('mouseleave', handleDragEnd); // 보드를 벗어나면 종료

// 터치 이벤트 등록 (모바일 대응)
gameBoard.addEventListener('touchstart', handleDragStart);
gameBoard.addEventListener('touchmove', handleDragMove);
gameBoard.addEventListener('touchend', handleDragEnd);

// 초기화
createBoard();
updateUI();
