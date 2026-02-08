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
- [Video demonstration]
- [Link to the game page]


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
The logic of each minigame is common, reason why they all inherit and implement from the abstract class `0BaseRhythmMiniGame.js`: they contains 8 beats, 4 played by the game as out counting or as pattern listening, and 4 in which the game is expecting an input from the user. 
1. The first minigame `1FollowTheBeat.js` contains as the played sequence only the 4 beats as quarter notes, and is expecting so this specific frequence as input.
2. The second minigame `2ListenAndRepeat.js` generates the sequence, plays it and then expects this specific pattern as an input.
3. The third minigame `3ReadAndRepeat.js` generates the sequence without playing but just counting out the 4 beats and then expects the input.









