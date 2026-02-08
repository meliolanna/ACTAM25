# **BEAT THE BEAT**
*Advanced Coding, Tools and Methodologies - A.Y. 2025/26*

*Professors: Bruschi Francesco, Rana Vincenzo*

Final project by UCETO - 
*Marzola Pier Matteo, Melioli Anna Chiara, Tortorella Elena*

## Outline
- [Purpose of the project](#purpose-of-the-project)
- [Game instructions](#game-instructions)
- [Implementation](#implementation)
- [Challenges](#challenges)
- [Link to the game page](#link-to-the-game-page)


## Purpose of the project
BEAT THE BEAT is an online game to challenge your rhythmic abilities. 
Traditional music solfeggio is boring, isn't it? With its different levels of difficulty and its practice mode, this game wants to be a funnier tool to help you learn it. 
It is designed to be good for every user:
- for music *beginners*, BTB can be a funny and simple way to discover the rhythmic notation, getting more confident with the duration of the notes and their subdivision in the time flowing
- for *children*, our game can be a colorful and less boring way to practice rhythmic skills, learning better by imitation
- for *everyone* who wants to increase their tempo perception and ability to keep time and go on time, faster and faster, without neglecting a bit of fun


## Game instructions
The game is structured by and infinite flow of 4/4 measures, one to listen and one to play, and each round is composed by three steps: 
1. The first pattern is a simple beat keeping, in order to set on the right idea of time that is flowing.
2. The second is a pattern randomly generated that is firstly played by the game, and then the user has to reproduce it. This is done thinking about learning the notes values by imitating and repeating.
3. The third is a new pattern, that is no more played by the game but the user has only to read. This is designed to let the user apply their new skills jusst learned.
After each round, the tempo value is increased of 6 BPM.

The score of each measure is given by the accuracy of the played rhythm. Each time an error is done, one of the three lives is lost and when all lives are lost the game ends.
When the game is over, the user can save their score into the leaderboard, which can be always opened by the button on the right top.

The difficulty of the rhythmic elements is set by the user in the first page: by their choice the game generates the pattern with more particular figures, as triplets or dotted notes.
Therefore, also the sound of the user's "hit" can be set, choosing by a sound palette in the settings on the right top. 

In addition to the main game, it is possible to play each single mini-game only to practice some specific skills. For example, the user can choose to only listean and repeat.


## Implementation
The web application is implemented mainly by HTML, CSS and JavaScript code. Therefore, an external database is linked used FireBase.
Each page is composed by an HTML page, with an external JS code imported which implement its functionalities, and styled by the general file `style.css` that contains all the references of the CSS sections.

### Grammars
The first page that the user can open contains the three buttons to choose the level of difficulty of the game. In fact, for each level a different grammar is used by an algorithm to generate randomly the single measure that the user has to repeat or read.
The algorithm is a tree that uses some rules to implement a pattern: the whole measure last four beats and can be divided in two half measures, and each half measure in two beats, and each beat in other rhythmic figures seen as the "leaves" of the tree. Each level of difficulty adds more possibilities and so more rules to the grammar, so generating more possible patterns. 
The leaf rhythms are mapped with their vlaues, so that at the end the generated pattern can be represented in time multiplying the relative durations by the duration of each beat, according to the tempo (speed) that is currently playing. 

### Mini games
These patterns are generated into the game every time a measure is needed. In fact, the three minigames that compose the steps of the main game are all based on a rhythmic sequence, but the second and the third use this algorithm to generate their sequence, always as new. 
The logic of each minigame is common, reason why they all inherit and implement from the abstract class `0BaseRhythmMiniGame.js`: they contains 8 beats, 4 played by the game as out counting or as pattern listening, and 4 in which the game is expecting an input from the user. All this script are located in `minigames` folder. 
1. The first minigame `1FollowTheBeat.js` contains as the played sequence only the 4 beats as quarter notes, and is expecting so this specific frequence as input.
2. The second minigame `2ListenAndRepeat.js` generates the sequence, plays it and then expects this specific pattern as an input.
3. The third minigame `3ReadAndRepeat.js` generates the sequence without playing but just counting out the 4 beats and then expects the input.

### User input
During the game, the code is expecting a specific input from the user that has to match with the rhythm of the sequence of that measure. 
The class `GameController.js` handles the measuring of time and the input detection, communicating with the class of the minigame. From the moment in which the user can give an input, the time starts and the hits are detected and real time compared to the original sequence in order to check the accuracy. 
The input classification is done by two time windows: if the input is located in the exact instant +- 10% of the duration of the beat, it is classified as *Perfect* and the score is increased by 100; if it is located in a +- 20% window, it is classified as *Good* and the score is increased only by 50; a bigger difference with respect to the expected instant or a missing is classified as an error, giving no points to the score and loosing a life (but only one for all the errors in the measure).

### Scores and FireBase
When all the lives are lost, the game is over repporting the number of rounds, the tempo reached and the score obtained. 
The score can be saved into a rank: through the button *SAVE*, the name of the gamer and the score are put into an online real time database hold by FireBase. 
Then, the rank can be always seen by the button on the right top. By hitting the trophy icon, a overpage compares and the system import from the database all the names and score. This page is implemented in `leaderboardModal.html` and its behavior defined in `leaderboardUI.js`.

The FireBaser configuration is set in `firebaseClient.js` file, then the communication, the savings and the readings are defined in `leaderboardService.js`.

### Sounds 
Next to the rank button, there is the settings button that opens the overpage `settingsModal.html` using the script `settingsUI.js`. Here the user can change their hit input sound choosing between four sounds: synth, clap, dog and cat. 
This choice is set in the class `GameSounds.js `, in which are defined the functions to implement the click sounds of the buttons and the sounds of the games as the metronome, the input, the error sound, the game over sound and so on.


## Challenges
The main challenges we found implementing our idea follow here.
1. **Pattern generation**: we thought about how to increase the difficulty in the levels, and the solution we found was the one described above. The grammar allows us to not write manually the rhythmic sequences but to obtain them automatically, setting new rules as the only feature to increase the level. It was very easy to implement, obtaining a very good and satisfying result.
2. **Music notation**: we wanted to represent the rhythms with the traditional notation, in order to let the user learn the corrispondance between what they reads and what they hears, but it was a problem to find a good library that can work in each browser. So to overcome the problem we implemented a CSS notation that draws each single note of the sequence as an object into a little display. This display is divided in four sections in order to show the four beats and the notes are accurately located to a distance from the vertical line of the beat proportional to the fraction of beat it is. We know it is not as beautiful as the traditional notation, but it is very intuitive and a little "primitive" as the pixalated 80s aestethics we used for the whole game.
3. **User input matching**: to classify the input as right or wrong, we had to find a solution to match the sequence given and the input one. The solution we found is to have like two different "time passing"s, one to calculate the amount of seconds the game expects from one input to the other, than another one to detect how much time passed from one "hit" to the next and comparing in real time this sequences of times in seconds. This solution allows us to have a real time detection.




## Link to the game page
Hoping we made you curious to try the game, [this is the link to the GitHub Page to play](https://meliolanna.github.io/ACTAM25/index.html).


___
<p>
  <sub><i>
    BEAT THE BEAT - Academic project implemented by Marzola Pier Matteo, Melioli Anna Chiara and Tortorella Elena.

Finished in February 2026.

GIF illustrations by @coi_illustrazioni.
  </i></sub>
</p>


