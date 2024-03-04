//МУЗИКА
let musicSound = new Audio('muzyka-tetris.mp3')
musicSound.play()

document.getElementById('music').loop=true;
document.getElementById('music').play()

const scoreElement =  document.querySelector('.score');
const btnRestart = document.querySelector('.restart');
// const btnNewGame = document.querySelector('.newgame');
const scoreFinal = document.querySelector('.scorefinal');
const PLAYFIELD_COLUMNS = 10;
const PLAYFIELD_ROWS = 20;

let playfield;
let tetromino;
let score = 0;
let isPaused = false;
let isGameOver = false;//за замовчуванням в нас фолс

let timedId = null;
const overlay = document.querySelector('.overlay');


//массив фігур
const TETROMINO_NAMES = [
    'O',
    'J',
    'I',
    'L',
    'Z',
    'T'
]

//об'єкт з описом фігур
//одинички максимально виставлені по центру, щоб при центруванні фігур
//по середині поля, вони центрувались гармонійно
const TETROMINOES = {
    'O': [
        [1,1],
        [1,1]
    ],
    'J': [
        [1,0,0],
        [1,1,1],
        [0,0,0]
    ],
    'I':[
        [0,0,0,0],
        [1,1,1,1],
        [0,0,0,0],
        [0,0,0,0]
    ],
    'L':[
        [0,1,0],
        [0,1,0],
        [0,1,1]
    ],
    'Z':[
        [1,1,0],
        [0,1,0],
        [0,1,1]
    ],
    'T':[
        [1,1,1],
        [0,1,0],
        [0,1,0]
    ],
    
}

let cells;    //звертаємось до всіх комірок разом
init();
function init(){
    score = 0;
    scoreElement.innerHTML = 0;
    isGameOver = false;
    isPaused = false;
    generatePlayField();
    generateTetromino();
    //звертаємось до всіх комірок разом
    cells = document.querySelectorAll(".grid div");
    moveDown();
}


//вичисляємо індекс комірки. Ось ми в teromino задали row і column. Наприклад row - 1(у нас відлик іде з ноля, тож для глаза то 
//другий рядок, але зі сторони логіки перший), column - 5
//тобто буде 1 помножити на 10(бо стільки у нас столбців) + 5 і вийде, що індекс комірки 15(для ока 16)
function convertPositionToIndex(row, column){
    return row * PLAYFIELD_COLUMNS + column;
}

function countScore(destroyRows){
    switch(destroyRows){
        case 1:
            score +=10;
            break;
        case 2:
            score +=20;
            break;
        case 3:
            score +=50;
            break;
        case 4:
            score +=100;
            break;
                    
    }
    scoreElement.innerHTML = score;
}

//ПЕРШЕ - створюємо одразу 200 полей в головному діві з класом грід
function generatePlayField(){
  for(let i=0; i< PLAYFIELD_ROWS * PLAYFIELD_COLUMNS; i++)  {
    const div = document.createElement("div")
    document.querySelector(".grid").append(div);
  }
//ДРУГЕ - наповнюємо кожну колонку(яка є масивом) масивом з 20 нулів(тобто у кожній з 20 комірок буде ноль)
  playfield = new Array(PLAYFIELD_ROWS).fill()
                            .map(()=> new Array(PLAYFIELD_COLUMNS).fill(0) )
                            console.log(playfield);
}

//ТРЕТЄ - функція, яка задає параметри місцезнаходження для фігури. Беремо з першочергових данних(самий верх) всі данні о фігурі
// і кажемо де їй стояти

function generateRandomTetrominoNumber(){
    return Math.floor(Math.random() * TETROMINO_NAMES.length);
}

function generateTetromino(){

    //TETROMINO_NAMES.length це в нас кількість фігур
        let RandomTetrominoNumber = generateRandomTetrominoNumber(); 

    //в name загоняємо саму букву через індекс, тобто зараз у нас за першим індексом J
    const name = TETROMINO_NAMES[RandomTetrominoNumber];
    //звертаємось до обє'кту tetrominoes, в якому у нас всі масиви з описом фігур, по нейму(в ньому у нас вище літера J) звертаємось
    // до масиву в цій літері і заносимо це в змінну matrix
    
    const matrix = TETROMINOES[name];

    //вичисляємо середину колонок (10/2)
    //і відіймаємо половину ширини фігури
    //тож фігура буде по центру playfield
    let averageColumn = Math.floor(PLAYFIELD_COLUMNS/2 - matrix.length/2 )

    const rowTetro = -2;
    //щоб фігура планомірно падала з гори, а не одразу з'являлась на полю
    
    //визначаємо місцезнаходження фігури і її ім'я
    tetromino = {
        name,
        matrix,
        row:rowTetro,
        column:averageColumn
    }
}

//робимо так, щоб в кожної фігури був рандомний колір
// let randomColor = function (){
//     const hex = '0123456789ABCDEF';
//     let color = '#';
//     for(let i = 0; i < 6; i++){
//         let index = Math.floor(Math.random()*16);
//         color += hex[index];
//     }
//     if(color == '#808080'){
//         return randomColor();
//     }
//     return color;
// }

// let newcolor = randomColor();


//расположення фігури на полі(умова if відповідає за то, щоб внизу поля
//фігура не змінювалась)
function placeTetromino (){
    const matrixSize = tetromino.matrix.length;
    for (let row=0; row<matrixSize;row++){
        for(let column = 0; column < matrixSize;column++){
            //GAME OVER
            if(isOutsideOfTopboard(row)){
                isGameOver = true;
                return;
                //тобто дали код вже не выконаэться,створювати нову фігуру
                //немає необхідності
            }
            if(tetromino.matrix[row][column]){
                playfield[tetromino.row + row][tetromino.column + column] = tetromino.name;
            }
        }
    }

    const filledRows = findFilledRows();
    removeFillRows(filledRows);
    generateTetromino();
    countScore(filledRows.length);
}


//яункція, яка видаляє які ряди є повністю заповнені одиничками(тобто
//фігурами)
function removeFillRows(filledRows){
    for (let i = 0; i < filledRows.length; i++){
        const row = filledRows[i];
        dropRowsAbove(row);
    }
}

function dropRowsAbove(rowDelete){
    for(let row = rowDelete; row >0; row--){
        playfield[row] = playfield[row - 1];
    }
    playfield[0] = new Array(PLAYFIELD_COLUMNS).fill(0);
}

//яункція, яка трекає які ряди є повністю заповнені одиничками(тобто
//фігурами)
function findFilledRows(){
    const fillRows = [];
    for (let row = 0; row < PLAYFIELD_ROWS; row++){
        let filledColumns = 0;
        for(let column = 0; column < PLAYFIELD_COLUMNS; column++){
            if(playfield[row][column] != 0){
                filledColumns++;
            }
        }

        if(PLAYFIELD_COLUMNS === filledColumns){
            fillRows.push(row);
        }
    }

    return fillRows;
}


    






//ЧЕТВЕРТЕ - ПЕРЕМАЛЬОВКА ВСЬОГО ПОЛЯ, ЯКА ВІДЬУВАЄТЬСЯ ПОСТІЙНО
function drawPlayField(){
    for(let row = 0; row < PLAYFIELD_ROWS; row++){
        for(let column = 0; column < PLAYFIELD_COLUMNS; column++){

            if(playfield[row][column] == 0) continue;

            //continue значить пропустити ото малюваня нижче

            //ми ж ото вище відмалювали фігуру, в якій в матриці записані одинички і нолики - вони відображають форму фігури
           // і ось тепер ми проходимось по всім коміркам(оті два цикли зверху)
           //якщо в комірці нолик - нічого не відбувається
           // якщо НЕ нолик(тобто одиничка), то в name записується який то був ряд і колонка
           //потом ці данні передаються в функцію convertPositionToIndex і там створюємться унікальний
           //індекс комірки, яка має бути замальована 
           // і ось ми в усіх комірках шукаємо саме цю і додаємо їй css клас, щоб вона відмалювалась
            const name = playfield[row][column];
            const cellIndex = convertPositionToIndex(row,column);
            cells[cellIndex].classList.add(name); 
            // cells[cellIndex].style.backgroundColor = newcolor;

        }
       
    }
}




//П'ЯТЕ - ЗАМАЛЬОВУЄМО САМЕ ФІГУРУ. ТОбто ми її шукаємо і замальовуємо
function drawTetromino(){
    const name = tetromino.name;
    //схоплюємо пропорції, розмір фігури. Беремо в тетроміно параметр матрікс
    //в матрікс записаний отой масив з tetrominoes, який ми знаходемо по параметру
    //name, тобто в tetrominoMatrixSize у нас довжина масиву літери О(наприклад) [
    //    [1,1],
   //     [1,1]
  //  ],

  //тобто в випадку літери О дожина цього масиву - 2
    const tetrominoMatrixSize = tetromino.matrix.length;

    for(let row = 0; row < tetrominoMatrixSize; row++){
        for(let column = 0; column < tetrominoMatrixSize; column++){

            //ROTATE LEKCJA - підказка як воно ротейтиться
            // const cellIndex = convertPositionToIndex(tetromino.row+row,tetromino.column+column);
            // cells[cellIndex].innerHTML = showRotated[row][column];
            //ROTATE LEKCJA

            //це щоб фігура плавно випадала зверху
            if(isOutsideOfTopboard(row))continue;

            //саме оця строка відповідає за то, щоб
            //в матриці фігури замалювались тільки
            //одинички
            if(!tetromino.matrix[row][column]) continue;
            const cellIndex = convertPositionToIndex(tetromino.row+row,tetromino.column+column);

        //    console.log(cellIndex);
        // cells[cellIndex].style.backgroundColor = newcolor;

           cells[cellIndex].classList.add(name); 
        }
       
    }
    // cells[15].classList.add('O');
}

// drawPlayField();
// drawTetromino();


//НУЛЬОВИЙ ПЕРШОЧЕРГОВИЙ ШАГ - очищуємо повністю комірки від всіх класів(тобто фігур)
//і рисуємо її заново (drawplayfield)
//рисуємо нову фігуру(drawtetromino)
//саме ця функція відповідає за то, щоб фігура зсувалась вниз, а не
//тягнулась полосою
function draw(){
    cells.forEach(cell => cell.removeAttribute('class'));
    // cells.forEach(cell => cell.removeAttribute('style'));
    drawPlayField();
    drawTetromino();
}

//ROTATE LEKCJA
//підказка як воно ротейтиться
// let showRotated = [
//     [1,2,3],
//     [4,5,6],
//     [7,8,9]
// ]
//підказка як воно ротейтиться


function rotateTetromino(){
   const oldMatrix = tetromino.matrix;
   const rotatedMatrix = rotateMatrix(tetromino.matrix);
//підказка як воно ротейтиться
//showRotated = rotateMatrix(showRotated);
   tetromino.matrix = rotatedMatrix;

//функція isValid перевіряє чи координати (row i column) нашої фігури
//є ноль чи ні(тобто фігура притиснута до краю чи до ноля іншої фігури
//чи ні)
//тобто якщо не на ноляхб не стоїть в притик до іншої фігури і не є на кінцю
//поля,
//тоді матриця фігури стає то, що було на початку, тобто
//наша фігура дийшла до іншої, уперлася в її нолик, ми, ящко втиснемо
// ще раз rotate, нічого не відбудеться, вона вже вперлась
   if(!isValid()){
    tetromino.matrix = oldMatrix;
   }
}

draw();

function rotate(){
    rotateTetromino();
    draw();
}
//ROTATE LEKCJA



//ШОСТЕ-робимо так щоб фігура рухалась по стрилочці
document.addEventListener("keydown", onKeyDown);
function onKeyDown(e){
    console.log(e.key);
    if(e.key == 'Enter'){
        togglePauseGame();
    }
    //тобто, тільки якщо в нас гра НЕ на паузі, тоді можна вертіти фігури
    if(!isPaused){
        switch(e.key){
        case ' ': //це в нас знак пробілу
        //при натисканні пробілу фігура одразу падає вниз
        dropTetrominoDown();
        break;

        case 'ArrowUp':
        //ROTATE LEKCJA
        rotate();
        //ROTATE LEKCJA
        break;

        case "ArrowDown":
        moveTetrominoDown();
        break;
    
        case "ArrowLeft":
        moveTetrominoLeft();
        break;

        case "ArrowRight":
        moveTetrominoRight();
        break;
   }

}

   draw();
}

function dropTetrominoDown(){
    //в нас функція isvalid за замовчуванням true, тобто фігура НЕ дотикається
    //країв
    //цикл крутиться поки фігура не дотикається країв поля і інших фігур
    while(isValid()){
       tetromino.row++;
    } 
    tetromino.row--;//щоб фігура на випадала з поля внизу
    //повертаємо фігура на один ряд вище
}



//ROTATE LEKCJA
//хопаємо в аргументі саму фігуру
function rotateMatrix(matrixTetromino){
    const N = matrixTetromino.length;//два на два, три на три і тд
    const rotateMatrix = [];//наша фігура, але заротейчена

    //це в нас типу row i column по фігурі(а не по всьому полю, як
    //ми робимо в інших функціях)
for(let i = 0; i < N; i++){//проходимо по кожному рядку фігури
    rotateMatrix[i]=[];//кожному ряду створюємо масив
    //наповнюємо rotateMatrix іншими масивами
     for(let j = 0; j < N; j++){//і кожний масив ряда наповнюємо
        //потрібними нам даними
        rotateMatrix[i][j] = matrixTetromino[N - j - 1][i];

        //беремо наш ротейт матрікс і звертаємось до першого ряду і першої колонки
        //і прийсвоюємо йому [4 - 0 - 1]
        //4-бо наприклад така довжина матриця фігури палочки
        //0 - бо такий індекс першої колонки
        //-1 бо в нас іде робота з індексами, тобто елемент може бути четвертий
        //а індекс в нього буде 3
     }
}

return rotateMatrix;
}
//ROTATE LEKCJA



//AЛЬТЕРНАТИВНЕ rotate
// function rotateTetromino(){
//     const originalMatrix = tetromino.matrix;
//     const rotatedMatrix = [];

//     for(let i=0; i < originalMatrix[0].length;i++){
//         rotatedMatrix.push([]);
//         for(let x = 0; x < originalMatrix.length; x++){
//             rotatedMatrix[i].push(originalMatrix[x][i])
//         }
//     }

//     rotatedMatrix.forEach(row=>row.reverse());
//     tetromino.matrix = rotatedMatrix;
// }
//AЛЬТЕРНАТИВНЕ rotate


function moveTetrominoDown(){
    tetromino.row += 1;
    if(!isValid()){
        tetromino.row -= 1;
        placeTetromino();
    }
}

function moveTetrominoLeft(){
    tetromino.column -= 1;
    //якщо фігура не валідна пересуватись(тобто умова нульової чи остатньої колонки
    //вишла true, а не false, то все, фігура не валідна і ми її
    //далі не пускаємо)
    //ми вже колнки вліво не мінусуємо, а плюсуємо, тобто нівелюємо 
    //тобто в одному кліку left ми одночасно мінусуємо колонку
    //і додаємо її.
    //тому нам виглядає то так, що фігура стоїть
    if(!isValid()){
        tetromino.column += 1;
    }
}

function moveTetrominoRight(){
    tetromino.column += 1;
    if(!isValid()){
        tetromino.column -= 1;
    }
}



//фігури випадають самі з інтервалом в 700 мілісекунд, завдяки requestAnim...
//якщо ми відкриємо иншу вкладку,  ігра встане на паузу
function moveDown(){
    moveTetrominoDown();
    draw();
    stopLoop();
    startLoop();
    //в нас там вище сказано, що, якщо фігура є вище нульового рядка,
    //то параметр isGameOver стає true
    //тобто при true, ми тут викликаємо funciton gameover
    if(isGameOver){
        gameOver();
    }
}


//GAME OVER


function gameOver(){
    stopLoop();
    //якщо фігура вище нульового рядка, то зупиняжмо гру
    //і показуємо банер для рестарту
    overlay.style.display = 'flex';
    scoreFinal.innerHTML = scoreElement.innerHTML;
}
//GAME OVER

moveDown();
function startLoop(){
    timedId =  setTimeout(()=>{ requestAnimationFrame(moveDown)},700)
}
function stopLoop(){
    cancelAnimationFrame(timedId);
    clearTimeout(timedId);
    timedId = null;
}


//прописуємо як поставити гру на паузу
//ізначально в нас показник паузи фолс, бо ми відкриваємо гру і вона одразу
//стартиться

//тобто ми там вище прописали, що, якщо тиснемо Enter, то вмикається
    //оця фукнція
function togglePauseGame(){
    //якщо до цього гра була НЕ на паузі, вона стає на паузу
   if(isPaused === false){
    stopLoop();
    isPaused = true;
   } 
     //тобто, якщо гра Є на паузі, ми знімаємо її з паузи
   else{
    startLoop();
    isPaused = false;
   }
}

//перевіряємо може наша фігура пересуватись чи ні(тобто, ящо НЕ дійшла до
//лівого і правого країв(ця умова видала false), все тіп-топ, все true,
//фігура валідна рухатись далі
function isValid(){
    //розмір нашої фігури. Проганяємо 2 цикли по рядах і колонках нашої
    //фігури
    //ось по цій матриці, наприклад 'J': [
        // [1,0,0],
        // [1,1,1],
        // [0,0,0]
const matrixSize = tetromino.matrix.length;
for (let row=0; row<matrixSize;row++){
    for(let column = 0; column < matrixSize;column++){
        // if(tetromino.matrix[row][column]) continue;
        //тобто, якщо умова вище  true, то то, що нижче не спрацбовує
        //перевіряємо чи фігура прийшла до лівого і правого країв
          if(isOutsideOfGameboard(row,column)){
           return false;
//якщо вона не на лівому чи правому краю, видає тут false і ідемо далі, функція
//isvalid повертає true, вище в movetetromino ми її виокристаємо
        }
        if(hasCollisions(row,column)){return false;}
    }
}

return true;
//тобто вона не на краях
}

//задля того, щоб фігура плавно витікала зверху, ми потім робимо цю перевірку
//в функції drawtetromino
function isOutsideOfTopboard(row){
    return tetromino.row + row < 0 
}

//перевіряємо чи фігура прийшла до лівого і правого країв
function isOutsideOfGameboard(row,column){
    //колізії фігур, тобто щоб нолики находили на нолики в нижньому
    //краю поля
    return tetromino.matrix[row][column] &&
    (
           tetromino.column + column < 0 
           || tetromino.column + column >= PLAYFIELD_COLUMNS 
           || tetromino.row + row >= PLAYFIELD_ROWS
           //у нас при спущенні вниз фігруа може не торкатися остатнього рядя
           //то то через то, що  вона там в матриці має нулі
           //вони у нас не замальовані, тож воно виглядає так,
           //ніби воно висить
    );       
}


//колізії фігур, тобто щоб нолики находили на нолики у фігур між собою
function hasCollisions(row,column){
    return tetromino.matrix[row][column]
    &&  playfield[tetromino.row + row]?.[tetromino.column + column];
    //оцей в кінці хвостик ?. він задля того, щоб фігура плавно витікала
    //зверху з column -2
}

btnRestart.addEventListener("click", function(){
    document.querySelector('.grid').innerHTML = ' ';
    overlay.style.display='none';
    init();
});


// btnNewGame.addEventListener("click", function(){
//     document.querySelector('.grid').innerHTML = ' ';
//     overlay.style.display='none';
//     init();
// });
